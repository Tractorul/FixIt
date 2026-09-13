"use client";

import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import {
  Sparkles,
  UploadCloud,
  FileCode,
  Trash2,
  CornerDownLeft,
  Loader2,
  Code2,
} from "lucide-react";
import { SupportedLanguage } from "@/types";

const CODE_LOADING_MESSAGES = [
  "Parsing code structure...",
  "Detecting language patterns...",
  "Identifying bugs & type errors...",
  "Generating corrected code...",
  "Reviewing best practices...",
  "Finalizing code report...",
];

interface CodeInputProps {
  code: string;
  onChangeCode: (code: string) => void;
  language: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  additionalContext: string;
  onChangeAdditionalContext: (ctx: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onClear: () => void;
}

const LANGUAGES: SupportedLanguage[] = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Rust",
  "Go",
  "C / C++",
  "Java",
  "PHP",
  "Bash / Shell",
  "SQL",
  "Ruby",
  "Other",
];

const CODE_EXAMPLES: Array<{
  label: string;
  language: SupportedLanguage;
  code: string;
  context: string;
}> = [
  {
    label: "Python Mutable Default",
    language: "Python",
    code: `def append_to_list(item, target_list=[]):\n    target_list.append(item)\n    return target_list\n\n# Bug: persistent state across calls\nprint(append_to_list(1))\nprint(append_to_list(2))`,
    context: "Each call should return a new list containing only the passed item.",
  },
  {
    label: "JavaScript Async Missing Await",
    language: "JavaScript",
    code: `async function fetchUserData(userId) {\n    const response = fetch(\`https://api.example.com/users/\${userId}\`);\n    const data = response.json();\n    return data.name;\n}`,
    context: "Fetch user from API and return user name without unresolved promise errors.",
  },
  {
    label: "TypeScript Null Access",
    language: "TypeScript",
    code: `interface User {\n    id: string;\n    profile?: {\n        avatarUrl?: string;\n    };\n}\n\nfunction getAvatar(user: User): string {\n    return user.profile.avatarUrl.toUpperCase();\n}`,
    context: "Safely retrieve uppercase avatar URL or return fallback if profile is undefined.",
  },
  {
    label: "Rust Immutable Borrow",
    language: "Rust",
    code: `fn main() {\n    let items = vec![1, 2, 3];\n    items.push(4);\n    println!("{:?}", items);\n}`,
    context: "Create vector and append new elements.",
  },
  {
    label: "Bash Bracket Word Splitting",
    language: "Bash / Shell",
    code: `#!/usr/bin/env bash\n\nTARGET_NAME=$1\nif [ $TARGET_NAME == "production" ]; then\n    echo "Deploying to production..."\nfi`,
    context: "Check environment argument safely even when empty or containing spaces.",
  },
  {
    label: "Go Nil Pointer Dereference",
    language: "Go",
    code: `package main\n\nimport "fmt"\n\ntype Config struct {\n    Port int\n}\n\nfunc main() {\n    var cfg *Config\n    fmt.Println("Starting on port:", cfg.Port)\n}`,
    context: "Initialize config safely before accessing struct fields.",
  },
];

export function CodeInput({
  code,
  onChangeCode,
  language,
  onChangeLanguage,
  additionalContext,
  onChangeAdditionalContext,
  onAnalyze,
  isLoading,
  onClear,
}: CodeInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showContextInput, setShowContextInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % CODE_LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [isLoading]);


  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      readTextFile(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      readTextFile(e.target.files[0]);
    }
  };

  const readTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        onChangeCode(content);
      }
    };
    reader.readAsText(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isLoading && code.trim()) {
        onAnalyze();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          Select Language
        </label>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onChangeLanguage(lang)}
                className={`px-3 py-1.5 text-xs rounded-lg font-mono transition-all ${
                  isSelected
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Example Snippets */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Quick Buggy Examples
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Load sample buggy snippet
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CODE_EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                onChangeCode(ex.code);
                onChangeLanguage(ex.language);
                onChangeAdditionalContext(ex.context);
                setShowContextInput(Boolean(ex.context));
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 hover:border-white/15 transition-all text-left font-mono"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Textarea Container with Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border transition-all ${
          isDragging
            ? "border-sky-400 bg-sky-950/20 ring-2 ring-sky-500/30"
            : "border-white/10 bg-[#070b14]/90 focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/30"
        }`}
      >
        {/* Top bar with file upload & clear */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>snippet.{language.toLowerCase().replace(/[^a-z]/g, "") || "txt"}</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".py,.js,.ts,.tsx,.jsx,.rs,.go,.cpp,.c,.java,.php,.sh,.bash,.sql,.rb,text/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 rounded hover:bg-white/5 transition-colors"
              title="Upload code file"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload File</span>
            </button>

            {code && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-rose-300 rounded hover:bg-rose-500/10 transition-colors"
                title="Clear code"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Paste your buggy ${language} code snippet here...`}
          rows={9}
          className="w-full bg-transparent px-4 py-3 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-y min-h-[200px] leading-relaxed"
          disabled={isLoading}
        />

        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-sky-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none text-sky-200">
            <FileCode className="w-10 h-10 text-sky-400 animate-bounce" />
            <p className="text-sm font-medium">Drop code file here to load</p>
          </div>
        )}

        {/* Bottom indicator bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[11px] text-zinc-500 font-mono">
          <div>
            <span>{code.length.toLocaleString()}</span> chars
          </div>
          <div className="hidden sm:block text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">Ctrl</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">Enter</kbd> to debug
          </div>
        </div>
      </div>

      {/* Optional Context Toggle & Input */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowContextInput(!showContextInput)}
          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors"
        >
          <span>{showContextInput ? "− Hide expected behavior / notes" : "+ Add expected behavior / context (optional)"}</span>
        </button>

        {showContextInput && (
          <input
            type="text"
            value={additionalContext}
            onChange={(e) => onChangeAdditionalContext(e.target.value)}
            placeholder="e.g. Expected function to return a sorted array without mutating input..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50"
          />
        )}
      </div>

      {/* Main Debug Button */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isLoading || !code.trim()}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-lg ${
          isLoading || !code.trim()
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
            : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white border border-sky-400/30 hover:shadow-sky-500/20"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span key={loadingMsgIdx} className="transition-opacity duration-300 animate-in fade-in">
              {CODE_LOADING_MESSAGES[loadingMsgIdx]}
            </span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>Debug & Fix Code</span>
            <CornerDownLeft className="w-4 h-4 opacity-70 ml-1 hidden sm:inline" />
          </>
        )}
      </button>
    </div>
  );
}
