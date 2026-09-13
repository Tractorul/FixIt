"use client";

import React, { useState } from "react";
import { Container, Sparkles, Loader2, CornerDownLeft, Wrench } from "lucide-react";
import { DockerMode, DockerFramework } from "@/types";

interface DockerDoctorInputProps {
  mode: DockerMode;
  onChangeMode: (mode: DockerMode) => void;
  framework: DockerFramework;
  onChangeFramework: (framework: DockerFramework) => void;
  descriptionOrError: string;
  onChangeDescriptionOrError: (desc: string) => void;
  existingDockerfile: string;
  onChangeExistingDockerfile: (df: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onClear: () => void;
}

const FRAMEWORKS: DockerFramework[] = [
  "Next.js",
  "Node.js (Express/Nest)",
  "Python (FastAPI/Flask)",
  "Go",
  "Rust",
  "Java (Spring)",
  "PHP (Laravel)",
  "Static HTML/Nginx",
  "Custom",
];

export function DockerDoctorInput({
  mode,
  onChangeMode,
  framework,
  onChangeFramework,
  descriptionOrError,
  onChangeDescriptionOrError,
  existingDockerfile,
  onChangeExistingDockerfile,
  onAnalyze,
  isLoading,
}: DockerDoctorInputProps) {
  const [showExistingInputs, setShowExistingInputs] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isLoading) {
        onAnalyze();
      }
    }
  };

  return (
    <div className="space-y-5" onKeyDown={handleKeyDown}>
      {/* Mode Selector (Generator vs Doctor/Debug) */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/5 w-fit">
        <button
          type="button"
          onClick={() => onChangeMode("generate")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            mode === "generate"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Container className="w-3.5 h-3.5" />
          <span>Generate Dockerfile &amp; Compose</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeMode("debug")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            mode === "debug"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Doctor / Fix Broken Build</span>
        </button>
      </div>

      {/* Framework Selector (for Generator Mode) */}
      {mode === "generate" && (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
            Select Application Tech Stack:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FRAMEWORKS.map((fw) => {
              const isSelected = framework === fw;
              return (
                <button
                  key={fw}
                  type="button"
                  onClick={() => onChangeFramework(fw)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-mono transition-all ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm"
                      : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  {fw}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Description or Error Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-zinc-400">
          {mode === "generate"
            ? "Special requirements / environment notes (optional):"
            : "Paste your broken Docker build error or stack trace:"}
        </label>
        <textarea
          value={descriptionOrError}
          onChange={(e) => onChangeDescriptionOrError(e.target.value)}
          placeholder={
            mode === "generate"
              ? "e.g. Include PostgreSQL service in compose, non-root user, multi-stage alpine build..."
              : "e.g. npm ERR! code EACCES: permission denied, mkdir '/app/.next', failed to solve with frontend..."
          }
          rows={mode === "generate" ? 3 : 5}
          className="w-full bg-[#05080f] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 resize-y"
          disabled={isLoading}
        />
      </div>

      {/* Optional Existing Dockerfile input (for Debug Mode) */}
      {mode === "debug" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowExistingInputs(!showExistingInputs)}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
          >
            <span>{showExistingInputs ? "− Hide existing Dockerfile" : "+ Paste existing Dockerfile (optional)"}</span>
          </button>

          {showExistingInputs && (
            <textarea
              value={existingDockerfile}
              onChange={(e) => onChangeExistingDockerfile(e.target.value)}
              placeholder="Paste your current Dockerfile here..."
              rows={6}
              className="w-full bg-[#05080f] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 resize-y"
              disabled={isLoading}
            />
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={onAnalyze}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border border-cyan-400/30 hover:shadow-cyan-500/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Constructing Production Container Setup...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>{mode === "generate" ? "Generate Docker Setup" : "Diagnose & Fix Docker Build"}</span>
            <CornerDownLeft className="w-4 h-4 opacity-70 ml-1 hidden sm:inline" />
          </>
        )}
      </button>
    </div>
  );
}
