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
} from "lucide-react";
import { CodeDebugResponse } from "@/types";
import { CommandCard } from "./CommandCard";
import { useToast } from "@/components/Toast";
import { HighlightedCode } from "./HighlightedCode";

interface CodeResultProps {
  result: CodeDebugResponse;
  originalCode: string;
}

export function CodeResult({ result, originalCode }: CodeResultProps) {
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
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-sky-950/30 via-zinc-900/60 to-zinc-950/80 border border-sky-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
              Language & Classification
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-zinc-100 font-mono">
                {result.language}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                {result.errorType}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={downloadFixedFile}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              downloadedFile
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Download fixed code file"
          >
            {downloadedFile ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download .{getFileExtension(result.language)}</span>
              </>
            )}
          </button>

          <button
            onClick={copyFixedCodeOnly}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              copiedFixed
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/30 text-sky-300"
            }`}
            title="Copy fixed code snippet"
          >
            {copiedFixed ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Code!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Fixed Code</span>
              </>
            )}
          </button>

          <button
            onClick={copyFullReport}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              copiedMarkdown
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Copy full analysis as Markdown"
          >
            {copiedMarkdown ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Markdown!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Markdown</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Detected Error & Root Cause */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detected Error Card */}
        <div className="rounded-xl bg-[#0c1220]/90 border border-rose-500/20 p-5 space-y-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <h3>Detected Error / Bug</h3>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed font-mono text-[13px]">
            {result.detectedError}
          </p>
        </div>

        {/* Why It Happened Card */}
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-2.5 shadow-lg">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <h3>Root Cause Explanation</h3>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {result.rootCause}
          </p>
        </div>
      </div>

      {/* Code Viewer: Fixed Code & Comparison Tabs */}
      <div className="rounded-xl bg-[#0c1220]/90 border border-emerald-500/20 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Corrected Code</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("fixed")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                activeTab === "fixed"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Fixed Code
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("comparison")}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                activeTab === "comparison"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Side-by-Side Diff
            </button>
          </div>
        </div>

        {activeTab === "fixed" ? (
          <div className="p-4 bg-[#05080f]">
            <div className="p-4 rounded-lg bg-black/60 border border-white/10 select-all">
              <HighlightedCode code={result.fixedCode} language={result.language} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-[#05080f]">
            <div className="p-4 space-y-2">
              <span className="text-xs font-mono font-semibold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Before (Original)
              </span>
              <div className="p-3 rounded-lg bg-black/60 border border-rose-500/20 max-h-[300px] overflow-y-auto">
                <HighlightedCode code={originalCode} language={result.language} />
              </div>
            </div>
            <div className="p-4 space-y-2">
              <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> After (Fixed)
              </span>
              <div className="p-3 rounded-lg bg-black/60 border border-emerald-500/20 max-h-[300px] overflow-y-auto select-all">
                <HighlightedCode code={result.fixedCode} language={result.language} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Changes Made */}
      {result.diffExplanation && result.diffExplanation.length > 0 && (
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Wrench className="w-4 h-4 shrink-0" />
            <h3>Changes Made to Fix Snippet</h3>
          </div>
          <ul className="space-y-2 text-sm text-zinc-200">
            {result.diffExplanation.map((change, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                <span className="leading-relaxed">{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verification Commands */}
      {result.commands && result.commands.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm px-1">
            <Terminal className="w-4 h-4 text-sky-400" />
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
        <div className="rounded-xl bg-[#0c1220]/90 border border-white/10 p-5 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <ListChecks className="w-4 h-4 text-amber-400 shrink-0" />
            <h3>{result.language} Best Practices</h3>
          </div>
          <ul className="space-y-2 text-sm text-zinc-300">
            {result.bestPractices.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
