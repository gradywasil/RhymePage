import type { FieldValue, Timestamp } from "firebase/firestore";

export type SyncStatus = "draft" | "complete";

/** How a line's timing was captured. "waveform" and manual word-level editing are later phases. */
export type TimingSource = "fast-sync" | "manual" | "waveform" | "local-alignment";

/**
 * Optional per-word timing, subordinate to its parent line. Not required for a
 * Complete sync. `start`/`end` are `null` until marked, same convention as
 * `LineTiming` -- a line's word list exists (and is persisted) as soon as its
 * word-sync editor is opened, not only once every word is captured.
 */
export interface WordTiming {
  text: string;
  start: number | null;
  end: number | null;
}

export interface LineTiming {
  lineId: string;
  /** Position in `lineOrder` as of the last reconciliation. Rendering/gap math only, not identity. */
  snapshotIndex: number;
  /** Exact line text this timing was captured against -- the diff's comparison key. */
  text: string;
  /** Seconds. `null` until marked. */
  start: number | null;
  end: number | null;
  source: TimingSource;
  words?: WordTiming[];
  /** Reconciliation couldn't confidently carry this line's timing forward -- needs manual attention. */
  needsReview?: boolean;
  updatedAt?: Timestamp | FieldValue;
}

export interface SyncAudio {
  /** Firebase Storage object path, e.g. notes/{noteId}/sync/main/audio/<filename>. */
  storagePath: string;
  /** Cached getDownloadURL() result, so playback never refetches it. */
  downloadUrl: string;
  contentType: string;
  durationSeconds: number | null;
  sizeBytes: number;
  uploadedAt: Timestamp | FieldValue;
  /** Provenance only -- not an access gate. */
  uploadedBy: string;
}

export interface SyncWarning {
  code: "large-gap" | "audio-changed" | "line-needs-review";
  lineId?: string;
  message: string;
}

export interface SyncDoc {
  /** "main" in v1 -- one sync per note. */
  id: string;
  /** Exact note.lyrics this sync's line data was last reconciled against. */
  lyricsSnapshot: string;
  /** Non-blank lines derived from lyricsSnapshot, in order -- the diff's "old" side. */
  snapshotLines: string[];
  lines: Record<string, LineTiming>;
  /** Map iteration order isn't guaranteed; this drives render/playback order. */
  lineOrder: string[];
  audio?: SyncAudio;
  needsReview: boolean;
  warnings: SyncWarning[];
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  createdBy: string;
}

/**
 * A candidate timing generated from a local vocal-guide recording. Proposals
 * intentionally never appear on `SyncDoc`: they are held in component state
 * until the songwriter explicitly applies them.
 */
export interface TimingProposal {
  /** A client-generated identifier that lets the UI distinguish takes. */
  id: string;
  /** The lines for which the recognizer produced credible timing. */
  lines: ProposedLineTiming[];
}

export interface ProposedLineTiming {
  /** Existing SyncDoc line identity; a proposal cannot create lyric lines. */
  lineId: string;
  start: number;
  end: number;
  /** Optional word-level timing subordinate to this existing lyric line. */
  words?: WordTiming[];
  /** The recognizer/matcher could not confidently place this line or all its words. */
  uncertain: boolean;
}

/** The narrow patch shape which can be passed to the existing sync write API. */
export interface LineTimingPatch {
  lineId: string;
  patch: Partial<
    Pick<LineTiming, "start" | "end" | "source" | "words" | "needsReview">
  >;
}

/**
 * Ephemeral alignment UI state. This state is deliberately not serializable to
 * Firestore: retry and discard are local state transitions and write nothing.
 */
export type TimingProposalState =
  | { phase: "idle" }
  | { phase: "review"; proposal: TimingProposal };

export const emptyTimingProposalState: TimingProposalState = { phase: "idle" };

/** Moves a newly-generated proposal into the review step without touching SyncDoc. */
export function reviewTimingProposal(proposal: TimingProposal): TimingProposalState {
  return { phase: "review", proposal };
}

/** Discard and retry have the same persistence behavior: neither writes anything. */
export function discardTimingProposal(): TimingProposalState {
  return emptyTimingProposalState;
}

export function retryTimingProposal(): TimingProposalState {
  return emptyTimingProposalState;
}

/**
 * Converts a reviewed proposal into the patches accepted by `recordLineTimings`.
 * Uncertain matches remain visible after applying by flagging their line for
 * manual review; confident patches do not clear an existing review flag.
 */
export function toLineTimingPatches(proposal: TimingProposal): LineTimingPatch[] {
  return proposal.lines.map(({ lineId, start, end, words, uncertain }) => ({
    lineId,
    patch: {
      start,
      end,
      source: "local-alignment",
      ...(words === undefined ? {} : { words }),
      ...(uncertain ? { needsReview: true } : {}),
    },
  }));
}

/**
 * Ends review and returns only the patches that a caller may deliberately
 * persist. Calling this function alone has no side effects.
 */
export function applyTimingProposal(state: TimingProposalState): {
  state: TimingProposalState;
  patches: LineTimingPatch[];
} {
  if (state.phase === "idle") {
    return { state, patches: [] };
  }
  return {
    state: emptyTimingProposalState,
    patches: toLineTimingPatches(state.proposal),
  };
}

/**
 * Derived, not stored: persisting status invites staleness bugs (forgetting to
 * recompute after every line edit), and recomputing from already-loaded data is
 * cheap and always correct.
 */
export function computeSyncStatus(doc: SyncDoc): SyncStatus {
  if (doc.needsReview) return "draft";
  const hasBlockingWarning = doc.warnings.some(
    (w) => w.code === "line-needs-review"
  );
  if (hasBlockingWarning) return "draft";

  const allTimed = doc.lineOrder.every((lineId) => {
    const line = doc.lines[lineId];
    return line && line.start !== null && line.end !== null && !line.needsReview;
  });
  return allTimed ? "complete" : "draft";
}
