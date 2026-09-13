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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safe (Read-only)
          </span>
        );
      case "caution":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Caution (Modifies State)
          </span>
        );
      case "destructive":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Destructive (File Removal)
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner with Safety Badge */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-900/60 to-zinc-950/80 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Generated Solution
            </div>
            <div className="text-sm font-semibold text-zinc-100 font-mono">
              Recommended Command
            </div>
          </div>
        </div>

        <div>{getSafetyBadge()}</div>
      </div>

      {/* Primary Command Card */}
      <div className="rounded-xl bg-[#0c1220]/90 border border-amber-500/30 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-semibold">
            <span>$ Primary One-Liner</span>
          </div>

          <button
            onClick={() => copyCommand(result.primaryCommand)}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-all ${
              copiedPrimary
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30"
            }`}
          >
            {copiedPrimary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-[#05080f]">
          <pre className="font-mono text-sm text-amber-200 overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
            <code>{result.primaryCommand}</code>
          </pre>
        </div>

        {/* Explanation & Safety note */}
        <div className="p-4 border-t border-white/5 space-y-2 text-xs">
          <p className="text-zinc-300 leading-relaxed">{result.explanation}</p>
          {result.safetyNotes && (
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-amber-300/90 font-mono text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{result.safetyNotes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Command Breakdown Card */}
      {result.breakdown && result.breakdown.length > 0 && (
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span>Flag-by-Flag Command Breakdown</span>
          </div>

          <div className="space-y-2">
            {result.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono"
              >
                <code className="text-amber-300 font-semibold shrink-0 bg-white/5 px-2 py-0.5 rounded">
                  {item.part}
                </code>
                <span className="text-zinc-300 font-sans text-xs text-right sm:text-left">
                  {item.meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Commands */}
      {result.alternativeCommands && result.alternativeCommands.length > 0 && (
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Alternative Commands / Equivalent Tools</span>
          </div>

          <div className="space-y-2">
            {result.alternativeCommands.map((altCmd, idx) => {
              const isCopied = copiedAltIdx === idx;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#05080f] border border-white/5"
                >
                  <code className="text-xs font-mono text-zinc-300 overflow-x-auto select-all">
                    {altCmd}
                  </code>
                  <button
                    onClick={() => copyCommand(altCmd, true, idx)}
                    type="button"
                    className={`shrink-0 p-1.5 rounded text-xs transition-colors ${
                      isCopied
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
