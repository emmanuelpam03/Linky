"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toast: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function getToastStyles(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return {
        container: "border-(--color-brand-200) bg-(--color-brand-50)",
        title: "text-(--color-brand-900)",
        description: "text-(--color-brand-800)",
        icon: <Check className="size-4 text-(--color-brand-700)" />,
      };
    case "error":
      return {
        container: "border-(--color-coral-200) bg-(--color-coral-50)",
        title: "text-(--color-coral-700)",
        description: "text-(--color-coral-600)",
        icon: <CircleAlert className="size-4 text-(--color-coral-600)" />,
      };
    case "info":
      return {
        container: "border-(--color-border-tertiary) bg-(--color-background-primary)",
        title: "text-(--color-text-primary)",
        description: "text-(--color-text-secondary)",
        icon: <Info className="size-4 text-(--color-text-secondary)" />,
      };
    default:
      return {
        container: "border-(--color-border-tertiary) bg-(--color-background-primary)",
        title: "text-(--color-text-primary)",
        description: "text-(--color-text-secondary)",
        icon: <Info className="size-4 text-(--color-text-secondary)" />,
      };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ duration = 3500, variant = "default", ...input }: ToastInput) => {
      const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, duration, variant, ...input }]);
      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({ toast, dismiss }),
    [dismiss, toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-100 flex justify-center px-4">
        <div className="flex w-full max-w-sm flex-col gap-2">
          {toasts.map((item) => {
            const styles = getToastStyles(item.variant ?? "default");
            return (
              <div
                key={item.id}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
                  styles.container,
                )}
              >
                <div className="mt-0.5 shrink-0">{styles.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold", styles.title)}>{item.title}</p>
                  {item.description && (
                    <p className={cn("mt-0.5 text-sm", styles.description)}>{item.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 rounded-md p-1 text-(--color-text-tertiary) hover:bg-black/5"
                  aria-label="Dismiss toast"
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
