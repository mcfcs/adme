import { createContext, useCallback, useContext, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type) => {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, type }].slice(-3));
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const success = useCallback((message) => show(message, "success"), [show]);
  const error = useCallback((message) => show(message, "error"), [show]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast }) {
  let style = "bg-navy text-white";
  let icon = <CircleCheck size={18} className="text-zyellow" />;
  if (toast.type === "error") {
    style = "bg-red-600 text-white";
    icon = <CircleAlert size={18} />;
  }

  return (
    <div
      role="status"
      className={`animate-toast-in flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg ${style}`}
    >
      {icon}
      {toast.message}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
