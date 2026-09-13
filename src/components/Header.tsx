"use client";

import React, { useState, useEffect } from "react";
import {
  Terminal,
  Settings,
  History,
  PlusCircle,
  Sparkles,
  Server,
  LogOut,
  User,
  Menu,
} from "lucide-react";
import { AIStatusResponse } from "@/types";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeSlider } from "./ThemeSlider";
import { NavPage } from "./Sidebar";

interface HeaderProps {
  status: AIStatusResponse | null;
  historyCount?: number;
  onOpenSettings: () => void;
  onToggleHistory?: () => void;
  onNewAnalysis?: () => void;
  isHistoryOpen?: boolean;
  activePage?: NavPage;
  onToggleMobileSidebar?: () => void;
}

export function Header({
  status,
  historyCount = 0,
  onOpenSettings,
  onToggleHistory,
  onNewAnalysis,
  isHistoryOpen = false,
  onToggleMobileSidebar,
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
          <span className="font-mono">Offline</span>
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
          <span className="font-mono">Gemini</span>
        </span>
      );
    }

    if (status.provider === "local") {
      return (
        <span className="flex items-center gap-1.5 text-purple-300">
          <Server className="w-3 h-3 text-purple-400" />
          <span className="font-mono">Local LLM</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 text-emerald-300">
        <span className="inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        <span className="font-mono">{status.model}</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#070b14]/90 backdrop-blur-md transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand on Top Left + Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10"
              title="Toggle Menu"
            >
              <Menu className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-600/10 dark:from-sky-500/20 dark:to-blue-600/10 border border-sky-400/30 text-sky-600 dark:text-sky-400 shadow-xs group-hover:border-sky-500/60 transition-colors">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                  FixIt
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 font-semibold">
                  Linux Workstation
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:block">
                Root causes, safe fixes &amp; AI copilot
              </p>
            </div>
          </Link>
        </div>

        {/* Actions & Profile on Top Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Analysis / Reset button */}
          {onNewAnalysis && (
            <button
              onClick={onNewAnalysis}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>Reset</span>
            </button>
          )}

          {/* History Toggle */}
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isHistoryOpen
                  ? "bg-sky-50 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-zinc-800 text-[10px] text-slate-700 dark:text-zinc-300 font-mono">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {/* Theme Slider (Light / System / Dark) */}
          <ThemeSlider />

          {/* Status Indicator Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all text-xs text-slate-700 dark:text-zinc-300 shadow-xs dark:shadow-none"
            title="Click to view AI backend status and instructions"
          >
            {getProviderPill()}
            <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 ml-0.5" />
          </button>

          {/* User Profile / Logout on Top Right */}
          {supabaseActive && userEmail && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-white/10">
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <User className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span className="max-w-[130px] truncate">{userEmail}</span>
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-300 border border-slate-200 dark:border-white/5 transition-colors"
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
