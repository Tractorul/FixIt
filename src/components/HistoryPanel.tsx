"use client";

import React, { useState, useRef, useMemo } from "react";
import { HistoryItem } from "@/types";
import {
  History,
  Trash2,
  X,
  Search,
  Clock,
  Cpu,
  ChevronRight,
  AlertCircle,
  FileCode,
  Download,
  Upload,
} from "lucide-react";
import { exportHistoryJson, importHistoryJson } from "@/lib/storage";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  selectedId?: string;
}

export function HistoryPanel({
  isOpen,
  onClose,
  items,
  onSelect,
  onDelete,
  onClearAll,
  selectedId,
}: HistoryPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState<string>("All");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableTechs = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.technology) set.add(item.technology);
    });
    return ["All", ...Array.from(set)];
  }, [items]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.technology.toLowerCase().includes(q) ||
      item.rawError.toLowerCase().includes(q);

    const matchesTech = selectedTech === "All" || item.technology === selectedTech;

    return matchesQuery && matchesTech;
  });

  const formatTimestamp = (ts: number) => {
    try {
      const d = new Date(ts);
      return (
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " • " +
        d.toLocaleDateString([], { month: "short", day: "numeric" })
      );
    } catch {
      return "";
    }
  };

  const handleExportJson = () => {
    const dataStr = exportHistoryJson();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fixit_history_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text === "string") {
          importHistoryJson(text);
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Failed to import JSON");
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white dark:bg-[#090e18] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-transparent">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">Analysis History</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-zinc-400 font-mono">
            {items.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="text-xs px-2.5 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 rounded transition-colors flex items-center gap-1"
              title="Clear all stored history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded hover:bg-slate-100 dark:hover:bg-white/5"
            title="Close history"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Import / Export & Confirmation */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 text-xs transition-colors border border-slate-200 dark:border-transparent"
            title="Import history JSON file"
          >
            <Upload className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Import JSON</span>
          </button>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 text-xs transition-colors border border-slate-200 dark:border-transparent"
              title="Backup history to JSON"
            >
              <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Backup JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* Import error banner */}
      {importError && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-500/30 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clear confirmation dialog */}
      {showConfirmClear && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-500/30 flex items-center justify-between gap-2 text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Delete all {items.length} history entries?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClearAll();
                setShowConfirmClear(false);
              }}
              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium"
            >
              Yes, Clear
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-2 py-1 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-700 dark:text-zinc-300 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      {items.length > 0 && (
        <div className="p-3 border-b border-slate-200 dark:border-white/5 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search previous analyses..."
              className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          {/* Technology filter pills */}
          {availableTechs.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {availableTechs.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => setSelectedTech(tech)}
                  className={`px-2 py-0.5 rounded-md font-mono whitespace-nowrap transition-colors ${
                    selectedTech === tech
                      ? "bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 font-semibold"
                      : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50 dark:bg-transparent">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-zinc-500 space-y-2">
            <FileCode className="w-10 h-10 text-slate-300 dark:text-zinc-600 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">No previous analyses yet</p>
            <p className="text-xs text-slate-400 dark:text-zinc-600 max-w-xs">
              When you analyze an error, FixIt saves the result locally in your browser for quick reference.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-500">
            No history entries matching filter criteria.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                className={`group relative rounded-xl border p-3 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-500/40 text-sky-900 dark:text-sky-100 shadow-xs"
                    : "bg-white dark:bg-zinc-950/60 hover:bg-slate-50 dark:hover:bg-zinc-900/80 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 text-slate-700 dark:text-zinc-300 shadow-xs dark:shadow-none"
                }`}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-sky-700 dark:text-sky-300">
                        <Cpu className="w-2.5 h-2.5 inline mr-1" />
                        {item.technology}
                      </span>
                      {item.os && item.os !== "Unspecified" && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-transparent">
                          {item.os}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold font-mono text-slate-900 dark:text-zinc-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-1 mt-0.5 font-sans">
                      {item.result.summary}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(item.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded transition-all"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-600 group-hover:text-slate-700 dark:group-hover:text-zinc-300 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
