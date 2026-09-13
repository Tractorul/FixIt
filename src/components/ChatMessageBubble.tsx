"use client";

import React, { useState } from "react";
import { ChatMessage } from "@/types";
import { Copy, Check, Bot, User, Terminal } from "lucide-react";
import { useToast } from "@/components/Toast";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const { showToast } = useToast();
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const copySnippet = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeIdx(idx);
      showToast("Code copied to clipboard!");
      setTimeout(() => setCopiedCodeIdx(null), 2000);
    } catch {
      // ignore
    }
  };

  const isUser = message.role === "user";

  // Parse markdown code blocks ```lang ... ```
  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const firstLineEnd = part.indexOf("\n");
        const lang = part.slice(3, firstLineEnd).trim() || "bash";
        const code = part.slice(firstLineEnd + 1, -3).trim();

        const isCopied = copiedCodeIdx === idx;

        return (
          <div key={idx} className="my-2.5 rounded-xl border border-white/10 overflow-hidden bg-[#05080f]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/5 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Terminal className="w-3 h-3" />
                {lang}
              </span>
              <button
                onClick={() => copySnippet(code, idx)}
                type="button"
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed select-all">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format bold text **bold** and inline code `code`
      const formatted = part
        .split("\n")
        .map((line, lineIdx) => {
          return (
            <span key={lineIdx} className="block leading-relaxed">
              {line}
            </span>
          );
        });

      return <span key={idx}>{formatted}</span>;
    });
  };

  return (
    <div className={`flex gap-3 text-xs ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
          isUser
            ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-sm"
            : "bg-white dark:bg-[#090e18] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-zinc-200 rounded-tl-sm shadow-xs dark:shadow-none"
        }`}
      >
        <div className="space-y-1">{renderContent(message.content)}</div>
        <div className={`text-[10px] mt-1.5 font-mono ${isUser ? "text-sky-200/80 text-right" : "text-slate-500 dark:text-zinc-500"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/15 flex items-center justify-center shrink-0 text-slate-700 dark:text-zinc-300 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
