import { useEffect, useMemo, useState, useRef } from 'react';
import { Asset } from '../shared/types';

export type ExportMode = 'copy' | 'zip' | 'collection';
type ConflictDecision = 'rename' | 'overwrite' | 'skip';

interface UnifiedExportModalProps {
  mode: ExportMode;
  isOpen: boolean;
  assets: Asset[];
  isBusy: boolean;
  collectionName?: string;
  onClose: () => void;
  onConfirm: (opts: { preserveFolders: boolean; conflictDecision?: ConflictDecision }) => void;
}

export default function UnifiedExportModal({
  mode,
  isOpen,
  assets,
  isBusy,
  collectionName,
  onClose,
  onConfirm
}: UnifiedExportModalProps) {
  const [preserveFolders, setPreserveFolders] = useState(true);
  const [conflictDecision, setConflictDecision] = useState<ConflictDecision>('rename');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and ESC key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isBusy, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setPreserveFolders(true);
    setConflictDecision('rename');
  }, [isOpen]);

  const canConfirm = useMemo(() => assets.length > 0 && !isBusy, [assets.length, isBusy]);

  // Dynamic content based on mode
  const content = useMemo(() => {
    switch (mode) {
      case 'copy':
        return {
          title: 'Copiar arquivos selecionados',
          description: 'Escolha as opções e depois selecione a pasta de destino',
          buttonText: 'Escolher destino e copiar',
          busyText: 'Copiando arquivos...',
          ariaLabel: `${assets.length} arquivos selecionados para copiar`,
          showConflictDecision: true,
        };
      case 'zip':
        return {
          title: 'Exportar seleção como ZIP',
          description: 'Escolha as opções e depois selecione o arquivo .zip de destino',
          buttonText: 'Escolher arquivo e exportar',
          busyText: 'Exportando...',
          ariaLabel: `${assets.length} arquivos para exportar`,
          showConflictDecision: false,
        };
      case 'collection':
        return {
          title: collectionName ? `Exportar coleção: ${collectionName}` : 'Exportar coleção',
          description: 'A coleção será exportada para uma pasta com o nome da coleção',
          buttonText: 'Exportar coleção',
          busyText: 'Exportando coleção...',
          ariaLabel: `${assets.length} arquivos da coleção para exportar`,
          showConflictDecision: true,
        };
    }
  }, [mode, assets.length, collectionName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--color-overlay-strong)] p-6">
      <div
        ref={dialogRef}
        className="mh-popover w-full max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        aria-describedby="export-modal-desc"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 id="export-modal-title" className="text-lg font-semibold">{content.title}</h2>
            <p id="export-modal-desc" className="text-xs text-[var(--color-text-secondary)]">{content.description}</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            disabled={isBusy}
            className="mh-btn mh-btn-gray px-3 py-1 text-sm"
            aria-label="Fechar modal"
          >
            Fechar
          </button>
        </div>

        <div className="px-5 py-4">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Prévia</h3>
          <div
            className="mt-2 grid max-h-48 grid-cols-8 gap-2 overflow-y-auto"
            role="list"
            aria-label={content.ariaLabel}
          >
            {assets.map((a) => (
              <div key={a.id} className="overflow-hidden rounded bg-[var(--color-overlay-light)]" role="listitem">
                <div className="aspect-square">
                  <img src={`zona21thumb://${a.id}`} alt={a.fileName} className="h-full w-full object-cover" />
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-5 ${content.showConflictDecision ? 'grid grid-cols-2 gap-3' : ''}`}>
            <label className="flex items-center gap-2 rounded-lg bg-[var(--color-overlay-light)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={preserveFolders}
                disabled={isBusy}
                onChange={(e) => setPreserveFolders(e.target.checked)}
                aria-describedby="preserve-folders-desc"
              />
              <span id="preserve-folders-desc">Preservar estrutura de pastas</span>
            </label>

            {content.showConflictDecision && (
              <div className="rounded-lg bg-[var(--color-overlay-light)] border border-[var(--color-border)] px-4 py-3">
                <label htmlFor="conflict-select" className="text-xs text-[var(--color-text-secondary)]">
                  Em caso de conflito de nome
                </label>
                <select
                  id="conflict-select"
                  value={conflictDecision}
                  disabled={isBusy}
                  onChange={(e) => setConflictDecision(e.target.value as ConflictDecision)}
                  className="mh-control mt-1 w-full px-3 py-2 text-sm"
                >
                  <option value="rename">Renomear</option>
                  <option value="overwrite">Sobrescrever</option>
                  <option value="skip">Ignorar</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
          {isBusy && (
            <span className="text-sm text-[var(--color-text-secondary)]" role="status" aria-live="polite">
              {content.busyText}
            </span>
          )}
          <button
            type="button"
            onClick={() => onConfirm({
              preserveFolders,
              ...(content.showConflictDecision && { conflictDecision })
            })}
            disabled={!canConfirm}
            className="mh-btn mh-btn-indigo px-4 py-2 text-sm"
            aria-busy={isBusy}
          >
            {isBusy ? 'Processando…' : content.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
