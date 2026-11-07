/**
 * The local-only entry point for the self-hosted Sherpa-ONNX bundle.
 *
 * Nothing in this module starts a network request at import time. Callers must
 * wait for the songwriter's explicit opt-in, then call `load()`. The two
 * scripts and their Emscripten data file are served from our own `/public`
 * bundle; no model-host or inference URL is accepted by this API.
 */

import { ANDROID_ALIGNMENT_MESSAGE, localAlignmentAvailable } from "./platformSupport";

const BUNDLE_PATH = "/sherpa-alignment-prototype/sherpa-onnx-wasm-simd-v1.13.6-en-asr-zipformer/";

export type SherpaLoadStage =
  | "checking-compatibility"
  | "loading-runtime"
  | "downloading-model"
  | "initializing"
  | "ready"
  | "unsupported"
  | "cancelled"
  | "failed";

export interface SherpaLoadStatus {
  stage: SherpaLoadStage;
  message: string;
}

export interface SherpaRuntime {
  /** Creates a disposable recognizer for one completed vocal-guide take. */
  createOnlineRecognizer(): SherpaRecognizer;
  /** Releases recognizers created through this wrapper. */
  dispose(): void;
}

interface SherpaStream {
  acceptWaveform(sampleRate: number, samples: Float32Array): void;
  inputFinished(): void;
  free(): void;
}

interface SherpaResult {
  text?: string;
  tokens?: string[];
  timestamps?: number[];
}

export interface SherpaRecognizer {
  createStream(): SherpaStream;
  isReady(stream: SherpaStream): boolean;
  decode(stream: SherpaStream): void;
  getResult(stream: SherpaStream): SherpaResult;
  free?: () => void;
}

export type SherpaLoadResult =
  | { state: "ready"; runtime: SherpaRuntime }
  | { state: "unsupported"; message: string; fallback: "manual-sync" }
  | { state: "cancelled" }
  | { state: "failed"; message: string; fallback: "manual-sync" };

export interface SherpaLoadOptions {
  signal?: AbortSignal;
  onStatus?: (status: SherpaLoadStatus) => void;
}

interface SherpaWasmModule {
  locateFile?: (path: string, scriptDirectory?: string) => string;
  setStatus?: (status: string) => void;
  onRuntimeInitialized?: () => void;
  onAbort?: (reason: unknown) => void;
}

interface SherpaGlobal {
  Module?: SherpaWasmModule;
  createOnlineRecognizer?: (module: SherpaWasmModule) => unknown;
}

export interface SherpaLoaderDependencies {
  global: SherpaGlobal;
  supportsWebAssembly: () => boolean;
  supportsSimd: () => boolean;
  loadScript: (src: string, signal?: AbortSignal) => Promise<void>;
}

const simdProbe = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 9, 1, 7, 0, 65, 0, 253, 15, 26, 11,
]);

function browserSupportsWebAssembly(): boolean {
  return typeof WebAssembly !== "undefined" && typeof WebAssembly.validate === "function";
}

function browserSupportsSimd(): boolean {
  return browserSupportsWebAssembly() && WebAssembly.validate(simdProbe);
}

function browserScriptLoader(src: string, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Loading was cancelled.", "AbortError"));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("The local speech model could not be loaded."));
    const abort = () => {
      script.remove();
      reject(new DOMException("Loading was cancelled.", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    document.head.append(script);
  });
}

function getBrowserDependencies(): SherpaLoaderDependencies {
  return {
    global: window as unknown as SherpaGlobal,
    supportsWebAssembly: browserSupportsWebAssembly,
    supportsSimd: browserSupportsSimd,
    loadScript: browserScriptLoader,
  };
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return signal?.aborted || (error instanceof DOMException && error.name === "AbortError");
}

/** Factory export keeps browser APIs and script loading easy to unit test. */
export function createSherpaLoader(providedDependencies?: SherpaLoaderDependencies) {
  // Resolve `window` only when the application actually constructs its loader;
  // importing the module stays safe in Node-based unit tests and SSR tooling.
  const dependencies = providedDependencies ?? getBrowserDependencies();
  let loadedRuntime: SherpaRuntime | null = null;
  let loading: Promise<SherpaRuntime> | null = null;

  async function prepare(signal: AbortSignal | undefined, emit: (status: SherpaLoadStatus) => void): Promise<SherpaRuntime> {
    emit({ stage: "loading-runtime", message: "Preparing the local voice-timing engine…" });
    const module: SherpaWasmModule = {
      // Emscripten explicitly passes an empty script directory for its `.data`
      // sidecar. Always anchor every runtime and model asset to this bundle;
      // otherwise a note route makes it request `/notes/.../model.data`.
      locateFile: path => BUNDLE_PATH + path,
    };
    dependencies.global.Module = module;

    const initialized = new Promise<void>((resolve, reject) => {
      module.setStatus = status => {
        emit({
          stage: status.includes("Downloading data") ? "downloading-model" : "initializing",
          message: status || "Initializing the local voice-timing engine…",
        });
      };
      module.onRuntimeInitialized = resolve;
      module.onAbort = () => reject(new Error("The local speech engine could not start."));
    });

    await dependencies.loadScript(`${BUNDLE_PATH}sherpa-onnx-asr.js`, signal);
    emit({ stage: "downloading-model", message: "Loading the local speech model…" });
    await dependencies.loadScript(`${BUNDLE_PATH}sherpa-onnx-wasm-main-asr.js`, signal);
    await initialized;

    if (signal?.aborted) throw new DOMException("Loading was cancelled.", "AbortError");
    const createRecognizer = dependencies.global.createOnlineRecognizer;
    if (!createRecognizer) throw new Error("The local speech engine did not expose a recognizer.");

    const recognizers = new Set<SherpaRecognizer>();
    return {
      createOnlineRecognizer: () => {
        const recognizer = createRecognizer(module) as SherpaRecognizer;
        const free = recognizer.free?.bind(recognizer);
        recognizer.free = () => { if (recognizers.delete(recognizer)) free?.(); };
        recognizers.add(recognizer);
        return recognizer;
      },
      dispose: () => {
        [...recognizers].forEach(recognizer => recognizer.free?.());
      },
    };
  }

  return {
    async load({ signal, onStatus = () => undefined }: SherpaLoadOptions = {}): Promise<SherpaLoadResult> {
      onStatus({ stage: "checking-compatibility", message: "Checking whether this browser can run local voice timing…" });
      if (!dependencies.supportsWebAssembly() || !dependencies.supportsSimd()) {
        const message = "Local voice timing needs a current desktop Chrome or Edge browser. You can still sync lyrics manually.";
        onStatus({ stage: "unsupported", message });
        return { state: "unsupported", message, fallback: "manual-sync" };
      }
      if (signal?.aborted) {
        onStatus({ stage: "cancelled", message: "Local voice timing setup was cancelled." });
        return { state: "cancelled" };
      }

      try {
        loading ??= prepare(signal, onStatus).then(runtime => {
          loadedRuntime = runtime;
          return runtime;
        });
        const runtime = loadedRuntime ?? await loading;
        onStatus({ stage: "ready", message: "Local voice timing is ready." });
        return { state: "ready", runtime };
      } catch (error) {
        loading = null;
        if (isAbort(error, signal)) {
          onStatus({ stage: "cancelled", message: "Local voice timing setup was cancelled." });
          return { state: "cancelled" };
        }
        const message = error instanceof Error ? error.message : "The local speech model could not be prepared.";
        onStatus({ stage: "failed", message });
        return { state: "failed", message, fallback: "manual-sync" };
      }
    },
  };
}

/** The application singleton. Importing it remains inert until `load()` is called. */
let browserLoader: ReturnType<typeof createSherpaLoader> | null = null;
export const sherpaLoader = {
  load(options?: SherpaLoadOptions) {
    if (!localAlignmentAvailable()) return Promise.resolve<SherpaLoadResult>({ state: "unsupported", message: ANDROID_ALIGNMENT_MESSAGE, fallback: "manual-sync" });
    browserLoader ??= createSherpaLoader();
    return browserLoader.load(options);
  },
};
