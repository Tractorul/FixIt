"use client";

import React, { useState } from "react";
import {
  FileCode2,
  ArrowRightLeft,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { ConfigFormat, ConfigConverterResponse } from "@/types";
import { transformConfig } from "@/lib/ai/configHeuristics";
import { useToast } from "@/components/Toast";
import { HighlightedCode } from "./HighlightedCode";

const FORMATS: Array<{ id: ConfigFormat; label: string; ext: string }> = [
  { id: "env", label: ".env (Key=Val)", ext: "env" },
  { id: "json", label: "JSON", ext: "json" },
  { id: "yaml", label: "YAML", ext: "yaml" },
  { id: "toml", label: "TOML", ext: "toml" },
  { id: "docker-compose-env", label: "Docker Compose ENV", ext: "yml" },
];

const SAMPLE_ENV = `# FixIt Application Configuration
DATABASE_URL=postgres://appuser:superSecretPass@localhost:5432/mydb
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super_secret_jwt_token_987654321
NEXT_PUBLIC_APP_URL=https://myfixitapp.vercel.app
PORT=3000
NODE_ENV=production
ENABLE_TELEMETRY=false`;

export function ConfigConverterView() {
  const { showToast } = useToast();
  const [sourceFormat, setSourceFormat] = useState<ConfigFormat>("env");
  const [targetFormat, setTargetFormat] = useState<ConfigFormat>("json");
  const [inputContent, setInputContent] = useState(SAMPLE_ENV);
  const [maskSecrets, setMaskSecrets] = useState(false);
  const [copied, setCopied] = useState(false);

  // Instant reactive client-side transformation
  const result: ConfigConverterResponse = React.useMemo(() => {
    if (!inputContent.trim()) {
      return {
        sourceFormat,
        targetFormat,
        convertedContent: "",
        isValid: true,
        detectedVariablesCount: 0,
        maskedSecretsCount: 0,
      };
    }
    return transformConfig({
      sourceFormat,
      targetFormat,
      content: inputContent,
      maskSecrets,
    });
  }, [sourceFormat, targetFormat, inputContent, maskSecrets]);

  const handleSwap = () => {
    const prevSource = sourceFormat;
    setSourceFormat(targetFormat);
    setTargetFormat(prevSource);
    if (result.convertedContent) {
      setInputContent(result.convertedContent);
    }
  };

  const handleCopy = async () => {
    if (!result.convertedContent) return;
    try {
      await navigator.clipboard.writeText(result.convertedContent);
      setCopied(true);
      showToast("Converted config copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!result.convertedContent) return;
    const targetObj = FORMATS.find((f) => f.id === targetFormat);
    const filename = `config.${targetObj?.ext || "txt"}`;
    const blob = new Blob([result.convertedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Format Selectors Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Source Format */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-600 dark:text-zinc-400 font-semibold">From:</span>
          <select
            value={sourceFormat}
            onChange={(e) => setSourceFormat(e.target.value as ConfigFormat)}
            className="bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-200">
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          type="button"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-950 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
          title="Swap source and target formats"
        >
          <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>

        {/* Target Format */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase text-slate-600 dark:text-zinc-400 font-semibold">To:</span>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as ConfigFormat)}
            className="bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-sky-700 dark:text-sky-300 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-200">
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mask Secrets Toggle */}
        <button
          type="button"
          onClick={() => setMaskSecrets(!maskSecrets)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
            maskSecrets
              ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-400 dark:border-white/5"
          }`}
        >
          {maskSecrets ? <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{maskSecrets ? "Secrets Masked" : "Mask Passwords"}</span>
        </button>
      </div>

      {/* Side by Side Split Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Box */}
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Input ({sourceFormat.toUpperCase()})</span>
            </div>

            <button
              onClick={() => setInputContent("")}
              type="button"
              className="text-[11px] text-slate-500 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 font-mono cursor-pointer"
            >
              Clear
            </button>
          </div>

          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Paste your configuration here..."
            rows={15}
            className="w-full flex-1 bg-slate-50/60 dark:bg-[#05080f] p-4 text-xs font-mono text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none resize-none min-h-[300px] leading-relaxed"
          />

          <div className="px-4 py-2 border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
            {inputContent.length} chars
          </div>
        </div>

        {/* Target Converted Box */}
        <div className="glass-panel rounded-2xl border border-emerald-300 dark:border-emerald-500/30 overflow-hidden flex flex-col shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-sky-700 dark:text-sky-400">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Converted ({targetFormat.toUpperCase()})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!result.convertedContent}
                type="button"
                className="flex items-center gap-1 text-xs font-mono text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-transparent cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Download</span>
              </button>

              <button
                onClick={handleCopy}
                disabled={!result.convertedContent}
                type="button"
                className={`flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                  copied
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 dark:text-emerald-300 dark:border-emerald-500/30"
                }`}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-900 dark:bg-[#05080f] p-4 overflow-x-auto min-h-[300px] shadow-inner">
            {result.isValid && result.convertedContent ? (
              <div className="select-all">
                <HighlightedCode
                  code={result.convertedContent}
                  language={targetFormat === "json" ? "javascript" : targetFormat === "yaml" ? "bash" : "bash"}
                />
              </div>
            ) : result.errors && result.errors.length > 0 ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-rose-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Parse Error</span>
                </div>
                <p>{result.errors[0]}</p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                Paste configuration on the left to transform
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            <div>Variables detected: {result.detectedVariablesCount}</div>
            {maskSecrets && <div>Masked: {result.maskedSecretsCount}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
