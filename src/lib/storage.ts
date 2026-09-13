import { HistoryItem, FixItResponse, SupportedOS, SupportedShell } from "@/types";

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
