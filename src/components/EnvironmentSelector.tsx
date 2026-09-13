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
    <div className="rounded-xl bg-zinc-950/60 border border-white/10 p-3.5 space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
        <span className="flex items-center gap-1.5 text-zinc-300">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          Target Environment <span className="text-zinc-500 font-normal">(Optional)</span>
        </span>
        <span className="text-[11px] text-zinc-500">
          Tailors package commands (apt, dnf, pacman) & shell syntax
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* OS Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1">
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
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold"
                      : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-transparent"
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
          <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1">
            <Terminal className="w-3 h-3 text-zinc-400" /> Shell
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
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                      : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-transparent"
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
