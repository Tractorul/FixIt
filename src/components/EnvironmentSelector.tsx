"use client";

import React from "react";
import { SupportedOS, SupportedShell } from "@/types";
import { Cpu, Terminal } from "lucide-react";

interface EnvironmentSelectorProps {
  os: SupportedOS;
  shell: SupportedShell;
  onOSChange: (os: SupportedOS) => void;
  onShellChange: (shell: SupportedShell) => void;
}

const OS_OPTIONS: SupportedOS[] = ["Unspecified", "Fedora", "Ubuntu", "Debian", "Arch", "Other"];
const SHELL_OPTIONS: SupportedShell[] = ["Unspecified", "Bash", "Zsh", "Fish", "Other"];

export function EnvironmentSelector({
  os,
  shell,
  onOSChange,
  onShellChange,
}: EnvironmentSelectorProps) {
  return (
    <div className="rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200 dark:border-white/10 p-3.5 space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 font-medium">
        <span className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-300">
          <Cpu className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          Target Environment <span className="text-slate-500 dark:text-zinc-500 font-normal">(Optional)</span>
        </span>
        <span className="text-[11px] text-slate-500 dark:text-zinc-500">
          Tailors package commands (apt, dnf, pacman) & shell syntax
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* OS Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1 font-medium">
            Distribution
          </label>
          <div className="flex flex-wrap gap-1.5">
            {OS_OPTIONS.map((item) => {
              const isSelected = os === item;
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => onOSChange(item)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono transition-all ${
                    isSelected
                      ? "bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 font-semibold shadow-xs"
                      : "bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 border border-slate-200/80 dark:border-transparent"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shell Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1 font-medium">
            <Terminal className="w-3 h-3 text-slate-400 dark:text-zinc-400" /> Shell
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SHELL_OPTIONS.map((item) => {
              const isSelected = shell === item;
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => onShellChange(item)}
                  className={`px-2.5 py-1 text-xs rounded-md font-mono transition-all ${
                    isSelected
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-semibold shadow-xs"
                      : "bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 border border-slate-200/80 dark:border-transparent"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
