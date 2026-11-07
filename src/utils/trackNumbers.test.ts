import { beforeEach, describe, expect, it } from "vitest";
import type { Note } from "../types/note";
import { cacheTrackNumbers, trackNumberFor, trackNumbersFor } from "./trackNumbers";

const note = (id: string, created?: number) =>
  ({ id, title: "", lyrics: "", userId: "u", ...(created === undefined ? {} : { createdAt: { toMillis: () => created } }) }) as unknown as Note;

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) },
  });
});

describe("track numbers", () => {
  it("numbers songs by creation order, whatever order the notebook shows them in", () => {
    expect(trackNumbersFor([note("c", 300), note("a", 100), note("b", 200)])).toEqual({ a: 1, b: 2, c: 3 });
  });
  it("puts a note whose timestamp is still pending last", () => {
    expect(trackNumbersFor([note("new"), note("old", 5)])).toEqual({ old: 1, new: 2 });
  });
  it("prints a saved song's cached number and the next free number for a new draft", () => {
    cacheTrackNumbers("u", { a: 1, b: 2 });
    expect(trackNumberFor("u", "b")).toBe(2);
    expect(trackNumberFor("u", "")).toBe(3);
    expect(trackNumberFor("u", "unknown")).toBeNull();
  });
  it("gives a guest's demo song track 01", () => {
    expect(trackNumberFor(null, "")).toBe(1);
  });
});
