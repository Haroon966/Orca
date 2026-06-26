import { Check, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '../../../lib/utils';

export type ToastType = 'success' | 'error';

export type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextIdRef.current;
    setToasts((previous) => [...previous, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[10000] flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <ToastView key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg animate-in slide-in-from-bottom-2',
        toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
      )}
      role="status"
    >
      {toast.type === 'success' ? (
        <Check className="h-4 w-4 shrink-0" />
      ) : (
        <X className="h-4 w-4 shrink-0" />
      )}
      <span className="text-sm">{toast.message}</span>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
