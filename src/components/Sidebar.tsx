"use client";

import React from "react";
import Link from "next/link";
import {
  Terminal,
  Code2,
  Sparkles,
  GitBranch,
  Bot,
  FileCode2,
  Layers,
  HelpCircle,
  X,
} from "lucide-react";

export type NavPage = "error" | "code" | "chat" | "git" | "cli" | "config";

export const NAV_ITEMS = [
  {
    id: "error" as const,
    label: "Error Diagnosis",
    description: "Linux logs & traces",
    href: "/",
    icon: Terminal,
    color: "text-sky-500 dark:text-sky-400",
    activeBg: "bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-500/15 dark:border-sky-500/40 dark:text-sky-300",
  },
  {
    id: "code" as const,
    label: "Code Doctor",
    description: "Bug fixes & diffs",
    href: "/code-debug",
    icon: Code2,
    color: "text-indigo-500 dark:text-indigo-400",
    activeBg: "bg-indigo-50 border-indigo-300 text-indigo-800 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-300",
  },
  {
    id: "chat" as const,
    label: "Gemini AI Chat",
    description: "Multi-turn assistant",
    href: "/chat",
    icon: Sparkles,
    color: "text-purple-500 dark:text-purple-400",
    activeBg: "bg-purple-50 border-purple-300 text-purple-800 dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-purple-300",
  },
  {
    id: "git" as const,
    label: "Git Wizard",
    description: "Repo & commit recovery",
    href: "/git-wizard",
    icon: GitBranch,
    color: "text-rose-500 dark:text-rose-400",
    activeBg: "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-300",
  },
  {
    id: "cli" as const,
    label: "CLI Copilot",
    description: "Plain English to shell",
    href: "/cli-copilot",
    icon: Bot,
    color: "text-amber-500 dark:text-amber-400",
    activeBg: "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-300",
  },
  {
    id: "config" as const,
    label: "Config Transformer",
    description: ".env, JSON, YAML, TOML",
    href: "/config-converter",
    icon: FileCode2,
    color: "text-emerald-500 dark:text-emerald-400",
    activeBg: "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-300",
  },
];

interface SidebarProps {
  activePage?: NavPage;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ activePage = "error", isOpenMobile = false, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#070b14] border-r border-slate-200 dark:border-white/10 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Section Header (Mobile Close Button) */}
        <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400 font-semibold uppercase">
            <Layers className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>Developer Tools</span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Tools List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>Developer Suite</span>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-start gap-3 p-3 rounded-xl border text-xs font-mono transition-all ${
                  isActive
                    ? `${item.activeBg} font-semibold shadow-xs`
                    : "border-transparent bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                }`}
              >
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 dark:text-zinc-200 group-hover:text-slate-950 dark:group-hover:text-white font-medium leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-0.5 font-sans">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-[#05080f]/40 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Press <kbd className="px-1 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-zinc-300 font-bold">?</kbd></span>
            </span>
            <span>v2.2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
