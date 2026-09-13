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
        <label className="text-xs uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
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
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-rose-500/15 border-rose-500/40 text-white shadow-sm ring-1 ring-rose-500/30"
                    : "bg-black/40 hover:bg-white/5 border-white/5 text-zinc-300 hover:text-white"
                }`}
              >
                <div className="flex items-start gap-2">
                  <GitBranch className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? "text-rose-400" : "text-zinc-500"}`} />
                  <div>
                    <div className="text-xs font-semibold leading-tight">{sc.title}</div>
                    <div className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{sc.summary}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-zinc-400">
          Or describe what went wrong in your own words:
        </label>
        <textarea
          value={customDescription}
          onChange={(e) => onChangeCustomDescription(e.target.value)}
          placeholder="e.g. I committed to main instead of feature branch and haven't pushed yet..."
          rows={3}
          className="w-full bg-[#05080f] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 resize-y"
          disabled={isLoading}
        />
      </div>

      {/* Optional Git Status input */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowStatusInput(!showStatusInput)}
          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono transition-colors"
        >
          <span>{showStatusInput ? "− Hide git status output" : "+ Paste 'git status' output (optional for precise diagnosis)"}</span>
        </button>

        {showStatusInput && (
          <textarea
            value={gitStatusOutput}
            onChange={(e) => onChangeGitStatusOutput(e.target.value)}
            placeholder="Paste output from running 'git status' or 'git log -n 3'..."
            rows={4}
            className="w-full bg-[#05080f] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 resize-y"
            disabled={isLoading}
          />
        )}
      </div>

      {/* Main Action Button */}
      <button
        type="button"
        onClick={onRescue}
        disabled={isLoading || (!scenario && !customDescription.trim() && !gitStatusOutput.trim())}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-lg ${
          isLoading || (!scenario && !customDescription.trim() && !gitStatusOutput.trim())
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
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
