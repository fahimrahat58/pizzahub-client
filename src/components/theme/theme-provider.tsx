"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "pizzahub-theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // The blocking script in the root layout applies the stored class before
  // paint. This effect only syncs React state after hydration.
  useEffect(() => {
    queueMicrotask(() => {
      setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
  }, []);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private browsing; the class still works.
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
