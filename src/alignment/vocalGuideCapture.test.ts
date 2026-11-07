import { describe, expect, it, vi } from "vitest";
import {
  createVocalGuideCapture,
  SHERPA_SAMPLE_RATE,
  toSherpaSamples,
  type VocalGuideCaptureDependencies,
} from "./vocalGuideCapture";

function fakeStream() {
  const stop = vi.fn();
  return { getTracks: () => [{ stop }] } as unknown as MediaStream;
}

function dependencies(overrides: Partial<VocalGuideCaptureDependencies> = {}) {
  const stream = fakeStream();
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  const processor = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null as ((event: AudioProcessingEvent) => unknown) | null,
  };
  const gain = { connect: vi.fn(), disconnect: vi.fn(), gain: { value: 1 } };
  const context = {
    sampleRate: SHERPA_SAMPLE_RATE,
    destination: {},
    createMediaStreamSource: vi.fn().mockReturnValue(source),
    createScriptProcessor: vi.fn().mockReturnValue(processor),
    createGain: vi.fn().mockReturnValue(gain),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  return {
    requestMicrophone: vi.fn().mockResolvedValue(stream),
    createAudioContext: vi.fn().mockReturnValue(context),
    ...overrides,
  } satisfies VocalGuideCaptureDependencies;
}

describe("vocal-guide capture", () => {
  it("stops a microphone granted after cancellation without interrupting a new take", async () => {
    const deps = dependencies();
    const oldStream = await deps.requestMicrophone();
    const newStream = await dependencies().requestMicrophone();
    let grant!: (stream: MediaStream) => void;
    vi.mocked(deps.requestMicrophone)
      .mockReturnValueOnce(new Promise(resolve => { grant = resolve; }))
      .mockResolvedValueOnce(newStream);
    const capture = createVocalGuideCapture(deps);
    const first = capture.start();
    const rejected = expect(first).rejects.toMatchObject({ name: "AbortError" });
    await capture.cancel();
    await capture.start();
    grant(oldStream);
    await rejected;
    expect(oldStream.getTracks()[0].stop).toHaveBeenCalledOnce();
    expect(newStream.getTracks()[0].stop).not.toHaveBeenCalled();
    expect(capture.state).toBe("recording");
    await capture.cancel();
  });
  it("requests the microphone only after explicit start and returns direct 16 kHz PCM", async () => {
    const deps = dependencies();
    const capture = createVocalGuideCapture(deps);
    expect(deps.requestMicrophone).not.toHaveBeenCalled();

    await capture.start();
    const context = deps.createAudioContext();
    const processor = context.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => new Float32Array([0.1, 0.2, 0.3]) } } as unknown as AudioProcessingEvent);
    const audio = await capture.stop();

    expect(audio).toMatchObject({ sampleRate: 16_000, durationSeconds: 3 / 16_000 });
    expect(Array.from(audio.samples)).toEqual(expect.arrayContaining([
      expect.closeTo(0.1), expect.closeTo(0.2), expect.closeTo(0.3),
    ]));
    expect(context.createGain().gain.value).toBe(0);
    expect(deps.requestMicrophone).toHaveBeenCalledOnce();
    expect(capture.state).toBe("idle");
  });

  it("releases microphone tracks after a successful take", async () => {
    const deps = dependencies();
    const stream = await deps.requestMicrophone();
    vi.mocked(deps.requestMicrophone).mockResolvedValue(stream);
    const capture = createVocalGuideCapture(deps);

    await capture.start();
    await capture.stop().catch(() => undefined);
    expect(stream.getTracks()[0].stop).toHaveBeenCalledOnce();
  });

  it("cancels cleanly and releases microphone tracks", async () => {
    const deps = dependencies();
    const stream = await deps.requestMicrophone();
    vi.mocked(deps.requestMicrophone).mockResolvedValue(stream);
    const capture = createVocalGuideCapture(deps);

    await capture.start();
    await expect(capture.cancel()).resolves.toBeUndefined();
    expect(stream.getTracks()[0].stop).toHaveBeenCalledOnce();
    expect(capture.state).toBe("idle");
  });

  it("reports an empty microphone capture explicitly", async () => {
    const deps = dependencies();
    const capture = createVocalGuideCapture(deps);

    await capture.start();
    await expect(capture.stop()).rejects.toThrow("No microphone audio was captured");
  });
});

describe("toSherpaSamples", () => {
  it("mixes stereo and resamples it to 16 kHz", () => {
    const output = toSherpaSamples({
      sampleRate: 8_000,
      numberOfChannels: 2,
      length: 2,
      getChannelData: channel => new Float32Array(channel === 0 ? [0, 1] : [1, 0]),
    });
    expect(output).toHaveLength(4);
    expect(Array.from(output)).toEqual([0.5, 0.5, 0.5, 0.5]);
  });
});
