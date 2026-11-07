import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuEllipsis, LuPin, LuPinOff, LuTag, LuTrash2 } from "react-icons/lu";
import type { Note } from "../types/note";
import type { PublicProfile } from "../types/profile";

interface NoteCardProps {
  note: Note;
  /** Position in the visible tracklist, 1-based. */
  number: number;
  /** Shared notes are read-mostly: no pin, share or delete for a collaborator. */
  owned: boolean;
  onTogglePin: (noteId: string, isPinned: boolean) => void;
  onManage: (note: Note) => void;
  onDelete: (note: Note) => void;
  /** Only set for shared notes: whoever owns the note. */
  owner?: PublicProfile;
}

function firstLine(lyrics: string): string {
  const line = lyrics.split("\n").map((l) => l.trim()).find(Boolean);
  return line ?? "Nothing written yet.";
}

/**
 * One track in the notebook's tracklist: number, title, first line, tags.
 * The row opens the note; pin and the overflow menu sit above that target.
 */
const NoteCard = ({ note, number, owned, onTogglePin, onManage, onDelete, owner }: NoteCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareCount = note.sharedWith?.length ?? 0;
  const title = note.title || "Untitled";

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof PointerEvent && menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  return (
    <li className="group relative flex min-h-[76px] items-start gap-4 border-b border-rule py-3 pr-1 break-inside-avoid">
      <Link
        to={`/notes/${note.id}`}
        state={{ track: number }}
        aria-label={`Open ${title}`}
        className="absolute inset-0 transition-colors hover:bg-sleeve-2/60"
      />
      <span className="rp-numeral pointer-events-none relative w-9 flex-none pt-0.5 text-right text-[26px]" aria-hidden>
        {String(number).padStart(2, "0")}
      </span>

      <div className="pointer-events-none relative min-w-0 flex-1">
        <h3 className="truncate text-[17px] font-bold leading-snug">{title}</h3>
        <p className="rp-muted mt-0.5 truncate text-sm">{firstLine(note.lyrics ?? "")}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
          {owner && <span>Shared by {owner.displayName || "a RhymePage user"}</span>}
          {!owned && !owner && <span>Shared with you</span>}
          {note.tags?.slice(0, 4).map((tag) => <span key={tag} className="font-semibold">#{tag}</span>)}
          {owned && shareCount > 0 && <span>Shared with {shareCount}</span>}
        </div>
      </div>

      {owned && (
        <div className="relative flex flex-none items-center" ref={menuRef}>
          <button
            type="button"
            aria-label={note.isPinned ? `Unpin ${title}` : `Pin ${title}`}
            aria-pressed={note.isPinned ?? false}
            className={`rp-icon-btn ${note.isPinned ? "text-accent" : "text-ink-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"}`}
            onClick={() => onTogglePin(note.id, note.isPinned ?? false)}
          >
            {note.isPinned ? <LuPin aria-hidden className="fill-current" /> : <LuPin aria-hidden />}
          </button>
          <button
            type="button"
            aria-label={`More for ${title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="rp-icon-btn text-ink-2"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <LuEllipsis aria-hidden />
          </button>
          {menuOpen && (
            <div role="menu" className="rp-menu absolute top-full right-0 z-30">
              <button role="menuitem" type="button" className="rp-menu-item" onClick={() => { setMenuOpen(false); onManage(note); }}>
                <LuTag aria-hidden /> Tags &amp; sharing
              </button>
              <button role="menuitem" type="button" className="rp-menu-item" onClick={() => { setMenuOpen(false); onTogglePin(note.id, note.isPinned ?? false); }}>
                {note.isPinned ? <LuPinOff aria-hidden /> : <LuPin aria-hidden />} {note.isPinned ? "Unpin" : "Pin to top"}
              </button>
              <button role="menuitem" type="button" className="rp-menu-item rp-menu-item--danger" onClick={() => { setMenuOpen(false); onDelete(note); }}>
                <LuTrash2 aria-hidden /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export default NoteCard;
