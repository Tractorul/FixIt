"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Settings, History, PlusCircle, Sparkles, Server, Code2, LogOut, User } from "lucide-react";
import { AIStatusResponse } from "@/types";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface HeaderProps {
  status: AIStatusResponse | null;
  historyCount: number;
  onOpenSettings: () => void;
  onToggleHistory: () => void;
  onNewAnalysis: () => void;
  isHistoryOpen: boolean;
  activePage?: "error" | "code";
}

export function Header({
  status,
  historyCount,
  onOpenSettings,
  onToggleHistory,
  onNewAnalysis,
  isHistoryOpen,
  activePage = "error",
}: HeaderProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [supabaseActive] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (supabaseActive) {
      const supabase = createClient();
      if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user?.email) {
            setUserEmail(user.email);
          }
        });
      }
    }
  }, [supabaseActive]);

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    }
  };

  const getProviderPill = () => {
    if (!status?.configured) {
      return (
        <span className="flex items-center gap-1.5 text-amber-300">
          <span className="inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          <span className="font-mono">Offline Heuristics</span>
        </span>
      );
    }

    if (status.provider === "gemini") {
      return (
        <span className="flex items-center gap-1.5 text-sky-300">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
          </span>
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span className="font-mono">Gemini ({status.model})</span>
        </span>
      );
    }

    if (status.provider === "local") {
      return (
        <span className="flex items-center gap-1.5 text-purple-300">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
          </span>
          <Server className="w-3 h-3 text-purple-400" />
          <span className="font-mono">Local LLM</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 text-emerald-300">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span className="font-mono">{status.model}</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#080c14]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mode Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/30 text-sky-400 shadow-inner group-hover:border-sky-400/50 transition-colors">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  FixIt
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Linux Edition
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Root causes, safe fixes & code doctor
              </p>
            </div>
          </Link>

          {/* Navigation Mode Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                activePage === "error"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Error Diagnosis</span>
            </Link>

            <Link
              href="/code-debug"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                activePage === "code"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Code Debugger</span>
            </Link>
          </nav>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile switcher button */}
          <Link
            href={activePage === "error" ? "/code-debug" : "/"}
            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300"
          >
            {activePage === "error" ? (
              <>
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Debug</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span>Errors</span>
              </>
            )}
          </Link>

          {/* Status Indicator Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 hover:border-white/20 transition-all text-xs text-zinc-300"
            title="Click to view AI backend status and instructions"
          >
            {getProviderPill()}
            <Settings className="w-3.5 h-3.5 text-zinc-400 ml-1" />
          </button>

          {/* New Analysis */}
          <button
            onClick={onNewAnalysis}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Reset</span>
          </button>

          {/* History Toggle */}
          <button
            onClick={onToggleHistory}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isHistoryOpen
                ? "bg-sky-500/15 border-sky-500/40 text-sky-300"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-mono">
                {historyCount}
              </span>
            )}
          </button>

          {/* User / Logout */}
          {supabaseActive && userEmail && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 px-2 py-1 rounded bg-white/5">
                <User className="w-3 h-3 text-sky-400" />
                <span className="max-w-[120px] truncate">{userEmail}</span>
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/5 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
