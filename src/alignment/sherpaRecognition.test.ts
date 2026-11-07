import { describe, expect, it, vi } from "vitest";
import { groupSherpaTokens, recognizeVocalGuide } from "./sherpaRecognition";

describe("Sherpa vocal-guide recognition", () => {
  it("groups SentencePiece subwords into timestamped words for a partial vocal take", () => {
    expect(groupSherpaTokens(
      ["▁R", "acing", "▁to", "▁an", "other", "▁dimension"],
      [0.2, 0.26, 0.5, 0.66, 0.72, 0.9]
    )).toEqual([
      { text: "Racing", start: 0.2, end: 0.5 },
      { text: "to", start: 0.5, end: 0.66 },
      { text: "another", start: 0.66, end: 0.9 },
      { text: "dimension", start: 0.9 },
    ]);
  });

  it("groups Sherpa's space-prefixed display fragments into words", () => {
    expect(groupSherpaTokens(
      [" RA", "C", "ING", " TO", " ANOTHER", " DI", "M", "EN", "S", "ION"],
      [0.2, 0.23, 0.27, 0.5, 0.66, 0.9, 0.93, 0.96, 0.99, 1.02]
    )).toEqual([
      { text: "RACING", start: 0.2, end: 0.5 },
      { text: "TO", start: 0.5, end: 0.66 },
      { text: "ANOTHER", start: 0.66, end: 0.9 },
      { text: "DIMENSION", start: 0.9 },
    ]);
  });

  it("returns the local recognizer's timestamped tokens and releases its resources", () => {
    const stream = {
      acceptWaveform: vi.fn(),
      inputFinished: vi.fn(),
      free: vi.fn(),
    };
    const recognizer = {
      createStream: () => stream,
      isReady: vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false),
      decode: vi.fn(),
      getResult: () => ({ tokens: ["Hello", "world"], timestamps: [0.2, 0.8] }),
      free: vi.fn(),
    };

    const tokens = recognizeVocalGuide(recognizer, {
      samples: new Float32Array([0, 0.1]),
      sampleRate: 16_000,
      durationSeconds: 0.000125,
    });

    expect(tokens).toEqual([
      { text: "Hello", start: 0.2, end: 0.8 },
      { text: "world", start: 0.8 },
    ]);
    expect(stream.inputFinished).toHaveBeenCalledOnce();
    expect(recognizer.decode).toHaveBeenCalledOnce();
    expect(stream.free).toHaveBeenCalledOnce();
    expect(recognizer.free).toHaveBeenCalledOnce();
  });

  it("rejects results without usable timestamps so the UI can ask for another take", () => {
    const stream = { acceptWaveform: vi.fn(), inputFinished: vi.fn(), free: vi.fn() };
    const recognizer = {
      createStream: () => stream,
      isReady: () => false,
      decode: vi.fn(),
      getResult: () => ({ text: "hello world" }),
    };

    expect(() => recognizeVocalGuide(recognizer, {
      samples: new Float32Array(),
      sampleRate: 16_000,
      durationSeconds: 0,
    })).toThrow("could not find timed words");
  });
});
