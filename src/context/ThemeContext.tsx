"use client";

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from "react";

export type ThemeMode = "light" | "system" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "fixit_theme_v1";

const themeListeners = new Set<() => void>();

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(callback: () => void): () => void {
  themeListeners.add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      callback();
    }
  };

  const mediaQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const handleMedia = () => callback();

  window.addEventListener("storage", handleStorage);
  if (mediaQuery) {
    mediaQuery.addEventListener("change", handleMedia);
  }

  return () => {
    themeListeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
    if (mediaQuery) {
      mediaQuery.removeEventListener("change", handleMedia);
    }
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "system";
}

function getThemeServerSnapshot(): ThemeMode {
  return "dark";
}

function getSystemPref(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  const isServer = useSyncExternalStore(
    () => () => {},
    () => false,
    () => true
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system"
      ? (isServer ? "dark" : getSystemPref())
      : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [resolvedTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      notifyThemeListeners();
    } catch {
      // ignore
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
