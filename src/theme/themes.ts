/**
 * The selectable themes. Each is a printing of the same sleeve; values live in
 * src/styles/tokens.css and these entries only describe them for the picker.
 */
export type ThemeId = "harbor" | "lilac" | "mint" | "newsprint" | "night" | "forest";
export type ThemeChoice = ThemeId | "auto";

export interface ThemeInfo {
  id: ThemeId;
  label: string;
  dark: boolean;
  /** sleeve, ink, accent: drawn as the picker swatch. */
  swatch: [string, string, string];
}

export const THEMES: ThemeInfo[] = [
  { id: "harbor", label: "Harbor", dark: false, swatch: ["#d3e4ee", "#10243a", "#a8321c"] },
  { id: "lilac", label: "Lilac", dark: false, swatch: ["#e6dff3", "#1e1631", "#9b2c5a"] },
  { id: "mint", label: "Mint", dark: false, swatch: ["#d3ece2", "#0e2a21", "#a63a16"] },
  { id: "newsprint", label: "Newsprint", dark: false, swatch: ["#eaeae6", "#161616", "#b0261c"] },
  { id: "night", label: "Night", dark: true, swatch: ["#1c1a17", "#ede6da", "#f0875f"] },
  { id: "forest", label: "Forest", dark: true, swatch: ["#17251e", "#e6efe8", "#e9b44c"] },
];

/** daisyUI theme names saved by earlier versions, mapped to their nearest printing. */
const LEGACY: Record<string, ThemeChoice> = {
  pastel: "lilac",
  winter: "harbor",
  retro: "newsprint",
  corporate: "newsprint",
  business: "night",
  forest: "forest",
};

const STORAGE_KEY = "theme";

export function readThemeChoice(): ThemeChoice {
  let saved: string | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
  if (!saved) return "auto";
  if (saved === "auto" || THEMES.some((t) => t.id === saved)) return saved as ThemeChoice;
  return LEGACY[saved] ?? "auto";
}

export function saveThemeChoice(choice: ThemeChoice) {
  try { localStorage.setItem(STORAGE_KEY, choice); } catch { /* private mode */ }
}

/** "auto" follows the device: Harbor by day, Night when the system is dark. */
export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ThemeId {
  if (choice !== "auto") return choice;
  return prefersDark ? "night" : "harbor";
}
