"use client";

import React, { useState } from "react";
import {
  Bot,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Layers,
  HelpCircle,
} from "lucide-react";
import { CliCopilotResponse } from "@/types";
import { useToast } from "@/components/Toast";

interface CliCopilotResultProps {
  result: CliCopilotResponse;
}

export function CliCopilotResult({ result }: CliCopilotResultProps) {
  const { showToast } = useToast();
  const [copiedPrimary, setCopiedPrimary] = useState(false);
  const [copiedAltIdx, setCopiedAltIdx] = useState<number | null>(null);

  const copyCommand = async (cmd: string, isAlt = false, altIdx = 0) => {
    try {
      await navigator.clipboard.writeText(cmd);
      if (isAlt) {
        setCopiedAltIdx(altIdx);
        setTimeout(() => setCopiedAltIdx(null), 2000);
      } else {
        setCopiedPrimary(true);
        setTimeout(() => setCopiedPrimary(false), 2000);
      }
      showToast("Command copied to clipboard!");
    } catch {
      // ignore
    }
  };

  const getSafetyBadge = () => {
    switch (result.safetyLevel) {
      case "safe":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Safe (Read-only)
          </span>
        );
      case "caution":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Caution (Modifies State)
          </span>
        );
      case "destructive":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Destructive (File Removal)
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner with Safety Badge */}
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 dark:bg-gradient-to-r dark:from-amber-950/40 dark:via-zinc-900/60 dark:to-zinc-950/80 dark:border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-amber-800 dark:text-zinc-400 font-mono font-semibold">
              Generated Solution
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 font-mono">
              Recommended Command
            </div>
          </div>
        </div>

        <div>{getSafetyBadge()}</div>
      </div>

      {/* Primary Command Card */}
      <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-amber-300 dark:border-amber-500/30 shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/10 bg-amber-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-800 dark:text-amber-300 font-semibold">
            <span>$ Primary One-Liner</span>
          </div>

          <button
            onClick={() => copyCommand(result.primaryCommand)}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
              copiedPrimary
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/30"
            }`}
          >
            {copiedPrimary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-slate-900 dark:bg-[#05080f] shadow-inner">
          <pre className="font-mono text-sm text-amber-200 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
            <code>{result.primaryCommand}</code>
          </pre>
        </div>

        {/* Explanation & Safety note */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2 text-xs">
          <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">{result.explanation}</p>
          {result.safetyNotes && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-black/40 border border-amber-200 dark:border-white/5 text-amber-900 dark:text-amber-300/90 font-mono text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{result.safetyNotes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Command Breakdown Card */}
      {result.breakdown && result.breakdown.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-slate-200 dark:border-white/10 p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-xs uppercase font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>Flag-by-Flag Command Breakdown</span>
          </div>

          <div className="space-y-2">
            {result.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-2.5 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 text-xs font-mono"
              >
                <code className="text-amber-700 dark:text-amber-300 font-semibold shrink-0 bg-amber-50 dark:bg-white/5 border border-amber-200 dark:border-transparent px-2 py-0.5 rounded">
                  {item.part}
                </code>
                <span className="text-slate-700 dark:text-zinc-300 font-sans text-xs text-right sm:text-left">
                  {item.meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Commands */}
      {result.alternativeCommands && result.alternativeCommands.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-slate-200 dark:border-white/10 p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Alternative Commands / Equivalent Tools</span>
          </div>

          <div className="space-y-2">
            {result.alternativeCommands.map((altCmd, idx) => {
              const isCopied = copiedAltIdx === idx;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#05080f] border border-slate-200 dark:border-white/5"
                >
                  <code className="text-xs font-mono text-slate-800 dark:text-zinc-300 overflow-x-auto select-all">
                    {altCmd}
                  </code>
                  <button
                    onClick={() => copyCommand(altCmd, true, idx)}
                    type="button"
                    className={`shrink-0 p-1.5 rounded text-xs transition-colors cursor-pointer ${
                      isCopied
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-white dark:bg-white/5 dark:hover:bg-white/10"
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
