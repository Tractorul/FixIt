"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { CliCopilotInput } from "@/components/CliCopilotInput";
import { CliCopilotResult } from "@/components/CliCopilotResult";
import { StatusModal } from "@/components/StatusModal";
import { CliCopilotRequest, CliCopilotResponse, AIStatusResponse, SupportedOS, SupportedShell } from "@/types";
import { AlertCircle, X, Bot } from "lucide-react";

export default function CliCopilotPage() {
  const [query, setQuery] = useState("");
  const [os, setOS] = useState<SupportedOS>("Ubuntu");
  const [shell, setShell] = useState<SupportedShell>("Bash");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<CliCopilotResponse | null>(null);

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

  const handleGenerate = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setApiError(null);

    const payload: CliCopilotRequest = {
      query: query.trim(),
      os,
      shell,
    };

    try {
      const res = await fetch("/api/cli-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate command");

      setResult(data);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to communicate with server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setResult(null);
    setApiError(null);
  };

  return (
    <AppShell
      activePage="cli"
      status={status}
      onOpenSettings={() => setIsStatusOpen(true)}
      onNewAnalysis={handleReset}
    >
      {/* Title Banner */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-mono mb-1 font-semibold">
          <Bot className="w-3.5 h-3.5" />
          <span>CLI Copilot • Natural Language to Shell</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          Describe What You Want to Do
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Type your intent in plain English and FixIt generates the exact, tested shell command with safety ratings and flag breakdowns.
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
        <CliCopilotInput
          query={query}
          onChangeQuery={setQuery}
          os={os}
          shell={shell}
          onChangeOS={setOS}
          onChangeShell={setShell}
          onGenerate={handleGenerate}
          isLoading={isLoading}
          onClear={handleReset}
        />
      </section>

      {/* Result Card */}
      {result && (
        <section className="space-y-4 pt-2">
          <CliCopilotResult result={result} />
        </section>
      )}

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </AppShell>
  );
}
