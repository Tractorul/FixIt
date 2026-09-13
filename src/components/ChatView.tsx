"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { ChatMessageBubble } from "./ChatMessageBubble";
import {
  Send,
  Trash2,
  Download,
  Sparkles,
  Bot,
  Loader2,
  Terminal,
  Code2,
  GitBranch,
} from "lucide-react";

const STARTER_CARDS = [
  {
    icon: Terminal,
    color: "text-sky-400",
    title: "Linux System Tuning",
    prompt: "How do I optimize systemd journal size, memory swappiness, and disk caching for a production Linux server?",
  },
  {
    icon: Terminal,
    color: "text-amber-400",
    title: "Bash Scripting & Automation",
    prompt: "Write a robust bash script with error handling, logging, and lockfiles to automate system backups.",
  },
  {
    icon: GitBranch,
    color: "text-rose-400",
    title: "Git Rebase vs Merge",
    prompt: "Explain the pros and cons of interactive git rebase vs merge commits in team workflows, with step-by-step examples.",
  },
  {
    icon: Code2,
    color: "text-indigo-400",
    title: "Next.js 16 Best Practices",
    prompt: "What are the key architectural best practices for Next.js 16 App Router Server Components and Server Actions?",
  },
];

export function ChatView() {
  const { messages, isLoading, sendMessage, clearMessages, exportChat } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl flex flex-col h-[75vh] overflow-hidden">
      {/* Chat Top Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#080d1a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Gemini Developer Terminal</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-semibold">
                Multi-Turn Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Direct conversational AI for Linux &amp; DevOps</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={exportChat}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 transition-colors"
                title="Export conversation to Markdown"
              >
                <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={clearMessages}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-[#05080f]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-sky-100 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 mb-1">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ask FixIt AI Anything</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                Full-context AI assistant powered by Gemini. Ask about complex bash commands, containerization, debugging, or cloud infrastructure.
              </p>
            </div>

            {/* Starter Prompt Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {STARTER_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.title}
                    onClick={() => sendMessage(card.prompt)}
                    className="p-4 rounded-xl bg-white dark:bg-[#090e18] hover:bg-slate-50 dark:hover:bg-[#0e1628] border border-slate-200 dark:border-white/5 hover:border-sky-300 dark:hover:border-sky-500/30 text-left transition-all space-y-1.5 group shadow-xs dark:shadow-none"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-sky-600 dark:group-hover:text-sky-300">
                      <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                      <span>{card.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {card.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 font-mono p-3 bg-sky-50 dark:bg-sky-950/20 rounded-xl border border-sky-200 dark:border-sky-500/20 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Gemini is generating response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#080d1a]">
        <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#05080f] focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question or request here... (Press Enter to send, Shift+Enter for newline)"
            rows={3}
            className="w-full bg-transparent px-4 py-3 text-xs font-mono text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
              FixIt AI • Markdown &amp; Code Formatted
            </span>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              type="button"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                isLoading || !input.trim()
                  ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed border border-slate-200 dark:border-transparent"
                  : "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-md"
              }`}
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
