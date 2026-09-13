"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { ChatMessageBubble } from "./ChatMessageBubble";
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  Download,
  Sparkles,
  Bot,
  Loader2,
  Info,
} from "lucide-react";

const QUICK_PROMPTS = [
  "Explain this in simple terms",
  "How do I prevent this in production?",
  "What are the edge cases?",
  "Write an automated shell script for this",
];

export function FloatingChatDrawer() {
  const {
    messages,
    isOpen,
    setIsOpen,
    isLoading,
    activeContext,
    setActiveContext,
    sendMessage,
    clearMessages,
    exportChat,
  } = useChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input on drawer open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

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
    <>
      {/* Floating Toggle Button (Fixed bottom right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-mono text-xs font-semibold shadow-2xl hover:shadow-sky-500/30 transition-all group"
        title="Toggle AI Copilot (Ctrl+J)"
        aria-label="Toggle AI Copilot"
      >
        <MessageSquare className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">AI Copilot</span>
        {messages.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] text-sky-200 font-bold">
            {messages.length}
          </span>
        )}
      </button>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#070b14] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-[#080d1a] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-white">FixIt Copilot</h2>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    Gemini
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Ask questions &amp; debug in real-time</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <>
                  <button
                    onClick={exportChat}
                    className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                    title="Export chat as Markdown"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearMessages}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                    title="Clear conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-white/5"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Diagnostic Context Banner (if pre-loaded) */}
          {activeContext && (
            <div className="px-4 py-2 bg-sky-950/40 border-b border-sky-500/30 flex items-center justify-between text-xs text-sky-200 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 truncate pr-2">
                <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">Context Active: Diagnostic Result</span>
              </div>
              <button
                onClick={() => setActiveContext(null)}
                className="text-sky-400 hover:text-sky-200 text-[10px] font-mono shrink-0 underline"
              >
                Clear Context
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-3">
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">How can I help you?</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Ask any Linux, DevOps, or coding question. Press <kbd className="px-1 rounded bg-white/10 font-mono">Ctrl+J</kbd> anytime to open this copilot.
                  </p>
                </div>

                {/* Suggested prompt chips */}
                <div className="flex flex-col gap-1.5 w-full pt-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs p-2.5 rounded-xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-sky-500/30 text-zinc-300 hover:text-white transition-all font-mono"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-sky-400 font-mono p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3.5 border-t border-white/10 bg-[#080d1a] space-y-2">
            <div className="relative rounded-xl border border-white/10 bg-[#05080f] focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/30">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini about Linux, code, or your active error... (Enter to send)"
                rows={2}
                className="w-full bg-transparent px-3.5 py-2.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5">
                <span className="text-[10px] text-zinc-500 font-mono">
                  Shift+Enter for new line
                </span>
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  type="button"
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    isLoading || !input.trim()
                      ? "text-zinc-600 cursor-not-allowed"
                      : "bg-sky-500 text-white hover:bg-sky-400 shadow-md"
                  }`}
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
