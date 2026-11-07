# Browser-Local Lyric Alignment — Implementation Plan

## Approved scope

Add an optional, browser-local alignment pass to existing lyric sync. A songwriter wears headphones, records a vocal guide over an attached backing track, and receives editable proposed timing for their existing canonical lyrics. The model is Sherpa-ONNX WebAssembly with the int8 English Zipformer 20M bundle, self-hosted by Rhymepage. No hosted inference, token charge, background model download, or Write-tab transcription feature is included.

## Fixed decisions

- Manual and waveform timing remain available and authoritative.
- The local model downloads only after an explicit opt-in.
- Version one targets desktop Chrome/Edge with WebAssembly SIMD; unsupported browsers retain manual sync.
- Alignment is post-take, not live following.
- Headphones are required for a vocal guide.
- The saved lyric note is canonical; recognition output is used only to propose timing.

## Task index and critical path

| ID | Owner | Outcome | Depends on | Size | Status |
| --- | --- | --- | --- | --- | --- |
| ALN-01 | Product/data | Specify proposed-timing review and persistence contract. | — | Small | completed |
| ALN-02 | Frontend/runtime | Self-host the Sherpa bundle behind a lazy, opt-in loader with capability checks. | ALN-01 | Medium | completed |
| ALN-03 | Frontend/audio | Capture a temporary vocal guide and stream 16 kHz mono audio to the local recognizer. | ALN-02 | Medium | completed |
| ALN-04 | Frontend/domain | Match timestamped recognition tokens to canonical lyric lines/words and produce a proposal. | ALN-01, ALN-03 | Medium | completed |
| ALN-05 | UX/frontend | Add the approved guided alignment flow to SyncPanel, including download, recording, review, retry, and apply states. | ALN-02, ALN-03, ALN-04 | Medium | in-progress |
| ALN-06 | QA/accessibility | Test capability fallbacks, matching edge cases, cancellation, permissions, and manual-sync preservation. | ALN-05 | Medium | pending |

## Milestones

### M1 — A local recognizer is safely available

ALN-01 and ALN-02 complete. A user can explicitly opt in; supported browsers load only Rhymepage-hosted model assets, and unsupported browsers receive a clear manual-sync fallback.

### M2 — One take yields a reviewable proposal

ALN-03 and ALN-04 complete. A temporary vocal guide produces an in-memory timing proposal without writing a SyncDoc.

### M3 — Alignment ships alongside manual sync

ALN-05 and ALN-06 complete. A user can review, apply, retry, or abandon an alignment proposal; manual and waveform editing continue to work.

## Task details

### ALN-01 — Proposed-timing review and persistence contract

- **Owner:** Product/data
- **Journey:** A songwriter receives timings that may be imperfect and must decide whether to apply, retry, or manually fix them.
- **Likely files:** `src/types/sync.ts`, `src/utils/syncApi.ts`, `src/hooks/useSyncLogic.tsx`, tests.
- **Acceptance criteria:** A proposal is explicitly separate from saved sync timing; applying is deliberate; retry/discard writes nothing; uncertain matches are identifiable; existing `SyncDoc` data remains backward-compatible.
- **Validation:** Unit tests for proposal lifecycle and existing sync tests.
- **Risk/open decision:** Decide whether proposals are purely in memory in version one (recommended) or temporarily persisted for reload recovery. Recommended default: in memory only.

### ALN-02 — Lazy, self-hosted Sherpa loader

- **Owner:** Frontend/runtime
- **Journey:** A supported user explicitly starts alignment and sees download/preparation progress; no model assets are requested before that action.
- **Likely files:** new `src/alignment/` runtime module, `public/` model bundle, build/static-host configuration, capability tests.
- **Acceptance criteria:** No remote model URL; lazy load only after opt-in; WebAssembly SIMD/browser capability guard; cancellation/failure produces an actionable manual-sync fallback; model assets are excluded from source control and documented for deployment.
- **Validation:** Browser-network inspection plus a focused loader test.
- **Risk:** Static-host caching/header requirements must be verified in the deployed environment.

### ALN-03 — Temporary vocal-guide capture

- **Owner:** Frontend/audio
- **Journey:** With headphones, a user records one take over backing-track playback, stops it, and lets the browser finish local recognition.
- **Likely files:** new `src/alignment/` capture module; `useSyncLogic.tsx` boundary; focused tests.
- **Acceptance criteria:** Records only after microphone permission; cleans up microphone tracks on stop/cancel/unmount; sends 16 kHz mono audio; never uploads or persists a vocal guide.
- **Validation:** Browser microphone test and unit test for state cleanup.

### ALN-04 — Canonical-lyrics token matcher

- **Owner:** Frontend/domain
- **Journey:** Recognized token starts become a tentative line/word schedule for the saved lyric note, without changing the lyric text.
- **Likely files:** new pure matcher under `src/utils/`, `src/types/sync.ts`, unit tests.
- **Acceptance criteria:** Normalizes punctuation/case; tolerates bounded misses; maps only credible matches; marks uncertainty; estimates word ends from subsequent starts; never silently applies unmatched timing.
- **Validation:** Deterministic fixture tests for clean takes, skipped words, repeated words, ad-libs, and punctuation.

### ALN-05 — Guided alignment in SyncPanel

- **Owner:** UX/frontend
- **Journey:** Start alignment → one-time setup → record → locally process → review → apply/retry. Existing fast/manual sync remains visible as the fallback.
- **Likely files:** `src/components/SyncPanel.tsx`, `src/hooks/useSyncLogic.tsx`, new alignment components/styles.
- **Acceptance criteria:** Implements the approved one-next-action flow; clear local-only and headphone messages; keyboard/focus states; no persistent technical controls; apply updates existing line/word timing through established APIs.
- **Validation:** Rendered desktop/mobile review, keyboard pass, and manual-sync regression checks.

### ALN-06 — Quality and fallback verification

- **Owner:** QA/accessibility
- **Journey:** Unsupported, denied-permission, cancelled, low-confidence, and successful flows are recoverable and leave existing sync intact.
- **Likely files:** focused Vitest tests and UI checks.
- **Acceptance criteria:** Automated matcher/lifecycle coverage, build/lint pass, browser checks, accessibility review, no remote inference request, and documented deployment asset steps.
- **Validation:** `pnpm test`, `pnpm lint`, `pnpm build`, plus browser inspection.

## Handoff

Build order is ALN-01 → ALN-02 → ALN-03/ALN-04 → ALN-05 → ALN-06. The only product-level implementation choice left is ALN-01’s proposal-retention policy; default to in-memory-only unless you want a recovered draft after refresh. Any request to add Write-tab transcription, cloud fallback, mobile support, live following, or server-side recording storage returns to scoping.

**Approval required:** Approve this plan and the in-memory-only proposal default to begin ALN-01.
