"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ChatView } from "@/components/ChatView";
import { StatusModal } from "@/components/StatusModal";
import { AIStatusResponse } from "@/types";
import { Bot, Terminal } from "lucide-react";

export default function ChatPage() {
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
    <div className="min-h-screen flex flex-col bg-[#070a12] text-zinc-100 selection:bg-sky-500/30 selection:text-sky-200">
      <Header
        status={status}
        onOpenSettings={() => setIsStatusOpen(true)}
        activePage="chat"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title Banner */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono mb-1">
            <Bot className="w-3.5 h-3.5" />
            <span>AI Developer Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Chat with Gemini
          </h1>
          <p className="text-sm text-zinc-400">
            Interactive multi-turn conversation with memory, code generation, and Linux system expertise.
          </p>
        </div>

        {/* Chat Main View */}
        <ChatView />
      </main>

      <footer className="w-full border-t border-white/5 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>FixIt • Gemini AI Chat Terminal</span>
          </div>
          <div className="text-zinc-500 text-[11px]">
            Private by Default • Secrets Automatically Redacted
          </div>
        </div>
      </footer>

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </div>
  );
}
