"use client";

import React from "react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeSlider() {
  const { theme, setTheme } = useTheme();

  const options: Array<{ mode: ThemeMode; icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { mode: "light", icon: Sun, label: "Light" },
    { mode: "system", icon: Laptop, label: "System" },
    { mode: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div
      className="flex items-center p-0.5 rounded-xl bg-black/40 dark:bg-black/60 border border-white/10 relative text-xs font-mono"
      role="radiogroup"
      aria-label="Color theme switcher"
    >
      {options.map(({ mode, icon: Icon, label }) => {
        const isSelected = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(mode)}
            className={`relative z-10 flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              isSelected
                ? "bg-sky-500/20 text-sky-400 dark:text-sky-300 font-semibold shadow-sm border border-sky-500/40"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
            title={`Switch to ${label} mode`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
