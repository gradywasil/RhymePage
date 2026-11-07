import type { TimingProposal, WordTiming } from "../types/sync";

/** A word emitted by the local recognizer. Times are seconds into the take. */
export interface RecognizedToken {
  text: string;
  start: number;
  /** Optional because some recognizer adapters expose word starts only. */
  end?: number;
}

/** The existing lyric lines that may receive a proposal; this matcher never creates lines. */
export interface CanonicalLyricLine {
  lineId: string;
  text: string;
}

export interface CanonicalLyricsMatcherInput {
  proposalId: string;
  lines: readonly CanonicalLyricLine[];
  tokens: readonly RecognizedToken[];
}

interface LyricWord {
  lineIndex: number;
  wordIndex: number;
  text: string;
  normalized: string;
}

interface TimedRecognizedWord extends RecognizedToken {
  normalized: string;
}

type AlignmentStep = "match" | "fuzzy-match" | "substitute" | "skip-lyric" | "skip-recognized";

const MIN_CREDIBLE_MATCH_RATIO = 0.6;
const MIN_FUZZY_SIMILARITY = 0.75;

/**
 * Splits normal prose into words while preserving the source spelling for the
 * word editor. Matching is accent-, case-, apostrophe-, and punctuation-insensitive.
 */
export function lyricWords(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+(?:['\u2019][\p{L}\p{N}]+)*/gu) ?? [];
}

export function normalizeLyricWord(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u2019']/g, "")
    .toLowerCase();
}

function expandRecognizedTokens(tokens: readonly RecognizedToken[]): TimedRecognizedWord[] {
  return tokens.flatMap(token => {
    if (!Number.isFinite(token.start) || token.start < 0) return [];
    return lyricWords(token.text).map(text => ({
      ...token,
      text,
      normalized: normalizeLyricWord(text),
    }));
  });
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

/** A long near-spelling is useful only as a clearly marked review suggestion. */
function isFuzzyMatch(lyric: string, recognized: string): boolean {
  if (Math.min(lyric.length, recognized.length) < 4) return false;
  return 1 - editDistance(lyric, recognized) / Math.max(lyric.length, recognized.length) >= MIN_FUZZY_SIMILARITY;
}

/**
 * A deterministic edit-distance alignment. Exact words are the only matches
 * trusted for timing; substitutions are retained solely to explain uncertainty.
 */
function align(lyrics: readonly LyricWord[], recognized: readonly TimedRecognizedWord[]): AlignmentStep[] {
  const rows = lyrics.length + 1;
  const columns = recognized.length + 1;
  const costs = Array.from({ length: rows }, () => Array<number>(columns).fill(0));
  const steps = Array.from({ length: rows }, () => Array<AlignmentStep | null>(columns).fill(null));

  for (let lyricIndex = 1; lyricIndex < rows; lyricIndex += 1) {
    costs[lyricIndex][0] = lyricIndex;
    steps[lyricIndex][0] = "skip-lyric";
  }
  for (let tokenIndex = 1; tokenIndex < columns; tokenIndex += 1) {
    costs[0][tokenIndex] = tokenIndex;
    steps[0][tokenIndex] = "skip-recognized";
  }

  for (let lyricIndex = 1; lyricIndex < rows; lyricIndex += 1) {
    for (let tokenIndex = 1; tokenIndex < columns; tokenIndex += 1) {
      const same = lyrics[lyricIndex - 1].normalized === recognized[tokenIndex - 1].normalized;
      const fuzzy = !same && isFuzzyMatch(lyrics[lyricIndex - 1].normalized, recognized[tokenIndex - 1].normalized);
      // Preserve the deliberate order below for deterministic ties. Prefer
      // consuming an ad-lib before shifting repeated lyric words forward; it
      // keeps the earliest credible occurrence of "go go" as its timing.
      const candidates: Array<{ cost: number; step: AlignmentStep }> = [
        { cost: costs[lyricIndex][tokenIndex - 1] + 1, step: "skip-recognized" },
        { cost: costs[lyricIndex - 1][tokenIndex - 1] + (same ? 0 : fuzzy ? 0.75 : 2), step: same ? "match" : fuzzy ? "fuzzy-match" : "substitute" },
        { cost: costs[lyricIndex - 1][tokenIndex] + 1, step: "skip-lyric" },
      ];
      const winner = candidates.reduce((best, candidate) => candidate.cost < best.cost ? candidate : best);
      costs[lyricIndex][tokenIndex] = winner.cost;
      steps[lyricIndex][tokenIndex] = winner.step;
    }
  }

  const reverse: AlignmentStep[] = [];
  let lyricIndex = lyrics.length;
  let tokenIndex = recognized.length;
  while (lyricIndex > 0 || tokenIndex > 0) {
    const step = steps[lyricIndex][tokenIndex];
    if (!step) break;
    reverse.push(step);
    if (step === "match" || step === "fuzzy-match" || step === "substitute") {
      lyricIndex -= 1;
      tokenIndex -= 1;
    } else if (step === "skip-lyric") {
      lyricIndex -= 1;
    } else {
      tokenIndex -= 1;
    }
  }
  return reverse.reverse();
}

function lineEnd(lastTokenIndex: number, recognized: readonly TimedRecognizedWord[]): number | null {
  const last = recognized[lastTokenIndex];
  if (Number.isFinite(last.end) && last.end! > last.start) return last.end!;
  const next = recognized[lastTokenIndex + 1];
  return next && next.start > last.start ? next.start : null;
}

/**
 * Matches local recognition output to the saved lyrics and returns an
 * in-memory proposal. Lines without enough exact matches, or without a
 * defensible ending, are deliberately left out rather than guessed.
 */
export function matchRecognizedTokensToLyrics({
  proposalId,
  lines,
  tokens,
}: CanonicalLyricsMatcherInput): TimingProposal {
  const lyricLines = lines.map(line => lyricWords(line.text));
  const lyrics = lyricLines.flatMap((words, lineIndex) => words.map((text, wordIndex) => ({
    lineIndex,
    wordIndex,
    text,
    normalized: normalizeLyricWord(text),
  })));
  const recognized = expandRecognizedTokens(tokens);
  const matchedTokenByLyric = new Map<number, number>();
  const unmatchedRecognized = new Set<number>();
  const lineHasFuzzyMatch = lines.map(() => false);
  const steps = align(lyrics, recognized);

  let lyricIndex = 0;
  let tokenIndex = 0;
  for (const step of steps) {
    if (step === "match" || step === "fuzzy-match") {
      matchedTokenByLyric.set(lyricIndex, tokenIndex);
      if (step === "fuzzy-match") lineHasFuzzyMatch[lyrics[lyricIndex].lineIndex] = true;
      lyricIndex += 1;
      tokenIndex += 1;
    } else if (step === "substitute") {
      unmatchedRecognized.add(tokenIndex);
      lyricIndex += 1;
      tokenIndex += 1;
    } else if (step === "skip-lyric") {
      lyricIndex += 1;
    } else {
      unmatchedRecognized.add(tokenIndex);
      tokenIndex += 1;
    }
  }

  const matchedByLine = lines.map(() => new Map<number, number>());
  for (const [flatLyricIndex, matchedTokenIndex] of matchedTokenByLyric) {
    const lyric = lyrics[flatLyricIndex];
    matchedByLine[lyric.lineIndex].set(lyric.wordIndex, matchedTokenIndex);
  }

  // An ad-lib is attached to the closest matched line. That preserves useful
  // timing while ensuring review is requested instead of silently accepting it.
  const lineHasUnexpectedToken = lines.map(() => false);
  for (const unmatchedTokenIndex of unmatchedRecognized) {
    let closestLine = -1;
    let closestDistance = Number.POSITIVE_INFINITY;
    matchedByLine.forEach((matches, lineIndex) => matches.forEach(matchedIndex => {
      const distance = Math.abs(matchedIndex - unmatchedTokenIndex);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestLine = lineIndex;
      }
    }));
    if (closestLine >= 0) lineHasUnexpectedToken[closestLine] = true;
  }

  const proposalLines: TimingProposal["lines"] = [];
  lines.forEach((line, lineIndex) => {
    const words = lyricLines[lineIndex];
    const matches = matchedByLine[lineIndex];
    const matchedEntries = [...matches.entries()].sort(([a], [b]) => a - b);
    const credible = words.length > 0 && matches.size / words.length >= MIN_CREDIBLE_MATCH_RATIO;
    if (!credible || matchedEntries.length === 0) return;

    const firstTokenIndex = matchedEntries[0][1];
    const lastTokenIndex = matchedEntries.at(-1)![1];
    const end = lineEnd(lastTokenIndex, recognized);
    if (end === null || end <= recognized[firstTokenIndex].start) return;

    const wordTimings: WordTiming[] = words.map(text => ({ text, start: null, end: null }));
    for (let entryIndex = 0; entryIndex < matchedEntries.length; entryIndex += 1) {
      const [wordIndex, matchedIndex] = matchedEntries[entryIndex];
      const token = recognized[matchedIndex];
      const nextEntry = matchedEntries[entryIndex + 1];
      wordTimings[wordIndex] = { text: words[wordIndex], start: token.start, end: null };
      if (!nextEntry) {
        wordTimings[wordIndex].end = end > token.start ? end : null;
        continue;
      }

      const [nextWordIndex, nextMatchedIndex] = nextEntry;
      const nextStart = recognized[nextMatchedIndex].start;
      const skippedWordCount = nextWordIndex - wordIndex - 1;
      const tokenEnd = token.end;
      const hasUsableTokenEnd = Number.isFinite(tokenEnd) && tokenEnd! > token.start && tokenEnd! < nextStart;
      if (skippedWordCount === 0 || !hasUsableTokenEnd) {
        wordTimings[wordIndex].end = nextStart > token.start ? nextStart : null;
        continue;
      }

      // The recognizer brackets this gap with two real words. Split only that
      // bounded interval evenly and leave the proposal visibly uncertain.
      wordTimings[wordIndex].end = tokenEnd!;
      const interval = (nextStart - tokenEnd!) / skippedWordCount;
      for (let offset = 0; offset < skippedWordCount; offset += 1) {
        const start = tokenEnd! + interval * offset;
        wordTimings[wordIndex + offset + 1] = {
          text: words[wordIndex + offset + 1],
          start,
          end: start + interval,
        };
      }
    }

    proposalLines.push({
      lineId: line.lineId,
      start: recognized[firstTokenIndex].start,
      end,
      words: wordTimings,
      uncertain: matches.size !== words.length || lineHasFuzzyMatch[lineIndex] || lineHasUnexpectedToken[lineIndex],
    });
  });

  return { id: proposalId, lines: proposalLines };
}
