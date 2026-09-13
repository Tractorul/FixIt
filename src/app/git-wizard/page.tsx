"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { GitWizardInput } from "@/components/GitWizardInput";
import { GitWizardResult } from "@/components/GitWizardResult";
import { StatusModal } from "@/components/StatusModal";
import { GitWizardRequest, GitWizardResponse, AIStatusResponse } from "@/types";
import { AlertCircle, X, GitBranch, Terminal } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[#070a12] text-zinc-100 selection:bg-rose-500/30 selection:text-rose-200">
      <Header
        status={status}
        onOpenSettings={() => setIsStatusOpen(true)}
        onNewAnalysis={handleReset}
        activePage="git"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Banner */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono mb-1">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Git Disaster Recovery Wizard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Rescue Your Repository &amp; Lost Commits
          </h1>
          <p className="text-sm text-zinc-400">
            Committed secrets, lost branches, detached HEAD, or merge conflict hell? Get safe step-by-step rescue commands with reflog safety nets.
          </p>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start justify-between gap-3 text-sm text-rose-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-200/90 leading-relaxed">{apiError}</p>
            </div>
            <button onClick={() => setApiError(null)} className="p-1 text-rose-400 hover:text-rose-200">
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
      </main>

      <footer className="w-full border-t border-white/5 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
            <span>FixIt • Git Wizard Recovery</span>
          </div>
          <div className="text-zinc-500 text-[11px]">
            Safety First • Always test commands with reflog backup
          </div>
        </div>
      </footer>

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </div>
  );
}
