import { useEffect, useRef } from 'react';

export type LastOperation =
  | {
      kind: 'copy';
      title: string;
      destinationDir?: string;
      copied?: number;
      skipped?: number;
      skippedMissing?: number;
      skippedOffline?: number;
      failed?: number;
    }
  | {
      kind: 'zip';
      title: string;
      path?: string;
      added?: number;
      skippedMissing?: number;
      skippedOffline?: number;
      failed?: number;
    }
  | {
      kind: 'export';
      title: string;
      path?: string;
      count?: number;
    }
  | {
      kind: 'info';
      title: string;
      details?: string;
    };

interface LastOperationPanelProps {
  op: LastOperation | null;
  onDismiss: () => void;
  onRevealPath: (p: string) => void;
  onCopyText: (text: string) => void;
}

export default function LastOperationPanel({ op, onDismiss, onRevealPath, onCopyText }: LastOperationPanelProps) {
  if (!op) return null;

  const dismissBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    dismissBtnRef.current?.focus();
  }, [op]);

  const primaryPath = (() => {
    if (op.kind === 'copy') return op.destinationDir || null;
    if (op.kind === 'zip') return op.path || null;
    if (op.kind === 'export') return op.path || null;
    return null;
  })();

  const subtitle = (() => {
    if (op.kind === 'copy') {
      const parts: string[] = [];
      if (typeof op.copied === 'number') parts.push(`copiados ${op.copied}`);
      if (typeof op.skipped === 'number' && op.skipped > 0) parts.push(`ignorados ${op.skipped}`);
      if (typeof op.skippedOffline === 'number' && op.skippedOffline > 0) parts.push(`offline ${op.skippedOffline}`);
      if (typeof op.skippedMissing === 'number' && op.skippedMissing > 0) parts.push(`ausentes ${op.skippedMissing}`);
      if (typeof op.failed === 'number' && op.failed > 0) parts.push(`falharam ${op.failed}`);
      return parts.join(' · ');
    }
    if (op.kind === 'zip') {
      const parts: string[] = [];
      if (typeof op.added === 'number') parts.push(`adicionados ${op.added}`);
      if (typeof op.skippedOffline === 'number' && op.skippedOffline > 0) parts.push(`offline ${op.skippedOffline}`);
      if (typeof op.skippedMissing === 'number' && op.skippedMissing > 0) parts.push(`ausentes ${op.skippedMissing}`);
      if (typeof op.failed === 'number' && op.failed > 0) parts.push(`falharam ${op.failed}`);
      return parts.join(' · ');
    }
    if (op.kind === 'export') {
      const parts: string[] = [];
      if (typeof op.count === 'number') parts.push(`total ${op.count}`);
      return parts.join(' · ');
    }
    return op.details || '';
  })();

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-[70] mx-auto w-full max-w-xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-floating)]/95 backdrop-blur-xl p-3 shadow-2xl"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-text-primary)]">{op.title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{subtitle}</div>}
          {primaryPath && <div className="mt-1 break-all text-[11px] text-[var(--color-text-secondary)]">{primaryPath}</div>}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          ref={dismissBtnRef}
          className="mh-btn mh-btn-gray px-2 py-1 text-xs text-[var(--color-text-primary)]"
        >
          Fechar
        </button>
      </div>

      {primaryPath && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onRevealPath(primaryPath)}
            className="mh-btn mh-btn-gray px-2 py-1 text-xs text-[var(--color-text-primary)]"
          >
            Revelar
          </button>
          <button
            type="button"
            onClick={() => onCopyText(primaryPath)}
            className="mh-btn mh-btn-gray px-2 py-1 text-xs text-[var(--color-text-primary)]"
          >
            Copiar caminho
          </button>
        </div>
      )}
    </div>
  );
}
