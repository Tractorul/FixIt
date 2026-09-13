"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ConfigConverterView } from "@/components/ConfigConverterView";
import { StatusModal } from "@/components/StatusModal";
import { AIStatusResponse } from "@/types";
import { FileCode2 } from "lucide-react";

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
    <AppShell
      activePage="config"
      status={status}
      onOpenSettings={() => setIsStatusOpen(true)}
    >
      {/* Title Banner */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono mb-1 font-semibold">
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Config &amp; Environment Transformer</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          Convert Between .env, JSON, YAML &amp; TOML
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Instant bidirectional configuration transformation with syntax validation, secret masking, and export.
        </p>
      </div>

      {/* Transformer Main View */}
      <ConfigConverterView />

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </AppShell>
  );
}
