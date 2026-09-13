import { HistoryItem, FixItResponse, SupportedOS, SupportedShell, CodeDebugHistoryItem } from "@/types";

const HISTORY_STORAGE_KEY = "fixit_analysis_history_v1";
const MAX_HISTORY_ITEMS = 50;

const emptyArray: HistoryItem[] = [];
let cachedHistory: HistoryItem[] | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  cachedHistory = null;
  listeners.forEach((listener) => listener());
}

export function subscribeHistory(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getHistorySnapshot(): HistoryItem[] {
  if (typeof window === "undefined") return emptyArray;
  if (cachedHistory === null) {
    cachedHistory = loadHistory();
  }
  return cachedHistory;
}

export function getHistoryServerSnapshot(): HistoryItem[] {
  return emptyArray;
}

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(
  errorText: string,
  result: FixItResponse,
  os?: SupportedOS,
  shell?: SupportedShell
): HistoryItem[] {
  if (typeof window === "undefined") return [];

  // Generate a concise title from the error or summary
  const firstLine = errorText.trim().split("\n")[0] || "Unknown Error";
  const title = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;

  const newItem: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    title,
    technology: result.technology || "Linux",
    rawError: errorText,
    os,
    shell,
    result,
  };

  try {
    const current = loadHistory();
    // Prepend new item and enforce maximum history size
    const updated = [newItem, ...current.filter((item) => item.rawError !== errorText)].slice(
      0,
      MAX_HISTORY_ITEMS
    );
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
    return updated;
  } catch {
    return [];
  }
}

export function removeHistoryItem(id: string): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = loadHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
    return updated;
  } catch {
    return [];
  }
}

export function clearAllHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    notifyListeners();
  } catch {
    // ignore
  }
}

export function exportHistoryJson(): string {
  const items = loadHistory();
  return JSON.stringify(items, null, 2);
}

export function importHistoryJson(jsonStr: string): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error("Imported data must be an array of history items.");
    }
    const current = loadHistory();
    const merged = [...parsed, ...current];
    // Deduplicate by rawError or id
    const seen = new Set<string>();
    const deduplicated: HistoryItem[] = [];
    for (const item of merged) {
      const key = item.rawError || item.id;
      if (key && !seen.has(key) && item.result && item.title) {
        seen.add(key);
        deduplicated.push(item);
      }
    }
    const finalItems = deduplicated.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(finalItems));
    notifyListeners();
    return finalItems;
  } catch (err) {
    throw new Error(`Invalid history JSON: ${err instanceof Error ? err.message : "Parse error"}`);
  }
}

// ============================================================
// Code Doctor history store (parallel to error history store)
// ============================================================

const CODE_DEBUG_STORAGE_KEY = "fixit_code_debug_history_v1";
const MAX_CODE_DEBUG_ITEMS = 30;

const emptyCodeDebugArray: CodeDebugHistoryItem[] = [];
let cachedCodeDebugHistory: CodeDebugHistoryItem[] | null = null;
const codeDebugListeners = new Set<() => void>();

function notifyCodeDebugListeners() {
  cachedCodeDebugHistory = null;
  codeDebugListeners.forEach((listener) => listener());
}

export function subscribeCodeDebugHistory(callback: () => void): () => void {
  codeDebugListeners.add(callback);
  return () => {
    codeDebugListeners.delete(callback);
  };
}

export function getCodeDebugSnapshot(): CodeDebugHistoryItem[] {
  if (typeof window === "undefined") return emptyCodeDebugArray;
  if (cachedCodeDebugHistory === null) {
    cachedCodeDebugHistory = loadCodeDebugHistory();
  }
  return cachedCodeDebugHistory;
}

export function getCodeDebugServerSnapshot(): CodeDebugHistoryItem[] {
  return emptyCodeDebugArray;
}

export function loadCodeDebugHistory(): CodeDebugHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CODE_DEBUG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function saveCodeDebugHistoryItem(
  rawCode: string,
  result: CodeDebugHistoryItem["result"],
  language: string
): CodeDebugHistoryItem[] {
  if (typeof window === "undefined") return [];
  const firstLine = rawCode.trim().split("\n")[0] || "Untitled Snippet";
  const title = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;

  const newItem: CodeDebugHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    title,
    language,
    rawCode,
    result,
  };

  try {
    const current = loadCodeDebugHistory();
    const updated = [newItem, ...current.filter((item) => item.rawCode !== rawCode)].slice(
      0,
      MAX_CODE_DEBUG_ITEMS
    );
    localStorage.setItem(CODE_DEBUG_STORAGE_KEY, JSON.stringify(updated));
    notifyCodeDebugListeners();
    return updated;
  } catch {
    return [];
  }
}

export function removeCodeDebugHistoryItem(id: string): CodeDebugHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = loadCodeDebugHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(CODE_DEBUG_STORAGE_KEY, JSON.stringify(updated));
    notifyCodeDebugListeners();
    return updated;
  } catch {
    return [];
  }
}

export function clearAllCodeDebugHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CODE_DEBUG_STORAGE_KEY);
    notifyCodeDebugListeners();
  } catch {
    // ignore
  }
}
