import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-600',
    title: 'text-emerald-900',
    msg: 'text-emerald-700',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    msg: 'text-red-700',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    msg: 'text-amber-700',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    msg: 'text-blue-700',
    progress: 'bg-blue-500',
  },
};

function ToastItem({ toast, onDismiss }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const Icon = TOAST_ICONS[toast.type] || Info;

  return (
    <div
      className={`
        relative flex items-start gap-3 w-[380px] max-w-[calc(100vw-32px)]
        px-4 py-3.5 rounded-xl border shadow-lg shadow-black/5
        ${style.bg}
        animate-in slide-in-from-right duration-300
      `}
      role="alert"
    >
      <div className={`shrink-0 mt-0.5 ${style.icon}`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`text-[13px] font-semibold ${style.title} leading-tight`}>
            {toast.title}
          </p>
        )}
        <p className={`text-[12px] ${style.msg} leading-relaxed ${toast.title ? 'mt-0.5' : ''}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 mt-0.5 p-0.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-black/5 overflow-hidden">
        <div
          className={`h-full ${style.progress} rounded-full`}
          style={{
            animation: `toast-progress ${toast.duration || 3500}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 3500 }) => {
    const id = ++counterRef.current;
    const toast = { id, type, title, message, duration };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const contextValue = {
    toast: {
      success: (message, title) => addToast({ type: 'success', title, message }),
      error: (message, title) => addToast({ type: 'error', title, message }),
      warning: (message, title) => addToast({ type: 'warning', title, message }),
      info: (message, title) => addToast({ type: 'info', title, message }),
    },
    dismiss,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
      {/* Keyframe animation for progress bar */}
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes slide-in-from-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-in.slide-in-from-right {
          animation: slide-in-from-right 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
