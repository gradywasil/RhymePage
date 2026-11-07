import { useEffect, useRef, useState } from "react";
import {
  LuAudioWaveform,
  LuDownload,
  LuListMusic,
  LuMic,
  LuPause,
  LuPlay,
  LuRotateCcw,
  LuTriangleAlert,
  LuUndo2,
  LuUpload,
  LuX,
} from "react-icons/lu";
import useSyncLogic from "../hooks/useSyncLogic";
import WaveformEditor from "./WaveformEditor";
import WordSyncEditor from "./WordSyncEditor";
import { FormMessage } from "./FormControls";
import ConfirmDialog from "./ConfirmDialog";
import Loading from "./Loading";
import { downloadTextFile, slugForFilename, toExportJson, toLrc } from "../utils/syncExport";
import type { AppUser } from "../types/user";
import { isAndroid, nativeApp } from "../utils/nativeApp";
import { ANDROID_ALIGNMENT_MESSAGE, localAlignmentAvailable } from "../alignment/platformSupport";

interface SyncPanelProps {
  currentUser: AppUser | null;
  noteId: string;
  lyrics: string;
  title: string;
}

type SyncView = "fast" | "precision";

function formatTimestamp(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

const SyncPanel = ({ currentUser, noteId, lyrics, title }: SyncPanelProps) => {
  const [confirmingRemoveAudio, setConfirmingRemoveAudio] = useState(false);
  const [discardingTiming, setDiscardingTiming] = useState(false);
  const [requestedView, setRequestedView] = useState<SyncView>("fast");
  const [wordSyncLineId, setWordSyncLineId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const exportFile = async (format: "lrc" | "json") => {
    if (!syncDoc || exporting) return;
    setExporting(true);
    setExportMessage("");
    try {
      const saved = await downloadTextFile(`${slugForFilename(title)}.${format}`, format === "lrc" ? toLrc(syncDoc, title) : JSON.stringify(toExportJson(syncDoc, title), null, 2), format === "lrc" ? "text/plain" : "application/json");
      setExportMessage(saved ? "Export saved." : "Export cancelled. Your timing is unchanged.");
    } catch {
      setExportMessage("Could not export. Choose another location and try again.");
    } finally { setExporting(false); }
  };

  const {
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
    exportDeviceTiming,
    retryTiming,
    discardDeviceTiming,
    cancelUpload,
    uploadError,
    hasAudio,
    audioRef,
    start,
    pause,
    replay,
    mark,
    finish,
    undo,
    resumeFrom,
    discardOrphan,
    attachAudio,
    removeAudio,
    setLineTiming,
    setLineWords,
    canUndo,
    alignment,
    openAlignment,
    setHeadphonesConfirmed,
    prepareAlignment,
    startVocalGuide,
    finishVocalGuide,
    cancelAlignment,
    retryAlignment,
    applyAlignment,
  } = useSyncLogic({ currentUser, noteId, lyrics });

  // The precision editor needs audio to draw a waveform against -- fall back
  // to fast-sync if it was removed while that view was open, without a
  // dedicated effect (this is a pure derivation, not new state to persist).
  const view: SyncView = hasAudio ? requestedView : "fast";

  // Whether a line has been started but not yet closed -- at most one line is
  // ever in this state at a time, so this is a reliable "still needs Finish"
  // signal without the panel having to track which line was marked last.
  // Null-safe since syncDoc may still be loading here, before this hook's
  // effect (which needs it as a dependency) but after the early guards below.
  const needsFinish =
    syncDoc?.lineOrder.some((id) => {
      const line = syncDoc.lines[id];
      return line.start !== null && line.end === null;
    }) ?? false;

  // Space to mark, "r" to replay, desktop-only convenience -- avoids
  // hijacking typing in the (only) text input on this panel, the file picker.
  // Suppressed while the word-sync modal is open: its own controls own Space
  // /keyboard focus there, and a native <dialog> doesn't stop this bubbling.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (wordSyncLineId) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (armedLineId) void mark();
        else if (needsFinish) void finish();
      } else if (e.key.toLowerCase() === "r") {
        replay();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [armedLineId, mark, finish, replay, wordSyncLineId, needsFinish]);

  if (!currentUser) {
    return (
      <p className="max-w-md px-4 py-10 text-[15px] text-ink-2 md:px-6">
        Log in to sync this song to a recording.
      </p>
    );
  }

  if (!noteId) {
    return (
      <p className="max-w-md px-4 py-10 text-[15px] text-ink-2 md:px-6">
        Save this note first -- sync needs somewhere to keep its timing.
      </p>
    );
  }

  if (loading) {
    return <Loading label="Loading sync" />;
  }

  if (error || !syncDoc) {
    return (
      <div className="max-w-md px-4 py-10 md:px-6">
        <FormMessage tone="error">{error ?? "Couldn't load sync data."}</FormMessage>
      </div>
    );
  }

  const armedIndex = armedLineId ? syncDoc.lineOrder.indexOf(armedLineId) : -1;
  const hasTimedLines = syncDoc.lineOrder.some((id) => syncDoc.lines[id].start !== null);
  const complete = status === "complete";

  return (
    <div className="flex h-full w-full max-w-[44rem] flex-col gap-4 px-4 py-4 md:px-6 md:py-5">
      {/* ---- Status, view, audio and export controls ---- */}
      <div className="flex flex-none flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`flex items-center gap-2 text-xs font-bold tracking-[0.08em] uppercase ${complete ? "text-ok" : "text-ink-2"}`}>
            <span aria-hidden className={`h-[11px] w-[11px] flex-none rounded-full border-[1.5px] border-current ${complete ? "bg-current" : ""}`} />
            {complete ? "Complete" : "Draft"}
          </p>
          <button
            type="button"
            className="rp-btn rp-btn--line rp-btn--sm"
            disabled={!hasAudio}
            title={hasAudio ? undefined : "Attach audio to use the precision editor"}
            onClick={() => setRequestedView(view === "fast" ? "precision" : "fast")}
          >
            {view === "fast" ? <LuAudioWaveform aria-hidden /> : <LuListMusic aria-hidden />}
            {view === "fast" ? "Precision editor" : "Fast sync"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rp-btn rp-btn--line rp-btn--sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <LuUpload aria-hidden />
            <span className="tabular-nums">
              {uploading ? `Uploading ${uploadProgress}%` : hasAudio ? "Replace audio" : "Attach audio"}
            </span>
          </button>
          {uploading && (
            <button type="button" className="rp-btn rp-btn--quiet rp-btn--sm" onClick={cancelUpload}>
              <LuX aria-hidden /> Cancel upload
            </button>
          )}
          {hasAudio ? (
            <button
              type="button"
              className="rp-btn rp-btn--quiet rp-btn--sm"
              onClick={() => setConfirmingRemoveAudio(true)}
            >
              Remove audio
            </button>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void attachAudio(file);
            }}
          />
          <div className="ml-auto flex flex-wrap items-center gap-1">
            <button
              type="button"
              className="rp-btn rp-btn--quiet rp-btn--sm"
              disabled={!hasTimedLines || exporting}
              title={hasTimedLines ? undefined : "Mark at least one line before exporting"}
              onClick={() => void exportFile("lrc")}
            >
              <LuDownload aria-hidden /> Export LRC
            </button>
            <button
              type="button"
              className="rp-btn rp-btn--quiet rp-btn--sm"
              disabled={!hasTimedLines || exporting}
              title={hasTimedLines ? undefined : "Mark at least one line before exporting"}
              onClick={() => void exportFile("json")}
            >
              <LuDownload aria-hidden /> Export JSON
            </button>
          </div>
        </div>
      </div>

      {hasAudio && syncDoc.audio && (
        <audio ref={audioRef} src={syncDoc.audio.downloadUrl} preload="metadata" />
      )}

      {uploadError && <FormMessage tone="error">{uploadError}</FormMessage>}
      {timingState.message && (
        <div role="status" className="rp-notice flex-none flex-col">
          <p>{timingState.message}</p>
          {timingState.review && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rp-btn rp-btn--line rp-btn--sm" onClick={() => void retryTiming()}>Save recovered timing</button>
              <button type="button" className="rp-btn rp-btn--quiet rp-btn--sm" onClick={() => void downloadTextFile(`${slugForFilename(title)}-device-timing.txt`, exportDeviceTiming(), "text/plain").catch(() => setExportMessage("Could not export the timing recovery copy."))}>Export device timing</button>
              <button type="button" className="rp-btn rp-btn--quiet rp-btn--sm" onClick={() => setDiscardingTiming(true)}>Discard device timing</button>
            </div>
          )}
        </div>
      )}
      {exportMessage && <p role="status" className="rp-message flex-none text-ink-2">{exportMessage}</p>}
      {isAndroid() && localAlignmentAvailable() && (
        <button type="button" className="rp-btn rp-btn--quiet rp-btn--sm flex-none self-start" onClick={() => void nativeApp.openSettings().catch(() => setExportMessage("Could not open Android Settings."))}>
          <LuMic aria-hidden /> Microphone permissions
        </button>
      )}

      {view === "fast" && !localAlignmentAvailable() && <p className="rp-hint flex-none">{ANDROID_ALIGNMENT_MESSAGE}</p>}
      {view === "fast" && localAlignmentAvailable() && (
        <section className="rp-card flex flex-none flex-col gap-3 px-4 py-4" aria-label="Local vocal-guide timing">
          {alignment.phase === "idle" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1 basis-60">
                <p className="text-[15px] font-bold">Align with a vocal guide</p>
                <p className="rp-hint mt-1">Record over your backing track and review suggested timing. Your voice stays on this device.</p>
              </div>
              <button
                type="button"
                className="rp-btn rp-btn--line"
                disabled={!hasAudio}
                title={hasAudio ? undefined : "Attach a backing track before recording a vocal guide"}
                onClick={openAlignment}
              >
                <LuMic aria-hidden /> Align lyrics
              </button>
            </div>
          )}

          {alignment.phase === "setup" && (
            <>
              <div>
                <p className="text-[15px] font-bold">Use headphones for this take</p>
                <p className="rp-hint mt-1">They keep the backing track out of your microphone. The optional speech model downloads only after you continue, then runs locally in this browser.</p>
              </div>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  className="rp-check"
                  checked={alignment.headphonesConfirmed}
                  onChange={event => setHeadphonesConfirmed(event.target.checked)}
                />
                <span>I'm wearing headphones.</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rp-btn rp-btn--ink" disabled={!alignment.headphonesConfirmed} onClick={() => void prepareAlignment()}>
                  Download local voice timing
                </button>
                <button type="button" className="rp-btn rp-btn--quiet" onClick={() => void cancelAlignment()}>
                  Back to manual sync
                </button>
              </div>
            </>
          )}

          {alignment.phase === "preparing" && (
            <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-3 text-[15px]">
              <span className="rp-loading flex-none" aria-hidden="true" />
              <span className="min-w-0 flex-1">{alignment.message}</span>
              <button type="button" className="rp-btn rp-btn--quiet rp-btn--sm" onClick={() => void cancelAlignment()}>Cancel</button>
            </div>
          )}

          {alignment.phase === "ready" && (
            <>
              <div>
                <p className="text-[15px] font-bold">Record your vocal guide</p>
                <p role="status" aria-live="polite" className="rp-hint mt-1">{alignment.message || "The backing track starts with your recording."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rp-btn rp-btn--ink" onClick={() => void startVocalGuide()}>
                  <LuMic aria-hidden /> Start recording
                </button>
                <button type="button" className="rp-btn rp-btn--quiet" onClick={() => void cancelAlignment()}>
                  Back to manual sync
                </button>
              </div>
            </>
          )}

          {alignment.phase === "recording" && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="h-2.5 w-2.5 flex-none bg-danger" aria-hidden="true" />
              <p role="status" aria-live="polite" className="min-w-0 flex-1 basis-56 text-[15px]">Recording locally. Sing or speak along with the track, then finish the take.</p>
              <div className="ml-auto flex gap-2">
                <button type="button" className="rp-btn rp-btn--quiet" onClick={() => void cancelAlignment()}>Cancel</button>
                <button type="button" className="rp-btn rp-btn--ink" onClick={() => void finishVocalGuide()}>Finish take</button>
              </div>
            </div>
          )}

          {alignment.phase === "processing" && (
            <div role="status" aria-live="polite" className="rp-notice flex-col">
              <span className="rp-loading" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-bold">Finding timing from your take</p>
                <p className="mt-1 text-[13px] text-ink-2">{alignment.message}</p>
                <p className="mt-1 text-[13px] text-ink-2">This stays on your device and may take a moment.</p>
              </div>
            </div>
          )}

          {alignment.phase === "review" && alignment.proposal && (
            <>
              <div>
                <p className="text-[15px] font-bold">Suggested timing is ready</p>
                <p role="status" aria-live="polite" className="rp-hint mt-1">
                  {alignment.proposal.lines.length} line{alignment.proposal.lines.length === 1 ? "" : "s"} can be timed from this take.
                  {alignment.proposal.lines.some(line => line.uncertain) ? " Some words need a quick manual check afterward." : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rp-btn rp-btn--ink" onClick={() => void applyAlignment()}>Apply suggested timing</button>
                <button type="button" className="rp-btn rp-btn--line" onClick={retryAlignment}>Record another take</button>
                <button type="button" className="rp-btn rp-btn--quiet" onClick={() => void cancelAlignment()}>Keep manual sync</button>
              </div>
            </>
          )}

          {alignment.phase === "fallback" && (
            <>
              <div className="rp-notice">
                <LuTriangleAlert aria-hidden />
                <p role="alert">{alignment.message}</p>
              </div>
              <button type="button" className="rp-btn rp-btn--quiet self-start" onClick={() => void cancelAlignment()}>Use manual sync</button>
            </>
          )}
        </section>
      )}

      {syncDoc.warnings.length > 0 && (
        <div className="rp-notice flex-none">
          <LuTriangleAlert aria-hidden />
          <div className="flex min-w-0 flex-col gap-1">
            {syncDoc.warnings.map((w, i) => (
              <p key={i}>{w.message}</p>
            ))}
          </div>
        </div>
      )}

      {reviewLines.length > 0 && (
        <div className="rp-notice flex-none flex-col">
          <p className="flex gap-2 font-semibold">
            <LuTriangleAlert aria-hidden className="mt-0.5 h-[18px] w-[18px] flex-none" />
            {reviewLines.length} old line{reviewLines.length === 1 ? "" : "s"} no longer
            match the lyrics and need review:
          </p>
          <div className="flex w-full flex-col">
            {reviewLines.map((line) => (
              <div key={line.lineId} className="flex items-center justify-between gap-2 border-t border-rule">
                <span className="min-w-0 truncate text-ink-2 line-through">{line.text}</span>
                <button
                  type="button"
                  className="rp-btn rp-btn--quiet rp-btn--sm flex-none"
                  onClick={() => void discardOrphan(line.lineId)}
                >
                  Discard
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "precision" ? (
        <WaveformEditor
          syncDoc={syncDoc}
          audioRef={audioRef}
          onLineTimingChange={setLineTiming}
        />
      ) : (
        <>
          {/* Tap-anywhere marking surface, plus the scrollable line list:
              running times in a fixed column, lyric beside it, like a tracklist. */}
          <div
            role="button"
            tabIndex={-1}
            onClick={() => {
              if (armedLineId) void mark();
              else if (needsFinish) void finish();
            }}
            className="no-bar flex min-h-60 flex-1 cursor-pointer flex-col overflow-y-auto rounded-3xl bg-surface p-1.5"
          >
            {syncDoc.lineOrder.map((lineId) => {
              const line = syncDoc.lines[lineId];
              const isArmed = lineId === armedLineId;
              const isTimed = line.start !== null && line.end !== null;
              const hasWords = (line.words?.length ?? 0) > 0;
              return (
                <div
                  key={lineId}
                  className={[
                    "flex flex-none items-center border-b border-rule transition-colors duration-150 ease-out motion-reduce:transition-none",
                    isArmed ? "rounded-2xl bg-ink text-sleeve" : "",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resumeFrom(lineId);
                    }}
                    className={[
                      "flex min-h-12 min-w-0 flex-1 items-center gap-3 py-1.5 pr-2 pl-1 text-left text-[15px]",
                      isArmed ? "" : "rounded-2xl hover:bg-sleeve-2",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-[4.75rem] flex-none text-[13px] leading-tight font-semibold tabular-nums",
                        isArmed ? "text-sleeve" : line.start !== null ? "text-accent-text" : "text-ink-2",
                      ].join(" ")}
                    >
                      <span className="block">{formatTimestamp(line.start)}</span>
                      <span className="sr-only"> to </span>
                      <span className={`block font-normal ${isArmed ? "text-sleeve" : "text-ink-2"}`}>{formatTimestamp(line.end)}</span>
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {line.text}
                      {hasWords && (
                        <>
                          <span aria-hidden className={`ml-2 inline-block h-1.5 w-1.5 align-middle ${isArmed ? "bg-sleeve" : "bg-accent"}`} />
                          <span className="sr-only"> (word timing set)</span>
                        </>
                      )}
                    </span>
                  </button>
                  {isTimed && (
                    <button
                      type="button"
                      title="Word timing"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWordSyncLineId(lineId);
                      }}
                      className={[
                        "rp-btn rp-btn--sm mr-1 flex-none",
                        isArmed ? "rounded-full text-sleeve hover:bg-ink-2" : "rounded-full text-ink-2 hover:bg-sleeve-2 hover:text-ink",
                      ].join(" ")}
                    >
                      Words
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ---- Transport ---- */}
          <div className="flex flex-none items-center justify-center gap-1 md:gap-2">
            <button type="button" className="rp-icon-btn" aria-label="Undo" title="Undo" disabled={!canUndo} onClick={() => void undo()}>
              <LuUndo2 aria-hidden />
            </button>
            <button type="button" className="rp-icon-btn" aria-label="Replay" title="Replay (R)" onClick={replay}>
              <LuRotateCcw aria-hidden />
            </button>
            <button
              type="button"
              className="rp-btn rp-btn--ink h-14 min-w-28"
              disabled={!armedLineId && !needsFinish}
              onClick={() => (armedLineId ? void mark() : void finish())}
            >
              {armedLineId ? "Mark" : needsFinish ? "Finish" : "Done"}
            </button>
            <button
              type="button"
              className="rp-btn rp-btn--line"
              onClick={() => (isRunning ? pause() : start())}
            >
              {isRunning ? <LuPause aria-hidden /> : <LuPlay aria-hidden />}
              {isRunning ? "Pause" : "Start"}
            </button>
          </div>

          <p className="flex-none text-center text-[13px] text-ink-2 tabular-nums">
            {armedIndex >= 0
              ? `Marking line ${armedIndex + 1} of ${syncDoc.lineOrder.length}`
              : needsFinish
                ? "All lines marked -- tap Finish to close the last line."
                : "All lines marked."}
          </p>
        </>
      )}

      {wordSyncLineId && syncDoc.lines[wordSyncLineId] && (
        <WordSyncEditor
          line={syncDoc.lines[wordSyncLineId]}
          audioRef={audioRef}
          onWordsChange={setLineWords}
          onClose={() => setWordSyncLineId(null)}
        />
      )}

      {confirmingRemoveAudio && (
        <ConfirmDialog
          title="Remove audio?"
          body="The synced timing stays -- only the audio attachment is removed."
          confirmLabel="Remove"
          tone="danger"
          onCancel={() => setConfirmingRemoveAudio(false)}
          onConfirm={async () => {
            await removeAudio();
            setConfirmingRemoveAudio(false);
          }}
        />
      )}
      {discardingTiming && <ConfirmDialog title="Discard device timing?" body="This removes the unsaved timing recovery copy from this device and reloads your notebook timing." confirmLabel="Discard device timing" tone="danger" onCancel={() => setDiscardingTiming(false)} onConfirm={async () => { await discardDeviceTiming(); setDiscardingTiming(false); }} />}
    </div>
  );
};

export default SyncPanel;
