# Production Log

## ALN-01 — Proposed-timing review and persistence contract

- **Status:** completed (user approved)
- **Outcome:** Added an in-memory `TimingProposal` lifecycle and side-effect-free conversion to existing line-timing patches. Applying a proposal returns patches for the caller to persist; reviewing, retrying, and discarding write nothing.
- **Changed:** `src/types/sync.ts`, `src/types/sync.test.ts`, production-plan/state artifacts.
- **Validation:** `pnpm test -- src/types/sync.test.ts` — 4 files / 34 tests passed. No UI or Firestore behavior changed.
- **Deviations:** None. ALN-01 was implemented by a focused subagent and independently verified in the main task.
- **Next:** ALN-02 — lazy, self-hosted Sherpa loader, after approval.

## ALN-02 — Lazy, self-hosted Sherpa loader

- **Status:** completed (user approved)
- **Outcome:** Added a local-only, inert-until-opt-in Sherpa loader. It checks WebAssembly/SIMD support, loads only the self-hosted bundle, reports preparation progress, supports cancellation, and returns an actionable manual-sync fallback on failure.
- **Changed:** `src/alignment/sherpaLoader.ts`, `src/alignment/sherpaLoader.test.ts`, production-plan/state artifacts.
- **Validation:** `pnpm test -- src/alignment/sherpaLoader.test.ts` — 5 files / 38 tests passed.
- **Deviations:** None. The static model assets remain ignored by Git and are documented/staged separately from source code.
- **Next:** ALN-03 — temporary vocal-guide capture, after approval.

## ALN-03 — Temporary vocal-guide capture

- **Status:** completed (user approved)
- **Outcome:** Added an explicit-start microphone capture module that produces disposable 16 kHz mono `Float32Array` PCM for local recognition. It releases microphone tracks and audio contexts on successful stop, cancel, permission failure, recorder error, and decode failure.
- **Changed:** `src/alignment/vocalGuideCapture.ts`, `src/alignment/vocalGuideCapture.test.ts`, production-plan/state artifacts.
- **Validation:** `pnpm test -- src/alignment/vocalGuideCapture.test.ts` — 6 files / 43 tests passed. A cancellation test initially surfaced an unhandled rejection when a recorder fires `onstop` synchronously; fixed and rerun cleanly.
- **Deviations:** No runtime or UI integration yet; output is temporary and local only.
- **Next:** ALN-04 — canonical-lyrics token matcher, after approval.

## ALN-04 — Canonical-lyrics token matcher

- **Status:** completed (user approved)
- **Outcome:** Added a pure matcher that normalizes recognized tokens against canonical lyric lines, returns in-memory timing proposals, estimates word ends from subsequent token starts, and flags skipped, repeated, ad-libbed, or mismatched passages for review rather than forcing timings.
- **Changed:** `src/alignment/canonicalLyricsMatcher.ts`, `src/alignment/canonicalLyricsMatcher.test.ts`, production-plan/state artifacts.
- **Validation:** `pnpm test -- src/alignment/canonicalLyricsMatcher.test.ts` — 7 files / 48 tests passed.
- **Next:** ALN-05 — guided alignment in SyncPanel, after approval.
