import type { RecognizedToken } from "./canonicalLyricsMatcher";
import type { SherpaRecognizer } from "./sherpaLoader";
import type { VocalGuideAudio } from "./vocalGuideCapture";

const SENTENCEPIECE_WORD_BOUNDARY = "▁";

/**
 * Sherpa's Zipformer model emits SentencePiece fragments (`▁R`, `acing`) and
 * one timestamp per fragment. Rejoin them before lyric matching; the timestamp
 * on each word-start fragment is the defensible word start for a partial take.
 */
export function groupSherpaTokens(tokens: readonly string[], timestamps: readonly number[]): RecognizedToken[] {
  const hasSentencePiece = tokens.some(token => token.includes(SENTENCEPIECE_WORD_BOUNDARY) || /^\s/u.test(token));
  if (!hasSentencePiece) {
    return tokens.flatMap((text, index) => {
      const start = timestamps[index];
      if (!text.trim() || !Number.isFinite(start) || start < 0) return [];
      const next = timestamps[index + 1];
      return [{ text, start, ...(Number.isFinite(next) && next > start ? { end: next } : {}) }];
    });
  }

  const words: RecognizedToken[] = [];
  let current: RecognizedToken | null = null;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const start = timestamps[index];
    if (!Number.isFinite(start) || start < 0 || token === "<blk>" || token === "<sos/eos>") continue;

    const startsWord = token.startsWith(SENTENCEPIECE_WORD_BOUNDARY) || /^\s/u.test(token);
    const fragment = token.replaceAll(SENTENCEPIECE_WORD_BOUNDARY, "").trimStart();
    if (startsWord) {
      if (current?.text) current.end = start > current.start ? start : undefined;
      if (current?.text) words.push(current);
      current = { text: fragment, start };
    } else if (current) {
      current.text += fragment;
    } else {
      current = { text: fragment, start };
    }
  }
  if (current?.text) words.push(current);
  return words;
}

/** Runs one completed take through Sherpa and returns only usable word starts. */
export function recognizeVocalGuide(
  recognizer: SherpaRecognizer,
  audio: VocalGuideAudio
): RecognizedToken[] {
  const stream = recognizer.createStream();
  try {
    stream.acceptWaveform(audio.sampleRate, audio.samples);
    stream.inputFinished();
    while (recognizer.isReady(stream)) recognizer.decode(stream);

    const result = recognizer.getResult(stream);
    const tokens = result.tokens ?? [];
    const timestamps = result.timestamps ?? [];
    const recognized = groupSherpaTokens(tokens, timestamps);

    if (recognized.length === 0) {
      throw new Error("The local voice engine could not find timed words in this take. Try a clearer take or use manual sync.");
    }
    return recognized;
  } finally {
    stream.free();
    recognizer.free?.();
  }
}
