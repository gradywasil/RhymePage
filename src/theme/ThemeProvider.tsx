import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readThemeChoice, resolveTheme, saveThemeChoice, type ThemeChoice, type ThemeId } from "./themes";
import { updateSystemBarContrast } from "../utils/nativeApp";

interface ThemeState {
  choice: ThemeChoice;
  theme: ThemeId;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const darkQuery = () =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(readThemeChoice);
  const [prefersDark, setPrefersDark] = useState(() => darkQuery()?.matches ?? false);

  useEffect(() => {
    const query = darkQuery();
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const theme = resolveTheme(choice, prefersDark);

  /*
   * data-theme lives on <html> so the sleeve ground paints behind every gap,
   * including the strip Chrome-for-Android's dvh recalculation can leave below
   * the app frame. The browser chrome colour follows the same sleeve.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    const sleeve = getComputedStyle(root).getPropertyValue("--sleeve").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", sleeve);
    // Let the frame repaint before sampling it for the system bar icons.
    requestAnimationFrame(() => updateSystemBarContrast());
  }, [theme]);

  const value = useMemo<ThemeState>(() => ({
    choice,
    theme,
    setChoice: (next) => {
      saveThemeChoice(next);
      setChoiceState(next);
    },
  }), [choice, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeState {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
