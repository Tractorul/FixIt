"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-2 fade-in duration-200 max-w-sm ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-500/40 dark:text-emerald-200"
                : toast.type === "error"
                ? "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/90 dark:border-rose-500/40 dark:text-rose-200"
                : "bg-white border-slate-200 text-slate-900 dark:bg-zinc-900/90 dark:border-white/15 dark:text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
