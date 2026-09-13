"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorInput } from "@/components/ErrorInput";
import { AnalysisResult } from "@/components/AnalysisResult";
import { HistoryPanel } from "@/components/HistoryPanel";
import { StatusModal } from "@/components/StatusModal";
import {
  AnalyzeRequest,
  FixItResponse,
  HistoryItem,
  AIStatusResponse,
  SupportedOS,
  SupportedShell,
} from "@/types";
import {
  saveHistoryItem,
  removeHistoryItem,
  clearAllHistory,
  subscribeHistory,
  getHistorySnapshot,
  getHistoryServerSnapshot,
} from "@/lib/storage";
import { AlertCircle, X, Sparkles, Code2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [errorText, setErrorText] = useState("");
  const [os, setOS] = useState<SupportedOS>("Unspecified");
  const [shell, setShell] = useState<SupportedShell>("Unspecified");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<FixItResponse | null>(null);

  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyItems = useSyncExternalStore(
    subscribeHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();

  // Fetch AI backend status on mount & setup global shortcuts
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data: AIStatusResponse = await res.json();
          setStatus(data);
        }
      } catch {
        // ignore status failure
      }
    }
    fetchStatus();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsStatusOpen(false);
        setIsHistoryOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleAnalyze = async () => {
    if (!errorText.trim()) {
      setApiError("Please paste an error message or stack trace before analyzing.");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    const payload: AnalyzeRequest = {
      errorText: errorText.trim(),
      os,
      shell,
    };

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with error status ${res.status}`);
      }

      const analyzedResponse: FixItResponse = data;
      setResult(analyzedResponse);

      // Save to localStorage history
      const updatedHistory = saveHistoryItem(errorText, analyzedResponse, os, shell);
      setSelectedHistoryId(updatedHistory[0]?.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to communicate with analysis server.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setErrorText(item.rawError);
    if (item.os) setOS(item.os);
    if (item.shell) setShell(item.shell);
    setResult(item.result);
    setSelectedHistoryId(item.id);
    setApiError(null);
  };

  const handleDeleteHistory = (id: string) => {
    removeHistoryItem(id);
    if (selectedHistoryId === id) {
      setSelectedHistoryId(undefined);
    }
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setSelectedHistoryId(undefined);
  };

  const handleNewAnalysis = () => {
    setErrorText("");
    setResult(null);
    setSelectedHistoryId(undefined);
    setApiError(null);
  };

  return (
    <AppShell
      activePage="error"
      status={status}
      historyCount={historyItems.length}
      onOpenSettings={() => setIsStatusOpen(true)}
      onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
      onNewAnalysis={handleNewAnalysis}
      isHistoryOpen={isHistoryOpen}
    >
      {/* Hero title banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2">
          <Link
            href="/code-debug"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300 text-xs font-mono transition-all group shadow-2xs"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Need to debug a code snippet instead? Try Code Doctor</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          Diagnose Linux &amp; Code Errors Safely
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Paste any terminal traceback, compiler error, or package manager failure. FixIt pinpoints what happened, why, and offers vetted, non-destructive commands.
        </p>
      </div>

      {/* API Error Alert Banner */}
      {apiError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 flex items-start justify-between gap-3 text-sm text-rose-900 dark:text-rose-200 shadow-md animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-rose-950 dark:text-rose-300">Analysis Error</span>
              <p className="text-xs text-rose-800 dark:text-rose-200/90 leading-relaxed">{apiError}</p>
            </div>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="p-1 text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20 cursor-pointer"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Section: Error Input */}
      <section className="glass-panel p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <ErrorInput
          errorText={errorText}
          onChangeErrorText={setErrorText}
          os={os}
          shell={shell}
          onChangeOS={setOS}
          onChangeShell={setShell}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          onClear={() => setErrorText("")}
        />
      </section>

      {/* Results Section */}
      {result && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Diagnostic &amp; Resolution Plan
              </h2>
            </div>
          </div>

          <AnalysisResult result={result} />
        </section>
      )}

      {/* History Sidebar */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        onClearAll={handleClearAllHistory}
        selectedId={selectedHistoryId}
      />

      {/* Configuration / AI Status Modal */}
      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        status={status}
      />
    </AppShell>
  );
}
