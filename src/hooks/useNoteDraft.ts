import { useEffect, useState, useSyncExternalStore } from "react";
import { NoteDraft } from "../utils/noteDraft";
import { noteDraftRepository } from "../utils/noteDraftRepository";
import { getRecoveryStorage } from "../utils/recoveryStorage";

export function useNoteDraft(uid: string | null, noteId?: string) {
  const [draft] = useState(() => new NoteDraft(uid, noteId, getRecoveryStorage(), noteDraftRepository(uid)));
  const state = useSyncExternalStore(draft.subscribe, draft.getSnapshot);
  useEffect(() => { draft.activate(); void draft.load(); return draft.close; }, [draft]);
  useEffect(() => {
    const retry = () => {
      const current = draft.getSnapshot();
      if (!current.ready) void draft.load();
      else if (current.cloudExists || current.noteId) void draft.save();
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [draft]);
  useEffect(() => {
    if (!uid || !state.cloudExists || !state.ready || !state.dirty || state.recovery || state.saving || state.saveFailed) return;
    const timer = setTimeout(() => void draft.save(), 2000);
    return () => clearTimeout(timer);
  }, [draft, uid, state.cloudExists, state.ready, state.dirty, state.recovery, state.saving, state.saveFailed, state.content]);
  return { draft, state };
}
