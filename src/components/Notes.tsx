import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuPlus } from "react-icons/lu";
import useNotesLogic from "../hooks/useNotesLogic";
import NoteCard from "./NoteCard";
import NoteManageDialog from "./NoteManageDialog";
import ConfirmDialog from "./ConfirmDialog";
import Loading from "./Loading";
import type { Note } from "../types/note";
import type { AppUser } from "../types/user";
import { cacheTrackNumbers, trackNumbersFor } from "../utils/trackNumbers";

interface NotesProps {
  currentUser: AppUser | null;
}

const Notes = ({ currentUser }: NotesProps) => {
  const {
    ownNotes,
    sharedNotes,
    owners,
    visibleNotes,
    allTags,
    loading,
    tab,
    setTab,
    tagFilter,
    setTagFilter,
    createNote,
    togglePin,
    deleteNote,
    updateTags,
    shareWithEmail,
    removeCollaborator,
  } = useNotesLogic({ currentUser });

  // Track numbers follow creation order, so pinning or editing never renumbers a song.
  const trackNumbers = useMemo(() => trackNumbersFor(ownNotes), [ownNotes]);
  useEffect(() => {
    if (currentUser && !loading) cacheTrackNumbers(currentUser.uid, trackNumbers);
  }, [currentUser, loading, trackNumbers]);

  const [managing, setManaging] = useState<Note | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  if (!currentUser) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-6 py-12">
        <h1 className="rp-title text-[34px]">Your notebook</h1>
        <p className="rp-muted text-[17px]">Sign in to keep your songs, tag them, and share them with co-writers.</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/login" className="rp-btn rp-btn--ink">Sign in</Link>
          <Link to="/notes/new" className="rp-btn rp-btn--line">Try the editor</Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "mine" as const, label: "My notes", count: ownNotes.length },
    { id: "shared" as const, label: "Shared with me", count: sharedNotes.length },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-10 md:px-10 md:pt-10">
      <div className="flex items-end justify-between gap-3">
        <h1 className="rp-title text-[34px] md:text-[44px]">Notebook</h1>
        <button type="button" className="rp-btn rp-btn--ink" onClick={createNote}>
          <LuPlus aria-hidden /> New note
        </button>
      </div>

      <div role="tablist" aria-label="Notebook" className="rp-tabs mt-5">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setTagFilter(null);
            }}
            className="rp-tab"
          >
            {label}
            <span className="rp-count">{count}</span>
          </button>
        ))}
      </div>

      {allTags.length > 0 && tab === "mine" && (
        <div className="no-bar -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4" role="group" aria-label="Filter by tag">
          <button type="button" className="rp-tag" aria-pressed={tagFilter === null} onClick={() => setTagFilter(null)}>
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rp-tag"
              aria-pressed={tagFilter === tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Loading label="Loading your notebook" />
      ) : visibleNotes.length === 0 ? (
        <div className="mt-12 flex max-w-md flex-col gap-4">
          <p className="text-[17px]">
            {tab === "shared"
              ? "Nothing has been shared with you yet. When a co-writer shares a song, it lands here."
              : tagFilter
                ? `No notes tagged #${tagFilter}.`
                : "No songs yet. Your first one starts with a single line."}
          </p>
          {tab === "mine" && !tagFilter && (
            <button type="button" className="rp-btn rp-btn--line self-start" onClick={createNote}>Start a song</button>
          )}
        </div>
      ) : (
        // A sleeve's tracklist: one column on a phone, two sides on a wide screen.
        <ol className="mt-4 gap-x-12 border-t-[1.5px] border-ink lg:columns-2">
          {visibleNotes.map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              number={tab === "mine" ? trackNumbers[note.id] ?? index + 1 : index + 1}
              owned={tab === "mine"}
              onTogglePin={togglePin}
              onManage={setManaging}
              onDelete={setPendingDelete}
              owner={tab === "shared" ? owners[note.userId] : undefined}
            />
          ))}
        </ol>
      )}

      {managing && (
        <NoteManageDialog
          note={ownNotes.find((n) => n.id === managing.id) ?? managing}
          suggestedTags={allTags}
          onClose={() => setManaging(null)}
          onUpdateTags={updateTags}
          onShare={shareWithEmail}
          onRemoveCollaborator={removeCollaborator}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.title || "Untitled"}"?`}
          body="This permanently removes the note, its attached audio, and its lyric timing. It can't be undone."
          confirmLabel="Delete note"
          tone="danger"
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteNote(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default Notes;
