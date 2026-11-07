import { RELATIONS, RELATION_KEYS, type RelationKey } from "../utils/rhymeApi";
import type { ThemeEngine } from "../utils/rhymeApi";
import type { RhymeSettings } from "../types/settings";
import { SettingsSection } from "./SettingsSection";
import { FormMessage } from "./FormControls";

interface SettingsDashboardProps {
  settings: RhymeSettings;
  onToggle: (key: RelationKey) => void;
  onEngineChange: (engine: ThemeEngine) => void;
  onMaxChange: (max: number) => void;
  onSave: () => void;
  status: "idle" | "saving" | "saved" | "error";
}

const STATUS_TEXT = {
  idle: "Save preferences",
  saving: "Saving…",
  saved: "Saved",
  error: "Could not save - try again",
} as const;

const ENGINES: { id: ThemeEngine; label: string; hint: string }[] = [
  {
    id: "topics",
    label: "Broad",
    hint: "Nudges results toward your themes but keeps the list full.",
  },
  {
    id: "ml",
    label: "Specific",
    hint: "Demands results actually mean something like your themes. Far fewer words, sometimes none.",
  },
];

const SettingsDashboard = ({
  settings,
  onToggle,
  onEngineChange,
  onMaxChange,
  onSave,
  status,
}: SettingsDashboardProps) => {
  const enabledCount = RELATION_KEYS.filter((k) => settings.enabled[k]).length;

  return (
    <div className="flex flex-col">
      <SettingsSection
        title="Categories"
        description={`Which suggestion tabs appear while you write. ${enabledCount} of ${RELATION_KEYS.length} on.`}
      >
        <ul className="flex flex-col divide-y divide-rule">
          {RELATION_KEYS.map((key) => (
            <li key={key}>
              <label className="flex min-h-14 cursor-pointer items-center gap-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{RELATIONS[key].label}</span>
                  <span className="rp-muted block text-[13px] leading-snug">{RELATIONS[key].hint}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={RELATIONS[key].label}
                  checked={settings.enabled[key]}
                  onChange={() => onToggle(key)}
                  className="rp-switch"
                />
              </label>
            </li>
          ))}
        </ul>
      </SettingsSection>

      <SettingsSection
        title="Theme matching"
        description="How hard the Themes field on the dashboard pulls results toward your subject."
      >
        <div className="flex flex-col">
          {ENGINES.map(({ id, label, hint }) => (
            <label key={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
              <input
                type="radio"
                name="engine"
                className="rp-radio mt-0.5"
                checked={settings.engine === id}
                onChange={() => onEngineChange(id)}
              />
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold">{label}</span>
                <span className="rp-muted block text-[13px] leading-snug">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Results per category"
        description="More words means more scrolling in the suggestion panel."
      >
        <div className="flex items-center gap-4">
          <input
            type="range"
            aria-label="Results per category"
            min="5"
            max="50"
            step={5}
            value={settings.max}
            onChange={(e) => onMaxChange(parseInt(e.target.value, 10))}
            className="rp-range flex-1"
          />
          <span className="w-8 text-right text-[17px] font-bold tabular-nums">
            {settings.max}
          </span>
        </div>
      </SettingsSection>

      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-5">
        <button
          type="button"
          className="rp-btn rp-btn--ink"
          onClick={onSave}
          disabled={status === "saving"}
        >
          {STATUS_TEXT[status]}
        </button>
        {status === "saved" && (
          <FormMessage tone="success">Applied to your dashboard.</FormMessage>
        )}
        {status === "error" && (
          <FormMessage tone="error">Check your connection and try again.</FormMessage>
        )}
      </div>
    </div>
  );
};

export default SettingsDashboard;
