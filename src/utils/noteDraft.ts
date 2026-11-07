import type { RecoveryStorage } from "./recoveryStorage";

export interface NoteContent {
  title: string;
  lyrics: string;
  themes: string;
}

export const EMPTY_NOTE: NoteContent = { title: "", lyrics: "", themes: "" };
export const DRAFT_PREFIX = "rhymepage:draft:v1:";
export const contentRevision = (content: NoteContent) => JSON.stringify([
  content.title, content.lyrics, content.themes,
]);

interface DraftRecord {
  version: 1;
  noteId: string;
  content: NoteContent;
  baseRevision: string | null;
}

export interface NoteDraftRepository {
  createId(): string;
  load(noteId: string): Promise<NoteContent>;
  save(noteId: string, content: NoteContent, baseRevision: string | null): Promise<void>;
}

export class NoteConflict extends Error {
  constructor(public readonly cloud: NoteContent) {
    super("This note changed elsewhere. Choose which version to keep.");
  }
}

interface DraftState {
  content: NoteContent;
  noteId: string;
  ready: boolean;
  cloudExists: boolean;
  saving: boolean;
  saveFailed: boolean;
  dirty: boolean;
  recovery: boolean;
  cloud: NoteContent | null;
  message: string;
  storageError: string | null;
}

function isContent(value: unknown): value is NoteContent {
  return typeof value === "object" && value !== null
    && ["title", "lyrics", "themes"].every(key => typeof Reflect.get(value, key) === "string");
}

export function draftKey(uid: string | null, noteId?: string): string {
  return `${DRAFT_PREFIX}${encodeURIComponent(uid ?? "guest")}:${encodeURIComponent(noteId || "new")}`;
}

export function unsignedDeviceDraft(storage: Storage): NoteContent | null {
  try {
    const raw = storage.getItem(draftKey(null));
    const record = raw ? JSON.parse(raw) : null;
    return record?.version === 1 && isContent(record.content) ? record.content : null;
  } catch { return null; }
}

/** One editor session owns its recovery copy and serializes cloud writes. */
export class NoteDraft {
  private state: DraftState;
  private baseRevision: string | null = null;
  private listeners = new Set<() => void>();
  private loadGeneration = 0;
  private editGeneration = 0;
  private closed = false;
  private persistGeneration = 0;
  private readonly key: string;

  constructor(
    private readonly uid: string | null,
    private readonly routeNoteId: string | undefined,
    private readonly storage: RecoveryStorage,
    private readonly repository: NoteDraftRepository,
  ) {
    this.key = draftKey(uid, routeNoteId);
    let draft: DraftRecord | null = null;
    let storageError: string | null = null;
    try {
      const raw = storage.getItem(this.key);
      if (raw) {
        const value = JSON.parse(raw);
        if (value.version !== 1 || !isContent(value.content) || typeof value.noteId !== "string"
          || (value.baseRevision !== null && typeof value.baseRevision !== "string")) {
          throw new Error("Invalid draft");
        }
        draft = value;
      }
    } catch {
      storageError = "The device recovery copy could not be read. Keep this editor open until you save.";
    }
    this.baseRevision = draft?.baseRevision ?? null;
    this.state = {
      content: draft?.content ?? { ...EMPTY_NOTE },
      noteId: routeNoteId || draft?.noteId || "",
      ready: !(routeNoteId || draft?.baseRevision),
      cloudExists: Boolean(routeNoteId || draft?.baseRevision),
      saving: false,
      saveFailed: false,
      dirty: Boolean(draft),
      recovery: Boolean(draft && (routeNoteId || draft.baseRevision)),
      cloud: null,
      message: draft ? "Recovered writing from this device." : "",
      storageError,
    };
  }

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(patch: Partial<DraftState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }

  private persist() {
    if (this.closed) return;
    const generation = ++this.persistGeneration;
    const committed = () => {
      if (this.closed || generation !== this.persistGeneration) return;
      this.update({ storageError: null, ...(this.state.message === "Keeping a device recovery copy..." ? { message: "Saved on this device. Not yet saved to your notebook." } : {}) });
    };
    const failed = () => {
      if (!this.closed && generation === this.persistGeneration) this.update({ storageError: "Device storage is unavailable or full. Keep this editor open and save or export your writing." });
    };
    try {
      if (this.state.dirty) {
        const record: DraftRecord = {
          version: 1, noteId: this.state.noteId,
          content: this.state.content, baseRevision: this.baseRevision,
        };
        this.storage.setItem(this.key, JSON.stringify(record));
      } else {
        this.storage.removeItem(this.key);
      }
      if (this.storage.flush) void this.storage.flush().then(committed, failed);
      else committed();
    } catch {
      failed();
    }
  }

  edit = (patch: Partial<NoteContent>) => {
    this.editGeneration++;
    this.update({ content: { ...this.state.content, ...patch }, dirty: true, saveFailed: false, message: "Keeping a device recovery copy..." });
    this.persist();
  };

  load = async () => {
    const target = this.routeNoteId || (this.baseRevision !== null ? this.state.noteId : "");
    if (!target) return;
    const generation = ++this.loadGeneration;
    const edit = this.editGeneration;
    try {
      const cloud = await this.repository.load(target);
      if (generation !== this.loadGeneration) return;
      const changed = this.state.dirty || edit !== this.editGeneration;
      if (changed && contentRevision(this.state.content) !== contentRevision(cloud)) {
        this.update({ ready: true, recovery: true, cloud, message: "A device draft and a notebook version are available. Review them before saving." });
      } else {
        this.baseRevision = contentRevision(cloud);
        this.update({ content: cloud, ready: true, dirty: false, recovery: false, cloud: null, message: "Saved to your notebook." });
        this.persist();
      }
    } catch {
      if (generation === this.loadGeneration) {
        this.update({ message: "Could not load the notebook version. Your device draft is kept. Reconnect and retry." });
      }
    }
  };

  activate = () => { this.closed = false; };
  close = () => { this.closed = true; this.loadGeneration++; };

  resetNew = () => {
    if (this.routeNoteId || this.state.saving) return;
    this.loadGeneration++;
    this.editGeneration++;
    this.baseRevision = null;
    this.update({ content: { ...EMPTY_NOTE }, noteId: "", ready: true, cloudExists: false, dirty: false, recovery: false, saveFailed: false, cloud: null, message: "New draft." });
    this.persist();
  };

  resolveRecovery = (keepDevice: boolean) => {
    if (!this.state.cloud) return;
    const cloud = this.state.cloud;
    this.baseRevision = contentRevision(cloud);
    this.editGeneration++;
    this.update({
      content: keepDevice ? this.state.content : cloud,
      recovery: false, cloud: null, dirty: keepDevice, saveFailed: false,
      message: keepDevice ? "Device draft selected. Save it to update your notebook." : "Using the notebook version.",
    });
    this.persist();
  };

  save = async () => {
    if (this.closed || !this.uid || !this.state.ready || this.state.recovery || this.state.saving || !this.state.dirty) return;
    if (!this.state.noteId) this.update({ noteId: this.repository.createId() });
    // Persist the allocated ID before the request, so an interrupted create can be retried without duplicates.
    this.persist();
    const content = { ...this.state.content };
    const edit = this.editGeneration;
    this.update({ saving: true, saveFailed: false, message: "Saving to your notebook..." });
    try {
      await this.repository.save(this.state.noteId, content, this.baseRevision);
      this.baseRevision = contentRevision(content);
      this.update({ cloudExists: true, dirty: edit !== this.editGeneration, message: edit === this.editGeneration ? "Saved to your notebook." : "Newer edits are kept on this device." });
    } catch (error) {
      if (error instanceof NoteConflict) {
        this.update({ recovery: true, cloud: error.cloud, message: error.message });
      } else {
        this.update({ saveFailed: true, message: "Could not save to your notebook. Your device draft is kept; reconnect and retry." });
      }
    } finally {
      this.update({ saving: false });
      this.persist();
    }
  };
}

export function clearAccountDrafts(storage: Storage, uid: string) {
  const prefixes = [`${DRAFT_PREFIX}${encodeURIComponent(uid)}:`, `rhymepage:timing:v1:${encodeURIComponent(uid)}:`, `sync-position:${uid}:`];
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
  for (const key of keys) if (key && prefixes.some(prefix => key.startsWith(prefix))) storage.removeItem(key);
  storage.removeItem(`rhymepage:last-route:${uid}`);
}
