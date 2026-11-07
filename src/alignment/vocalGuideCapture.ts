/**
 * Temporary, local-only microphone capture for lyric alignment.
 *
 * PCM is collected directly from the microphone's Web Audio graph. This
 * deliberately avoids recording an encoded WebM/MP4 blob and decoding it
 * again, which is unreliable in some embedded Chromium runtimes.
 */

export const SHERPA_SAMPLE_RATE = 16_000;

export interface VocalGuideAudio {
  samples: Float32Array;
  sampleRate: typeof SHERPA_SAMPLE_RATE;
  durationSeconds: number;
}

export type VocalGuideCaptureState = "idle" | "requesting-permission" | "recording" | "stopping";

interface DecodedAudioLike {
  sampleRate: number;
  numberOfChannels: number;
  length: number;
  getChannelData(channel: number): Float32Array;
}

interface AudioNodeLike {
  connect(destination: unknown): void;
  disconnect(): void;
}

interface AudioProcessorLike extends AudioNodeLike {
  onaudioprocess: ((event: AudioProcessingEvent) => unknown) | null;
}

interface GainLike extends AudioNodeLike {
  gain: { value: number };
}

interface CaptureAudioContextLike {
  sampleRate: number;
  destination: unknown;
  createMediaStreamSource(stream: MediaStream): AudioNodeLike;
  createScriptProcessor(bufferSize: number, inputChannels: number, outputChannels: number): AudioProcessorLike;
  createGain(): GainLike;
  resume?(): Promise<void>;
  close(): Promise<void>;
}

export interface VocalGuideCaptureDependencies {
  requestMicrophone: () => Promise<MediaStream>;
  createAudioContext: () => CaptureAudioContextLike;
}

export interface VocalGuideCapture {
  readonly state: VocalGuideCaptureState;
  start(): Promise<void>;
  stop(): Promise<VocalGuideAudio>;
  cancel(): Promise<void>;
}

function abortError(): DOMException {
  return new DOMException("Vocal-guide recording was cancelled.", "AbortError");
}

function browserDependencies(): VocalGuideCaptureDependencies {
  return {
    requestMicrophone: () => navigator.mediaDevices.getUserMedia({
      audio: { autoGainControl: true, echoCancellation: false, noiseSuppression: true },
    }),
    createAudioContext: () => new AudioContext(),
  };
}

/** Mixes all channels and resamples by linear interpolation to Sherpa's PCM format. */
export function toSherpaSamples(audio: DecodedAudioLike): Float32Array {
  if (audio.numberOfChannels < 1 || audio.length === 0) return new Float32Array();
  const mixed = new Float32Array(audio.length);
  for (let channel = 0; channel < audio.numberOfChannels; channel += 1) {
    const samples = audio.getChannelData(channel);
    for (let index = 0; index < audio.length; index += 1) mixed[index] += samples[index] / audio.numberOfChannels;
  }
  if (audio.sampleRate === SHERPA_SAMPLE_RATE) return mixed;
  const outputLength = Math.max(1, Math.round((audio.length * SHERPA_SAMPLE_RATE) / audio.sampleRate));
  const output = new Float32Array(outputLength);
  const scale = audio.sampleRate / SHERPA_SAMPLE_RATE;
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * scale;
    const lower = Math.min(Math.floor(position), mixed.length - 1);
    const upper = Math.min(lower + 1, mixed.length - 1);
    const fraction = position - lower;
    output[index] = mixed[lower] + (mixed[upper] - mixed[lower]) * fraction;
  }
  return output;
}

function combine(chunks: Float32Array[]): Float32Array {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const samples = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }
  return samples;
}

/** Factory export keeps permissions and Web Audio APIs fully unit-testable. */
export function createVocalGuideCapture(providedDependencies?: VocalGuideCaptureDependencies): VocalGuideCapture {
  const dependencies = providedDependencies ?? browserDependencies();
  let captureState: VocalGuideCaptureState = "idle";
  let stream: MediaStream | null = null;
  let context: CaptureAudioContextLike | null = null;
  let source: AudioNodeLike | null = null;
  let processor: AudioProcessorLike | null = null;
  let silentGain: GainLike | null = null;
  let chunks: Float32Array[] = [];
  let generation = 0;

  const releaseStream = () => {
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
  };

  const disconnectGraph = () => {
    if (processor) processor.onaudioprocess = null;
    source?.disconnect();
    processor?.disconnect();
    silentGain?.disconnect();
    source = null;
    processor = null;
    silentGain = null;
  };

  const cleanup = async () => {
    disconnectGraph();
    releaseStream();
    const closingContext = context;
    context = null;
    chunks = [];
    captureState = "idle";
    await closingContext?.close();
  };

  return {
    get state() {
      return captureState;
    },

    async start() {
      if (captureState !== "idle") throw new Error("A vocal-guide recording is already active.");
      captureState = "requesting-permission";
      const request = ++generation;
      try {
        const requestedStream = await dependencies.requestMicrophone();
        if (request !== generation) {
          requestedStream.getTracks().forEach(track => track.stop());
          throw abortError();
        }
        stream = requestedStream;
        context = dependencies.createAudioContext();
        source = context.createMediaStreamSource(stream);
        processor = context.createScriptProcessor(4096, 1, 1);
        silentGain = context.createGain();
        silentGain.gain.value = 0;
        processor.onaudioprocess = event => {
          if (captureState === "recording") chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
        };
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(context.destination);
        await context.resume?.();
        if (request !== generation) throw abortError();
        captureState = "recording";
      } catch (error) {
        if (request === generation) await cleanup();
        throw error;
      }
    },

    async stop() {
      if (captureState !== "recording" || !context) throw new Error("There is no vocal-guide recording to stop.");
      captureState = "stopping";
      const rawSamples = combine(chunks);
      const sourceSampleRate = context.sampleRate;
      await cleanup();
      const samples = toSherpaSamples({
        sampleRate: sourceSampleRate,
        numberOfChannels: 1,
        length: rawSamples.length,
        getChannelData: () => rawSamples,
      });
      if (samples.length === 0) throw new Error("No microphone audio was captured. Check your microphone and try another take.");
      return { samples, sampleRate: SHERPA_SAMPLE_RATE, durationSeconds: samples.length / SHERPA_SAMPLE_RATE };
    },

    async cancel() {
      if (captureState === "idle") return;
      generation++;
      captureState = "stopping";
      await cleanup();
    },
  };
}
