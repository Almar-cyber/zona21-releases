import { useEffect, useRef } from 'react';
import Icon from './Icon';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    confirmButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'warning',
      iconColor: 'text-[var(--color-status-rejected)]',
      buttonClass: 'mh-btn mh-btn-danger'
    },
    warning: {
      icon: 'warning',
      iconColor: 'text-[var(--color-status-favorite)]',
      buttonClass: 'mh-btn mh-btn-indigo'
    },
    info: {
      icon: 'info',
      iconColor: 'text-blue-400',
      buttonClass: 'mh-btn mh-btn-indigo'
    }
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-overlay-strong)] backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="mh-popover relative max-w-md w-full mx-4 overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
          <div className={`${style.iconColor}`}>
            <Icon name={style.icon} size={24} />
          </div>
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p id="confirm-dialog-message" className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onCancel}
            className="mh-btn mh-btn-gray px-4 py-2 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={`${style.buttonClass} px-4 py-2 text-sm`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
