import { env, pipeline } from '@huggingface/transformers';

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = '/models/';
const wasm = env.backends.onnx.wasm;
if (wasm) wasm.wasmPaths = '/transformers-wasm/';

type WorkerRequest =
  | { type: 'prepare' }
  | { type: 'transcribe'; audio: Float32Array };

let transcriber: Awaited<ReturnType<typeof pipeline<'automatic-speech-recognition'>>> | null = null;

async function getTranscriber() {
  if (!transcriber) {
    transcriber = await pipeline('automatic-speech-recognition', 'whisper-tiny.en', {
      device: 'webgpu',
      dtype: 'fp16',
      progress_callback: (progress: { status?: string; file?: string; progress?: number }) =>
        postMessage({ type: 'progress', ...progress }),
    });
  }
  return transcriber;
}

self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    if (data.type === 'prepare') {
      await getTranscriber();
      postMessage({ type: 'ready' });
      return;
    }
    const recognizer = await getTranscriber();
    const result = await recognizer(data.audio, { return_timestamps: 'word' });
    postMessage({ type: 'transcript', result });
  } catch (error) {
    postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Unknown alignment error.' });
  }
};
