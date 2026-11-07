const status = document.querySelector<HTMLParagraphElement>('#status')!;
const detail = document.querySelector<HTMLParagraphElement>('#detail')!;
const prepare = document.querySelector<HTMLButtonElement>('#prepare')!;
const record = document.querySelector<HTMLButtonElement>('#record')!;
const stop = document.querySelector<HTMLButtonElement>('#stop')!;
const transcript = document.querySelector<HTMLPreElement>('#transcript')!;

const worker = new Worker(new URL('./alignmentRuntime.worker.ts', import.meta.url), { type: 'module' });
let recorder: MediaRecorder | null = null;
let parts: BlobPart[] = [];
let prepareTimeout: ReturnType<typeof setTimeout> | null = null;

function setStatus(title: string, message: string) { status.textContent = title; detail.textContent = message; }
function clearPrepareTimeout() {
  if (prepareTimeout) clearTimeout(prepareTimeout);
  prepareTimeout = null;
}

worker.onmessage = ({ data }) => {
  if (data.type === 'progress') setStatus('Preparing local model', `${data.file ?? data.status ?? 'Loading'}${data.progress ? ` · ${Math.round(data.progress)}%` : ''}`);
  if (data.type === 'ready') { clearPrepareTimeout(); setStatus('Ready to record', 'The model loaded locally. Your next recording is not uploaded.'); record.disabled = false; }
  if (data.type === 'transcript') { setStatus('Transcript received', 'Inspect the timestamps below; this is the runtime feasibility result.'); transcript.textContent = JSON.stringify(data.result, null, 2); prepare.disabled = false; }
  if (data.type === 'error') { clearPrepareTimeout(); setStatus('Prototype error', data.message); prepare.disabled = false; }
};

prepare.onclick = () => {
  if (!(navigator as Navigator & { gpu?: unknown }).gpu) { setStatus('WebGPU unavailable', 'This prototype intentionally has no CPU fallback. Try current Chrome or Edge on desktop.'); return; }
  prepare.disabled = true;
  setStatus('Preparing local model', 'Loading only assets served from /models on this Vite site.');
  worker.postMessage({ type: 'prepare' });
  prepareTimeout = setTimeout(() => {
    setStatus('This browser could not start local voice timing', 'The model did not initialize within 45 seconds. This is expected in some embedded browsers; test this prototype in current desktop Chrome or Edge.');
    prepare.disabled = false;
  }, 45_000);
};

record.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  parts = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = event => parts.push(event.data);
  recorder.onstop = async () => {
    stream.getTracks().forEach(track => track.stop());
    const blob = new Blob(parts, { type: recorder?.mimeType });
    const context = new AudioContext({ sampleRate: 16000 });
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const channel = decoded.getChannelData(0);
    setStatus('Transcribing locally', 'Matching your voice to words in this browser worker.');
    worker.postMessage({ type: 'transcribe', audio: channel }, [channel.buffer]);
    await context.close();
  };
  recorder.start();
  record.disabled = true;
  stop.disabled = false;
  setStatus('Recording vocal guide', 'Speak a short lyric phrase, then stop recording.');
};

stop.onclick = () => { recorder?.stop(); stop.disabled = true; };
