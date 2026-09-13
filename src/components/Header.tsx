"use client";

import React, { useState, useEffect } from "react";
import {
  Terminal,
  Settings,
  History,
  PlusCircle,
  Sparkles,
  Server,
  Code2,
  LogOut,
  User,
  GitBranch,
  Bot,
  Container,
  FileCode2,
  Menu,
  X,
} from "lucide-react";
import { AIStatusResponse } from "@/types";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeSlider } from "./ThemeSlider";

export type NavPage = "error" | "code" | "git" | "cli" | "docker" | "config" | "chat";

interface HeaderProps {
  status: AIStatusResponse | null;
  historyCount?: number;
  onOpenSettings: () => void;
  onToggleHistory?: () => void;
  onNewAnalysis?: () => void;
  isHistoryOpen?: boolean;
  activePage?: NavPage;
}

const NAV_ITEMS = [
  { id: "error" as const, label: "Error Diagnosis", href: "/", icon: Terminal, color: "text-sky-400" },
  { id: "code" as const, label: "Code Doctor", href: "/code-debug", icon: Code2, color: "text-indigo-400" },
  { id: "chat" as const, label: "AI Chat", href: "/chat", icon: Sparkles, color: "text-purple-400" },
  { id: "git" as const, label: "Git Wizard", href: "/git-wizard", icon: GitBranch, color: "text-rose-400" },
  { id: "cli" as const, label: "CLI Copilot", href: "/cli-copilot", icon: Bot, color: "text-amber-400" },
  { id: "docker" as const, label: "Docker Doctor", href: "/docker-doctor", icon: Container, color: "text-cyan-400" },
  { id: "config" as const, label: "Config Transformer", href: "/config-converter", icon: FileCode2, color: "text-emerald-400" },
];

export function Header({
  status,
  historyCount = 0,
  onOpenSettings,
  onToggleHistory,
  onNewAnalysis,
  isHistoryOpen = false,
  activePage = "error",
}: HeaderProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [supabaseActive] = useState(() => isSupabaseConfigured());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#080c14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/30 text-sky-400 shadow-inner group-hover:border-sky-400/50 transition-colors">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-sky-300 transition-colors">
                  FixIt
                </span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  DevSuite
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Mode Tabs */}
          <nav className="hidden xl:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                    isActive
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-sky-300" : item.color}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-zinc-300"
          >
            {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5 text-sky-400" />}
            <span className="capitalize">{activePage}</span>
          </button>

          {/* Theme Slider (Light / System / Dark) */}
          <ThemeSlider />

          {/* Status Indicator Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 hover:border-white/20 transition-all text-xs text-zinc-300"
            title="Click to view AI backend status and instructions"
          >
            {getProviderPill()}
            <Settings className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
          </button>

          {/* New Analysis / Reset */}
          {onNewAnalysis && (
            <button
              onClick={onNewAnalysis}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Reset</span>
            </button>
          )}

          {/* History Toggle (if supported on active page) */}
          {onToggleHistory && (
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
          )}

          {/* User / Logout */}
          {supabaseActive && userEmail && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 px-2 py-1 rounded bg-white/5">
                <User className="w-3 h-3 text-sky-400" />
                <span className="max-w-[100px] truncate">{userEmail}</span>
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

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-white/10 bg-[#090e18] p-3 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono transition-all ${
                    isActive
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-300" : item.color}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

