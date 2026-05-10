import { useState, useEffect, useCallback } from "react";

// Simple event-based toast system
type ToastType = "default" | "success" | "error" | "loading";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  icon?: string;
  duration: number;
}

let nextId = 1;
let listeners: Array<(toasts: ToastItem[]) => void> = [];
let currentToasts: ToastItem[] = [];

function notify() {
  listeners.forEach((l) => l([...currentToasts]));
}

function addToast(message: string, type: ToastType = "default", options?: { icon?: string; duration?: number }) {
  const id = nextId++;
  const duration = options?.duration ?? 3000;
  const item: ToastItem = { id, message, type, icon: options?.icon, duration };
  currentToasts = [...currentToasts, item];
  notify();

  if (duration !== Infinity) {
    setTimeout(() => {
      currentToasts = currentToasts.filter((t) => t.id !== id);
      notify();
    }, duration);
  }

  return id;
}

// Public API matching react-hot-toast/sonner interface
function toast(message: string, options?: { icon?: string; duration?: number }) {
  return addToast(message, "default", options);
}
toast.success = (message: string, options?: { icon?: string; duration?: number }) => addToast(message, "success", options);
toast.error = (message: string, options?: { icon?: string; duration?: number }) => addToast(message, "error", options);
toast.loading = (message: string, options?: { icon?: string; duration?: number }) => addToast(message, "loading", { ...options, duration: options?.duration ?? Infinity });
toast.dismiss = (id?: number) => {
  if (id) {
    currentToasts = currentToasts.filter((t) => t.id !== id);
  } else {
    currentToasts = [];
  }
  notify();
};
toast.promise = <T,>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) => {
  const id = toast.loading(msgs.loading);
  promise
    .then(() => {
      currentToasts = currentToasts.filter((t) => t.id !== id);
      addToast(msgs.success, "success");
    })
    .catch(() => {
      currentToasts = currentToasts.filter((t) => t.id !== id);
      addToast(msgs.error, "error");
    });
  return promise;
};

// Toaster component
function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    listeners.push(setToasts);
    // Sync with any existing toasts
    if (currentToasts.length > 0) {
      setToasts([...currentToasts]);
    }
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    notify();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          style={{
            pointerEvents: "auto",
            background: "#1a1a1a",
            color: "#ffffff",
            border: `1px solid ${t.type === "error" ? "#ef4444" : t.type === "success" ? "#f59e0b" : "#333333"}`,
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 200,
            maxWidth: 360,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            cursor: "pointer",
            animation: "toast-in 0.3s ease-out",
          }}
        >
          {t.icon && <span>{t.icon}</span>}
          {!t.icon && t.type === "success" && <span style={{ color: "#f59e0b" }}>✓</span>}
          {!t.icon && t.type === "error" && <span style={{ color: "#ef4444" }}>✕</span>}
          {!t.icon && t.type === "loading" && <span className="animate-spin">⟳</span>}
          <span>{t.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export { toast, Toaster };
export default toast;
