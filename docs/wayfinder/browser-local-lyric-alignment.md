# Browser-Local Lyric Alignment

## Destination

Specify a browser-only, no-per-request-cost lyric-alignment feature that records a vocal guide over a user's backing track and proposes editable lyric-sync timing in Rhymepage.

## Notes

The existing `SyncDoc` is the timing source of truth. Version one is post-take, runs on-device in desktop Chrome/Edge with WebGPU, and preserves the manual and waveform editors as the correction path. Use `CONTEXT.md` terminology.

## Decisions so far

- Browser-only runtime: transcription and alignment stay on the user's device; no hosted inference or token-metered call is used.
- Post-take workflow: timing is proposed after a completed vocal guide rather than highlighted live.
- Canonical lyric policy: saved note lyrics remain authoritative; uncertain, skipped, repeated, or ad-libbed material requires review.
- Platform floor: version one supports desktop Chrome/Edge with WebGPU; unsupported browsers keep existing manual lyric sync.
- Model direction: begin with a browser-ready ONNX Whisper-family model, not Parakeet v3.
- Capture contract: headphones are required so backing-track monitoring is separated from the temporary vocal guide.
- Consent and storage: the local alignment model downloads only after an explicit opt-in action, with visible progress and an in-product option to remove its browser-cached files.
- First-use workflow: show one next action at a time—opt in, confirm headphones, download once, record a vocal guide, review the proposed timing, then apply it.
- Runtime direction: replace the stalled browser Whisper experiment with sherpa-onnx WebAssembly and the int8 English Zipformer 20M model; it is roughly 42 MB, CPU/SIMD-based, local-only, and returns token timestamps.
- Runtime feasibility: the official Sherpa browser bundle initialized and transcribed successfully in the user’s test, validating the self-hosted WebAssembly route.

## Not yet specified

- Exact model size and first-download experience depend on a measured prototype.
- Review states depend on the observed shape of uncertain alignments.

## Out of scope

- Live word-following during a performance.
- Server-side, token-billed, or third-party transcription.
- Write-tab transcription as a separate feature; version one uses recognition only to time-sync existing canonical lyrics.

## Decision tickets

- [Capture contract for a vocal guide](./capture-contract-for-a-vocal-guide.md) — resolved, grilling
- [First-use vocal-guide alignment flow](./first-use-vocal-guide-alignment-flow.md) — resolved, prototype
- [Browser alignment runtime feasibility](./browser-alignment-runtime-feasibility.md) — resolved, prototype
- [Uncertain alignment review model](./uncertain-alignment-review-model.md) — blocked by Browser alignment runtime feasibility, grilling
