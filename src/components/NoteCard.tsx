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

/** The first few lines of the lyric, for the card's preview. */
function opening(lyrics: string): string {
  const lines = lyrics.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines.slice(0, 3).join("\n") : "Nothing written yet.";
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

  const pinned = owned && (note.isPinned ?? false);

  return (
    <li
      className={[
        "group relative flex aspect-square min-w-0 flex-col rounded-[24px] p-3 transition-shadow md:p-4",
        "shadow-[0_8px_24px_rgb(var(--shadow)/0.08),0_1px_2px_rgb(var(--shadow)/0.06)] hover:shadow-[0_10px_28px_rgb(var(--shadow)/0.16)]",
        // Pinned songs wear the theme accent: a tinted card with an accent ring.
        pinned ? "bg-accent-soft ring-2 ring-accent-text/45" : "bg-surface",
      ].join(" ")}
    >
      <Link
        to={`/notes/${note.id}`}
        aria-label={`Open ${title}${pinned ? ", pinned" : ""}`}
        className="absolute inset-0 rounded-[24px]"
      />

      <div className="pointer-events-none relative flex items-start gap-1">
        <span
          aria-hidden
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-lg font-extrabold text-white md:h-11 md:w-11"
          style={{ background: `var(--cat-${colourFor(note.id)})` }}
        >
          {initialOf(title)}
        </span>

        {owned && (
          <div className="pointer-events-auto relative ml-auto flex items-center" ref={menuRef}>
            <button
              type="button"
              aria-label={pinned ? `Unpin ${title}` : `Pin ${title}`}
              aria-pressed={pinned}
              className={[
                "rp-icon-btn !h-10 !w-10",
                pinned
                  ? "text-accent-text"
                  : "text-ink-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100",
              ].join(" ")}
              onClick={() => onTogglePin(note.id, note.isPinned ?? false)}
            >
              <LuPin aria-hidden className={pinned ? "fill-current" : ""} />
            </button>
            <button
              type="button"
              aria-label={`More for ${title}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="rp-icon-btn !h-10 !w-10 text-ink-2"
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
                  {pinned ? <LuPinOff aria-hidden /> : <LuPin aria-hidden />} {pinned ? "Unpin" : "Pin to top"}
                </button>
                <button role="menuitem" type="button" className="rp-menu-item rp-menu-item--danger" onClick={() => { setMenuOpen(false); onDelete(note); }}>
                  <LuTrash2 aria-hidden /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <h3 className="pointer-events-none relative mt-3 line-clamp-2 text-[16px] font-bold leading-snug md:text-[17px]">{title}</h3>
      <p className="rp-muted pointer-events-none relative mt-1 line-clamp-3 min-h-0 text-[13px] leading-snug whitespace-pre-line md:text-sm">
        {opening(note.lyrics ?? "")}
      </p>

      <div className="pointer-events-none relative mt-auto flex flex-wrap items-center gap-1 pt-2 text-xs text-ink-2">
        {owner && <span className="truncate">by {owner.displayName || "a RhymePage user"}</span>}
        {!owned && !owner && <span>Shared with you</span>}
        {note.tags?.slice(0, 2).map((tag) => (
          <span key={tag} className={`max-w-full truncate rounded-full px-2 py-0.5 font-semibold ${pinned ? "bg-surface" : "bg-sleeve-2"}`}>#{tag}</span>
        ))}
        {owned && shareCount > 0 && <span>Shared with {shareCount}</span>}
      </div>
    </li>
  );
};

export default NoteCard;
