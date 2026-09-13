"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { GitWizardInput } from "@/components/GitWizardInput";
import { GitWizardResult } from "@/components/GitWizardResult";
import { StatusModal } from "@/components/StatusModal";
import { GitWizardRequest, GitWizardResponse, AIStatusResponse } from "@/types";
import { AlertCircle, X, GitBranch } from "lucide-react";

export default function GitWizardPage() {
  const [scenario, setScenario] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [gitStatusOutput, setGitStatusOutput] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<GitWizardResponse | null>(null);

  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data: AIStatusResponse = await res.json();
          setStatus(data);
        }
      } catch {
        // ignore
      }
    }
    fetchStatus();
  }, []);

  const handleRescue = async () => {
    setIsLoading(true);
    setApiError(null);

    const payload: GitWizardRequest = {
      scenario: scenario || undefined,
      customDescription: customDescription.trim() || undefined,
      gitStatusOutput: gitStatusOutput.trim() || undefined,
    };

    try {
      const res = await fetch("/api/git-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate Git recovery plan");

      setResult(data);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to communicate with server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setScenario("");
    setCustomDescription("");
    setGitStatusOutput("");
    setResult(null);
    setApiError(null);
  };

  return (
    <AppShell
      activePage="git"
      status={status}
      onOpenSettings={() => setIsStatusOpen(true)}
      onNewAnalysis={handleReset}
    >
      {/* Title Banner */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-mono mb-1 font-semibold">
          <GitBranch className="w-3.5 h-3.5" />
          <span>Git Disaster Recovery Wizard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          Rescue Your Repository &amp; Lost Commits
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Committed secrets, lost branches, detached HEAD, or merge conflict hell? Get safe step-by-step rescue commands with reflog safety nets.
        </p>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 flex items-start justify-between gap-3 text-sm text-rose-900 dark:text-rose-200 shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800 dark:text-rose-200/90 leading-relaxed">{apiError}</p>
          </div>
          <button onClick={() => setApiError(null)} className="p-1 text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Card */}
      <section className="glass-panel p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <GitWizardInput
          scenario={scenario}
          onChangeScenario={setScenario}
          customDescription={customDescription}
          onChangeCustomDescription={setCustomDescription}
          gitStatusOutput={gitStatusOutput}
          onChangeGitStatusOutput={setGitStatusOutput}
          onRescue={handleRescue}
          isLoading={isLoading}
          onClear={handleReset}
        />
      </section>

      {/* Result Card */}
      {result && (
        <section className="space-y-4 pt-2">
          <GitWizardResult result={result} />
        </section>
      )}

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </AppShell>
  );
}
