import type { Note } from "../types/note";

/**
 * A song's track number is its place in the order the writer created their
 * notes, so it stays with the song: pinning or editing reorders the notebook
 * but never renumbers it. The notebook computes the numbers from its full list
 * and caches them on the device so the editor can print them after a reload,
 * a deep link or a native resume.
 */
interface TrackCache {
  numbers: Record<string, number>;
  count: number;
}

const key = (uid: string) => `rhymepage:tracks:${uid}`;

function createdMillis(note: Note): number {
  const created = note.createdAt as { toMillis?: () => number } | undefined;
  // A note whose server timestamp is still pending is the newest one.
  return typeof created?.toMillis === "function" ? created.toMillis() : Number.MAX_SAFE_INTEGER;
}

export function trackNumbersFor(notes: Note[]): Record<string, number> {
  const ordered = [...notes].sort((a, b) => createdMillis(a) - createdMillis(b) || a.id.localeCompare(b.id));
  return Object.fromEntries(ordered.map((note, index) => [note.id, index + 1]));
}

function read(uid: string): TrackCache | null {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as TrackCache) : null;
  } catch {
    return null;
  }
}

export function cacheTrackNumbers(uid: string, numbers: Record<string, number>) {
  try {
    localStorage.setItem(key(uid), JSON.stringify({ numbers, count: Object.keys(numbers).length }));
  } catch { /* the number is a nicety; a full or blocked store just falls back */ }
}

/**
 * The number to print for a note in the editor: its cached track number, or,
 * for a draft not yet in the notebook, the next free one. Guests have a single
 * demo song, track 01.
 */
export function trackNumberFor(uid: string | null, noteId: string | null | undefined): number | null {
  if (!uid) return 1;
  const cache = read(uid);
  if (noteId && cache?.numbers[noteId]) return cache.numbers[noteId];
  if (!noteId && cache) return cache.count + 1;
  return null;
}
