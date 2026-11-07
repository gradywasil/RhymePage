import type { CSSProperties } from "react";
import { useLongPress } from "../hooks/useLongPress";
import type { RelationKey } from "../utils/rhymeApi";

interface WordChipProps {
  word: string;
  /** The suggestion category, which sets the chip's colour. */
  category: RelationKey;
  /** 0 = strongest third of the list, 2 = weakest; the tint fades with it. */
  strength?: 0 | 1 | 2;
  onSelect: (word: string) => void;
  onInspect: (word: string) => void;
}

/** One suggested word: a chip tinted in its category's colour, 44px tall to tap. */
const WordChip = ({ word, category, strength = 1, onSelect, onInspect }: WordChipProps) => {
  const handlers = useLongPress({
    onClick: () => onSelect(word),
    onLongPress: () => onInspect(word),
  });

  return (
    <button
      type="button"
      data-strength={strength}
      style={{ "--cat": `var(--cat-${category})` } as CSSProperties}
      className="word-chip cat-chip inline-flex min-h-11 flex-none items-center px-3.5 text-[16px] leading-tight"
      title={`${word}: tap to insert, hold or right-click for the meaning`}
      {...handlers}
    >
      {word}
    </button>
  );
};

export default WordChip;
