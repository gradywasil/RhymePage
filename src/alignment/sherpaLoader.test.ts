import { describe, expect, it, vi } from "vitest";
import { createSherpaLoader, type SherpaLoaderDependencies } from "./sherpaLoader";

function dependencies(overrides: Partial<SherpaLoaderDependencies> = {}) {
  const global: SherpaLoaderDependencies["global"] = {
    createOnlineRecognizer: () => ({ free: vi.fn() }),
  };
  const loadScript = vi.fn<SherpaLoaderDependencies["loadScript"]>(async () => {
    global.Module?.onRuntimeInitialized?.();
  });
  return {
    global,
    supportsWebAssembly: () => true,
    supportsSimd: () => true,
    loadScript,
    ...overrides,
  } satisfies SherpaLoaderDependencies;
}

describe("Sherpa local loader", () => {
  it("does not free a completed recognizer again when its runtime is disposed", async () => {
    const free = vi.fn();
    const deps = dependencies();
    deps.global.createOnlineRecognizer = () => ({ free });
    const result = await createSherpaLoader(deps).load();
    if (result.state !== "ready") throw new Error("Expected a ready runtime");
    result.runtime.createOnlineRecognizer().free?.();
    result.runtime.dispose();
    expect(free).toHaveBeenCalledOnce();
  });
  it("does not request any assets when WebAssembly SIMD is unavailable", async () => {
    const deps = dependencies({ supportsSimd: () => false });
    const result = await createSherpaLoader(deps).load();

    expect(result).toMatchObject({ state: "unsupported", fallback: "manual-sync" });
    expect(deps.loadScript).not.toHaveBeenCalled();
  });

  it("loads only the self-hosted bundle after explicit caller request", async () => {
    const deps = dependencies();
    const statuses: string[] = [];
    const result = await createSherpaLoader(deps).load({ onStatus: status => statuses.push(status.stage) });

    expect(result.state).toBe("ready");
    const scripts = vi.mocked(deps.loadScript).mock.calls.map(([src]) => src);
    expect(scripts).toEqual([
      "/sherpa-alignment-prototype/sherpa-onnx-wasm-simd-v1.13.6-en-asr-zipformer/sherpa-onnx-asr.js",
      "/sherpa-alignment-prototype/sherpa-onnx-wasm-simd-v1.13.6-en-asr-zipformer/sherpa-onnx-wasm-main-asr.js",
    ]);
    expect(statuses).toContain("ready");
  });

  it("resolves Emscripten data files inside the self-hosted bundle even when it passes an empty script directory", async () => {
    const deps = dependencies();
    await createSherpaLoader(deps).load();

    expect(deps.global.Module?.locateFile?.("sherpa-onnx-wasm-main-asr.data", ""))
      .toBe("/sherpa-alignment-prototype/sherpa-onnx-wasm-simd-v1.13.6-en-asr-zipformer/sherpa-onnx-wasm-main-asr.data");
  });

  it("returns a safe cancelled state without attempting a script load", async () => {
    const controller = new AbortController();
    controller.abort();
    const deps = dependencies();

    const result = await createSherpaLoader(deps).load({ signal: controller.signal });
    expect(result).toEqual({ state: "cancelled" });
    expect(deps.loadScript).not.toHaveBeenCalled();
  });

  it("returns a manual-sync fallback when loading fails", async () => {
    const deps = dependencies({ loadScript: vi.fn().mockRejectedValue(new Error("Missing local bundle")) });
    const result = await createSherpaLoader(deps).load();

    expect(result).toEqual({ state: "failed", message: "Missing local bundle", fallback: "manual-sync" });
  });
});
