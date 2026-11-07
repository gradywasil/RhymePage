import { collection, doc, getDoc, getFirestore, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth } from "../firebase";
import { contentRevision, NoteConflict, type NoteContent, type NoteDraftRepository } from "./noteDraft";

function contentOf(data: Record<string, unknown>): NoteContent {
  return {
    title: typeof data.title === "string" ? data.title : "",
    lyrics: typeof data.lyrics === "string" ? data.lyrics : "",
    themes: typeof data.themes === "string" ? data.themes : "",
  };
}

export function noteDraftRepository(uid: string | null): NoteDraftRepository {
  const db = getFirestore();
  return {
    createId: () => doc(collection(db, "notes")).id,
    load: async id => {
      if (!uid || auth.currentUser?.uid !== uid) throw new Error("Sign in to load this note.");
      const snapshot = await getDoc(doc(db, "notes", id));
      if (!snapshot.exists()) throw new Error("Note unavailable.");
      return contentOf(snapshot.data());
    },
    save: async (id, content, baseRevision) => {
      if (!uid || auth.currentUser?.uid !== uid) throw new Error("Your sign-in session changed.");
      const reference = doc(db, "notes", id);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(reference);
        if (auth.currentUser?.uid !== uid) throw new Error("Your sign-in session changed.");
        if (snapshot.exists()) {
          const cloud = contentOf(snapshot.data());
          const revision = contentRevision(cloud);
          if (revision !== baseRevision && revision !== contentRevision(content)) throw new NoteConflict(cloud);
          transaction.update(reference, { ...content, lastEditedAt: serverTimestamp() });
        } else {
          if (baseRevision !== null) throw new Error("This note was deleted. Your device draft is kept.");
          transaction.set(reference, {
            ...content, userId: uid, isPinned: false, tags: [], sharedWith: [],
            createdAt: serverTimestamp(), lastEditedAt: serverTimestamp(),
          });
        }
      });
    },
  };
}
