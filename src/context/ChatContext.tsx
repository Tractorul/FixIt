"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ChatMessage, ChatResponse } from "@/types";

const CHAT_STORAGE_KEY = "fixit_chat_messages_v1";

interface ChatContextValue {
  messages: ChatMessage[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isLoading: boolean;
  activeContext: string | null;
  setActiveContext: (ctx: string | null) => void;
  sendMessage: (text: string, contextOverride?: string) => Promise<void>;
  openWithContext: (contextReport: string, initialQuestion?: string) => void;
  clearMessages: () => void;
  exportChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeContext, setActiveContext] = useState<string | null>(null);

  // Sync with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Global shortcut (Ctrl+J or Cmd+J to toggle drawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sendMessage = useCallback(
    async (text: string, contextOverride?: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsLoading(true);

      const ctxToSend = contextOverride !== undefined ? contextOverride : activeContext;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
            context: ctxToSend || undefined,
          }),
        });

        const data: ChatResponse = await res.json();
        if (!res.ok) {
          throw new Error((data as unknown as { error?: string }).error || "Failed to reach AI");
        }

        const modelMsg: ChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: "model",
          content: data.reply,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, modelMsg]);
      } catch (err: unknown) {
        const errorMsg: ChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: "model",
          content: `⚠️ **Chat Error**: ${err instanceof Error ? err.message : "Failed to communicate with AI"}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, activeContext]
  );

  const openWithContext = useCallback(
    (contextReport: string, initialQuestion?: string) => {
      setActiveContext(contextReport);
      setIsOpen(true);
      if (initialQuestion) {
        sendMessage(initialQuestion, contextReport);
      }
    },
    [sendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveContext(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }, []);

  const exportChat = useCallback(() => {
    if (messages.length === 0) return;
    const md = `# FixIt AI Chat Session\nExported: ${new Date().toISOString()}\n\n---\n\n` +
      messages
        .map((m) => `### ${m.role === "user" ? "🧑‍💻 You" : "🤖 FixIt AI (Gemini)"} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n---\n`)
        .join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fixit_chat_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isOpen,
        setIsOpen,
        isLoading,
        activeContext,
        setActiveContext,
        sendMessage,
        openWithContext,
        clearMessages,
        exportChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
