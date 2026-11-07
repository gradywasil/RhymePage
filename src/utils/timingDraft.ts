import type { LineTiming } from "../types/sync";
import type { RecoveryStorage } from "./recoveryStorage";

export interface TimingPatch { lineId: string; patch: Partial<Omit<LineTiming, "lineId">> }
interface PendingTiming { lyricsSnapshot: string; patches: Record<string, TimingPatch["patch"]> }
export const timingDraftKey = (uid: string, noteId: string) => `rhymepage:timing:v1:${encodeURIComponent(uid)}:${encodeURIComponent(noteId)}`;

/** Serialize timing writes, keeping a device copy until each exact patch is acknowledged. */
export class TimingDraft {
  private pending: PendingTiming | null = null;
  private running: Promise<void> | null = null;
  private closed = false;
  private listeners = new Set<() => void>();
  private state = { count: 0, review: false, message: "" };
  constructor(private storage: RecoveryStorage, private key: string, private save: (snapshot: string, patches: TimingPatch[]) => Promise<void>) {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const value = JSON.parse(raw);
        if (typeof value.lyricsSnapshot !== "string" || !value.patches || Array.isArray(value.patches)
          || !Object.entries(value.patches).every(([id, patch]) => /^[a-zA-Z0-9_-]+$/.test(id) && patch !== null && typeof patch === "object"
            && Object.keys(patch).every(field => ["start", "end", "source", "words"].includes(field)))) throw new Error("Invalid timing draft");
        this.pending = value;
        this.state = { count: Object.keys(value.patches).length, review: true, message: "Recovered device timing. Review it before saving." };
      }
    } catch { this.state = { count: 0, review: true, message: "Device timing could not be read. Export your current timing before discarding the recovery copy." }; }
  }
  getSnapshot = () => this.state;
  getPending = () => this.pending;
  exportRecovery = () => this.pending ? JSON.stringify(this.pending, null, 2) : this.storage.getItem(this.key) ?? "No device timing copy.";
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  activate = () => { this.closed = false; };
  close = () => { this.closed = true; };
  private publish(message: string, review = this.state.review) {
    this.state = { count: Object.keys(this.pending?.patches ?? {}).length, review, message };
    this.listeners.forEach(listener => listener());
  }
  private persist() {
    if (this.closed) return;
    try {
      if (this.pending && Object.keys(this.pending.patches).length) this.storage.setItem(this.key, JSON.stringify(this.pending));
      else this.storage.removeItem(this.key);
      void this.storage.flush?.().catch(() => { if (!this.closed && this.pending) this.publish("Device storage could not confirm the timing copy. Keep Sync open and export your timing."); });
    } catch { this.publish("Device storage is full or unavailable. Keep Sync open and export your timing."); }
  }
  append(snapshot: string, patches: TimingPatch[]) {
    if (this.closed) return;
    if (this.state.review && !this.pending) throw new Error(this.state.message);
    if (this.pending && this.pending.lyricsSnapshot !== snapshot) throw new Error("The recovered timing belongs to different lyrics. Export it or discard the device timing before editing.");
    this.pending ??= { lyricsSnapshot: snapshot, patches: {} };
    for (const { lineId, patch } of patches) this.pending.patches[lineId] = { ...this.pending.patches[lineId], ...patch };
    this.publish("Saving timing recovery on this device; waiting for your notebook to confirm.");
    this.persist();
  }
  flush = (reviewed = false): Promise<void> => {
    if (reviewed) this.publish(this.state.message, false);
    if (this.closed || this.state.review) return Promise.resolve();
    if (this.running) return this.running;
    if (!this.pending || !Object.keys(this.pending.patches).length) return Promise.resolve();
    this.running = (async () => {
      try {
        while (!this.closed && this.pending && Object.keys(this.pending.patches).length) {
          const snapshot = this.pending.lyricsSnapshot;
          const patches = structuredClone(this.pending.patches);
          await this.save(snapshot, Object.entries(patches).map(([lineId, patch]) => ({ lineId, patch })));
          if (this.closed) return;
          for (const [id, patch] of Object.entries(patches)) {
            if (JSON.stringify(this.pending.patches[id]) === JSON.stringify(patch)) delete this.pending.patches[id];
          }
          this.persist();
        }
        this.pending = null;
        this.publish("Timing saved to your notebook.");
      } catch {
        this.publish("Timing has not been saved to your notebook. Your device copy is kept. Reconnect, review, and retry.", true);
      } finally { this.running = null; }
    })();
    return this.running;
  };
  discard = () => { if (this.running) return; this.pending = null; this.publish("Device timing discarded.", false); this.persist(); };
}
