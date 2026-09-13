"use client";

import React, { useState } from "react";
import { Copy, Check, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { FixItCommand } from "@/types";
import { useToast } from "@/components/Toast";

interface CommandCardProps {
  commandItem: FixItCommand;
  index: number;
}

export function CommandCard({ commandItem, index }: CommandCardProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commandItem.command);
      setCopied(true);
      showToast("Command copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const isDangerous = Boolean(commandItem.isDangerous);

  return (
    <div
      className={`rounded-xl border transition-all ${
        isDangerous
          ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40 glow-danger"
          : "bg-white dark:bg-zinc-950/80 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs dark:shadow-none"
      }`}
    >
      {/* Header bar of command */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-200 dark:bg-white/10 text-[11px] font-mono text-slate-700 dark:text-zinc-300 font-semibold">
            {index + 1}
          </span>

          {isDangerous ? (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Potentially Destructive
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Safe Diagnostic / Standard Fix
            </span>
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
            copied
              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40"
              : "bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/10"
          }`}
          title="Copy command to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Dangerous warning notification if applicable */}
      {isDangerous && commandItem.dangerReason && (
        <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-100/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 flex items-start gap-2 text-xs text-rose-900 dark:text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-950 dark:text-rose-300">Caution: </span>
            {commandItem.dangerReason}
          </div>
        </div>
      )}

      {/* Code command block */}
      <div className="p-4">
        <div className="relative group">
          <div className="flex items-start gap-2 bg-slate-900 dark:bg-[#05080f] p-3.5 rounded-lg border border-slate-800 dark:border-white/10 font-mono text-sm text-sky-300 dark:text-sky-200 overflow-x-auto select-all shadow-inner">
            <span className="text-slate-500 dark:text-zinc-500 select-none">$</span>
            <code className="whitespace-pre-wrap break-all flex-1 font-mono text-[13px] leading-relaxed text-sky-200">
              {commandItem.command}
            </code>
          </div>
        </div>

        {/* Explanation */}
        {commandItem.explanation && (
          <div className="mt-2.5 flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-400 px-1">
            <Info className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{commandItem.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
