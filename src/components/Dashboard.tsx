import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuChevronLeft, LuCircleAlert, LuRotateCcw } from "react-icons/lu";
import useDashboardLogic from "../hooks/useDashboardLogic";
import SuggestionPanel, { type SheetState } from "./SuggestionPanel";
import SyncPanel from "./SyncPanel";
import PlayPanel from "./PlayPanel";
import type { AppUser } from "../types/user";
import ConfirmDialog from "./ConfirmDialog";
import { unsignedDeviceDraft } from "../utils/noteDraft";

interface DashboardProps {
  currentUser: AppUser | null;
}

const NEXT_SHEET: Record<SheetState, SheetState> = {
  peek: "half",
  half: "full",
  full: "peek",
};

type Mode = "write" | "sync" | "play";
const MODES: { id: Mode; label: string }[] = [
  { id: "write", label: "Write" },
  { id: "sync", label: "Sync" },
  { id: "play", label: "Play" },
];

type SaveMark = { label: string; filled: boolean; tone: "plain" | "danger" | "accent" };

const Dashboard = ({ currentUser }: DashboardProps) => {
  const { existingNoteId } = useParams<{ existingNoteId?: string }>();
  const [sheetState, setSheetState] = useState<SheetState>("half");
  // Local UI state, not a route param: switching modes shouldn't remount the
  // page or interrupt audio playback / scroll position.
  const [mode, setMode] = useState<Mode>("write");
  const [resetting, setResetting] = useState(false);
  const [unsignedDraft, setUnsignedDraft] = useState(() => currentUser && !existingNoteId ? unsignedDeviceDraft(localStorage) : null);
  const [importing, setImporting] = useState(false);

  const {
    noteId,
    title,
    setTitle,
    lyrics,
    themes,
    setThemes,
    suggestions,
    suggestionError,
    settings,
    lastWord,
    lyricsRef,
    activeCategory,
    setActiveCategory,
    definition,
    definitionWord,
    definitionState,
    lookUpWord,
    clearDefinition,
    handleSave,
    handleReset,
    handleLeftClick,
    handleLyricsChange,
    draftState,
    retryDraft,
    resolveRecovery,
    importDeviceDraft,
  } = useDashboardLogic({ currentUser, existingNoteId });

  /*
   * The full draft message is long and mostly reassurance, so the masthead
   * shows a mark in a fixed cell instead: hollow while the writing is only on
   * this device, filled once the notebook holds it. The sentence stays as the
   * accessible label and surfaces in full only when the writer must act.
   */
  const mark: SaveMark = draftState.storageError
    ? { label: "Device copy failed", filled: false, tone: "danger" }
    : !draftState.ready ? { label: "Opening…", filled: false, tone: "plain" }
    : draftState.saving ? { label: "Saving…", filled: false, tone: "plain" }
    : draftState.recovery ? { label: "Two versions", filled: false, tone: "accent" }
    : draftState.saveFailed ? { label: "Not saved", filled: false, tone: "danger" }
    : draftState.cloudExists && !draftState.dirty ? { label: "In notebook", filled: true, tone: "plain" }
    : { label: "On this device", filled: false, tone: "plain" };
  const fullMessage = draftState.storageError || draftState.message || "Writing is kept on this device as you type.";
  const mustAct = !!draftState.storageError || draftState.saveFailed || !draftState.ready && /could not/i.test(draftState.message);

  return (
    <div className="flex h-full min-h-0 w-full flex-col md:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* ---- Song header: a card in the theme colour holding title, themes and save state ---- */}
        <section className="mx-3 mt-2 flex-none rounded-[24px] bg-accent px-4 pt-1 pb-4 text-on-accent md:mx-6 md:mt-5 md:px-6 md:pb-5">
          <div className="flex h-11 items-center gap-1">
            {currentUser ? (
              <Link to="/notes" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold hover:bg-on-accent/15 md:hidden">
                <LuChevronLeft aria-hidden className="h-[18px] w-[18px]" /> Notebook
              </Link>
            ) : null}
            <p className="ml-auto flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold" title={fullMessage}>
              <span aria-hidden className={`h-2.5 w-2.5 flex-none rounded-full border-2 border-current ${mark.filled ? "bg-current" : ""}`} />
              <span className="sr-only" role={draftState.storageError ? "alert" : "status"}>{fullMessage}</span>
              <span aria-hidden>{mark.label}</span>
            </p>
            {!currentUser ? (
              <Link to="/login" className="ml-2 inline-flex min-h-9 items-center rounded-full bg-on-accent px-4 text-sm font-bold text-accent">Sign in to save</Link>
            ) : !draftState.cloudExists && (
              <button
                type="button"
                onClick={handleSave}
                disabled={!draftState.ready || draftState.recovery || draftState.saving}
                title="Save to your notebook. It autosaves from then on."
                className="ml-2 inline-flex min-h-9 items-center rounded-full bg-on-accent px-4 text-sm font-bold text-accent disabled:opacity-60"
              >
                {draftState.saving ? "Saving…" : "Save"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setResetting(true)}
              disabled={draftState.saving}
              aria-label="Start a new draft"
              title="Start a new draft"
              className="rp-icon-btn -mr-2 hover:!bg-on-accent/15"
            >
              <LuRotateCcw aria-hidden />
            </button>
          </div>
          <input
            type="text"
            aria-label="Title"
            placeholder="Untitled"
            className="rp-bare rp-title mt-2 text-[30px] md:text-[38px]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="mt-1 flex items-baseline gap-2 text-[14px] font-medium">
            {currentUser?.displayName && <span className="flex-none">by {currentUser.displayName} ·</span>}
            <label htmlFor="note-themes" className="flex-none">Themes:</label>
            <input
              id="note-themes"
              type="text"
              placeholder="add a few to steer suggestions"
              className="rp-bare min-w-0 flex-1 text-[14px] font-medium"
              value={themes}
              onChange={(e) => setThemes(e.target.value)}
            />
          </div>
        </section>

        {/* ---- Things the writer has to decide, only when they exist ---- */}
        {(mustAct || !draftState.ready || (unsignedDraft && !draftState.dirty && !draftState.cloudExists) || (draftState.recovery && draftState.cloud)) && (
          <div className="flex-none px-3 pt-3 md:px-6">
            <div className={`rp-notice flex-col ${mustAct ? "rp-notice--danger" : ""}`}>
              <p className="flex gap-2">{mustAct && <LuCircleAlert className="mt-0.5 h-[18px] w-[18px] flex-none" aria-hidden />}{fullMessage}</p>
              <div className="flex flex-wrap gap-2">
                {!draftState.ready && <button type="button" className="rp-btn rp-btn--line rp-btn--sm" onClick={() => void retryDraft()}>Retry</button>}
                {unsignedDraft && !draftState.dirty && !draftState.cloudExists && (
                  <button type="button" className="rp-btn rp-btn--line rp-btn--sm" onClick={() => setImporting(true)}>Import this device's demo draft</button>
                )}
                {draftState.recovery && draftState.cloud && (
                  <>
                    <button type="button" className="rp-btn rp-btn--ink rp-btn--sm" onClick={() => resolveRecovery(true)}>Keep device draft</button>
                    <button type="button" className="rp-btn rp-btn--line rp-btn--sm" onClick={() => resolveRecovery(false)}>Use notebook version</button>
                  </>
                )}
              </div>
              {draftState.recovery && draftState.cloud && (
                <details className="w-full text-ink">
                  <summary className="cursor-pointer text-sm font-semibold">Compare the notebook version</summary>
                  <p className="mt-2 font-bold">{draftState.cloud.title || "Untitled"}</p>
                  <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-sans text-[15px]">{draftState.cloud.lyrics}</pre>
                  {draftState.cloud.themes && <p className="rp-muted mt-1 text-sm">Themes: {draftState.cloud.themes}</p>}
                </details>
              )}
            </div>
          </div>
        )}


        {/* ---- Write / Sync / Play ---- */}
        <div role="tablist" aria-label="Song view" className="rp-tabs mx-3 mt-3 flex-none md:mx-6">
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

        {mode === "write" && (
          <textarea
            ref={lyricsRef}
            aria-label="Lyrics"
            placeholder="Start writing. Finish a word and the suggestions follow."
            className="rp-bare min-h-0 w-full max-w-[48rem] flex-1 resize-none px-5 py-3 text-lg leading-[1.85] md:px-8 md:py-5 md:text-[19px]"
            value={lyrics}
            onChange={(e) => handleLyricsChange(
              e.currentTarget.value,
              e.currentTarget.selectionStart,
              e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing
            )}
            onCompositionEnd={(e) => handleLyricsChange(
              e.currentTarget.value, e.currentTarget.selectionStart
            )}
          />
        )}

        {mode === "sync" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SyncPanel currentUser={currentUser} noteId={noteId} lyrics={lyrics} title={title} />
          </div>
        )}

        {mode === "play" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PlayPanel currentUser={currentUser} noteId={noteId} />
          </div>
        )}
      </div>

      {/* ---- Suggestions: bottom sheet on a phone, ink column on desktop ---- */}
      {mode === "write" && (
        <SuggestionPanel
          error={suggestionError}
          suggestions={suggestions}
          settings={settings}
          lastWord={lastWord}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onSelect={handleLeftClick}
          onInspect={lookUpWord}
          definition={definition}
          definitionWord={definitionWord}
          definitionState={definitionState}
          onCloseDefinition={clearDefinition}
          sheetState={sheetState}
          onCycleSheet={() => setSheetState((s) => NEXT_SHEET[s])}
        />
      )}

      {resetting && <ConfirmDialog title="Start a new draft?" body={existingNoteId ? "Your current writing stays in its device recovery copy. A new draft opens." : "This clears this device draft. Any note already saved to your notebook stays there."} confirmLabel="New draft" onCancel={() => setResetting(false)} onConfirm={() => { handleReset(); setResetting(false); }} />}
      {importing && unsignedDraft && <ConfirmDialog title="Import this device's demo writing?" body="This copies the demo draft into your editor. Review it before saving it to your account. The demo recovery copy is kept." confirmLabel="Import draft" onCancel={() => setImporting(false)} onConfirm={() => { importDeviceDraft(unsignedDraft); setUnsignedDraft(null); setImporting(false); }} />}
    </div>
  );
};

export default Dashboard;
