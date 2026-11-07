import { useState } from "react";
import { useParams } from "react-router-dom";
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex-none border-b border-base-300 px-3 py-2 text-xs" aria-live="polite">
        <p role={draftState.storageError ? "alert" : "status"}>{draftState.storageError || draftState.message || "Writing is kept on this device as you type."}</p>
        {!draftState.ready && <button type="button" className="btn btn-ghost btn-xs" onClick={() => void retryDraft()}>Retry notebook load</button>}
        {unsignedDraft && !draftState.dirty && !draftState.cloudExists && <button type="button" className="btn btn-ghost btn-xs" onClick={() => setImporting(true)}>Import unsigned draft from this device</button>}
        {draftState.recovery && draftState.cloud && (
          <div className="mt-1 flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-xs" onClick={() => resolveRecovery(true)}>Keep device draft</button>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => resolveRecovery(false)}>Use notebook version</button>
            <details className="w-full"><summary>Compare notebook version</summary><p className="mt-2 font-semibold">{draftState.cloud.title || "Untitled"}</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap font-sans">{draftState.cloud.lyrics}</pre><p>{draftState.cloud.themes}</p></details>
          </div>
        )}
      </div>
      <div
        role="tablist"
        aria-label="Song view"
        className="flex flex-none items-center gap-1 border-b border-base-300 px-3 md:px-5"
      >
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={[
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              mode === id
                ? "border-primary text-primary"
                : "border-transparent opacity-60 hover:opacity-100",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "write" && (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* ---- editor column ---- */}
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Keep the writing measure readable rather than letting it span a wide monitor. */}
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
            <header className="flex flex-none items-center gap-2 border-b border-base-300 px-3 py-2 md:px-5">
              <input
                type="text"
                aria-label="Title"
                placeholder="Untitled"
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:opacity-40"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={!currentUser || !draftState.ready || draftState.recovery || draftState.saving}
                title={
                  currentUser
                    ? "Save to your notebook - it autosaves from then on"
                    : "Log in to save notes"
                }
                className="btn btn-primary btn-sm"
              >
                {draftState.saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setResetting(true)}
                disabled={draftState.saving}
                className="btn btn-ghost btn-sm"
              >
                Reset
              </button>
            </header>

            <div className="flex flex-none items-center gap-2 border-b border-base-300 px-3 py-1.5 md:px-5">
              <label
                htmlFor="note-themes"
                className="flex-none text-[0.68rem] font-medium uppercase tracking-wider opacity-55"
              >
                Themes
              </label>
              <input
                id="note-themes"
                type="text"
                placeholder="ocean, midnight - steers the suggestions"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                value={themes}
                onChange={(e) => setThemes(e.target.value)}
              />
            </div>

            <textarea
              ref={lyricsRef}
              aria-label="Lyrics"
              placeholder="Start writing. Finish a word and the suggestions follow."
              className="min-h-0 w-full flex-1 resize-none bg-transparent px-3 py-3 text-lg
                         leading-loose outline-none placeholder:opacity-40 md:px-5"
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
            </div>
          </div>

          {/* ---- suggestions: bottom sheet on a phone, right dock on desktop ---- */}
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
        </div>
      )}

      {mode === "sync" && (
        <SyncPanel currentUser={currentUser} noteId={noteId} lyrics={lyrics} title={title} />
      )}

      {mode === "play" && <PlayPanel currentUser={currentUser} noteId={noteId} />}
      {resetting && <ConfirmDialog title="Start a new draft?" body={existingNoteId ? "Your current writing stays in its device recovery copy. A new draft opens." : "This clears this device draft. Any note already saved to your notebook stays there."} confirmLabel="New draft" onCancel={() => setResetting(false)} onConfirm={() => { handleReset(); setResetting(false); }} />}
      {importing && unsignedDraft && <ConfirmDialog title="Import this device's unsigned writing?" body="This copies the unsigned demo draft into your editor. Review it before saving it to your account. The unsigned recovery copy is kept." confirmLabel="Import draft" onCancel={() => setImporting(false)} onConfirm={() => { importDeviceDraft(unsignedDraft); setUnsignedDraft(null); setImporting(false); }} />}
    </div>
  );
};

export default Dashboard;
