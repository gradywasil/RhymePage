# Browser-local ASR options for lyric alignment

Research date: 2026-08-29

## Decision

Build the next proof of concept with **sherpa-onnx WebAssembly and the int8 streaming Zipformer English 20M model**. It runs on the CPU through WASM with SIMD, so it does not depend on WebGPU, a key difference from the failing Whisper route. It has no API, token, or usage quota. The first run must download roughly 42 MB of model files, then every recording stays in the browser.

The small model is not likely to transcribe sung words as accurately as a larger Whisper model. That is acceptable for this test. The real question is whether its token timestamps are stable enough to snap a user's known lyrics to an audio timeline. Feed the saved lyric text into the existing matcher, do not treat the ASR transcript as canonical.

## Recommended concrete prototype

Use `sherpa-onnx-streaming-zipformer-en-20M-2023-02-17`, int8 files, on a 16 kHz mono microphone stream:

| Asset | Published size |
| --- | ---: |
| `encoder-epoch-99-avg-1.int8.onnx` | 41 MB |
| `decoder-epoch-99-avg-1.int8.onnx` | 527 KB |
| `joiner-epoch-99-avg-1.int8.onnx` | 253 KB |
| `tokens.txt` and model vocabulary | small |

The project documents this model as small and English-only, trained on LibriSpeech. The unquantized alternative is about 88 MB, so do not ship it for the first attempt. [Official model listing](https://k2-fsa.github.io/sherpa/onnx/pretrained_models/online-transducer/zipformer-transducer-models.html) lists the files and sizes.

Prototype shape:

1. Download the WASM runtime plus the four model assets as ordinary static files. Cache them with the browser Cache API after a successful first load.
2. Capture microphone samples through an `AudioWorklet` or `ScriptProcessorNode`, downsample to 16 kHz mono, and pass `Float32Array` chunks to the recognizer.
3. Read `{ text, tokens, timestamps, is_final }` after each decode. The official streaming API documents the per-token timestamp array. [Streaming API reference](https://k2-fsa.github.io/sherpa/onnx/javascript-api/examples/api_streaming_asr.html)
4. On stop, flush the stream, match the recognized tokens to the lyric text, and convert each matched token's timestamp into the existing lyric-highlight schedule.
5. Treat missing timestamps or an empty match as a recoverable result. Show the captured audio and offer retry or manual timing, never leave the recording flow blocked.

The model and WASM need to be served over the Vite development server or production HTTPS, rather than opening an HTML file directly. Microphone permission also requires a secure context or localhost. Test in Chrome and Edge with WebAssembly SIMD available. The sherpa project's own WASM route is CPU-only and uses a SIMD build. [Official WebAssembly build script](https://raw.githubusercontent.com/k2-fsa/sherpa-onnx/master/build-wasm-simd-web.sh) and [English Zipformer WASM build workflow](https://raw.githubusercontent.com/k2-fsa/sherpa-onnx/master/.github/workflows/wasm-simd-hf-space-en-asr-zipformer.yaml) show the maintained implementation path.

## Timestamp fit

sherpa-onnx's streaming result has token strings and optional timestamps in seconds. When timestamps exist, each is parallel to a token. The runtime documents that the timestamp pointer can be absent for a model, so the UI must validate them before alignment. [C API result contract](https://k2-fsa.github.io/sherpa/onnx/c-api/html/structSherpaOnnxOnlineRecognizerResult.html)

This is good enough for a lyric alignment proof of concept, but timestamps are token starts, not guaranteed word start and end boundaries. Build word intervals by grouping subword tokens and using the next token's start, or the utterance end, as an estimated end. Mark the result as an estimate in the UI.

## Cost and licensing

The sherpa-onnx runtime is Apache-2.0. The selected model's official Hugging Face card also declares Apache-2.0. Local CPU inference means no per-recording vendor request, token charge, or quota. The product still bears the one-time bandwidth and storage cost of serving the WASM and model assets.

Sources: [sherpa-onnx repository and license](https://github.com/k2-fsa/sherpa-onnx), [model card](https://huggingface.co/csukuangfj/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17/tree/main).

Do not assume every sherpa-published model has this license. Check the model card and included notices again before swapping models or shipping commercially.

## Viable fallback: Vosk WebAssembly

Vosk is also local, Apache-2.0, and its small US-English model is 40 MB. Its official API provides word `start` and `end` times and can include them in partial results, which is a better alignment shape on paper. [Vosk API](https://raw.githubusercontent.com/alphacep/vosk-api/master/src/vosk_api.h) and [official model list](https://alphacephei.com/vosk/models) document these facts.

I would keep Vosk as the fallback rather than start there. Its published WebJS sample exists, but sherpa-onnx has a current, project-maintained WASM ASR example and a direct streaming model workflow. If sherpa's integration proves fragile, switch the prototype to Vosk's small English model and preserve the matching layer, which can consume either token starts or Vosk's word intervals.

## Rejected for this iteration

Whisper in Transformers.js already failed while initializing a decoder in the target browser. Moving to another Whisper wrapper would not remove the heavy encoder-decoder initialization that caused the failure. Cloud ASR services avoid the local runtime issue but introduce credentials, per-use billing, and practical usage limits, which do not meet the product goal.
