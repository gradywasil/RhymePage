import { useLongPress } from "../hooks/useLongPress";

interface WordChipProps {
  word: string;
  /** 0 = strongest match in the list, 2 = weakest third; rides the weight ramp. */
  strength?: 0 | 1 | 2;
  onSelect: (word: string) => void;
  onInspect: (word: string) => void;
}

const WEIGHT = ["font-bold text-on-panel", "font-medium text-on-panel", "font-normal text-on-panel-2"] as const;

/**
 * One suggested word in the panel's column list. Not a pill: a full-width row
 * set in the panel's ink, ranked by weight, with a 44px tap row.
 */
const WordChip = ({ word, strength = 1, onSelect, onInspect }: WordChipProps) => {
  const handlers = useLongPress({
    onClick: () => onSelect(word),
    onLongPress: () => onInspect(word),
  });

  return (
    <button
      type="button"
      className={[
        "word-chip flex min-h-11 w-full items-center px-3 text-left text-[17px] leading-tight",
        "transition-colors hover:bg-panel-2 hover:text-on-panel active:bg-panel-2",
        WEIGHT[strength],
      ].join(" ")}
      title={`${word}: tap to insert, hold or right-click for the meaning`}
      {...handlers}
    >
      <span className="truncate">{word}</span>
    </button>
  );
};

export default WordChip;
