"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Server,
  Sparkles,
  ExternalLink,
  Loader2,
  Activity,
} from "lucide-react";
import { AIStatusResponse } from "@/types";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: AIStatusResponse | null;
}

export function StatusModal({ isOpen, onClose, status }: StatusModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    latencyMs: number;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const copySnippet = (snippet: string, key: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setPingResult(null);
    try {
      const res = await fetch("/api/status?ping=true");
      const data: AIStatusResponse = await res.json();
      if (data.ping) {
        setPingResult(data.ping);
      } else {
        setPingResult({
          success: data.configured,
          latencyMs: 0,
          error: data.configured ? undefined : "Offline heuristics active",
        });
      }
    } catch (err) {
      setPingResult({
        success: false,
        latencyMs: 0,
        error: err instanceof Error ? err.message : "Failed to ping backend",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const geminiSnippet = `# .env.local for Google Gemini API (Recommended)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash`;

  const ollamaSnippet = `# .env.local for Local Ollama (Free & Offline)
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3.2
AI_API_KEY=ollama`;

  const lmStudioSnippet = `# .env.local for LM Studio / vLLM / LocalAI
AI_BASE_URL=http://localhost:1234/v1
AI_MODEL=qwen2.5-coder-7b-instruct
AI_API_KEY=lm-studio`;

  const openaiSnippet = `# .env.local for OpenAI
AI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-4o-mini`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                AI Backend Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Supports Google Gemini, Local LLMs (Ollama, LM Studio), and OpenAI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status info with Live Test Connection */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {status?.configured ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Active Provider:</span>
                  <span
                    className={`font-semibold ${
                      status?.configured
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {status?.configured
                      ? `${status.provider.toUpperCase()} (${status.model})`
                      : "Built-in Linux Diagnostics (Offline Heuristics)"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{status?.message}</p>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 border border-sky-300 dark:border-sky-500/30 dark:text-sky-300 text-xs font-semibold transition-all shrink-0 cursor-pointer"
              title="Send a lightweight ping to verify API connectivity"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Pinging...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>

          {/* Live Ping Result Banner */}
          {pingResult && (
            <div
              className={`p-3 rounded-lg text-xs border flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                pingResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {pingResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className="font-medium">
                  {pingResult.success
                    ? `Connection verified successfully! Response time: ${pingResult.latencyMs} ms`
                    : `Connection error: ${pingResult.error || "Failed to reach endpoint"}`}
                </span>
              </div>
              {pingResult.latencyMs > 0 && (
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-zinc-300">
                  {pingResult.latencyMs}ms
                </span>
              )}
            </div>
          )}
        </div>

        {/* Setup instructions */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <div className="text-xs text-slate-600 dark:text-zinc-400">
            Create or edit{" "}
            <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded font-mono text-slate-800 dark:text-zinc-300 border border-slate-200 dark:border-transparent">
              .env.local
            </code>{" "}
            in your project root with any of the options below:
          </div>

          {/* Option 1: Google Gemini API (Recommended) */}
          <div className="rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Option 1: Google Gemini API (Fast & Recommended)
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 underline flex items-center gap-0.5"
                >
                  Get Free Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <button
                onClick={() => copySnippet(geminiSnippet, "gemini")}
                className="flex items-center gap-1 text-[11px] text-sky-800 dark:text-zinc-300 hover:text-sky-950 dark:hover:text-white bg-sky-100 hover:bg-sky-200 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 px-2 py-1 rounded transition-colors"
              >
                {copiedKey === "gemini" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono bg-slate-900 dark:bg-black/60 p-2.5 rounded-lg text-sky-200 overflow-x-auto shadow-inner">
              {geminiSnippet}
            </pre>
          </div>

          {/* Option 2: Local Ollama */}
          <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Option 2: Local Ollama (Self-hosted / 100% Offline)
              </span>
              <button
                onClick={() => copySnippet(ollamaSnippet, "ollama")}
                className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 bg-slate-200/80 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 px-2 py-1 rounded transition-colors"
              >
                {copiedKey === "ollama" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono bg-slate-900 dark:bg-black/60 p-2.5 rounded-lg text-amber-200 dark:text-zinc-300 overflow-x-auto shadow-inner">
              {ollamaSnippet}
            </pre>
          </div>

          {/* Option 3: LM Studio / LocalAI / vLLM */}
          <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> Option 3: LM Studio / LocalAI / vLLM
              </span>
              <button
                onClick={() => copySnippet(lmStudioSnippet, "lmstudio")}
                className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 bg-slate-200/80 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 px-2 py-1 rounded transition-colors"
              >
                {copiedKey === "lmstudio" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono bg-slate-900 dark:bg-black/60 p-2.5 rounded-lg text-purple-200 dark:text-zinc-300 overflow-x-auto shadow-inner">
              {lmStudioSnippet}
            </pre>
          </div>

          {/* Option 4: OpenAI */}
          <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Option 4: OpenAI API
              </span>
              <button
                onClick={() => copySnippet(openaiSnippet, "openai")}
                className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 bg-slate-200/80 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 px-2 py-1 rounded transition-colors"
              >
                {copiedKey === "openai" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs font-mono bg-slate-900 dark:bg-black/60 p-2.5 rounded-lg text-emerald-200 dark:text-zinc-300 overflow-x-auto shadow-inner">
              {openaiSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-zinc-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-transparent rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
