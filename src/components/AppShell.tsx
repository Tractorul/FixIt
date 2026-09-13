"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar, NavPage } from "./Sidebar";
import { AIStatusResponse } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  activePage: NavPage;
  status: AIStatusResponse | null;
  historyCount?: number;
  onOpenSettings: () => void;
  onToggleHistory?: () => void;
  onNewAnalysis?: () => void;
  isHistoryOpen?: boolean;
}

export function AppShell({
  children,
  activePage,
  status,
  historyCount = 0,
  onOpenSettings,
  onToggleHistory,
  onNewAnalysis,
  isHistoryOpen = false,
}: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-zinc-100 selection:bg-sky-500/20 selection:text-sky-900 dark:selection:bg-sky-500/30 dark:selection:text-sky-200 transition-colors duration-150">
      {/* Top Header */}
      <Header
        status={status}
        historyCount={historyCount}
        onOpenSettings={onOpenSettings}
        onToggleHistory={onToggleHistory}
        onNewAnalysis={onNewAnalysis}
        isHistoryOpen={isHistoryOpen}
        activePage={activePage}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Container with Left Sidebar */}
      <div className="flex-1 flex">
        {/* Left Side Menu */}
        <Sidebar
          activePage={activePage}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Content View offset for left sidebar */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
