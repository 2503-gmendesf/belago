import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface ToastContextValue {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<{ fade?: number; remove?: number }>({});

  const toast = useCallback((msg: string) => {
    window.clearTimeout(timers.current.fade);
    window.clearTimeout(timers.current.remove);
    setMessage(msg);
    setLeaving(false);
    timers.current.fade = window.setTimeout(() => setLeaving(true), 2200);
    timers.current.remove = window.setTimeout(() => setMessage(null), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message && (
        <div className={`toast${leaving ? ' toast-leave' : ''}`} role="status">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
