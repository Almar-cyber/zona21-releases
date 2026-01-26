import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
  actions?: ToastAction[];
  timeoutMs?: number;
};

interface ToastHostProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  useEffect(() => {
    const timers = toasts
      .filter((t) => (t.timeoutMs ?? 5000) > 0)
      .map((t) => {
        const ms = t.timeoutMs ?? 5000;
        return window.setTimeout(() => onDismiss(t.id), ms);
      });

    return () => {
      timers.forEach((x) => window.clearTimeout(x));
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  const bgByType: Record<ToastType, string> = {
    success: 'bg-emerald-700/95 border-emerald-600',
    error: 'bg-red-700/95 border-red-600',
    info: 'bg-gray-800/95 border-gray-700'
  };

  const liveByType: Record<ToastType, 'polite' | 'assertive'> = {
    success: 'polite',
    info: 'polite',
    error: 'assertive'
  };

  return (
    <div className="fixed right-4 top-4 z-[220] flex w-[360px] max-w-[90vw] flex-col gap-2" aria-live="polite" aria-relevant="additions text">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border p-4 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300 ${bgByType[t.type]}`}
          role={t.type === 'error' ? 'alert' : 'status'}
          aria-live={liveByType[t.type]}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-white">{t.message}</div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="mh-btn mh-btn-gray h-7 w-7 flex items-center justify-center text-xs"
              aria-label="Dispensar notificação"
            >
              ✕
            </button>
          </div>

          {t.actions && t.actions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {t.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={a.onClick}
                  className="mh-btn mh-btn-gray px-2 py-1 text-xs"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
