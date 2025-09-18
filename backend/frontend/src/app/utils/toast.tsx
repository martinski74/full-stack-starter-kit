"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

const ToastContext = createContext<{ addToast: (message: string, kind?: ToastKind) => void } | null>(null);

// Global cache to survive provider remounts (dev/StrictMode)
declare global {
  interface Window { __toastDedup?: { key: string; at: number } }
}

const DEDUP_MS = 2500;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastToastRef = useRef<{ key: string; at: number } | null>(null);

  const addToast = useCallback((message: string, kind: ToastKind = "info") => {
    const now = Date.now();
    const key = `${kind}::${message}`;

    const last = lastToastRef.current;
    const globalLast = typeof window !== 'undefined' ? window.__toastDedup : undefined;

    if (
      (last && last.key === key && now - last.at < DEDUP_MS) ||
      (globalLast && globalLast.key === key && now - globalLast.at < DEDUP_MS) ||
      (toasts.length > 0 && `${toasts[toasts.length - 1].kind}::${toasts[toasts.length - 1].message}` === key)
    ) {
      return;
    }

    lastToastRef.current = { key, at: now };
    if (typeof window !== 'undefined') window.__toastDedup = { key, at: now };

    const id = now + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, [toasts]);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`min-w-[240px] max-w-[360px] rounded-lg shadow-lg px-4 py-3 text-sm text-white border backdrop-blur-md transition-all
              ${t.kind === "success" ? "bg-green-600/90 border-green-500" : ""}
              ${t.kind === "error" ? "bg-red-600/90 border-red-500" : ""}
              ${t.kind === "info" ? "bg-blue-600/90 border-blue-500" : ""}
              ${t.kind === "warning" ? "bg-yellow-600/90 border-yellow-500" : ""}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
