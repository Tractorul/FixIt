"use client";

import React, { useState } from "react";
import { GitBranch, Sparkles, Loader2, CornerDownLeft, ShieldAlert } from "lucide-react";
import { GIT_SCENARIOS } from "@/lib/ai/gitHeuristics";

interface GitWizardInputProps {
  scenario: string;
  onChangeScenario: (scenario: string) => void;
  customDescription: string;
  onChangeCustomDescription: (desc: string) => void;
  gitStatusOutput: string;
  onChangeGitStatusOutput: (status: string) => void;
  onRescue: () => void;
  isLoading: boolean;
  onClear: () => void;
}

export function GitWizardInput({
  scenario,
  onChangeScenario,
  customDescription,
  onChangeCustomDescription,
  gitStatusOutput,
  onChangeGitStatusOutput,
  onRescue,
  isLoading,
}: GitWizardInputProps) {
  const [showStatusInput, setShowStatusInput] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isLoading && (scenario || customDescription.trim() || gitStatusOutput.trim())) {
        onRescue();
      }
    }
  };

  return (
    <div className="space-y-5" onKeyDown={handleKeyDown}>
      {/* Visual Scenario Selector */}
      <div className="space-y-2.5">
        <label className="text-xs uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-mono flex items-center gap-1.5 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          Select Your Git Emergency / Scenario
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {GIT_SCENARIOS.map((sc) => {
            const isSelected = scenario === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  onChangeScenario(sc.id);
                  onChangeCustomDescription(sc.summary);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-rose-50 border-rose-300 text-rose-950 shadow-xs ring-1 ring-rose-400/40 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-white dark:ring-rose-500/30"
                    : "bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-black/40 dark:hover:bg-white/5 dark:border-white/5 dark:text-zinc-300 dark:hover:text-white"
                }`}
              >
                <div className="flex items-start gap-2">
                  <GitBranch className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-zinc-500"}`} />
                  <div>
                    <div className="text-xs font-semibold leading-tight">{sc.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1">{sc.summary}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-slate-600 dark:text-zinc-400 font-medium">
          Or describe what went wrong in your own words:
        </label>
        <textarea
          value={customDescription}
          onChange={(e) => onChangeCustomDescription(e.target.value)}
          placeholder="e.g. I committed to main instead of feature branch and haven't pushed yet..."
          rows={3}
          className="w-full bg-slate-50 dark:bg-[#05080f] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 resize-y"
          disabled={isLoading}
        />
      </div>

      {/* Optional Git Status input */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowStatusInput(!showStatusInput)}
          className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 font-mono transition-colors font-medium cursor-pointer"
        >
          <span>{showStatusInput ? "− Hide git status output" : "+ Paste 'git status' output (optional for precise diagnosis)"}</span>
        </button>

        {showStatusInput && (
          <textarea
            value={gitStatusOutput}
            onChange={(e) => onChangeGitStatusOutput(e.target.value)}
            placeholder="Paste output from running 'git status' or 'git log -n 3'..."
            rows={4}
            className="w-full bg-slate-50 dark:bg-[#05080f] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-rose-500 resize-y"
            disabled={isLoading}
          />
        )}
      </div>

      {/* Main Action Button */}
      <button
        type="button"
        onClick={onRescue}
        disabled={isLoading || (!scenario && !customDescription.trim() && !gitStatusOutput.trim())}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-lg cursor-pointer ${
          isLoading || (!scenario && !customDescription.trim() && !gitStatusOutput.trim())
            ? "bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed border border-transparent dark:border-white/5"
            : "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border border-rose-500/30 hover:shadow-rose-500/20"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Calculating Safe Git Recovery Steps...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-rose-200" />
            <span>Generate Git Recovery Plan</span>
            <CornerDownLeft className="w-4 h-4 opacity-70 ml-1 hidden sm:inline" />
          </>
        )}
      </button>
    </div>
  );
}
