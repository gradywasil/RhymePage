import { describe, expect, it } from "vitest";
import { matchRecognizedTokensToLyrics } from "./canonicalLyricsMatcher";

const lines = (...text: string[]) => text.map((value, index) => ({ lineId: `line-${index + 1}`, text: value }));
const tokens = (...items: Array<[string, number, number]>) => items.map(([text, start, end]) => ({ text, start, end }));

describe("matchRecognizedTokensToLyrics", () => {
  it("creates confident line and word timing for a clean take", () => {
    expect(matchRecognizedTokensToLyrics({
      proposalId: "take-1",
      lines: lines("Hello world", "We are home"),
      tokens: tokens(["hello", 1, 1.2], ["world", 1.2, 1.6], ["we", 2, 2.1], ["are", 2.1, 2.25], ["home", 2.25, 2.7]),
    })).toEqual({
      id: "take-1",
      lines: [
        { lineId: "line-1", start: 1, end: 1.6, uncertain: false, words: [{ text: "Hello", start: 1, end: 1.2 }, { text: "world", start: 1.2, end: 1.6 }] },
        { lineId: "line-2", start: 2, end: 2.7, uncertain: false, words: [{ text: "We", start: 2, end: 2.1 }, { text: "are", start: 2.1, end: 2.25 }, { text: "home", start: 2.25, end: 2.7 }] },
      ],
    });
  });

  it("ignores case, punctuation, accents, and apostrophe spelling", () => {
    const proposal = matchRecognizedTokensToLyrics({
      proposalId: "take-2",
      lines: lines("DON'T stop, caf\u00e9!"),
      tokens: tokens(["dont", 1, 1.2], ["STOP", 1.2, 1.5], ["cafe", 1.5, 1.9]),
    });

    expect(proposal.lines[0]).toMatchObject({ lineId: "line-1", uncertain: false, start: 1, end: 1.9 });
    expect(proposal.lines[0].words).toEqual([{ text: "DON'T", start: 1, end: 1.2 }, { text: "stop", start: 1.2, end: 1.5 }, { text: "caf\u00e9", start: 1.5, end: 1.9 }]);
  });

  it("interpolates a skipped word between surrounding recognized words and marks it for review", () => {
    const proposal = matchRecognizedTokensToLyrics({
      proposalId: "take-3",
      lines: lines("hello brave world"),
      tokens: tokens(["hello", 1, 1.3], ["world", 1.8, 2.2]),
    });

    expect(proposal.lines[0]).toMatchObject({ uncertain: true, start: 1, end: 2.2 });
    expect(proposal.lines[0].words).toEqual([{ text: "hello", start: 1, end: 1.3 }, { text: "brave", start: 1.3, end: 1.8 }, { text: "world", start: 1.8, end: 2.2 }]);
  });

  it("keeps a close local-ASR spelling as an uncertain reviewable timing", () => {
    const proposal = matchRecognizedTokensToLyrics({
      proposalId: "take-fuzzy",
      lines: lines("Racing to another dimension"),
      tokens: tokens(["racing", 1, 1.2], ["to", 1.2, 1.3], ["another", 1.3, 1.65], ["dimansion", 1.65, 2.1]),
    });

    expect(proposal.lines).toHaveLength(1);
    expect(proposal.lines[0]).toMatchObject({ lineId: "line-1", start: 1, end: 2.1, uncertain: true });
    expect(proposal.lines[0].words).toEqual([
      { text: "Racing", start: 1, end: 1.2 },
      { text: "to", start: 1.2, end: 1.3 },
      { text: "another", start: 1.3, end: 1.65 },
      { text: "dimension", start: 1.65, end: 2.1 },
    ]);
  });

  it("keeps repeated lyric words in order and flags an extra repeated recognition as an ad-lib", () => {
    const proposal = matchRecognizedTokensToLyrics({
      proposalId: "take-4",
      lines: lines("go go home"),
      tokens: tokens(["go", 1, 1.1], ["go", 1.1, 1.2], ["go", 1.2, 1.3], ["home", 1.3, 1.7]),
    });

    expect(proposal.lines[0]).toMatchObject({ uncertain: true, start: 1, end: 1.7 });
    expect(proposal.lines[0].words).toEqual([{ text: "go", start: 1, end: 1.1 }, { text: "go", start: 1.1, end: 1.3 }, { text: "home", start: 1.3, end: 1.7 }]);
  });

  it("does not fabricate a proposal for a low-credibility or unbounded line", () => {
    expect(matchRecognizedTokensToLyrics({
      proposalId: "take-5",
      lines: lines("we will never surrender", "another line"),
      tokens: [{ text: "maybe", start: 1, end: 1.3 }, { text: "we", start: 1.3, end: 1.5 }, { text: "another", start: 2 }],
    }).lines).toEqual([]);
  });
});
