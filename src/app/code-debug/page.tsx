"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { AppShell } from "@/components/AppShell";
import { CodeInput } from "@/components/CodeInput";
import { CodeResult } from "@/components/CodeResult";
import { CodeDebugHistoryPanel } from "@/components/CodeDebugHistoryPanel";
import { StatusModal } from "@/components/StatusModal";
import {
  CodeDebugRequest,
  CodeDebugResponse,
  SupportedLanguage,
  AIStatusResponse,
  CodeDebugHistoryItem,
} from "@/types";
import {
  saveCodeDebugHistoryItem,
  removeCodeDebugHistoryItem,
  clearAllCodeDebugHistory,
  subscribeCodeDebugHistory,
  getCodeDebugSnapshot,
  getCodeDebugServerSnapshot,
} from "@/lib/storage";
import { AlertCircle, X, Sparkles, Code2 } from "lucide-react";

export default function CodeDebugPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("Python");
  const [additionalContext, setAdditionalContext] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeDebugResponse | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();

  const [status, setStatus] = useState<AIStatusResponse | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyItems = useSyncExternalStore(
    subscribeCodeDebugHistory,
    getCodeDebugSnapshot,
    getCodeDebugServerSnapshot
  );

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsStatusOpen(false);
        setIsHistoryOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAnalyzeCode = async () => {
    if (!code.trim()) {
      setApiError("Please paste a code snippet before analyzing.");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    const payload: CodeDebugRequest = {
      code: code.trim(),
      language,
      additionalContext: additionalContext.trim() || undefined,
    };

    try {
      const res = await fetch("/api/debug-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      setResult(data);

      // Save to Code Doctor history
      const updated = saveCodeDebugHistoryItem(code.trim(), data, language);
      setSelectedHistoryId(updated[0]?.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to communicate with code analysis server.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: CodeDebugHistoryItem) => {
    setCode(item.rawCode);
    setLanguage(item.language as SupportedLanguage);
    setResult(item.result);
    setSelectedHistoryId(item.id);
    setApiError(null);
  };

  const handleNewAnalysis = () => {
    setCode("");
    setResult(null);
    setAdditionalContext("");
    setApiError(null);
    setSelectedHistoryId(undefined);
  };

  return (
    <AppShell
      activePage="code"
      status={status}
      historyCount={historyItems.length}
      onOpenSettings={() => setIsStatusOpen(true)}
      onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
      onNewAnalysis={handleNewAnalysis}
      isHistoryOpen={isHistoryOpen}
    >
      {/* Hero Title Banner */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-mono mb-1 font-semibold">
          <Code2 className="w-3.5 h-3.5" />
          <span>Code Doctor &amp; Snippet Debugger</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          Detect &amp; Fix Code Snippet Bugs
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Select your language, paste your code snippet, and FixIt pinpoints the syntax error, type mismatch, or logic flaw and writes the corrected replacement code.
        </p>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 flex items-start justify-between gap-3 text-sm text-rose-900 dark:text-rose-200 shadow-md animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-rose-950 dark:text-rose-300">Code Analysis Error</span>
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

      {/* Code Input Card */}
      <section className="glass-panel p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
        <CodeInput
          code={code}
          onChangeCode={setCode}
          language={language}
          onChangeLanguage={setLanguage}
          additionalContext={additionalContext}
          onChangeAdditionalContext={setAdditionalContext}
          onAnalyze={handleAnalyzeCode}
          isLoading={isLoading}
          onClear={() => {
            setCode("");
            setAdditionalContext("");
          }}
        />
      </section>

      {/* Code Result */}
      {result && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Bug Diagnosis &amp; Corrected Code
            </h2>
          </div>
          <CodeResult result={result} originalCode={code} />
        </section>
      )}

      {/* Code Doctor History Sidebar */}
      <CodeDebugHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelect={handleSelectHistory}
        onDelete={removeCodeDebugHistoryItem}
        onClearAll={clearAllCodeDebugHistory}
        selectedId={selectedHistoryId}
      />

      {/* AI Status Modal */}
      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        status={status}
      />
    </AppShell>
  );
}
