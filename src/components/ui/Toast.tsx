"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-sm text-sm max-w-sm animate-[slideIn_0.2s_ease-out] ${
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-800/60 text-emerald-200"
                : t.type === "error"
                ? "bg-red-950/90 border-red-800/60 text-red-200"
                : "bg-zinc-900/90 border-zinc-700/60 text-zinc-200"
            }`}
          >
            <span className="flex-shrink-0">
              {t.type === "success" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-emerald-400">
                  <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm3.22 4.97L7 10.19 4.78 7.97l-.72.72L7 11.63l4.94-4.94-.72-.72z" />
                </svg>
              )}
              {t.type === "error" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-red-400">
                  <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM8 4a.75.75 0 0 0-.75.75v4a.75.75 0 0 0 1.5 0v-4A.75.75 0 0 0 8 4z" />
                </svg>
              )}
              {t.type === "info" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-blue-400">
                  <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm-.75 4v1.5h1.5V5h-1.5zm0 3v4h1.5V8h-1.5z" />
                </svg>
              )}
            </span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 text-zinc-500 hover:text-white transition"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
