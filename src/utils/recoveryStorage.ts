import { isAndroid, nativeApp } from "./nativeApp";

export type RecoveryStorage = Storage & { flush?: () => Promise<void> };
const isRecoveryKey = (key: string) => ["rhymepage:draft:v1:", "rhymepage:timing:v1:", "rhymepage:last-route:"].some(prefix => key.startsWith(prefix));
let recovery: RecoveryStorage;
export const getRecoveryStorage = (): RecoveryStorage => recovery ?? localStorage;

/** Native commit acknowledgment covers the disk-write gap in Android WebView localStorage. */
export async function initializeRecoveryStorage() {
  if (!isAndroid()) return;
  const seed: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (isRecoveryKey(key)) seed[key] = localStorage.getItem(key)!;
  }
  const { entries } = await nativeApp.loadRecovery({ seed });
  for (const key of Object.keys(seed)) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(entries)) if (isRecoveryKey(key)) localStorage.setItem(key, value);
  recovery = nativeRecoveryStorage(localStorage, (key, value) => nativeApp.writeRecovery({ key, value }));
}

export function nativeRecoveryStorage(storage: Storage, write: (key: string, value: string | null) => Promise<void>): RecoveryStorage {
  let pending = Promise.resolve();
  const failed = new Set<string>();
  const enqueue = (key: string, value: string | null) => {
    if (!isRecoveryKey(key)) return;
    pending = pending.catch(() => undefined).then(async () => {
      try { await write(key, value); failed.delete(key); }
      catch (error) { failed.add(key); throw error; }
    });
    // Callers observe failures through flush; a route write has no observer.
    void pending.catch(() => undefined);
  };
  return {
    get length() { return storage.length; },
    key: index => storage.key(index),
    getItem: key => storage.getItem(key),
    setItem(key, value) { storage.setItem(key, value); enqueue(key, value); },
    removeItem(key) { storage.removeItem(key); enqueue(key, null); },
    clear() { throw new Error("Recovery storage must be cleared by account, not globally."); },
    flush: async () => { await pending; if (failed.size) throw new Error("A device recovery write has not been committed."); },
  };
}
