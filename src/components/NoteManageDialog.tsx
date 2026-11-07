import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { LuX } from "react-icons/lu";
import { getProfile } from "../utils/profiles";
import { normalizeTag } from "../utils/notesApi";
import { Field, FormMessage, fieldInput } from "./FormControls";
import type { Note } from "../types/note";
import type { PublicProfile } from "../types/profile";
import type { ShareResult } from "../hooks/useNotesLogic";

interface NoteManageDialogProps {
  note: Note;
  suggestedTags: string[];
  onClose: () => void;
  onUpdateTags: (noteId: string, tags: string[]) => Promise<void>;
  onShare: (noteId: string, email: string) => Promise<ShareResult>;
  onRemoveCollaborator: (noteId: string, uid: string) => Promise<void>;
}

const NoteManageDialog = ({
  note,
  suggestedTags,
  onClose,
  onUpdateTags,
  onShare,
  onRemoveCollaborator,
}: NoteManageDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [email, setEmail] = useState("");
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [sharing, setSharing] = useState(false);
  const [collaborators, setCollaborators] = useState<PublicProfile[]>([]);

  const sharedWith = note.sharedWith ?? [];

  // Native <dialog> gives focus trapping and Escape handling for free.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = await Promise.all(sharedWith.map((uid) => getProfile(uid)));
      if (cancelled) return;
      setCollaborators(
        found.filter((p): p is PublicProfile => p !== null)
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedWith.join(",")]);

  const commitTags = useCallback(
    async (next: string[]) => {
      setTags(next);
      await onUpdateTags(note.id, next);
    },
    [note.id, onUpdateTags]
  );

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag || tags.includes(tag)) {
      setTagDraft("");
      return;
    }
    commitTags([...tags, tag]);
    setTagDraft("");
  };

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      commitTags(tags.slice(0, -1));
    }
  };

  const handleShare = async () => {
    setSharing(true);
    const result = await onShare(note.id, email);
    setShareResult(result);
    if (result.ok) setEmail("");
    setSharing(false);
  };

  const unusedSuggestions = suggestedTags.filter((t) => !tags.includes(t));

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="manage-title"
      className="rp-dialog sm:!w-[min(32rem,calc(100vw-2rem))]"
    >
      <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-ink py-2 pr-2 pl-5">
        <h2 id="manage-title" className="rp-title truncate text-xl">
          {note.title || "Untitled"}
        </h2>
        <button
          type="button"
          className="rp-icon-btn"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
        >
          <LuX aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-7 px-5 pt-5 pb-6">
        {/* ---- tags ---- */}
        <section>
          <h3 className="rp-label">Tags</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.length === 0 && (
              <p className="rp-muted text-sm">No tags yet.</p>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="rp-tag gap-1 !pr-0 !text-ink"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  className="flex h-full w-7 items-center justify-center text-ink-2 hover:text-ink"
                  onClick={() => commitTags(tags.filter((t) => t !== tag))}
                >
                  <LuX aria-hidden className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            aria-label="Add a tag"
            placeholder="Add a tag, then press Enter"
            className={`${fieldInput} mt-2`}
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={handleTagKey}
            onBlur={() => tagDraft && addTag(tagDraft)}
          />
          {unusedSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rp-muted text-xs">Used elsewhere:</span>
              {unusedSuggestions.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="rp-tag border-dashed hover:text-ink"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ---- sharing ---- */}
        <section>
          <h3 className="rp-label">Shared with</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {collaborators.length === 0 && (
              <li className="rp-muted text-sm">Nobody else yet.</li>
            )}
            {collaborators.map((person) => (
              <li
                key={person.uid}
                className="flex min-h-11 items-center justify-between gap-2 border-b border-rule text-[15px]"
              >
                <span className="truncate">
                  {person.displayName || "A RhymePage user"}
                </span>
                <button
                  type="button"
                  className="rp-btn rp-btn--quiet rp-btn--sm"
                  onClick={() => onRemoveCollaborator(note.id, person.uid)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Field
              label="Invite by email"
              htmlFor="share-email"
              hint="They can edit the words, but not the sharing or who owns it."
            >
              <input
                id="share-email"
                type="email"
                className={fieldInput}
                placeholder="them@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setShareResult(null);
                }}
              />
            </Field>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rp-btn rp-btn--ink"
                disabled={sharing || !email.trim()}
                onClick={handleShare}
              >
                {sharing ? "Sharing…" : "Share"}
              </button>
              {shareResult && (
                <FormMessage tone={shareResult.ok ? "success" : "error"}>
                  {shareResult.message}
                </FormMessage>
              )}
            </div>
          </div>
        </section>
      </div>
    </dialog>
  );
};

export default NoteManageDialog;
