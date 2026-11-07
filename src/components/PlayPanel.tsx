import { useEffect, useRef, useState } from "react";
import { LuFlipHorizontal2, LuPause, LuPlay, LuSkipBack } from "react-icons/lu";
import usePlayLogic from "../hooks/usePlayLogic";
import Loading from "./Loading";
import type { LineTiming, SyncDoc } from "../types/sync";
import type { AppUser } from "../types/user";

interface PlayPanelProps {
  currentUser: AppUser | null;
  noteId: string;
}

type PlayMode = "simple" | "karaoke" | "teleprompter";
const MODES: { id: PlayMode; label: string }[] = [
  { id: "simple", label: "Simple" },
  { id: "karaoke", label: "Karaoke" },
  { id: "teleprompter", label: "Teleprompter" },
];

type GapBehavior = "hold" | "clear" | "preview";
const GAP_BEHAVIORS: { id: GapBehavior; label: string }[] = [
  { id: "hold", label: "Hold" },
  { id: "clear", label: "Clear" },
  { id: "preview", label: "Preview" },
];

/**
 * What to show during a gap between lines. `activeLineId` from `usePlayLogic`
 * stays a pure "literally playing right now, or null" signal -- this is a
 * presentation-only substitute, not a redefinition of "active". A full scan
 * rather than an early-break, since overlapping segments are intentionally
 * supported and can't be assumed chronological.
 */
function resolveGapLineId(
  behavior: GapBehavior,
  syncDoc: SyncDoc,
  currentTime: number
): string | null {
  if (behavior === "clear") return null;

  if (behavior === "hold") {
    let result: string | null = null;
    let resultEnd = -Infinity;
    for (const id of syncDoc.lineOrder) {
      const line = syncDoc.lines[id];
      if (line.end !== null && line.end <= currentTime && line.end > resultEnd) {
        result = id;
        resultEnd = line.end;
      }
    }
    return result;
  }

  let result: string | null = null;
  let resultStart = Infinity;
  for (const id of syncDoc.lineOrder) {
    const line = syncDoc.lines[id];
    if (line.start !== null && line.start > currentTime && line.start < resultStart) {
      result = id;
      resultStart = line.start;
    }
  }
  return result;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds - m * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Word-by-word fill for the active line; falls back to a plain span for a word
 * with no timing yet. Sung words hold in ink, the word being sung takes the
 * accent, and words still to come wait in the second ink.
 */
const KaraokeLine = ({ line, currentTime }: { line: LineTiming; currentTime: number }) => (
  <>
    {line.words?.map((word, index) => {
      const sung = word.end !== null && currentTime >= word.end;
      const current =
        !sung && word.start !== null && word.end !== null && currentTime >= word.start;
      return (
        <span
          key={index}
          className={[
            "transition-colors duration-150 ease-out motion-reduce:transition-none",
            sung ? "text-ink" : current ? "text-accent-text" : "text-ink-2",
          ].join(" ")}
        >
          {index > 0 ? " " : ""}
          {word.text}
        </span>
      );
    })}
  </>
);

/** A two-state control inside a ruled segment: reversed out (ink block) when on. */
const segmentClass = (on: boolean) =>
  [
    "rp-btn rp-btn--sm",
    on ? "rounded-full bg-ink text-sleeve" : "rounded-full text-ink-2 hover:bg-surface hover:text-ink",
  ].join(" ");

/** Simple/karaoke/teleprompter presentation modes over the same synced-lyric data. */
const PlayPanel = ({ currentUser, noteId }: PlayPanelProps) => {
  const [mode, setMode] = useState<PlayMode>("simple");
  const [gapBehavior, setGapBehavior] = useState<GapBehavior>("hold");
  const [mirrored, setMirrored] = useState(false);
  const {
    syncDoc,
    loading,
    error,
    hasAudio,
    audioRef,
    isPlaying,
    currentTime,
    activeLineId,
    play,
    pause,
    seek,
    reset,
  } = usePlayLogic({ currentUser, noteId });

  const activeLineRef = useRef<HTMLParagraphElement>(null);

  // What to highlight right now: the truly active line, or -- during a gap --
  // whatever the gap-display choice substitutes in. Safe to compute before
  // the early returns below since it just short-circuits without `syncDoc`.
  const displayLineId =
    activeLineId ?? (syncDoc ? resolveGapLineId(gapBehavior, syncDoc, currentTime) : null);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [displayLineId]);

  if (!noteId) {
    return (
      <p className="max-w-md px-4 py-10 text-[15px] text-ink-2 md:px-6">
        Save this note first -- there's nothing to play yet.
      </p>
    );
  }

  if (loading) {
    return <Loading label="Loading lyrics" />;
  }

  if (!syncDoc || syncDoc.lineOrder.length === 0) {
    return (
      <p className="max-w-md px-4 py-10 text-[15px] text-ink-2 md:px-6">
        {error || "No synced lyrics yet. Head to the Sync tab to mark this song's timing."}
      </p>
    );
  }

  const duration = syncDoc.audio?.durationSeconds ?? null;
  const teleprompter = mode === "teleprompter";

  return (
    <div className="flex h-full w-full flex-col">
      {error && <p role="alert" className="rp-message rp-message--danger flex-none px-4 pt-4 md:px-6">{error}</p>}
      {hasAudio && syncDoc.audio && (
        <audio ref={audioRef} src={syncDoc.audio.downloadUrl} preload="metadata" />
      )}

      {/* ---- Presentation mode, and how the gaps between lines read ---- */}
      <div className="flex flex-none flex-col gap-3 px-4 pt-4 md:px-6 md:pt-5">
        <div role="tablist" aria-label="Play mode" className="rp-tabs">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className="rp-tab"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div role="group" aria-label="Gap" className="flex items-center gap-3">
            <span className="rp-label" aria-hidden>Gap</span>
            <div className="flex rounded-full bg-sleeve-2 p-1">
              {GAP_BEHAVIORS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={gapBehavior === id}
                  onClick={() => setGapBehavior(id)}
                  className={segmentClass(gapBehavior === id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {teleprompter && (
            <div className="flex rounded-full bg-sleeve-2 p-1">
              <button
                type="button"
                aria-pressed={mirrored}
                onClick={() => setMirrored((m) => !m)}
                className={segmentClass(mirrored)}
              >
                <LuFlipHorizontal2 aria-hidden /> Mirror
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- The lyric: the current line lifts, the rest stay set back ---- */}
      <div
        className="no-bar flex min-h-60 flex-1 flex-col items-center justify-start gap-4 overflow-y-auto px-4 py-8 text-center md:px-6"
        style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      >
        {syncDoc.lineOrder.map((lineId) => {
          const line = syncDoc.lines[lineId];
          const isActive = lineId === activeLineId;
          const isDisplayed = lineId === displayLineId;
          const showKaraoke = mode === "karaoke" && isActive && (line.words?.length ?? 0) > 0;
          return (
            <p
              key={lineId}
              ref={isDisplayed ? activeLineRef : undefined}
              className={[
                "max-w-[40rem] transition-[color,font-size] duration-200 ease-out motion-reduce:transition-none",
                isDisplayed
                  ? "leading-tight font-extrabold tracking-[-0.01em] text-ink"
                  : "leading-snug text-ink-2",
                isDisplayed
                  ? teleprompter ? "text-[40px] md:text-[56px]" : "text-[26px] md:text-[28px]"
                  : teleprompter ? "text-[30px] font-semibold md:text-[40px]" : "text-[17px] md:text-lg",
              ].join(" ")}
            >
              {showKaraoke ? <KaraokeLine line={line} currentTime={currentTime} /> : line.text}
            </p>
          );
        })}
      </div>

      {/* ---- Transport ---- */}
      <div className="flex flex-none flex-col gap-2 border-t border-rule bg-surface px-4 pt-2 pb-4 md:px-6">
        {duration !== null && (
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={Math.min(currentTime, duration)}
            onChange={(e) => seek(Number(e.target.value))}
            className="rp-range"
            aria-label="Playback position"
          />
        )}
        <div className="flex items-center justify-center gap-3">
          <span className="w-14 flex-none text-right text-[13px] font-semibold tabular-nums text-accent-text">
            {formatTimestamp(currentTime)}
          </span>
          <button type="button" className="rp-icon-btn" aria-label="Reset" title="Back to the start" onClick={reset}>
            <LuSkipBack aria-hidden />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            className="inline-flex h-14 w-14 flex-none items-center justify-center rounded-full bg-ink text-sleeve transition-colors duration-150 ease-out hover:bg-ink-2 motion-reduce:transition-none"
            onClick={() => (isPlaying ? pause() : play())}
          >
            {isPlaying ? <LuPause aria-hidden className="h-6 w-6" /> : <LuPlay aria-hidden className="h-6 w-6" />}
          </button>
          {/* Balances Reset so the play block sits centred under the slider. */}
          <span className="w-11 flex-none" aria-hidden />
          <span className="w-14 flex-none text-[13px] tabular-nums text-ink-2">
            {duration !== null ? formatTimestamp(duration) : ""}
          </span>
        </div>
        {!hasAudio && (
          <p className="text-center text-[13px] text-ink-2">
            No audio attached -- playing from the synced timing alone.
          </p>
        )}
      </div>
    </div>
  );
};

export default PlayPanel;
