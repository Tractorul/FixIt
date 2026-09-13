"use client";

import React, { useState, useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";

export function KeyboardShortcutPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Only trigger on bare '?' key, not when typing in inputs/textareas
      if (
        e.key === "?" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const shortcuts = [
    { keys: ["Ctrl", "Enter"], description: "Analyze error / execute tool" },
    { keys: ["Ctrl", "J"], description: "Toggle Gemini AI Copilot drawer" },
    { keys: ["Ctrl", "H"], description: "Toggle history panel" },
    { keys: ["Esc"], description: "Close any open panel or drawer" },
    { keys: ["?"], description: "Show / hide keyboard shortcuts" },
  ];

  return (
    <>
      {/* Trigger button — fixed bottom-left */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-all shadow-lg"
        title="Keyboard shortcuts (?)"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {/* Shortcut panel popover */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-14 left-4 z-50 w-72 bg-[#0d1322] border border-white/15 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-2 fade-in duration-150"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-semibold text-zinc-200">Keyboard Shortcuts</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {shortcuts.map(({ keys, description }) => (
              <div key={description} className="flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-400">{description}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {keys.map((key, i) => (
                    <React.Fragment key={key}>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 text-[11px] font-mono border border-white/10">
                        {key}
                      </kbd>
                      {i < keys.length - 1 && (
                        <span className="text-zinc-600 text-[10px]">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
