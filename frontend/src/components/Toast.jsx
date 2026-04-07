import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "../lib/utils";

const Toast = ({ message, type = "info", onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600" aria-hidden />,
    error: <AlertCircle className="w-5 h-5 text-red-600" aria-hidden />,
    info: <Info className="w-5 h-5 text-slate-500" aria-hidden />,
  };

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-slate-800",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-white border-slate-200 text-slate-700",
  };

  return (
    <div
      className={cn(
        "flex items-center w-full max-w-sm p-3 mb-3 text-sm bg-white rounded-md border shadow-md shadow-slate-900/5",
        styles[type],
      )}
      role="alert"
    >
      <div className="inline-flex items-center justify-center shrink-0 w-8 h-8">{icons[type]}</div>
      <div className="ml-2.5 break-words flex-1 leading-snug">{message}</div>
      <button
        type="button"
        className="ml-2 shrink-0 text-slate-400 hover:text-slate-800 rounded p-1.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        aria-label="Close"
        onClick={onClose}
      >
        <span className="sr-only">Close</span>
        <X className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

export default Toast;
