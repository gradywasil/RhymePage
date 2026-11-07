import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useNoteDraft } from "./useNoteDraft";
import {
  RELATION_KEYS,
  fetchRelated,
  type RelatedWord,
  type RelationKey,
} from "../utils/rhymeApi";
import { getCompletedWord } from "../utils/lyrics";
import { getDefinition } from "../utils/dictionaryApi";
import {
  DEFAULT_RHYME_SETTINGS,
  coerceSettings,
  type RhymeSettings,
} from "../types/settings";
import type { DictionaryEntry } from "../utils/dictionaryApi";
import type { AppUser } from "../types/user";

export type Suggestions = Record<RelationKey, RelatedWord[]>;

function emptySuggestions(): Suggestions {
  const empty = {} as Suggestions;
  for (const key of RELATION_KEYS) empty[key] = [];
  return empty;
}

/** Shared empty value, so the derived fallback keeps a stable identity. */
const NO_SUGGESTIONS = emptySuggestions();

/** Wait this long after the last keystroke before hitting the API. */
const SUGGEST_DEBOUNCE_MS = 250;

interface DashboardProps {
  currentUser: AppUser | null;
  existingNoteId?: string;
}

const useDashboardLogic = ({ currentUser, existingNoteId }: DashboardProps) => {
  const { draft, state: draftState } = useNoteDraft(currentUser?.uid ?? null, existingNoteId);
  const { title, lyrics, themes } = draftState.content;
  const setTitle = (title: string) => draft.edit({ title });
  const setLyrics = (lyrics: string) => draft.edit({ lyrics });
  const setThemes = (themes: string) => draft.edit({ themes });
  const noteId = draftState.cloudExists ? draftState.noteId : "";
  const navigate = useNavigate();
  useEffect(() => {
    if (!existingNoteId && draftState.cloudExists && !draftState.dirty && !draftState.saving) {
      navigate(`/notes/${draftState.noteId}`, { replace: true });
    }
  }, [existingNoteId, draftState.cloudExists, draftState.dirty, draftState.saving, draftState.noteId, navigate]);
  const [lastWord, setLastWord] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestions>(emptySuggestions);
  const [suggestionError, setSuggestionError] = useState("");
  const [activeCategory, setActiveCategory] = useState<RelationKey>("rhyme");
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null);
  const [definitionWord, setDefinitionWord] = useState<string>("");
  const [definitionState, setDefinitionState] = useState<
    "idle" | "loading" | "empty" | "error" | "ready"
  >("idle");
  const [settings, setSettings] = useState<RhymeSettings>(DEFAULT_RHYME_SETTINGS);

  /** The live textarea, so suggestions can be inserted at the caret. */
  const lyricsRef = useRef<HTMLTextAreaElement>(null);
  /** Where to put the caret after a programmatic insert. */
  const pendingCaret = useRef<number | null>(null);

  const db = getFirestore();

  /** A signed-out writer always gets the defaults, whatever was last loaded. */
  const activeSettings = useMemo(
    () => (currentUser ? settings : DEFAULT_RHYME_SETTINGS),
    [currentUser, settings]
  );

  const handleSave = draft.save;

  const clearDefinition = useCallback(() => {
    setDefinitionState("idle");
    setDefinition(null);
    setDefinitionWord("");
  }, []);

  /** Look a word up for the definition view. Long-press on touch, right-click on desktop. */
  const lookUpWord = useCallback(async (word: string) => {
    setDefinitionWord(word);
    setDefinition(null);
    setDefinitionState("loading");
    try {
      const entry = await getDefinition(word);
      if (entry) {
        setDefinition(entry);
        setDefinitionState("ready");
      } else {
        setDefinitionState("empty");
      }
    } catch {
      setDefinitionState("error");
    }
  }, []);

  const handleReset = () => {
    if (existingNoteId) navigate("/notes/new");
    else draft.resetNew();
    setLastWord("");
    setSuggestions(emptySuggestions());
    clearDefinition();
  };

  const handleLyricsChange = (value: string, caret: number, composing = false) => {
    setLyrics(value);
    if (composing) return;
    const word = getCompletedWord(value, caret);
    if (word) setLastWord(word);
  };

  /**
   * Drop a suggested word in at the caret instead of tacking it onto the very
   * end, so picking a rhyme while editing line two doesn't append it to the
   * bottom of the song.
   */
  const handleLeftClick = (word: string) => {
    const el = lyricsRef.current;
    const start = el?.selectionStart ?? lyrics.length;
    const end = el?.selectionEnd ?? lyrics.length;

    const before = lyrics.slice(0, start);
    const after = lyrics.slice(end);
    const needsLeadingSpace = before.length > 0 && !/\s$/.test(before);
    const insertion = `${needsLeadingSpace ? " " : ""}${word}`;
    const needsTrailingSpace = after.length === 0 || !/^\s/.test(after);

    setLyrics(`${before}${insertion}${needsTrailingSpace ? " " : ""}${after}`);
    setLastWord(word);
    pendingCaret.current =
      before.length + insertion.length + (needsTrailingSpace ? 1 : 0);
  };

  // Restore the caret after an insert, then hand focus back to the writer.
  useEffect(() => {
    const caret = pendingCaret.current;
    const el = lyricsRef.current;
    if (caret === null || !el) return;
    pendingCaret.current = null;
    el.focus();
    el.setSelectionRange(caret, caret);
  }, [lyrics]);

  // Fetch every enabled section for the current word in one pass. The
  // AbortController means a fast typist's stale responses can never overwrite
  // the results for the word they're actually on.
  useEffect(() => {
    if (!lastWord) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const active = RELATION_KEYS.filter((key) => activeSettings.enabled[key]);
      const settled = await Promise.all(
        active.map(async (key) => {
          try {
            const words = await fetchRelated(key, lastWord, {
              themes,
              engine: activeSettings.engine,
              max: activeSettings.max,
              signal: controller.signal,
            });
            return [key, words, false] as const;
          } catch {
            // An aborted or failed section just stays empty.
            return [key, [] as RelatedWord[], true] as const;
          }
        })
      );

      if (controller.signal.aborted) return;
      const next = emptySuggestions();
      for (const [key, words] of settled) next[key] = words;
      setSuggestions(next);
      setSuggestionError(settled.length > 0 && settled.every(([, , failed]) => failed) ? "Word suggestions could not load. Check your connection. Your writing is kept on this device." : "");
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [lastWord, themes, activeSettings]);

  // Pull the signed-in user's suggestion preferences.
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (cancelled || !snap.exists()) return;
        setSettings(coerceSettings(snap.data().settings));
      } catch {
        // Preferences are a nicety; fall back to the defaults silently.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, db]);

  return {
    noteId,
    title,
    setTitle,
    lyrics,
    themes,
    setThemes,
    suggestions: lastWord ? suggestions : NO_SUGGESTIONS,
    suggestionError: lastWord ? suggestionError : "",
    settings: activeSettings,
    lastWord,
    activeCategory,
    setActiveCategory,
    definition,
    definitionWord,
    definitionState,
    lookUpWord,
    clearDefinition,
    lyricsRef,
    handleSave,
    handleReset,
    handleLeftClick,
    handleLyricsChange,
    draftState,
    retryDraft: draft.load,
    resolveRecovery: draft.resolveRecovery,
    importDeviceDraft: draft.edit,
  };
};

export default useDashboardLogic;
