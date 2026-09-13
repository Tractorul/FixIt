"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  HelpCircle,
  Wrench,
  Terminal,
  ListChecks,
  Check,
  Share2,
  Download,
  Copy,
  Code2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { CodeDebugResponse } from "@/types";
import { CommandCard } from "./CommandCard";
import { useToast } from "@/components/Toast";
import { HighlightedCode } from "./HighlightedCode";
import { useChat } from "@/context/ChatContext";

interface CodeResultProps {
  result: CodeDebugResponse;
  originalCode: string;
}

export function CodeResult({ result, originalCode }: CodeResultProps) {
  const { openWithContext } = useChat();

  const [copiedFixed, setCopiedFixed] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState(false);
  const [activeTab, setActiveTab] = useState<"fixed" | "comparison">("fixed");
  const { showToast } = useToast();

  const getFileExtension = (lang: string): string => {
    switch (lang.toLowerCase()) {
      case "python":
        return "py";
      case "javascript":
        return "js";
      case "typescript":
        return "ts";
      case "rust":
        return "rs";
      case "go":
        return "go";
      case "c / c++":
        return "cpp";
      case "java":
        return "java";
      case "php":
        return "php";
      case "bash / shell":
        return "sh";
      case "sql":
        return "sql";
      case "ruby":
        return "rb";
      default:
        return "txt";
    }
  };

  const copyFixedCodeOnly = async () => {
    try {
      await navigator.clipboard.writeText(result.fixedCode);
      setCopiedFixed(true);
      showToast("Fixed code copied!");
      setTimeout(() => setCopiedFixed(false), 2000);
    } catch {
      // ignore
    }
  };

  const copyFullReport = async () => {
    const ext = getFileExtension(result.language);
    const md = `# FixIt Code Debug Report
## Language: ${result.language}
## Error Type: ${result.errorType}

### Detected Error
${result.detectedError}

### Root Cause
${result.rootCause}

### Fixed Code
\`\`\`${ext}
${result.fixedCode}
\`\`\`

### Changes Made
${result.diffExplanation.map((d) => `- ${d}`).join("\n")}

### Best Practices
${result.bestPractices.map((b) => `- ${b}`).join("\n")}
`;

    try {
      await navigator.clipboard.writeText(md);
      setCopiedMarkdown(true);
      showToast("Markdown report copied!");
      setTimeout(() => setCopiedMarkdown(false), 2000);
    } catch {
      // ignore
    }
  };

  const downloadFixedFile = () => {
    const ext = getFileExtension(result.language);
    const blob = new Blob([result.fixedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fixed_snippet.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedFile(true);
    setTimeout(() => setDownloadedFile(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-slate-50 to-white dark:from-sky-950/30 dark:via-zinc-900/60 dark:to-zinc-950/80 border border-sky-200 dark:border-sky-500/20 shadow-xs dark:shadow-none">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono font-medium">
              Language &amp; Classification
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 font-mono">
                {result.language}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 font-mono font-medium">
                {result.errorType}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              const context = `Language: ${result.language}\nError Type: ${result.errorType}\nDetected Error: ${result.detectedError}\nRoot Cause: ${result.rootCause}\nFixed Code:\n${result.fixedCode}`;
              openWithContext(context, "Can you explain this code bug and help me write unit tests for it?");
            }}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-sky-100 hover:bg-sky-200 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 border-sky-300 dark:border-sky-500/40 text-sky-800 dark:text-sky-300 transition-colors"
            title="Open Gemini AI copilot with this code context"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Ask Gemini</span>
          </button>

          <button
            onClick={downloadFixedFile}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              downloadedFile
                ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                : "bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="Download fixed code file"
          >
            {downloadedFile ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Download .{getFileExtension(result.language)}</span>
              </>
            )}
          </button>

          <button
            onClick={copyFixedCodeOnly}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              copiedFixed
                ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                : "bg-sky-100 hover:bg-sky-200 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 border-sky-300 dark:border-sky-500/30 text-sky-800 dark:text-sky-300"
            }`}
            title="Copy fixed code snippet"
          >
            {copiedFixed ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied Code!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Copy Fixed Code</span>
              </>
            )}
          </button>

          <button
            onClick={copyFullReport}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              copiedMarkdown
                ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                : "bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="Copy full analysis as Markdown"
          >
            {copiedMarkdown ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied Markdown!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Markdown</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Detected Error & Root Cause */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detected Error Card */}
        <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-rose-200 dark:border-rose-500/20 p-5 space-y-2.5 shadow-xs dark:shadow-lg">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <h3>Detected Error / Bug</h3>
          </div>
          <p className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-mono text-[13px]">
            {result.detectedError}
          </p>
        </div>

        {/* Why It Happened Card */}
        <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-slate-200 dark:border-white/10 p-5 space-y-2.5 shadow-xs dark:shadow-lg">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <h3>Root Cause Explanation</h3>
          </div>
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
            {result.rootCause}
          </p>
        </div>
      </div>

      {/* Code Viewer: Fixed Code & Comparison Tabs */}
      <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-emerald-200 dark:border-emerald-500/20 shadow-xs dark:shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Corrected Code</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("fixed")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                activeTab === "fixed"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Fixed Code
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("comparison")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                activeTab === "comparison"
                  ? "bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 font-semibold"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Side-by-Side Diff
            </button>
          </div>
        </div>

        {activeTab === "fixed" ? (
          <div className="p-4 bg-slate-900 dark:bg-[#05080f]">
            <div className="p-4 rounded-lg bg-black/40 border border-slate-800 dark:border-white/10 select-all shadow-inner">
              <HighlightedCode code={result.fixedCode} language={result.language} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 dark:divide-white/10 bg-slate-900 dark:bg-[#05080f]">
            <div className="p-4 space-y-2">
              <span className="text-xs font-mono font-semibold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Before (Original)
              </span>
              <div className="p-3 rounded-lg bg-black/40 border border-rose-500/30 max-h-[300px] overflow-y-auto">
                <HighlightedCode code={originalCode} language={result.language} />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> After (Fixed)
              </span>
              <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/30 max-h-[300px] overflow-y-auto select-all">
                <HighlightedCode code={result.fixedCode} language={result.language} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Changes Made */}
      {result.diffExplanation && result.diffExplanation.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-slate-200 dark:border-white/10 p-5 space-y-3 shadow-xs dark:shadow-lg">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            <Wrench className="w-4 h-4 shrink-0" />
            <h3>Changes Made to Fix Snippet</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-zinc-200">
            {result.diffExplanation.map((change, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-2 shrink-0"></span>
                <span className="leading-relaxed">{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verification Commands */}
      {result.commands && result.commands.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-semibold text-sm px-1">
            <Terminal className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <h3>Verification / Compiler Commands</h3>
          </div>
          <div className="space-y-3">
            {result.commands.map((cmd, idx) => (
              <CommandCard key={idx} commandItem={cmd} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Best Practices */}
      {result.bestPractices && result.bestPractices.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-[#0c1220]/90 border border-slate-200 dark:border-white/10 p-5 space-y-3 shadow-xs dark:shadow-lg">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
            <ListChecks className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3>{result.language} Best Practices</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-zinc-300">
            {result.bestPractices.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-2 shrink-0"></span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
