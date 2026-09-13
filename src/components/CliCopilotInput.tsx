"use client";

import React from "react";
import { Bot, Sparkles, Loader2, CornerDownLeft } from "lucide-react";
import { SupportedOS, SupportedShell } from "@/types";
import { EnvironmentSelector } from "./EnvironmentSelector";

interface CliCopilotInputProps {
  query: string;
  onChangeQuery: (query: string) => void;
  os: SupportedOS;
  shell: SupportedShell;
  onChangeOS: (os: SupportedOS) => void;
  onChangeShell: (shell: SupportedShell) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onClear: () => void;
}

const SAMPLE_QUERIES = [
  "Kill whatever process is locking port 8080",
  "Find all files bigger than 500MB in /var",
  "Delete log files older than 30 days in /var/log",
  "Find top 10 IP addresses in nginx access.log",
  "Check SSL certificate expiration date for google.com",
  "Show top 10 processes using highest RAM memory",
  "Compress my directory into tar.gz with progress",
];

export function CliCopilotInput({
  query,
  onChangeQuery,
  os,
  shell,
  onChangeOS,
  onChangeShell,
  onGenerate,
  isLoading,
}: CliCopilotInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading && query.trim()) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Sample Quick Prompts */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Examples
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Click to load realistic admin command queries
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => onChangeQuery(sample)}
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 hover:border-white/15 transition-all text-left font-mono"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Main Command Prompt Input */}
      <div className="space-y-1.5">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type in plain English what you want to do... (e.g. Find all files modified today, kill port 5432)"
            className="w-full bg-[#05080f] border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3.5 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* OS & Shell Environment Selector */}
      <EnvironmentSelector
        os={os}
        shell={shell}
        onOSChange={onChangeOS}
        onShellChange={onChangeShell}
      />

      {/* Action Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isLoading || !query.trim()}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-lg ${
          isLoading || !query.trim()
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
            : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border border-amber-400/30 hover:shadow-amber-500/20"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating Shell Command &amp; Safety Checks...</span>
          </>
        ) : (
          <>
            <Bot className="w-4 h-4 text-amber-200" />
            <span>Generate Shell Command</span>
            <CornerDownLeft className="w-4 h-4 opacity-70 ml-1 hidden sm:inline" />
          </>
        )}
      </button>
    </div>
  );
}
