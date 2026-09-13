"use client";

import React, { useState } from "react";
import {
  GitBranch,
  Check,
  Copy,
  AlertTriangle,
  ShieldCheck,
  LifeBuoy,
  Info,
  Terminal,
  MessageSquare,
} from "lucide-react";
import { GitWizardResponse } from "@/types";
import { useToast } from "@/components/Toast";
import { useChat } from "@/context/ChatContext";

interface GitWizardResultProps {
  result: GitWizardResponse;
}

export function GitWizardResult({ result }: GitWizardResultProps) {
  const { showToast } = useToast();
  const { openWithContext } = useChat();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyStepCommand = async (command: string, stepIdx: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedStep(stepIdx);
      showToast("Git command copied!");
      setTimeout(() => setCopiedStep(null), 2000);
    } catch {
      // ignore
    }
  };

  const copyAllScript = async () => {
    const script = result.steps
      .map((s) => `# Step ${s.stepNumber}: ${s.title}\n${s.command}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(script);
      setCopiedAll(true);
      showToast("All recovery steps copied!");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-rose-50/90 border border-rose-200 dark:bg-gradient-to-r dark:from-rose-950/40 dark:via-zinc-900/60 dark:to-zinc-950/80 dark:border-rose-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-rose-700 dark:text-zinc-400 font-mono font-semibold">
              Git Recovery Plan
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 font-mono">
              {result.scenarioTitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const context = `Git Scenario: ${result.scenarioTitle}\nSummary: ${result.summary}\nWhy it works: ${result.whyThisWorks}\nSteps:\n${result.steps.map((s) => `${s.stepNumber}. ${s.command} (${s.title})`).join("\n")}`;
              openWithContext(context, "Can you guide me through executing these Git recovery steps safely?");
            }}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-800 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:border-rose-500/40 dark:text-rose-300 transition-colors cursor-pointer"
            title="Open Gemini AI copilot with this Git context"
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Ask Gemini</span>
          </button>

          <button
            onClick={copyAllScript}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              copiedAll
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 font-semibold"
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-zinc-300 dark:hover:text-white"
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Copy All Steps</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary and Why it Works */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-slate-200 dark:border-white/10 p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase font-mono">
            <Info className="w-3.5 h-3.5" />
            <span>Recovery Strategy</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed">{result.summary}</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-slate-200 dark:border-white/10 p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-xs uppercase font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Why This Is Safe</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">{result.whyThisWorks}</p>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        <div className="text-xs font-mono font-semibold text-slate-800 dark:text-zinc-300 px-1">
          Execute in sequential order:
        </div>

        {result.steps.map((step, idx) => {
          const isDangerous = Boolean(step.isDangerous);
          const isCopied = copiedStep === idx;
          return (
            <div
              key={step.stepNumber}
              className={`rounded-xl border transition-all ${
                isDangerous
                  ? "bg-rose-50/80 border-rose-300 dark:bg-rose-950/20 dark:border-rose-500/40 shadow-xs"
                  : "bg-white dark:bg-zinc-950/80 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-300">
                    {step.stepNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200">{step.title}</span>
                </div>

                <button
                  onClick={() => copyStepCommand(step.command, idx)}
                  type="button"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    isCopied
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-semibold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-white/10"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dangerous warning if any */}
              {isDangerous && step.dangerReason && (
                <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-100/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 flex items-start gap-2 text-xs text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-rose-950 dark:text-rose-300">Caution: </span>
                    {step.dangerReason}
                  </div>
                </div>
              )}

              {/* Command block */}
              <div className="p-4 space-y-2">
                <div className="flex items-start gap-2 bg-slate-900 dark:bg-[#05080f] p-3 rounded-lg border border-slate-800 dark:border-white/10 font-mono text-xs text-rose-200 overflow-x-auto select-all shadow-inner">
                  <span className="text-slate-500 select-none">$</span>
                  <code className="whitespace-pre-wrap break-all flex-1 leading-relaxed">
                    {step.command}
                  </code>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed px-1">
                  {step.explanation}
                </p>

                {step.verificationCommand && (
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-zinc-500 px-1">
                    <Terminal className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    <span>Verify with: </span>
                    <code className="text-sky-700 bg-sky-50 dark:bg-white/5 dark:text-sky-300 px-1.5 py-0.5 rounded border border-sky-200 dark:border-transparent">
                      {step.verificationCommand}
                    </code>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency Fallback */}
      {result.emergencyFallback && (
        <div className="rounded-xl bg-amber-50 dark:bg-[#0c1220]/90 border border-amber-300 dark:border-amber-500/20 p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs uppercase font-mono">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Emergency Fallback & Safety Net</span>
          </div>
          <p className="text-xs text-amber-900 dark:text-zinc-300 leading-relaxed font-mono">
            {result.emergencyFallback}
          </p>
        </div>
      )}
    </div>
  );
}
