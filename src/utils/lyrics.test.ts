import { describe, expect, it } from "vitest";
import { getCompletedWord, splitLyricLines, splitWords } from "./lyrics";

describe("getCompletedWord", () => {
  it("accepts committed text from an Android keyboard without a Space keydown", () => {
    expect(getCompletedWord("night ", 6)).toBe("night");
    expect(getCompletedWord("night\n", 6)).toBe("night");
  });

  it("uses the completed word at the caret while editing an earlier line", () => {
    expect(getCompletedWord("Moonlight, falls\nanother night", 11)).toBe("moonlight");
  });

  it("waits for a word boundary and ignores empty input", () => {
    expect(getCompletedWord("night", 5)).toBe("");
    expect(getCompletedWord("night later", 3)).toBe("");
    expect(getCompletedWord("  ", 2)).toBe("");
  });
});

describe("splitLyricLines", () => {
  it("drops blank lines used for verse/chorus spacing", () => {
    const lyrics = "Line one\n\nLine two\n   \nLine three";
    expect(splitLyricLines(lyrics)).toEqual(["Line one", "Line two", "Line three"]);
  });

  it("preserves order and keeps punctuation intact", () => {
    const lyrics = "I remember, driving down\nthat road at night.";
    expect(splitLyricLines(lyrics)).toEqual([
      "I remember, driving down",
      "that road at night.",
    ]);
  });

  it("returns an empty array for lyrics that are only blank lines", () => {
    expect(splitLyricLines("\n\n   \n")).toEqual([]);
  });
});

describe("splitWords", () => {
  it("splits on whitespace and keeps punctuation on each word", () => {
    expect(splitWords("I don't wanna go, half-light fading")).toEqual([
      "I",
      "don't",
      "wanna",
      "go,",
      "half-light",
      "fading",
    ]);
  });

  it("collapses repeated whitespace and trims the ends", () => {
    expect(splitWords("  one   two    three  ")).toEqual(["one", "two", "three"]);
  });

  it("returns an empty array for whitespace-only text", () => {
    expect(splitWords("   ")).toEqual([]);
  });
});
