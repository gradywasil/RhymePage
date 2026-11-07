import { LuArrowLeft } from "react-icons/lu";
import type { DictionaryEntry } from "../utils/dictionaryApi";

interface DefinitionViewProps {
  word: string;
  entry: DictionaryEntry | null;
  state: "idle" | "loading" | "empty" | "error" | "ready";
  onClose: () => void;
}

const DefinitionView = ({ word, entry, state, onClose }: DefinitionViewProps) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex flex-none items-center gap-1 pr-4 pt-1">
      <button type="button" onClick={onClose} className="rp-icon-btn" aria-label="Back to suggestions">
        <LuArrowLeft aria-hidden />
      </button>
      <h3 className="truncate text-lg font-extrabold">{word}</h3>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 text-[15px] leading-relaxed" aria-live="polite">
      {state === "loading" && <span className="rp-loading mt-3" aria-label="Looking it up" />}
      {state === "empty" && <p className="rp-muted">No dictionary entry for &ldquo;{word}&rdquo;.</p>}
      {state === "error" && <p className="rp-muted">The dictionary isn't answering. Try again in a moment.</p>}
      {state === "ready" &&
        entry?.meanings?.map((meaning, i) => (
          <section key={`${meaning.partOfSpeech}-${i}`} className="mt-3">
            <p className="rp-label mb-1.5">{meaning.partOfSpeech}</p>
            <ol className="flex list-decimal flex-col gap-2 pl-5 marker:text-ink-2">
              {meaning.definitions.slice(0, 4).map((sense, j) => (
                <li key={j}>
                  {sense.definition}
                  {sense.example && <span className="rp-muted block italic">&ldquo;{sense.example}&rdquo;</span>}
                </li>
              ))}
            </ol>
          </section>
        ))}
    </div>
  </div>
);

export default DefinitionView;
