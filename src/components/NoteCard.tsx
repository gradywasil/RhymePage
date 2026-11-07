import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuEllipsis, LuPin, LuPinOff, LuTag, LuTrash2 } from "react-icons/lu";
import type { Note } from "../types/note";
import type { PublicProfile } from "../types/profile";

interface NoteCardProps {
  note: Note;
  /** Shared notes are read-mostly: no pin, share or delete for a collaborator. */
  owned: boolean;
  onTogglePin: (noteId: string, isPinned: boolean) => void;
  onManage: (note: Note) => void;
  onDelete: (note: Note) => void;
  /** Only set for shared notes: whoever owns the note. */
  owner?: PublicProfile;
}

/** Song tiles borrow the suggestion-category colours, chosen stably from the note id. */
const TILE_COLOURS = ["rhyme", "synonym", "antonym", "adjective", "noun", "relatedWord", "soundAlike", "frequentFollower"] as const;
function colourFor(id: string): (typeof TILE_COLOURS)[number] {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TILE_COLOURS[hash % TILE_COLOURS.length];
}

function initialOf(title: string): string {
  return title.trim().charAt(0).toUpperCase();
}

function firstLine(lyrics: string): string {
  const line = lyrics.split("\n").map((l) => l.trim()).find(Boolean);
  return line ?? "Nothing written yet.";
}

/**
 * One song in the notebook: a colour tile, title, first line, tags. The card
 * opens the note; pin and the overflow menu sit above that target.
 */
const NoteCard = ({ note, owned, onTogglePin, onManage, onDelete, owner }: NoteCardProps) => {
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
    <li className="rp-card group relative flex min-h-[80px] min-w-0 items-start gap-3.5 p-3.5 transition-shadow hover:shadow-[0_10px_28px_rgb(var(--shadow)/0.14)]">
      <Link
        to={`/notes/${note.id}`}
        aria-label={`Open ${title}`}
        className="absolute inset-0 rounded-[24px]"
      />
      <span
        aria-hidden
        className="pointer-events-none relative flex h-12 w-12 flex-none items-center justify-center rounded-2xl text-xl font-extrabold text-white"
        style={{ background: `var(--cat-${colourFor(note.id)})` }}
      >
        {initialOf(title)}
      </span>

      <div className="pointer-events-none relative min-w-0 flex-1">
        <h3 className="truncate text-[17px] font-bold leading-snug">{title}</h3>
        <p className="rp-muted mt-0.5 truncate text-sm">{firstLine(note.lyrics ?? "")}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
          {owner && <span>Shared by {owner.displayName || "a RhymePage user"}</span>}
          {!owned && !owner && <span>Shared with you</span>}
          {note.tags?.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-sleeve-2 px-2 py-0.5 font-semibold">#{tag}</span>)}
          {owned && shareCount > 0 && <span>Shared with {shareCount}</span>}
        </div>
      </div>

      {owned && (
        <div className="relative flex flex-none items-center" ref={menuRef}>
          <button
            type="button"
            aria-label={note.isPinned ? `Unpin ${title}` : `Pin ${title}`}
            aria-pressed={note.isPinned ?? false}
            className={`rp-icon-btn ${note.isPinned ? "text-accent-text" : "text-ink-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"}`}
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
