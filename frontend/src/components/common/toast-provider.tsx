import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { CheckCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error";

type ToastMessage = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({
      id: Date.now(),
      message,
      type,
    });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className={`fixed right-5 top-5 z-[100] flex max-w-sm items-center gap-3 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={19} />
          ) : (
            <AlertCircle size={19} />
          )}

          <span className="flex-1">{toast.message}</span>

          <button
            type="button"
            onClick={closeToast}
            className="text-white/80 hover:text-white"
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
