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
      iconColor: 'text-red-400',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'warning',
      iconColor: 'text-yellow-400',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'info',
      iconColor: 'text-blue-400',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-gray-800 rounded-xl shadow-2xl border border-white/10 max-w-md w-full mx-4 overflow-hidden"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className={`${style.iconColor}`}>
            <Icon name={style.icon} size={24} />
          </div>
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p id="confirm-dialog-message" className="text-gray-300 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 bg-gray-900/50 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${style.buttonColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
