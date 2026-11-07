import { describe, expect, it, vi } from "vitest";
import { clearAccountDrafts, contentRevision, draftKey, EMPTY_NOTE, NoteConflict, NoteDraft, type NoteDraftRepository } from "./noteDraft";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

function setup(uid: string | null = "a", noteId?: string, storage = new MemoryStorage()) {
  const repository = {
    createId: vi.fn(() => "allocated-note"),
    load: vi.fn<NoteDraftRepository["load"]>().mockResolvedValue({ ...EMPTY_NOTE, lyrics: "cloud" }),
    save: vi.fn<NoteDraftRepository["save"]>().mockResolvedValue(),
  };
  const draft = new NoteDraft(uid, noteId, storage, repository);
  return { draft, repository, storage };
}

describe("note draft recovery", () => {
  it("recovers title, lyrics and themes synchronously after process loss", () => {
    const { draft, storage } = setup(null);
    draft.edit({ title: "My song", lyrics: "An unfinished line", themes: "night" });
    const reopened = setup(null, undefined, storage).draft;
    expect(reopened.getSnapshot().content).toEqual(draft.getSnapshot().content);
    expect(reopened.getSnapshot().dirty).toBe(true);
  });

  it("waits for native disk acknowledgment before reporting a device save", async () => {
    let committed!: () => void;
    const storage = new MemoryStorage();
    const durable = Object.assign(storage, { flush: () => new Promise<void>(resolve => { committed = resolve; }) });
    const { draft } = setup(null, undefined, durable);
    draft.edit({ lyrics: "The latest line" });
    expect(draft.getSnapshot().message).toContain("Keeping");
    committed();
    await Promise.resolve();
    expect(draft.getSnapshot().message).toContain("Saved on this device");
  });

  it("reports a native disk failure while keeping the editor content", async () => {
    const storage = Object.assign(new MemoryStorage(), { flush: () => Promise.reject(new Error("disk full")) });
    const { draft } = setup(null, undefined, storage);
    draft.edit({ lyrics: "Keep this editor open" });
    await Promise.resolve();
    expect(draft.getSnapshot().storageError).toContain("Device storage");
    expect(draft.getSnapshot().content.lyrics).toBe("Keep this editor open");
  });

  it("separates guests, accounts and notes", () => {
    const { storage, draft } = setup("a", "one");
    draft.edit({ lyrics: "private" });
    expect(setup("b", "one", storage).draft.getSnapshot().content.lyrics).toBe("");
    expect(setup("a", "two", storage).draft.getSnapshot().content.lyrics).toBe("");
    expect(setup(null, undefined, storage).draft.getSnapshot().content.lyrics).toBe("");
  });

  it("cannot save blank initialization over a note that is still loading", async () => {
    const { draft, repository } = setup("a", "one");
    await draft.save();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("preserves typing that happens while the cloud load is pending", async () => {
    const { draft, repository } = setup("a", "one");
    let complete!: (value: typeof EMPTY_NOTE) => void;
    repository.load.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    const loading = draft.load();
    draft.edit({ lyrics: "typed while loading" });
    complete({ ...EMPTY_NOTE, lyrics: "cloud" });
    await loading;
    expect(draft.getSnapshot()).toMatchObject({ recovery: true, content: { lyrics: "typed while loading" } });
    await draft.save();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("requires a deliberate choice before saving a recovered device draft", async () => {
    const first = setup("a", "one");
    await first.draft.load();
    first.draft.edit({ lyrics: "device" });
    const { draft, repository } = setup("a", "one", first.storage);
    await draft.load();
    await draft.save();
    expect(repository.save).not.toHaveBeenCalled();
    draft.resolveRecovery(true);
    await draft.save();
    expect(repository.save).toHaveBeenCalledWith("one", { ...EMPTY_NOTE, lyrics: "device" }, contentRevision({ ...EMPTY_NOTE, lyrics: "cloud" }));
  });

  it("can explicitly discard the device version without writing cloud data", async () => {
    const { draft, repository, storage } = setup("a", "one");
    draft.edit({ lyrics: "device" });
    await draft.load();
    draft.resolveRecovery(false);
    expect(draft.getSnapshot().content.lyrics).toBe("cloud");
    expect(storage.getItem(draftKey("a", "one"))).toBeNull();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("reuses an allocated ID when a create is interrupted and retried", async () => {
    const first = setup();
    first.draft.edit({ lyrics: "new song" });
    first.repository.save.mockRejectedValueOnce(new Error("offline"));
    await first.draft.save();
    const second = setup("a", undefined, first.storage);
    await second.draft.save();
    expect(second.repository.createId).not.toHaveBeenCalled();
    expect(second.repository.save).toHaveBeenCalledWith("allocated-note", { ...EMPTY_NOTE, lyrics: "new song" }, null);
  });

  it("does not erase edits made during a cloud save", async () => {
    const { draft, repository, storage } = setup();
    let complete!: () => void;
    repository.save.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    draft.edit({ lyrics: "first" });
    const saving = draft.save();
    draft.edit({ lyrics: "second" });
    complete();
    await saving;
    expect(draft.getSnapshot()).toMatchObject({ dirty: true, content: { lyrics: "second" } });
    expect(JSON.parse(storage.getItem(draftKey("a"))!).content.lyrics).toBe("second");
  });

  it("serializes repeated Save taps", async () => {
    const { draft, repository } = setup();
    repository.save.mockReturnValue(new Promise(() => {}));
    draft.edit({ lyrics: "first" });
    void draft.save();
    await draft.save();
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it("preserves a failed save and exposes a remote conflict", async () => {
    const { draft, repository, storage } = setup("a", "one");
    await draft.load();
    draft.edit({ lyrics: "device" });
    repository.save.mockRejectedValue(new NoteConflict({ ...EMPTY_NOTE, lyrics: "newer cloud" }));
    await draft.save();
    expect(draft.getSnapshot()).toMatchObject({ recovery: true, dirty: true, cloud: { lyrics: "newer cloud" } });
    expect(storage.getItem(draftKey("a", "one"))).toContain("device");
  });

  it("does not let an old session acknowledgement remove a newer recovery copy", async () => {
    const first = setup();
    let complete!: () => void;
    first.repository.save.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    first.draft.edit({ lyrics: "first" });
    const saving = first.draft.save();
    first.draft.close();
    const second = setup("a", undefined, first.storage);
    second.draft.edit({ lyrics: "new session" });
    complete();
    await saving;
    expect(first.storage.getItem(draftKey("a"))).toContain("new session");
  });

  it("shows storage failure without throwing away the live writing", () => {
    const { draft, storage } = setup();
    vi.spyOn(storage, "setItem").mockImplementation(() => { throw new Error("quota"); });
    draft.edit({ lyrics: "keep me" });
    expect(draft.getSnapshot()).toMatchObject({ content: { lyrics: "keep me" }, storageError: expect.stringContaining("storage") });
  });

  it("retains malformed recovery data for diagnosis instead of silently deleting it", () => {
    const storage = new MemoryStorage();
    storage.setItem(draftKey("a"), "broken");
    const { draft } = setup("a", undefined, storage);
    expect(draft.getSnapshot().storageError).not.toBeNull();
    expect(storage.getItem(draftKey("a"))).toBe("broken");
  });

  it("clears only the deleted account's drafts and playback positions", () => {
    const { storage, draft } = setup("a");
    draft.edit({ lyrics: "mine" });
    storage.setItem(draftKey("b"), "other");
    storage.setItem("sync-position:a:one", "2");
    storage.setItem("theme", "pastel");
    clearAccountDrafts(storage, "a");
    expect(storage.getItem(draftKey("a"))).toBeNull();
    expect(storage.getItem("sync-position:a:one")).toBeNull();
    expect(storage.getItem(draftKey("b"))).toBe("other");
    expect(storage.getItem("theme")).toBe("pastel");
  });
});
