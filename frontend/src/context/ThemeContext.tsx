import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

interface ThemeContextValue {
  darkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";
const THEME_EVENT = "theme-change";

function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
  } catch {
    /* ignore storage errors */
  }

  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState<boolean>(getInitialTheme);
  const ignoreSystemPreference = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      ignoreSystemPreference.current = window.localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      ignoreSystemPreference.current = false;
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, darkMode ? "dark" : "light");
      ignoreSystemPreference.current = true;
    } catch {
      /* ignore storage errors */
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: darkMode }));
  }, [darkMode]);

  useEffect(() => {
    const onThemeChange = (event: Event) => {
      const custom = event as CustomEvent<boolean>;
      setDarkModeState(Boolean(custom.detail));
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setDarkModeState(event.newValue === "dark");
      }
    };

    window.addEventListener(THEME_EVENT, onThemeChange as EventListener);
    window.addEventListener("storage", onStorage);

    let mql: MediaQueryList | null = null;
    const onMedia = (event: MediaQueryListEvent) => {
      if (!ignoreSystemPreference.current) {
        setDarkModeState(event.matches);
      }
    };

    try {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      if (mql.addEventListener) mql.addEventListener("change", onMedia);
      else mql.addListener(onMedia);
    } catch {
      mql = null;
    }

    return () => {
      window.removeEventListener(THEME_EVENT, onThemeChange as EventListener);
      window.removeEventListener("storage", onStorage);
      if (mql) {
        if (mql.removeEventListener) mql.removeEventListener("change", onMedia);
        else mql.removeListener(onMedia);
      }
    };
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkModeState((prev) => !prev);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ darkMode, toggleTheme, setDarkMode }),
    [darkMode, toggleTheme, setDarkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
