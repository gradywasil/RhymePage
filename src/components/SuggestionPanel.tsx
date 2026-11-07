import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import DefinitionView from "./DefinitionView";
import WordChip from "./WordChip";
import { RELATIONS, RELATION_KEYS, type RelationKey } from "../utils/rhymeApi";
import type { Suggestions } from "../hooks/useDashboardLogic";
import type { RhymeSettings } from "../types/settings";
import type { DictionaryEntry } from "../utils/dictionaryApi";

export type SheetState = "peek" | "half" | "full";

const STATE_LABEL: Record<SheetState, string> = {
  peek: "Expand suggestions",
  half: "Expand suggestions further",
  full: "Collapse suggestions",
};

interface SuggestionPanelProps {
  error?: string;
  suggestions: Suggestions;
  settings: RhymeSettings;
  lastWord: string;
  activeCategory: RelationKey;
  onCategoryChange: (key: RelationKey) => void;
  onSelect: (word: string) => void;
  onInspect: (word: string) => void;
  definition: DictionaryEntry | null;
  definitionWord: string;
  definitionState: "idle" | "loading" | "empty" | "error" | "ready";
  onCloseDefinition: () => void;
  sheetState: SheetState;
  onCycleSheet: () => void;
}

/** Datamuse returns results best-first; thirds of the list ride the weight ramp. */
function strengthAt(index: number, total: number): 0 | 1 | 2 {
  if (total < 3) return 0;
  return index < total / 3 ? 0 : index < (2 * total) / 3 ? 1 : 2;
}

const SuggestionPanel = ({
  error,
  suggestions,
  settings,
  lastWord,
  activeCategory,
  onCategoryChange,
  onSelect,
  onInspect,
  definition,
  definitionWord,
  definitionState,
  onCloseDefinition,
  sheetState,
  onCycleSheet,
}: SuggestionPanelProps) => {
  const categories = RELATION_KEYS.filter((key) => settings.enabled[key]);

  // Several categories come back empty for most words -- Sound-Alikes and
  // Antonyms especially -- so if the chosen tab has nothing, show the first
  // one that does rather than an empty panel.
  const firstWithWords = categories.find((key) => suggestions[key].length > 0);
  const shown =
    suggestions[activeCategory]?.length > 0
      ? activeCategory
      : firstWithWords ?? activeCategory;

  const words = suggestions[shown] ?? [];
  const showingDefinition = definitionState !== "idle";
  const SheetIcon = sheetState === "full" ? LuChevronDown : LuChevronUp;

  return (
    <aside
      className="suggest panel z-20 flex w-full flex-none flex-col
                 md:h-full md:w-80 md:flex-none lg:w-96"
      data-state={sheetState}
      aria-label="Word suggestions"
    >
      {/* Headword row. On a phone the whole row also cycles the sheet height. */}
      <div className="flex h-11 flex-none items-center gap-3 pl-4 md:h-14">
        {lastWord ? (
          <p key={lastWord} className="suggest-headword min-w-0 truncate text-[22px] font-extrabold tracking-[-0.01em]">
            {lastWord}
          </p>
        ) : (
          <p className="rp-label">Suggestions</p>
        )}
        <p className="rp-muted ml-auto hidden truncate text-xs lg:block lg:pr-4">Tap to insert · hold for meaning</p>
        <button
          type="button"
          onClick={onCycleSheet}
          aria-label={STATE_LABEL[sheetState]}
          className="rp-icon-btn ml-auto md:hidden"
        >
          <SheetIcon aria-hidden />
        </button>
      </div>

      {/* Category tabs hold their positions; each carries its result count. */}
      <div role="tablist" aria-label="Suggestion categories" className="rp-tabs flex-none px-4">
        {categories.map((key) => {
          const count = suggestions[key].length;
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={key === shown}
              disabled={count === 0}
              onClick={() => onCategoryChange(key)}
              className="rp-tab"
            >
              {RELATIONS[key].label}
              <span className="rp-count">{count}</span>
            </button>
          );
        })}
      </div>

      {showingDefinition ? (
        <DefinitionView
          word={definitionWord}
          entry={definition}
          state={definitionState}
          onClose={onCloseDefinition}
        />
      ) : words.length > 0 ? (
        <div className="suggest-words no-bar min-h-0 flex-1 py-1">
          {words.map(({ word }, index) => (
            <WordChip
              key={`${shown}-${word}`}
              word={word}
              strength={strengthAt(index, words.length)}
              onSelect={onSelect}
              onInspect={onInspect}
            />
          ))}
        </div>
      ) : (
        <p className="rp-muted px-4 py-3 text-[15px]">
          {error || (lastWord
            ? `Nothing came back for "${lastWord}". Try the next word.`
            : "Finish a word and its rhymes and relatives land here.")}
        </p>
      )}
    </aside>
  );
};

export default SuggestionPanel;
