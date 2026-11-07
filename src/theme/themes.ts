/**
 * The selectable themes. Values live in src/styles/tokens.css; these entries
 * only describe them for the picker.
 */
export type ThemeId = "coral" | "lemon" | "sky" | "mint" | "grape" | "night";
export type ThemeChoice = ThemeId | "auto";

export interface ThemeInfo {
  id: ThemeId;
  label: string;
  dark: boolean;
  /** ground, ink, accent: drawn as the picker swatch. */
  swatch: [string, string, string];
}

export const THEMES: ThemeInfo[] = [
  { id: "coral", label: "Coral", dark: false, swatch: ["#fff4ee", "#2b1b17", "#c93d2a"] },
  { id: "lemon", label: "Lemon", dark: false, swatch: ["#fffae8", "#2a2410", "#f2c12e"] },
  { id: "sky", label: "Sky", dark: false, swatch: ["#eef5ff", "#12233d", "#1f67c9"] },
  { id: "mint", label: "Mint", dark: false, swatch: ["#ecf8f3", "#10291f", "#0f7a6a"] },
  { id: "grape", label: "Grape", dark: true, swatch: ["#1d1830", "#f1ecff", "#a78bff"] },
  { id: "night", label: "Night", dark: true, swatch: ["#1e1917", "#f7eeea", "#ff7a62"] },
];

/**
 * Theme names saved by earlier versions (daisyUI, then the inner-sleeve
 * redesign), mapped to their nearest current theme. Mirrored in index.html's
 * pre-paint script and scripts/build-legal-pages.mjs.
 */
export const LEGACY_THEMES: Record<string, ThemeChoice> = {
  pastel: "grape",
  winter: "sky",
  retro: "lemon",
  corporate: "sky",
  business: "night",
  forest: "mint",
  harbor: "sky",
  lilac: "grape",
  newsprint: "lemon",
};

const STORAGE_KEY = "theme";

export function readThemeChoice(): ThemeChoice {
  let saved: string | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
  if (!saved) return "auto";
  if (saved === "auto" || THEMES.some((t) => t.id === saved)) return saved as ThemeChoice;
  return LEGACY_THEMES[saved] ?? "auto";
}

export function saveThemeChoice(choice: ThemeChoice) {
  try { localStorage.setItem(STORAGE_KEY, choice); } catch { /* private mode */ }
}

/** "auto" follows the device: Coral by day, Night when the system is dark. */
export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ThemeId {
  if (choice !== "auto") return choice;
  return prefersDark ? "night" : "coral";
}
