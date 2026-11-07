import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { deleteAccountData, deleteOwnedNote, lockDeletedAccount } from './delete-account.mjs';
import { runWith } from 'firebase-functions/v1';

initializeApp();

// Deletions can wait for a cold start; avoid paid warm capacity and uncontrolled scaling.
const deletionRuntime = { minInstances: 0, maxInstances: 1, concurrency: 1, cpu: 'gcf_gen1', timeoutSeconds: 540 };

export const finishAccountDeletion = runWith({ failurePolicy: true, minInstances: 0, maxInstances: 1 }).auth.user().onDelete(async user => {
  const db = getFirestore();
  await lockDeletedAccount(db, user.uid);
  await db.recursiveDelete(db.doc(`users/${user.uid}`));
});

export const deleteNote = onCall({ ...deletionRuntime, memory: '256MiB' }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to delete a note.');
  const noteId = request.data?.noteId;
  if (typeof noteId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(noteId)) throw new HttpsError('invalid-argument', 'Choose a note.');
  const db = getFirestore();
  const reference = db.doc(`notes/${noteId}`);
  const note = await reference.get();
  if (!note.exists) return { deleted: true };
  if (note.data().userId !== request.auth.uid) throw new HttpsError('permission-denied', 'Only the note owner can delete it.');
  await deleteOwnedNote({ db, bucket: getStorage().bucket() }, reference);
  return { deleted: true };
});

export const deleteAccount = onCall({ ...deletionRuntime, memory: '512MiB' }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before deleting your account.');
  const authenticatedAt = Number(request.auth.token.auth_time);
  if (!Number.isFinite(authenticatedAt) || Date.now() / 1000 - authenticatedAt > 300) {
    throw new HttpsError('failed-precondition', 'Confirm your account again before deleting it.');
  }
  try {
    return await deleteAccountData({ db: getFirestore(), bucket: getStorage().bucket(), auth: getAuth() }, request.auth.uid);
  } catch {
    // Do not return object names, account details, or administrative errors to the client.
    throw new HttpsError('internal', 'Deletion did not finish. Keep signed in, confirm your account, and retry.');
  }
});
