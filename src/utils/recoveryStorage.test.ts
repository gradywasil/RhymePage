import { expect, it, vi } from "vitest";
import { nativeRecoveryStorage } from "./recoveryStorage";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; }, key: i => [...values.keys()][i] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); }, clear: () => values.clear(),
  };
}

it("commits native recovery writes in order and waits for deletion", async () => {
  let acknowledge!: () => void;
  const write = vi.fn().mockImplementationOnce(() => new Promise<void>(resolve => { acknowledge = resolve; })).mockResolvedValue(undefined);
  const storage = nativeRecoveryStorage(memoryStorage(), write);
  const key = "rhymepage:draft:v1:a:one";
  storage.setItem(key, "first");
  storage.setItem(key, "second");
  storage.removeItem(key);
  storage.setItem("theme", "pastel");
  await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  acknowledge();
  await storage.flush!();
  expect(write.mock.calls).toEqual([[key, "first"], [key, "second"], [key, null]]);
});

it("does not hide another key's failed commit and can retry it", async () => {
  const write = vi.fn().mockRejectedValueOnce(new Error("disk full")).mockResolvedValue(undefined);
  const storage = nativeRecoveryStorage(memoryStorage(), write);
  storage.setItem("rhymepage:draft:v1:a:one", "first");
  storage.setItem("rhymepage:last-route:a", "/notes/one");
  await expect(storage.flush!()).rejects.toThrow("not been committed");
  storage.setItem("rhymepage:draft:v1:a:one", "retry");
  await storage.flush!();
});
