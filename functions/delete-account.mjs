import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const lockDeletedAccount = (db, uid) => db.doc(`accountDeletionLocks/${uid}`).set({
  expiresAt: Timestamp.fromMillis(Date.now() + 2 * 60 * 60 * 1000),
});

export async function deleteOwnedNote({ db, bucket }, reference) {
  await reference.update({ deleting: true });
  await bucket.deleteFiles({ prefix: `notes/${reference.id}/` });
  await db.recursiveDelete(reference);
}

/** Delete owned objects before their parent notes; keep Auth until every data step succeeds. */
export async function deleteAccountData({ db, bucket, auth }, uid) {
  const user = db.doc(`users/${uid}`);
  await lockDeletedAccount(db, uid);
  await user.set({ deleting: true });
  const notes = await db.collection('notes').where('userId', '==', uid).get();
  for (const note of notes.docs) {
    await deleteOwnedNote({ db, bucket }, note.ref);
  }
  const shared = await db.collection('notes').where('sharedWith', 'array-contains', uid).get();
  for (const note of shared.docs) {
    const syncs = await note.ref.collection('sync').get();
    for (const sync of syncs.docs) {
      const data = sync.data();
      const attribution = {};
      if (data.createdBy === uid) attribution.createdBy = 'deleted-account';
      if (data.audio?.uploadedBy === uid) attribution['audio.uploadedBy'] = 'deleted-account';
      if (Object.keys(attribution).length) await sync.ref.update(attribution);
    }
    await note.ref.update({ sharedWith: FieldValue.arrayRemove(uid) });
  }

  const profile = db.doc(`publicProfiles/${uid}`);
  for (const direction of ['followers', 'following']) {
    const edges = await profile.collection(direction).get();
    const inverse = direction === 'followers' ? 'following' : 'followers';
    for (const edge of edges.docs) await db.doc(`publicProfiles/${edge.id}/${inverse}/${uid}`).delete();
  }
  const addresses = await db.collection('emailIndex').where('uid', '==', uid).get();
  for (const address of addresses.docs) await address.ref.delete();
  await db.recursiveDelete(profile);
  for (const child of await user.listCollections()) {
    const documents = await child.get();
    for (const document of documents.docs) await db.recursiveDelete(document.ref);
  }
  // Keep the deletion lock until Auth is gone. A failed step can be retried while signed in.
  await auth.deleteUser(uid);
  // A retrying Auth deletion trigger also removes this non-content lock if the final request fails.
  let cleanupPending = false;
  try { await user.delete(); } catch { cleanupPending = true; }
  return { deleted: true, notes: notes.size, cleanupPending };
}
