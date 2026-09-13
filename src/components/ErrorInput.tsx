"use client";

import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import {
  Sparkles,
  UploadCloud,
  FileText,
  Trash2,
  CornerDownLeft,
  Loader2,
  AlertCircle,
  Terminal,
} from "lucide-react";
import { SupportedOS, SupportedShell } from "@/types";
import { EnvironmentSelector } from "./EnvironmentSelector";

const ERROR_LOADING_MESSAGES = [
  "Reading error context...",
  "Detecting technology stack...",
  "Identifying root cause...",
  "Generating safe fix...",
  "Reviewing command safety...",
  "Preparing diagnostic report...",
];

interface ErrorInputProps {
  errorText: string;
  onChangeErrorText: (text: string) => void;
  os: SupportedOS;
  shell: SupportedShell;
  onChangeOS: (os: SupportedOS) => void;
  onChangeShell: (shell: SupportedShell) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onClear: () => void;
}

const SAMPLE_ERRORS: Array<{
  label: string;
  os: SupportedOS;
  shell: SupportedShell;
  text: string;
}> = [
  {
    label: "Docker Socket Permission",
    os: "Ubuntu",
    shell: "Bash",
    text: "docker: permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get \"http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json\": dial unix /var/run/docker.sock: connect: permission denied. See 'docker run --help'.",
  },
  {
    label: "Port 3000 EADDRINUSE",
    os: "Debian",
    shell: "Bash",
    text: "node:events:497\n      throw er; // Unhandled 'error' event\n      ^\n\nError: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1904:16)\n    at listenInCluster (node:net:1961:12)\n    at Server.listen (node:net:2063:7)\nEmitted 'error' event on Server instance at:\n    at emitErrorNT (node:net:1940:8)",
  },
  {
    label: "APT Lock Held",
    os: "Ubuntu",
    shell: "Bash",
    text: "E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 3241 (unattended-upgr)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), is another process using it?",
  },
  {
    label: "Pacman db.lck",
    os: "Arch",
    shell: "Zsh",
    text: "error: failed to init transaction (unable to lock database)\nerror: could not lock database: File exists\n  if you are sure a package manager is not already running, you can remove /var/lib/pacman/db.lck",
  },
  {
    label: "Python ModuleNotFound",
    os: "Fedora",
    shell: "Bash",
    text: "Traceback (most recent call last):\n  File \"/home/user/project/app.py\", line 4, in <module>\n    import requests\nModuleNotFoundError: No module named 'requests'",
  },
  {
    label: "Git Merge Conflict",
    os: "Ubuntu",
    shell: "Bash",
    text: "Auto-merging src/app/page.tsx\nCONFLICT (content): Merge conflict in src/app/page.tsx\nAutomatic merge failed; fix conflicts and then commit the result.",
  },
  {
    label: "Node Heap OOM",
    os: "Fedora",
    shell: "Bash",
    text: "<--- Last few GCs --->\n[14294:0x7f9914000] 62410 ms: Mark-Compact (reduce) 4048.2 (4120.5) -> 4040.1 (4122.0) MB\nFATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory",
  },
  {
    label: "Disk Full ENOSPC",
    os: "Fedora",
    shell: "Bash",
    text: "npm ERR! code ENOSPC\nnpm ERR! syscall write\nnpm ERR! errno -28\nnpm ERR! nospc ENOSPC: no space left on device, write",
  },
  {
    label: "SSL Expired",
    os: "Debian",
    shell: "Bash",
    text: "curl: (60) SSL certificate problem: certificate has expired\nMore details here: https://curl.se/docs/sslcerts.html",
  },
];

export function ErrorInput({
  errorText,
  onChangeErrorText,
  os,
  shell,
  onChangeOS,
  onChangeShell,
  onAnalyze,
  isLoading,
  onClear,
}: ErrorInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % ERROR_LOADING_MESSAGES.length);
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
        onChangeErrorText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isLoading && errorText.trim()) {
        onAnalyze();
      }
    }
  };

  const charCount = errorText.length;
  const isOverLimit = charCount > 50000;

  return (
    <div className="space-y-4">
      {/* Sample Error Quick Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            Quick Examples
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 hidden sm:inline">
            Click to load a realistic Linux error
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_ERRORS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                onChangeErrorText(sample.text);
                onChangeOS(sample.os);
                onChangeShell(sample.shell);
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-slate-700 hover:text-slate-950 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 transition-all text-left font-mono"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea Container with Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border transition-all ${
          isDragging
            ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 ring-2 ring-sky-500/30"
            : "border-slate-200 dark:border-white/10 bg-white dark:bg-[#070b14]/90 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20"
        }`}
      >
        {/* Top bar with file upload button & clear */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 font-mono">
            <Terminal className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <span>error_log.txt</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.log,.err,.out,.json,text/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title="Upload text or log file"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Log File</span>
            </button>

            {errorText && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-300 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                title="Clear text"
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
          value={errorText}
          onChange={(e) => onChangeErrorText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste your error, traceback, or compiler output here... (e.g., gcc: fatal error, npm ERR!, systemctl status, permission denied, Docker socket error)"
          rows={7}
          className="w-full bg-transparent px-4 py-3 text-sm font-mono text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none resize-y min-h-[160px] leading-relaxed"
          disabled={isLoading}
        />

        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-sky-50/90 dark:bg-sky-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none text-sky-800 dark:text-sky-200">
            <FileText className="w-10 h-10 text-sky-500 dark:text-sky-400 animate-bounce" />
            <p className="text-sm font-medium">Drop error log file here to load</p>
          </div>
        )}

        {/* Bottom indicator bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
          <div>
            <span className={isOverLimit ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>
              {charCount.toLocaleString()}
            </span>{" "}
            / 50,000 chars
            {isOverLimit && (
              <span className="ml-2 text-rose-600 dark:text-rose-400 font-sans inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Input too large
              </span>
            )}
          </div>
          <div className="hidden sm:block text-slate-500 dark:text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300">Ctrl</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300">Enter</kbd> to analyze
          </div>
        </div>
      </div>

      {/* Linux Environment Selector (OS & Shell) */}
      <EnvironmentSelector
        os={os}
        shell={shell}
        onOSChange={onChangeOS}
        onShellChange={onChangeShell}
      />

      {/* Main Analyze Button */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isLoading || !errorText.trim() || isOverLimit}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-md ${
          isLoading || !errorText.trim() || isOverLimit
            ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border border-slate-200 dark:border-white/5"
            : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-sky-500/20 hover:shadow-sky-500/30"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span key={loadingMsgIdx} className="transition-opacity duration-300 animate-in fade-in">
              {ERROR_LOADING_MESSAGES[loadingMsgIdx]}
            </span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-sky-100" />
            <span>Analyze Error</span>
            <CornerDownLeft className="w-4 h-4 opacity-80 ml-1 hidden sm:inline" />
          </>
        )}
      </button>
    </div>
  );
}
