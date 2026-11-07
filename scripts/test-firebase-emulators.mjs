import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { initializeApp as initializeClient, deleteApp as deleteClient } from 'firebase/app';
import { getAuth as clientAuth, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore as clientDb, connectFirestoreEmulator, doc, updateDoc, setDoc, runTransaction } from 'firebase/firestore';
import { getStorage as clientStorage, connectStorageEmulator, ref, uploadBytes, deleteObject } from 'firebase/storage';

// This script is deliberately restricted to loopback emulators and a Firebase demo project.
for (const [key, value] of Object.entries({ FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', STORAGE_EMULATOR_HOST: 'http://127.0.0.1:9199' })) process.env[key] = value;
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const projectId = 'demo-rhymepage';
const bucketName = `${projectId}.appspot.com`;
const admin = initializeApp({ projectId, storageBucket: bucketName }, `test-${Date.now()}`);
const db = getFirestore(admin);
const auth = getAuth(admin);
const bucket = getStorage(admin).bucket();
const suffix = Date.now();
const uid = `release-owner-${suffix}`;
const other = `release-other-${suffix}`;
const ownerNote = `owned-${suffix}`;
const singleNote = `single-${suffix}`;
const sharedNote = `shared-${suffix}`;
const clients = [];
let assertions = 0;
function pass(name) { assertions++; console.log(`PASS ${name}`); }
async function callable(name, token, data = {}) {
  const response = await fetch(`http://127.0.0.1:5001/${projectId}/us-central1/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ data }),
  });
  return { status: response.status, body: await response.json() };
}
async function signedIn(userId) {
  const email = `${userId}@example.test`;
  await auth.createUser({ uid: userId, email, password: 'emulator-only-password' });
  const app = initializeClient({ projectId, apiKey: 'demo-rhymepage', storageBucket: bucketName }, userId);
  clients.push(app);
  const session = clientAuth(app);
  connectAuthEmulator(session, 'http://127.0.0.1:9099', { disableWarnings: true });
  const firestore = clientDb(app);
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  const storage = clientStorage(app);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  const { user } = await signInWithEmailAndPassword(session, email, 'emulator-only-password');
  return { token: await user.getIdToken(), firestore, storage };
}

try {
  const owner = await signedIn(uid);
  const collaborator = await signedIn(other);
  await db.doc(`users/${uid}`).set({ email: `${uid}@example.test`, settings: { max: 25 } });
  await db.doc(`users/${uid}/private/extra`).set({ text: 'private' });
  await db.doc(`users/${other}`).set({ email: `${other}@example.test` });
  for (const id of [ownerNote, singleNote]) {
    await db.doc(`notes/${id}`).set({ userId: uid, lyrics: 'original', sharedWith: [other] });
    await db.doc(`notes/${id}/sync/main`).set({ lines: {}, audio: { storagePath: `notes/${id}/sync/main/audio/source.wav` } });
    await db.doc(`notes/${id}/sync/extra`).set({ legacy: true });
    await bucket.file(`notes/${id}/sync/main/audio/source.wav`).save('audio', { contentType: 'audio/wav' });
    await bucket.file(`notes/${id}/sync/main/audio/replaced.wav`).save('old audio', { contentType: 'audio/wav' });
  }
  await db.doc(`notes/${sharedNote}`).set({ userId: other, lyrics: 'keep', sharedWith: [uid] });
  await db.doc(`notes/${sharedNote}/sync/main`).set({ createdBy: uid, audio: { uploadedBy: uid } });
  await bucket.file(`notes/${sharedNote}/sync/main/audio/keep.wav`).save('keep', { contentType: 'audio/wav' });
  await db.doc(`publicProfiles/${uid}`).set({ displayName: 'owner' });
  await db.doc(`publicProfiles/${other}`).set({ displayName: 'other' });
  for (const path of [`${uid}/following/${other}`, `${other}/followers/${uid}`, `${uid}/followers/${other}`, `${other}/following/${uid}`]) {
    await db.doc(`publicProfiles/${path}`).set({ createdAt: new Date() });
  }
  for (const email of [`${uid}@example.test`, `old-${uid}@example.test`]) await db.doc(`emailIndex/${email}`).set({ uid });
  await db.doc(`emailIndex/${other}@example.test`).set({ uid: other });

  await runTransaction(owner.firestore, async transaction => {
    const reference = doc(owner.firestore, 'notes', `transaction-${suffix}`);
    assert.equal((await transaction.get(reference)).exists(), false);
    transaction.set(reference, { userId: uid, lyrics: 'transaction create', sharedWith: [] });
  });
  pass('a draft can safely create a note with a read-before-write transaction');

  await updateDoc(doc(collaborator.firestore, 'notes', ownerNote), { lyrics: 'collaborator edit' });
  assert.equal((await db.doc(`notes/${ownerNote}`).get()).data().userId, uid);
  pass('collaborator can edit lyrics without changing ownership');
  await assert.rejects(updateDoc(doc(collaborator.firestore, 'notes', ownerNote), { userId: other }));
  pass('collaborator cannot claim note ownership');
  await assert.rejects(updateDoc(doc(owner.firestore, 'notes', ownerNote), { userId: other }));
  pass('note ownership remains stable for owner updates');
  await assert.rejects(setDoc(doc(owner.firestore, 'users', uid), { deleting: true }));
  pass('clients cannot forge deletion locks');
  await assert.rejects(setDoc(doc(owner.firestore, 'emailIndex', `${other}@example.test`), { uid }));
  await setDoc(doc(owner.firestore, 'emailIndex', `${uid}@example.test`), { uid });
  pass('email lookup entries must match the authenticated email claim');
  await assert.rejects(updateDoc(doc(collaborator.firestore, 'notes', ownerNote), { sharedWith: [other, 'unexpected-reader'] }));
  pass('collaborator edits cannot grant another reader access');
  const upload = ref(owner.storage, `notes/${ownerNote}/sync/main/audio/upload.wav`);
  await uploadBytes(upload, new Uint8Array([1, 2, 3]), { contentType: 'audio/wav' });
  await deleteObject(upload);
  pass('owner audio upload and delete work under Storage rules');
  await assert.rejects(uploadBytes(ref(collaborator.storage, `notes/${ownerNote}/sync/main/audio/forbidden.wav`), new Uint8Array([1]), { contentType: 'audio/wav' }));
  pass('collaborator cannot replace owner audio');
  assert.equal((await callable('deleteAccount')).status, 401);
  pass('account deletion requires authentication');
  assert.equal((await callable('deleteNote', collaborator.token, { noteId: ownerNote })).status, 403);
  pass('non-owner cannot delete a note through the callable');
  const single = await callable('deleteNote', owner.token, { noteId: singleNote });
  assert.equal(single.body.result?.deleted, true, JSON.stringify(single.body));
  assert.equal((await db.doc(`notes/${singleNote}`).get()).exists, false);
  assert.equal((await db.collection(`notes/${singleNote}/sync`).get()).size, 0);
  assert.equal((await bucket.getFiles({ prefix: `notes/${singleNote}/` }))[0].length, 0);
  pass('individual note deletion removes all sync records and audio files');

  // An arbitrary payload UID must not change whose account gets deleted.
  const result = await callable('deleteAccount', owner.token, { uid: other });
  assert.equal(result.body.result?.deleted, true, JSON.stringify(result.body));
  await assert.rejects(auth.getUser(uid), { code: 'auth/user-not-found' });
  assert.equal((await db.doc(`users/${uid}`).get()).exists, false);
  assert.equal((await db.collection(`users/${uid}/private`).get()).size, 0);
  assert.equal((await db.doc(`notes/${ownerNote}`).get()).exists, false);
  assert.equal((await db.collection(`notes/${ownerNote}/sync`).get()).size, 0);
  assert.equal((await bucket.getFiles({ prefix: `notes/${ownerNote}/` }))[0].length, 0);
  pass('account deletion removes Auth, private data, owned notes, sync and all owned-note audio');
  assert.equal((await db.doc(`publicProfiles/${uid}`).get()).exists, false);
  assert.equal((await db.doc(`publicProfiles/${other}/following/${uid}`).get()).exists, false);
  assert.equal((await db.doc(`publicProfiles/${other}/followers/${uid}`).get()).exists, false);
  assert.equal((await db.collection('emailIndex').where('uid', '==', uid).get()).size, 0);
  pass('profile, reciprocal follows and current/historical email index entries are removed');
  assert.equal((await auth.getUser(other)).uid, other);
  assert.equal((await db.doc(`notes/${sharedNote}`).get()).data().lyrics, 'keep');
  assert.deepEqual((await db.doc(`notes/${sharedNote}`).get()).data().sharedWith, []);
  assert.equal((await db.doc(`notes/${sharedNote}/sync/main`).get()).data().createdBy, 'deleted-account');
  assert.equal((await db.doc(`notes/${sharedNote}/sync/main`).get()).data().audio.uploadedBy, 'deleted-account');
  assert.equal((await bucket.getFiles({ prefix: `notes/${sharedNote}/` }))[0].length, 1);
  pass('other account, its note and audio survive; the deleted UID is removed from sharing');
  await assert.rejects(setDoc(doc(owner.firestore, 'notes', `after-delete-${suffix}`), { userId: uid, lyrics: 'must not return' }));
  await assert.rejects(setDoc(doc(owner.firestore, 'users', uid), { email: 'must not return' }));
  assert.equal((await db.doc(`accountDeletionLocks/${uid}`).get()).exists, true);
  pass('a still-cached ID token cannot recreate data after account deletion');
  console.log(`${assertions} Firebase emulator integration checks passed.`);
} finally {
  await Promise.all(clients.map(app => deleteClient(app)));
  await deleteApp(admin);
}
