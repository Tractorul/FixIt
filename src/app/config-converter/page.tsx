"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ConfigConverterView } from "@/components/ConfigConverterView";
import { StatusModal } from "@/components/StatusModal";
import { AIStatusResponse } from "@/types";
import { FileCode2, Terminal } from "lucide-react";

export default function ConfigConverterPage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#070a12] text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header
        status={status}
        onOpenSettings={() => setIsStatusOpen(true)}
        activePage="config"
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Banner */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-1">
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Config &amp; Environment Transformer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Convert Between .env, JSON, YAML &amp; TOML
          </h1>
          <p className="text-sm text-zinc-400">
            Instant bidirectional configuration transformation with syntax validation, secret masking, and export.
          </p>
        </div>

        {/* Transformer Main View */}
        <ConfigConverterView />
      </main>

      <footer className="w-full border-t border-white/5 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>FixIt • Config Transformer</span>
          </div>
          <div className="text-zinc-500 text-[11px]">
            Zero Network Leak • 100% Client-Side Safe Transformation
          </div>
        </div>
      </footer>

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </div>
  );
}
