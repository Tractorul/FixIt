"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CliCopilotInput } from "@/components/CliCopilotInput";
import { CliCopilotResult } from "@/components/CliCopilotResult";
import { StatusModal } from "@/components/StatusModal";
import { CliCopilotRequest, CliCopilotResponse, AIStatusResponse, SupportedOS, SupportedShell } from "@/types";
import { AlertCircle, X, Bot, Terminal } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[#070a12] text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200">
      <Header
        status={status}
        onOpenSettings={() => setIsStatusOpen(true)}
        onNewAnalysis={handleReset}
        activePage="cli"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Banner */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-1">
            <Bot className="w-3.5 h-3.5" />
            <span>CLI Copilot • Natural Language to Shell</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Describe What You Want to Do
          </h1>
          <p className="text-sm text-zinc-400">
            Type your intent in plain English and FixIt generates the exact, tested shell command with safety ratings and flag breakdowns.
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
      </main>

      <footer className="w-full border-t border-white/5 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>FixIt • CLI Copilot</span>
          </div>
          <div className="text-zinc-500 text-[11px]">
            Safety First • Commands are for manual review only
          </div>
        </div>
      </footer>

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </div>
  );
}
