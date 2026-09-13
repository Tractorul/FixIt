"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ChatView } from "@/components/ChatView";
import { StatusModal } from "@/components/StatusModal";
import { AIStatusResponse } from "@/types";
import { Bot } from "lucide-react";

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
    <AppShell
      activePage="chat"
      status={status}
      onOpenSettings={() => setIsStatusOpen(true)}
    >
      {/* Title Banner */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-1">
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

      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} status={status} />
    </AppShell>
  );
}
