import { useEffect } from 'react';
import Icon from './Icon';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type Toast = {
  id: string;
  type: ToastType;
  title?: string;
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

  const accentByType: Record<ToastType, string> = {
    success: 'border-l-[var(--color-success)]',
    error: 'border-l-[var(--color-error)]',
    info: 'border-l-[var(--color-primary)]',
    warning: 'border-l-[var(--color-warning)]'
  };

  const iconByType: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning'
  };

  const iconColorByType: Record<ToastType, string> = {
    success: 'text-[var(--color-success)]',
    error: 'text-[var(--color-error)]',
    info: 'text-[var(--color-primary)]',
    warning: 'text-[var(--color-warning)]'
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
          className={`rounded-xl border border-[var(--color-border)] border-l-[3px] ${accentByType[t.type]} bg-[var(--color-surface-floating)]/95 backdrop-blur-xl p-4 shadow-2xl animate-in slide-in-from-right-5 fade-in duration-300`}
          role={t.type === 'error' ? 'alert' : 'status'}
          aria-live={liveByType[t.type]}
        >
          <div className="flex items-start gap-3">
            <Icon name={iconByType[t.type]} size={18} className={`${iconColorByType[t.type]} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              {t.title && (
                <div className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
                  {t.title}
                </div>
              )}
              <div className={`${t.title ? 'text-sm' : 'text-sm'} text-[var(--color-text-primary)]`}>
                {t.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="h-6 w-6 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-light)] transition-colors flex-shrink-0"
              aria-label="Dispensar notificação"
            >
              <Icon name="close" size={14} />
            </button>
          </div>

          {t.actions && t.actions.length > 0 && (
            <div className="mt-3 ml-[30px] flex flex-wrap gap-2">
              {t.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    a.onClick();
                    onDismiss(t.id);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-overlay-light)] hover:bg-[var(--color-overlay-medium)] text-[var(--color-text-primary)] transition-colors"
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
