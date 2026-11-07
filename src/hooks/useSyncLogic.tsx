import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  attachAudio as attachAudioFile,
  discardOrphanedLine,
  ensureSyncDoc,
  getSyncDoc,
  reconcileSync,
  recordLineTimings,
  removeAudio as removeAudioFile,
} from "../utils/syncApi";
import {
  applyTimingProposal,
  computeSyncStatus,
  reviewTimingProposal,
  retryTimingProposal,
} from "../types/sync";
import type { LineTiming, SyncDoc, SyncStatus, TimingProposal, WordTiming } from "../types/sync";
import type { AppUser } from "../types/user";
import { matchRecognizedTokensToLyrics } from "../alignment/canonicalLyricsMatcher";
import { sherpaLoader, type SherpaRuntime } from "../alignment/sherpaLoader";
import { recognizeVocalGuide } from "../alignment/sherpaRecognition";
import { createVocalGuideCapture, type VocalGuideCapture } from "../alignment/vocalGuideCapture";
import { describeAlignmentError } from "../alignment/alignmentError";
import { TimingDraft, timingDraftKey, type TimingPatch } from "../utils/timingDraft";
import { auth } from "../firebase";
import { getRecoveryStorage } from "../utils/recoveryStorage";

/** How far Replay rewinds so a missed line is cheap to retry. */
const REPLAY_SECONDS = 3;

interface UndoEntry {
  lineId: string;
  previousStart: number | null;
  previousEnd: number | null;
}

function firstUntimedLineId(doc: SyncDoc): string | null {
  return (
    doc.lineOrder.find((lineId) => doc.lines[lineId]?.start === null) ?? null
  );
}

/** Applies patches to a local copy of the doc for an optimistic UI update. */
function applyPatches(
  doc: SyncDoc,
  patches: { lineId: string; patch: Partial<Omit<LineTiming, "lineId">> }[]
): SyncDoc {
  const lines = { ...doc.lines };
  for (const { lineId, patch } of patches) {
    const existing = lines[lineId];
    if (!existing) continue;
    lines[lineId] = { ...existing, ...patch };
  }
  return { ...doc, lines };
}

interface UseSyncLogicProps {
  currentUser: AppUser | null;
  /** A note must already be saved (have an id) before it can be synced. */
  noteId: string;
  /** The live lyrics from the Write tab -- reconciliation compares against this, not a refetch. */
  lyrics: string;
}

export type AlignmentPhase =
  | "idle"
  | "setup"
  | "preparing"
  | "ready"
  | "recording"
  | "processing"
  | "review"
  | "fallback";

export interface AlignmentUiState {
  phase: AlignmentPhase;
  message: string;
  headphonesConfirmed: boolean;
  proposal: TimingProposal | null;
}

const initialAlignmentState: AlignmentUiState = {
  phase: "idle",
  message: "",
  headphonesConfirmed: false,
  proposal: null,
};

/** Gives React one frame to paint a truthful processing update before local WASM work blocks the main thread. */
function yieldToBrowser(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

const useSyncLogic = ({ currentUser, noteId, lyrics }: UseSyncLogicProps) => {
  const [syncDoc, setSyncDoc] = useState<SyncDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [armedLineId, setArmedLineId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const [alignment, setAlignment] = useState<AlignmentUiState>(initialAlignmentState);

  const audioRef = useRef<HTMLAudioElement>(null);
  /** `performance.now()` when the local (audio-less) clock last started running. */
  const clockStartRef = useRef<number | null>(null);
  /** Seconds accumulated on the local clock while it was last paused. */
  const clockElapsedRef = useRef(0);
  const undoStackRef = useRef<UndoEntry[]>([]);
  /** The line marked most recently, so the next mark can close its `end`. */
  const previouslyArmedRef = useRef<string | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const alignmentAbortRef = useRef<AbortController | null>(null);
  const sherpaRuntimeRef = useRef<SherpaRuntime | null>(null);
  const vocalGuideCaptureRef = useRef<VocalGuideCapture | null>(null);
  const alignmentGenerationRef = useRef(0);

  const uid = currentUser?.uid ?? null;
  const hasAudio = Boolean(syncDoc?.audio);
  const timingDraft = useMemo(() => new TimingDraft(getRecoveryStorage(), timingDraftKey(uid ?? "guest", noteId), async (snapshot, patches) => {
    if (!uid || auth.currentUser?.uid !== uid) throw new Error("Sign in again before saving timing.");
    await recordLineTimings(noteId, patches, snapshot);
  }), [uid, noteId]);
  const timingState = useSyncExternalStore(timingDraft.subscribe, timingDraft.getSnapshot);
  useEffect(() => { timingDraft.activate(); return timingDraft.close; }, [timingDraft]);
  const saveTimings = useCallback(async (patches: TimingPatch[]) => {
    if (!syncDoc) return;
    try { timingDraft.append(syncDoc.lyricsSnapshot, patches); await timingDraft.flush(); }
    catch (error) { setUploadError(error instanceof Error ? error.message : "Timing could not be saved."); }
  }, [syncDoc, timingDraft]);
  const retryTiming = async () => {
    if (!syncDoc) return;
    const pending = timingDraft.getPending();
    if (!pending || pending.lyricsSnapshot !== syncDoc.lyricsSnapshot) { setUploadError("The recovery copy belongs to different lyrics. Keep an export before discarding it."); return; }
    setSyncDoc(current => current ? applyPatches(current, Object.entries(pending.patches).map(([lineId, patch]) => ({ lineId, patch }))) : current);
    await timingDraft.flush(true);
  };

  const pushUndo = useCallback((entry: UndoEntry) => {
    undoStackRef.current.push(entry);
    setUndoCount(undoStackRef.current.length);
  }, []);

  const popUndo = useCallback((): UndoEntry | undefined => {
    const entry = undoStackRef.current.pop();
    setUndoCount(undoStackRef.current.length);
    return entry;
  }, []);

  // Bootstrap: load the existing sync doc, or create one seeded from lyrics.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!noteId || !uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const doc = await ensureSyncDoc(noteId, uid, lyrics);
        if (cancelled) return;
        setSyncDoc(doc);
        setArmedLineId(firstUntimedLineId(doc));
      } catch {
        if (!cancelled) setError("Couldn't load sync data for this song.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Deliberately not keyed on `lyrics`: this effect only bootstraps the
    // doc. Drift after that is handled by the reconciliation effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, uid]);

  // Detect lyric drift since the last reconciliation and repair timing.
  useEffect(() => {
    if (!syncDoc || !noteId || syncDoc.lyricsSnapshot === lyrics) return;
    let cancelled = false;
    (async () => {
      try {
        const reconciled = await reconcileSync(noteId, lyrics);
        if (cancelled) return;
        setSyncDoc(reconciled);
        setArmedLineId((current) => {
          const stillValid =
            current &&
            reconciled.lines[current] &&
            !reconciled.lines[current].needsReview;
          return stillValid ? current : firstUntimedLineId(reconciled);
        });
      } catch {
        // Leave the stale sync in place -- the drift banner in the UI keeps
        // reflecting `lyrics !== syncDoc.lyricsSnapshot` until this retries.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lyrics, syncDoc, noteId]);

  const getElapsedSeconds = useCallback((): number => {
    if (audioRef.current && hasAudio) return audioRef.current.currentTime;
    if (clockStartRef.current === null) return clockElapsedRef.current;
    return (
      clockElapsedRef.current + (performance.now() - clockStartRef.current) / 1000
    );
  }, [hasAudio]);

  const start = useCallback(async () => {
    try {
    if (audioRef.current && hasAudio) {
      await audioRef.current.play();
    } else {
      clockStartRef.current = performance.now();
    }
    setIsRunning(true);
    } catch { setUploadError("Audio could not play. Check your connection and try again."); setIsRunning(false); }
  }, [hasAudio]);

  const pause = useCallback(() => {
    if (audioRef.current && hasAudio) {
      audioRef.current.pause();
    } else if (clockStartRef.current !== null) {
      clockElapsedRef.current +=
        (performance.now() - clockStartRef.current) / 1000;
      clockStartRef.current = null;
    }
    setIsRunning(false);
  }, [hasAudio]);

  const replay = useCallback(() => {
    if (audioRef.current && hasAudio) {
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime - REPLAY_SECONDS
      );
      return;
    }
    clockElapsedRef.current = Math.max(0, getElapsedSeconds() - REPLAY_SECONDS);
    if (clockStartRef.current !== null) clockStartRef.current = performance.now();
  }, [hasAudio, getElapsedSeconds]);

  /** Tap/click/key: captures the armed line's start and advances to the next line. */
  const mark = useCallback(async () => {
    if (!noteId || !syncDoc || !armedLineId) return;
    const timestamp = getElapsedSeconds();
    const armedLine = syncDoc.lines[armedLineId];

    pushUndo({
      lineId: armedLineId,
      previousStart: armedLine?.start ?? null,
      previousEnd: armedLine?.end ?? null,
    });

    const patches: { lineId: string; patch: Partial<Omit<LineTiming, "lineId">> }[] =
      [{ lineId: armedLineId, patch: { start: timestamp, source: "fast-sync" } }];

    // The initial end of the previous line is inferred as this line's start
    // (spec: "Start and End Times") -- the precision editor can adjust it later.
    const prevId = previouslyArmedRef.current;
    if (prevId && prevId !== armedLineId) {
      const prevLine = syncDoc.lines[prevId];
      if (prevLine && prevLine.end === null) {
        patches.push({ lineId: prevId, patch: { end: timestamp } });
      }
    }

    setSyncDoc((current) => (current ? applyPatches(current, patches) : current));
    void saveTimings(patches);

    previouslyArmedRef.current = armedLineId;
    const idx = syncDoc.lineOrder.indexOf(armedLineId);
    const nextLineId = syncDoc.lineOrder[idx + 1] ?? null;
    setArmedLineId(nextLineId);
  }, [noteId, syncDoc, armedLineId, getElapsedSeconds, pushUndo, saveTimings]);

  /** Closes the final marked line's end. Needed because there's no next line to imply it. */
  const finish = useCallback(async () => {
    if (!noteId || !syncDoc) return;
    const lastId = previouslyArmedRef.current;
    if (!lastId) return;
    const line = syncDoc.lines[lastId];
    if (!line || line.end !== null) return;

    const timestamp = getElapsedSeconds();
    pushUndo({
      lineId: lastId,
      previousStart: line.start,
      previousEnd: line.end,
    });
    const patch = { lineId: lastId, patch: { end: timestamp } };
    setSyncDoc((current) => (current ? applyPatches(current, [patch]) : current));
    await saveTimings([patch]);
    pause();
  }, [noteId, syncDoc, getElapsedSeconds, pause, pushUndo, saveTimings]);

  const undo = useCallback(async () => {
    if (!noteId) return;
    const last = popUndo();
    if (!last) return;
    const patch = { start: last.previousStart, end: last.previousEnd };
    setSyncDoc((current) =>
      current ? applyPatches(current, [{ lineId: last.lineId, patch }]) : current
    );
    setArmedLineId(last.lineId);
    // Conservative: don't guess which line was armed before the undone mark.
    previouslyArmedRef.current = null;
    await saveTimings([{ lineId: last.lineId, patch }]);
  }, [noteId, popUndo, saveTimings]);

  /** Re-entrant sync: select any already-synced line and resume marking from there. */
  const resumeFrom = useCallback((lineId: string) => {
    previouslyArmedRef.current = null;
    setArmedLineId(lineId);
  }, []);

  const discardOrphan = useCallback(
    async (lineId: string) => {
      if (!noteId) return;
      await discardOrphanedLine(noteId, lineId);
      setSyncDoc((current) => {
        if (!current) return current;
        const rest: Record<string, LineTiming> = {};
        for (const [id, line] of Object.entries(current.lines)) {
          if (id !== lineId) rest[id] = line;
        }
        const stillHasOrphans = Object.values(rest).some(
          (l) => l.needsReview && !current.lineOrder.includes(l.lineId)
        );
        return { ...current, lines: rest, needsReview: stillHasOrphans };
      });
    },
    [noteId]
  );

  const attachAudio = useCallback(
    async (file: File) => {
      if (!noteId || !uid) return;
      if (uploadAbortRef.current) return;
      const controller = new AbortController();
      uploadAbortRef.current = controller;
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      try {
        await attachAudioFile(noteId, file, { signal: controller.signal, onProgress: setUploadProgress });
        const fresh = await getSyncDoc(noteId);
        if (fresh) setSyncDoc(fresh);
      } catch (uploadError) {
        setUploadError(
          controller.signal.aborted ? "Upload cancelled. Reopen the note to check its current audio attachment." : uploadError instanceof Error
            ? uploadError.message
            : "Couldn't attach that audio. Please try again."
        );
      } finally {
        setUploading(false);
        uploadAbortRef.current = null;
      }
    },
    [noteId, uid]
  );

  const removeAudio = useCallback(async () => {
    if (!noteId) return;
    await removeAudioFile(noteId);
    setSyncDoc((current) => (current ? { ...current, audio: undefined } : current));
  }, [noteId]);

  const openAlignment = useCallback(() => {
    if (!hasAudio) return;
    setAlignment({ phase: "setup", message: "", headphonesConfirmed: false, proposal: null });
  }, [hasAudio]);

  const setHeadphonesConfirmed = useCallback((headphonesConfirmed: boolean) => {
    setAlignment(current => ({ ...current, headphonesConfirmed }));
  }, []);

  const prepareAlignment = useCallback(async () => {
    if (!alignment.headphonesConfirmed) return;
    alignmentAbortRef.current?.abort();
    const controller = new AbortController();
    alignmentAbortRef.current = controller;
    setAlignment(current => ({ ...current, phase: "preparing", message: "Preparing local voice timing…" }));
    const result = await sherpaLoader.load({
      signal: controller.signal,
      onStatus: status => setAlignment(current => ({ ...current, message: status.message })),
    });
    if (alignmentAbortRef.current !== controller) return;
    if (result.state === "ready") {
      sherpaRuntimeRef.current = result.runtime;
      setAlignment(current => ({ ...current, phase: "ready", message: "Ready to record your vocal guide." }));
    } else if (result.state === "cancelled") {
      setAlignment(initialAlignmentState);
    } else {
      setAlignment(current => ({ ...current, phase: "fallback", message: result.message }));
    }
  }, [alignment.headphonesConfirmed]);

  const startVocalGuide = useCallback(async () => {
    const runtime = sherpaRuntimeRef.current;
    if (!runtime || !hasAudio || !audioRef.current) return;
    const capture = createVocalGuideCapture();
    const generation = ++alignmentGenerationRef.current;
    vocalGuideCaptureRef.current = capture;
    setAlignment(current => ({ ...current, phase: "recording", message: "Recording your vocal guide locally…" }));
    try {
      await capture.start();
      if (vocalGuideCaptureRef.current !== capture) { await capture.cancel(); return; }
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (captureError) {
      await capture.cancel();
      if (generation !== alignmentGenerationRef.current) return;
      vocalGuideCaptureRef.current = null;
      const message = captureError instanceof Error && captureError.name === "NotAllowedError"
        ? "Microphone permission was not granted. You can try again or keep syncing manually."
        : "The vocal guide could not start. Check your microphone, then try again.";
      setAlignment(current => ({ ...current, phase: "ready", message }));
    }
  }, [hasAudio]);

  const finishVocalGuide = useCallback(async () => {
    const capture = vocalGuideCaptureRef.current;
    const runtime = sherpaRuntimeRef.current;
    if (!capture || !runtime || !syncDoc) return;
    const generation = alignmentGenerationRef.current;
    audioRef.current?.pause();
    setAlignment(current => ({ ...current, phase: "processing", message: "Finalizing your vocal guide…" }));
    await yieldToBrowser();
    if (generation !== alignmentGenerationRef.current) return;
    let processingStage = "capturing microphone audio";
    try {
      const audio = await capture.stop();
      if (generation !== alignmentGenerationRef.current) return;
      vocalGuideCaptureRef.current = null;
      processingStage = "creating the local recognizer";
      setAlignment(current => ({ ...current, message: "Loading the local voice engine…" }));
      await yieldToBrowser();
      if (generation !== alignmentGenerationRef.current) return;
      const recognizer = runtime.createOnlineRecognizer();
      processingStage = "recognizing the vocal guide";
      setAlignment(current => ({ ...current, message: "Recognizing the words in your take…" }));
      await yieldToBrowser();
      if (generation !== alignmentGenerationRef.current) { recognizer.free?.(); return; }
      const tokens = recognizeVocalGuide(recognizer, audio);
      processingStage = "matching recognized words to the lyrics";
      setAlignment(current => ({ ...current, message: "Matching timing to your lyrics…" }));
      await yieldToBrowser();
      if (generation !== alignmentGenerationRef.current) return;
      const proposal = matchRecognizedTokensToLyrics({
        proposalId: crypto.randomUUID(),
        lines: syncDoc.lineOrder.map(lineId => ({ lineId, text: syncDoc.lines[lineId].text })),
        tokens,
      });
      if (proposal.lines.length === 0) {
        throw new Error("No lyric lines could be placed confidently from that take.");
      }
      const reviewed = reviewTimingProposal(proposal);
      setAlignment(current => ({ ...current, phase: "review", message: "Review the suggested timing before applying it.", proposal: reviewed.phase === "review" ? reviewed.proposal : null }));
    } catch (processingError) {
      if (generation !== alignmentGenerationRef.current) return;
      vocalGuideCaptureRef.current = null;
      const detail = describeAlignmentError(processingError);
      const message = detail === "The vocal guide could not be processed."
        ? `The vocal guide failed while ${processingStage}.`
        : detail;
      setAlignment(current => ({ ...current, phase: "ready", message }));
    }
  }, [syncDoc]);

  const cancelAlignment = useCallback(async () => {
    alignmentGenerationRef.current++;
    alignmentAbortRef.current?.abort();
    alignmentAbortRef.current = null;
    audioRef.current?.pause();
    await vocalGuideCaptureRef.current?.cancel();
    vocalGuideCaptureRef.current = null;
    setAlignment(initialAlignmentState);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const hidden = () => { if (document.hidden) { pause(); void cancelAlignment(); } };
    const ended = () => setIsRunning(false);
    const failed = () => { setIsRunning(false); setUploadError("Audio playback was interrupted. Check your connection and retry."); };
    document.addEventListener("visibilitychange", hidden);
    audio?.addEventListener("ended", ended);
    audio?.addEventListener("error", failed);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      audio?.removeEventListener("ended", ended);
      audio?.removeEventListener("error", failed);
      audio?.pause();
    };
  }, [hasAudio, pause, cancelAlignment]);

  const retryAlignment = useCallback(() => {
    const state = retryTimingProposal();
    setAlignment(current => ({ ...current, phase: "ready", message: "Ready to record another take.", proposal: state.phase === "review" ? state.proposal : null }));
  }, []);

  const applyAlignment = useCallback(async () => {
    if (!noteId || !alignment.proposal) return;
    const result = applyTimingProposal(reviewTimingProposal(alignment.proposal));
    if (result.patches.length === 0) return;
    setSyncDoc(current => (current ? applyPatches(current, result.patches) : current));
    try {
      await saveTimings(result.patches);
      setAlignment(initialAlignmentState);
    } catch {
      setAlignment(current => ({ ...current, phase: "review", message: "The timing could not be saved. Please try Apply again.", proposal: current.proposal }));
    }
  }, [alignment.proposal, noteId, saveTimings]);

  useEffect(() => () => {
    alignmentGenerationRef.current++;
    uploadAbortRef.current?.abort();
    alignmentAbortRef.current?.abort();
    void vocalGuideCaptureRef.current?.cancel();
    sherpaRuntimeRef.current?.dispose();
  }, []);

  /** Precision editor: a drag/resize on a waveform region, written on drag-end. */
  const setLineTiming = useCallback(
    async (lineId: string, start: number, end: number) => {
      if (!noteId) return;
      const patch = { start, end, source: "waveform" as const };
      setSyncDoc((current) =>
        current ? applyPatches(current, [{ lineId, patch }]) : current
      );
      await saveTimings([{ lineId, patch }]);
    },
    [noteId, saveTimings]
  );

  /** Word-level sync: the whole words array is rewritten on each mark/undo -- a line's word count is small. */
  const setLineWords = useCallback(
    async (lineId: string, words: WordTiming[]) => {
      if (!noteId) return;
      setSyncDoc((current) =>
        current ? applyPatches(current, [{ lineId, patch: { words } }]) : current
      );
      await saveTimings([{ lineId, patch: { words } }]);
    },
    [noteId, saveTimings]
  );

  const status: SyncStatus = syncDoc ? computeSyncStatus(syncDoc) : "draft";
  const reviewLines = syncDoc
    ? Object.values(syncDoc.lines).filter(
        (l) => l.needsReview && !syncDoc.lineOrder.includes(l.lineId)
      )
    : [];

  return {
    syncDoc,
    loading,
    error,
    status,
    reviewLines,
    armedLineId,
    isRunning,
    uploading,
    uploadProgress,
    timingState,
    exportDeviceTiming: timingDraft.exportRecovery,
    retryTiming,
    discardDeviceTiming: async () => { timingDraft.discard(); const fresh = await getSyncDoc(noteId); if (fresh) setSyncDoc(fresh); },
    cancelUpload: () => uploadAbortRef.current?.abort(),
    uploadError,
    hasAudio,
    audioRef,
    start,
    pause,
    replay,
    mark,
    finish,
    undo,
    setLineTiming,
    setLineWords,
    resumeFrom,
    discardOrphan,
    attachAudio,
    removeAudio,
    canUndo: undoCount > 0,
    alignment,
    openAlignment,
    setHeadphonesConfirmed,
    prepareAlignment,
    startVocalGuide,
    finishVocalGuide,
    cancelAlignment,
    retryAlignment,
    applyAlignment,
  };
};

export default useSyncLogic;
