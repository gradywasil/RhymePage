import { useEffect, useRef, useState, type RefObject } from "react";
import { LuPause, LuPlay, LuRotateCcw, LuUndo2 } from "react-icons/lu";
import { splitWords } from "../utils/lyrics";
import type { LineTiming, WordTiming } from "../types/sync";

interface WordSyncEditorProps {
  /** `line.start`/`line.end` are guaranteed non-null by the caller -- word sync needs a bounded window. */
  line: LineTiming;
  audioRef: RefObject<HTMLAudioElement | null>;
  onWordsChange: (lineId: string, words: WordTiming[]) => void;
  onClose: () => void;
}

/** Words are far shorter than lines, so Replay only needs a small rewind. */
const WORD_REPLAY_SECONDS = 1.5;

function formatSeconds(seconds: number | null): string {
  return seconds === null ? "--" : seconds.toFixed(2);
}

/** Reuses existing word timing if it's still valid for the current text, rather than discarding it. */
function seedWords(line: LineTiming): WordTiming[] {
  const texts = splitWords(line.text);
  const existing = line.words;
  const reusable =
    !!existing &&
    existing.length === texts.length &&
    existing.every((w, i) => w.text === texts[i]);
  if (reusable && existing) return existing.map((w) => ({ ...w }));
  return texts.map((text) => ({ text, start: null, end: null }));
}

/**
 * A tap-through mini fast-sync for one line's words, mirroring useSyncLogic's
 * mark/replay/undo vocabulary but bounded to the line's own audio window.
 * Reuses the same shared `<audio>` element via `audioRef` rather than a
 * second one.
 */
const WordSyncEditor = ({ line, audioRef, onWordsChange, onClose }: WordSyncEditorProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [words, setWords] = useState<WordTiming[]>(() => seedWords(line));
  const [armedIndex, setArmedIndex] = useState<number | null>(() => {
    const idx = words.findIndex((w) => w.start === null);
    return idx === -1 ? null : idx;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const undoStackRef = useRef<
    { index: number; previousStart: number | null; previousEnd: number | null }[]
  >([]);
  /** The word marked most recently, so the next mark can close its `end`. */
  const previouslyArmedRef = useRef<number | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Bound playback to this line's window and start at its beginning.
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || line.start === null || line.end === null) return;
    const lineStart = line.start;
    const lineEnd = line.end;
    audioEl.currentTime = lineStart;

    const onTimeUpdate = () => {
      if (audioEl.currentTime >= lineEnd) audioEl.pause();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audioEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("play", onPlay);
    audioEl.addEventListener("pause", onPause);
    return () => {
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
      audioEl.removeEventListener("play", onPlay);
      audioEl.removeEventListener("pause", onPause);
      audioEl.pause();
    };
  }, [audioRef, line.start, line.end]);

  const commit = (next: WordTiming[]) => {
    setWords(next);
    onWordsChange(line.lineId, next);
  };

  const mark = () => {
    const audioEl = audioRef.current;
    if (!audioEl || armedIndex === null || line.end === null) return;
    const timestamp = audioEl.currentTime;
    const next = [...words];

    undoStackRef.current.push({
      index: armedIndex,
      previousStart: next[armedIndex].start,
      previousEnd: next[armedIndex].end,
    });
    setCanUndo(true);

    const prevIndex = previouslyArmedRef.current;
    if (prevIndex !== null && prevIndex !== armedIndex && next[prevIndex].end === null) {
      next[prevIndex] = { ...next[prevIndex], end: timestamp };
    }

    // The last word is bounded by the parent line's own end -- no separate
    // "Finish" tap needed, unlike line-level sync which has no such bound.
    const isLast = armedIndex === next.length - 1;
    next[armedIndex] = {
      ...next[armedIndex],
      start: timestamp,
      end: isLast ? line.end : next[armedIndex].end,
    };

    commit(next);
    previouslyArmedRef.current = armedIndex;
    setArmedIndex(isLast ? null : armedIndex + 1);
  };

  const replay = () => {
    const audioEl = audioRef.current;
    if (!audioEl || line.start === null) return;
    audioEl.currentTime = Math.max(line.start, audioEl.currentTime - WORD_REPLAY_SECONDS);
  };

  const undo = () => {
    const last = undoStackRef.current.pop();
    setCanUndo(undoStackRef.current.length > 0);
    if (!last) return;
    const next = [...words];
    next[last.index] = { ...next[last.index], start: last.previousStart, end: last.previousEnd };
    commit(next);
    setArmedIndex(last.index);
    previouslyArmedRef.current = null;
  };

  const resumeFrom = (index: number) => {
    previouslyArmedRef.current = null;
    setArmedIndex(index);
  };

  const togglePlay = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (isPlaying) audioEl.pause();
    else void audioEl.play().catch(() => setIsPlaying(false));
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="word-sync-title"
      className="rp-dialog"
    >
      <div className="rp-dialog-head">
        <h2 id="word-sync-title" className="rp-title text-xl">Word timing</h2>
        <p className="rp-muted mt-1 text-[15px]">{line.text}</p>
      </div>

      <div className="rp-dialog-body flex flex-col gap-3">
        <div className="no-bar mt-2 flex max-h-64 flex-col overflow-y-auto rounded-2xl bg-sleeve p-1">
          {words.map((word, index) => {
            const isArmed = index === armedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => resumeFrom(index)}
                className={[
                  "flex min-h-11 flex-none items-center gap-3 border-b border-rule py-1.5 pr-2 pl-1 text-left text-[15px] transition-colors duration-150 ease-out motion-reduce:transition-none",
                  isArmed ? "rounded-xl bg-ink text-sleeve" : "rounded-xl hover:bg-sleeve-2",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-[7.5rem] flex-none text-[13px] font-semibold tabular-nums",
                    isArmed ? "text-sleeve" : word.start !== null ? "text-accent-text" : "text-ink-2",
                  ].join(" ")}
                >
                  {formatSeconds(word.start)}
                  <span className={`font-normal ${isArmed ? "text-sleeve" : "text-ink-2"}`}> - {formatSeconds(word.end)}</span>
                </span>
                <span className="min-w-0 flex-1 truncate">{word.text}</span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[13px] text-ink-2 tabular-nums">
          {armedIndex !== null
            ? `Marking word ${armedIndex + 1} of ${words.length}`
            : "All words marked."}
        </p>

        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <button type="button" className="rp-icon-btn" aria-label="Undo" title="Undo" disabled={!canUndo} onClick={undo}>
            <LuUndo2 aria-hidden />
          </button>
          <button type="button" className="rp-icon-btn" aria-label="Replay" title="Replay" onClick={replay}>
            <LuRotateCcw aria-hidden />
          </button>
          <button
            type="button"
            className="rp-btn rp-btn--ink h-14 min-w-28"
            disabled={armedIndex === null}
            onClick={mark}
          >
            Mark
          </button>
          <button type="button" className="rp-btn rp-btn--line" onClick={togglePlay}>
            {isPlaying ? <LuPause aria-hidden /> : <LuPlay aria-hidden />}
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className="rp-dialog-foot">
        <button
          type="button"
          className="rp-btn rp-btn--line"
          onClick={() => dialogRef.current?.close()}
        >
          Done
        </button>
      </div>
    </dialog>
  );
};

export default WordSyncEditor;
