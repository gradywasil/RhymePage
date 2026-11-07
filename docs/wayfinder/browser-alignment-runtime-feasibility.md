# Browser alignment runtime feasibility

## Question

Which ONNX model, browser execution path, model-delivery approach, and performance thresholds make a browser-only post-take alignment pass viable on the supported desktop Chrome/Edge hardware?

## Claim

The failed Whisper WebGPU experiment was replaced by a sherpa-onnx WebAssembly prototype using the int8 English Zipformer 20M model. See [browser-local-asr-options.md](../research/browser-local-asr-options.md) for the researched rationale and source links.

## Resolution

The official, self-hosted Sherpa WebAssembly bundle initialized and transcribed successfully in the user’s browser test. Browser-local CPU/SIMD inference is viable for the lyric-alignment prototype. Version one will use its token timestamps to time-sync existing canonical lyrics only; Write-tab transcription remains separate future scope.
