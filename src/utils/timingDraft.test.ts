import { describe, expect, it, vi } from "vitest";
import { TimingDraft } from "./timingDraft";

function setup() {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } } as Storage;
  const save = vi.fn<(snapshot: string, patches: unknown[]) => Promise<void>>().mockResolvedValue();
  return { values, storage, save, queue: new TimingDraft(storage, "timing", save) };
}

describe("durable timing writes", () => {
  it("persists a patch before attempting the cloud write", async () => {
    const { queue, values, save } = setup();
    queue.append("lyrics", [{ lineId: "one", patch: { start: 1 } }]);
    expect(values.get("timing")).toContain('"start":1');
    await queue.flush();
    expect(save).toHaveBeenCalledOnce();
    expect(values.has("timing")).toBe(false);
  });
  it("keeps failed writes for recovery after process death", async () => {
    const { queue, storage, save } = setup();
    save.mockRejectedValue(new Error("offline"));
    queue.append("lyrics", [{ lineId: "one", patch: { start: 1 } }]);
    await queue.flush();
    const reopened = new TimingDraft(storage, "timing", vi.fn());
    expect(reopened.getSnapshot()).toMatchObject({ count: 1, review: true });
    expect(reopened.exportRecovery()).toContain("lyrics");
  });
  it("does not silently replay recovered timings", async () => {
    const { storage, queue } = setup();
    queue.append("lyrics", [{ lineId: "one", patch: { start: 1 } }]);
    const save = vi.fn().mockResolvedValue(undefined);
    const reopened = new TimingDraft(storage, "timing", save);
    await reopened.flush();
    expect(save).not.toHaveBeenCalled();
    await reopened.flush(true);
    expect(save).toHaveBeenCalledOnce();
  });
  it("serializes writes and keeps edits made during a request", async () => {
    const { queue, save } = setup();
    let complete!: () => void;
    save.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
    queue.append("lyrics", [{ lineId: "one", patch: { start: 1 } }]);
    const first = queue.flush();
    queue.append("lyrics", [{ lineId: "one", patch: { start: 2 } }]);
    void queue.flush();
    expect(save).toHaveBeenCalledTimes(1);
    complete(); await first;
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][1]).toEqual([{ lineId: "one", patch: { start: 2 } }]);
  });
  it("refuses to merge recovery data belonging to different lyrics", () => {
    const { queue } = setup();
    queue.append("before", [{ lineId: "one", patch: { start: 1 } }]);
    expect(() => queue.append("after", [{ lineId: "one", patch: { start: 2 } }])).toThrow("different lyrics");
    expect(queue.getPending()?.lyricsSnapshot).toBe("before");
  });
  it("can flush after an initial empty flush", async () => {
    const { queue, save } = setup();
    await queue.flush();
    queue.append("lyrics", [{ lineId: "one", patch: { start: 1 } }]);
    await queue.flush();
    expect(save).toHaveBeenCalledOnce();
  });
});
