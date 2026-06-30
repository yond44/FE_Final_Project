import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const tones = {
  success: { bar: "bg-blue", Icon: CheckCircle2 },
  error: { bar: "bg-[#b23b2e]", Icon: AlertCircle },
  info: { bar: "bg-ink", Icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, kind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const api = {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => {
          const { bar, Icon } = tones[t.kind] || tones.info;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex animate-fadeUp items-center gap-3 overflow-hidden rounded-xl border border-line bg-white pr-3 shadow-lift"
            >
              <div className={`h-full w-1 self-stretch ${bar}`} />
              <Icon size={17} className="text-ink" />
              <span className="py-3 text-sm font-medium text-ink2">{t.msg}</span>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="ml-1 rounded-md p-1 text-faint hover:bg-line2 hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
