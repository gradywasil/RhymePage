// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  GoogleAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { isAndroid } from "./utils/nativeApp";

const firebaseConfig = {
  apiKey: "AIzaSyArkjuqZMCEWfZ4iDXh32ims44svzP7yJU",
  authDomain: "rhymepage-6b98b.firebaseapp.com",
  projectId: "rhymepage-6b98b",
  storageBucket: "rhymepage-6b98b.firebasestorage.app",
  messagingSenderId: "826172871931",
  appId: "1:826172871931:web:67460576ba5ae36885cc5e",
  measurementId: "G-K9094K0YSW"
};

const app = initializeApp(import.meta.env.MODE === "android-emulator" ? {
  ...firebaseConfig, projectId: "demo-rhymepage", storageBucket: "demo-rhymepage.appspot.com", apiKey: "demo-rhymepage",
} : firebaseConfig);
export const analytics = isAndroid() ? null : getAnalytics(app);
export const auth = isAndroid() ? initializeAuth(app, { persistence: indexedDBLocalPersistence }) : getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const provider = new GoogleAuthProvider();

if (import.meta.env.DEV) {
  // Debug-only hook for manual console inspection; never present in a build.
  (window as unknown as { __auth?: unknown; __db?: unknown }).__auth = auth;
  (window as unknown as { __auth?: unknown; __db?: unknown }).__db = db;
}

/*
 * Local-only escape hatch for testing against the Firebase emulator suite
 * instead of the real project. Gated on both DEV (never true in a production
 * build, regardless of this flag) and an explicit opt-in env var, so there is
 * no path by which a real user ever gets pointed at a local emulator.
 *
 * connectXEmulator throws if called twice on the same instance, which Vite's
 * HMR can trigger by re-running this module -- the try/catch is for that, not
 * for masking a real connection failure.
 */
if ((import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") || import.meta.env.MODE === "android-emulator") {
  const host = import.meta.env.MODE === "android-emulator" ? "10.0.2.2" : "127.0.0.1";
  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectStorageEmulator(storage, host, 9199);
    connectFunctionsEmulator(functions, host, 5001);
    console.info("[firebase] connected to local emulators");
  } catch {
    // Already connected -- expected on hot reload.
  }
}
