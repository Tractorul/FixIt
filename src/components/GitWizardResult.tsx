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
      <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-zinc-900/60 to-zinc-950/80 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Git Recovery Plan
            </div>
            <div className="text-sm font-semibold text-zinc-100 font-mono">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300 transition-colors"
            title="Open Gemini AI copilot with this Git context"
          >
            <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
            <span>Ask Gemini</span>
          </button>

          <button
            onClick={copyAllScript}
            type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            copiedAll
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
          }`}
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied All!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-rose-400" />
              <span>Copy All Steps</span>
            </>
          )}
        </button>
      </div>
    </div>

      {/* Summary and Why it Works */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase font-mono">
            <Info className="w-3.5 h-3.5" />
            <span>Recovery Strategy</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{result.summary}</p>
        </div>

        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Why This Is Safe</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{result.whyThisWorks}</p>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        <div className="text-xs font-mono font-semibold text-zinc-300 px-1">
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
                  ? "bg-rose-950/20 border-rose-500/40"
                  : "bg-zinc-950/80 border-white/10 hover:border-white/20"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[11px] font-mono font-bold text-zinc-300">
                    {step.stepNumber}
                  </span>
                  <span className="text-xs font-medium text-zinc-200">{step.title}</span>
                </div>

                <button
                  onClick={() => copyStepCommand(step.command, idx)}
                  type="button"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                    isCopied
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dangerous warning if any */}
              {isDangerous && step.dangerReason && (
                <div className="mx-4 mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-rose-300">Caution: </span>
                    {step.dangerReason}
                  </div>
                </div>
              )}

              {/* Command block */}
              <div className="p-4 space-y-2">
                <div className="flex items-start gap-2 bg-[#05080f] p-3 rounded-lg border border-white/10 font-mono text-xs text-rose-200 overflow-x-auto select-all">
                  <span className="text-zinc-500 select-none">$</span>
                  <code className="whitespace-pre-wrap break-all flex-1 leading-relaxed">
                    {step.command}
                  </code>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed px-1">
                  {step.explanation}
                </p>

                {step.verificationCommand && (
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 px-1">
                    <Terminal className="w-3 h-3 text-sky-400" />
                    <span>Verify with: </span>
                    <code className="text-sky-300 bg-white/5 px-1.5 py-0.5 rounded">
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
        <div className="rounded-xl bg-[#0c1220]/90 border border-amber-500/20 p-4 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase font-mono">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Emergency Fallback & Safety Net</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-mono">
            {result.emergencyFallback}
          </p>
        </div>
      )}
    </div>
  );
}
