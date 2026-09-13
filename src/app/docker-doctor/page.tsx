"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { DockerDoctorInput } from "@/components/DockerDoctorInput";
import { DockerDoctorResult } from "@/components/DockerDoctorResult";
import { StatusModal } from "@/components/StatusModal";
import { DockerDoctorRequest, DockerDoctorResponse, AIStatusResponse, DockerMode, DockerFramework } from "@/types";
import { AlertCircle, X, Container, Terminal } from "lucide-react";

export default function DockerDoctorPage() {
  const [mode, setMode] = useState<DockerMode>("generate");
  const [framework, setFramework] = useState<DockerFramework>("Next.js");
  const [descriptionOrError, setDescriptionOrError] = useState("");
  const [existingDockerfile, setExistingDockerfile] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<DockerDoctorResponse | null>(null);

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

  const handleAnalyze = async () => {
    setIsLoading(true);
    setApiError(null);

    const payload: DockerDoctorRequest = {
      mode,
      framework: mode === "generate" ? framework : undefined,
      descriptionOrError: descriptionOrError.trim(),
      existingDockerfile: existingDockerfile.trim() || undefined,
    };

    try {
      const res = await fetch("/api/docker-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze Docker configuration");

      setResult(data);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to communicate with server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDescriptionOrError("");
    setExistingDockerfile("");
    setResult(null);
    setApiError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070a12] text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header
        status={status}
        onOpenSettings={() => setIsStatusOpen(true)}
        onNewAnalysis={handleReset}
        activePage="docker"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Banner */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-1">
            <Container className="w-3.5 h-3.5" />
            <span>Docker &amp; Compose Doctor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Multi-Stage Dockerfile &amp; Compose Generator
          </h1>
          <p className="text-sm text-zinc-400">
            Generate hardened, minimal multi-stage Dockerfiles and compose setups, or diagnose and fix broken container builds.
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
          <DockerDoctorInput
            mode={mode}
            onChangeMode={setMode}
            framework={framework}
            onChangeFramework={setFramework}
            descriptionOrError={descriptionOrError}
            onChangeDescriptionOrError={setDescriptionOrError}
            existingDockerfile={existingDockerfile}
            onChangeExistingDockerfile={setExistingDockerfile}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            onClear={handleReset}
          />
        </section>

        {/* Result Card */}
        {result && (
          <section className="space-y-4 pt-2">
            <DockerDoctorResult result={result} />
          </section>
        )}
      </main>

      <footer className="w-full border-t border-white/5 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>FixIt • Docker Doctor</span>
          </div>
          <div className="text-zinc-500 text-[11px]">
            Production Hardened • Non-root by default
          </div>
        </div>
      </footer>

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </div>
  );
}
