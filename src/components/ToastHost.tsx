import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

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
  dedupeKey?: string;
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
    success: 'bg-[var(--color-success)] text-white',
    error: 'bg-[var(--color-error)] text-white',
    info: 'bg-[var(--color-primary)] text-white',
    warning: 'bg-[var(--color-warning)] text-white'
  };

  const liveByType: Record<ToastType, 'polite' | 'assertive'> = {
    success: 'polite',
    info: 'polite',
    error: 'assertive',
    warning: 'polite'
  };

  return (
    <div className="fixed right-4 top-4 z-[300] flex w-[360px] max-w-[90vw] flex-col gap-2" aria-live="polite" aria-relevant="additions text">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border p-4 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300 ${bgByType[t.type]}`}
          role={t.type === 'error' ? 'alert' : 'status'}
          aria-live={liveByType[t.type]}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-[var(--color-text-primary)]">{t.message}</div>
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
            <div className="mt-3 flex flex-wrap gap-2">
              {t.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    a.onClick();
                    onDismiss(t.id);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-overlay-medium)] hover:bg-[var(--color-overlay-strong)] text-[var(--color-text-primary)] transition-colors"
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
