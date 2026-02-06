import { useEffect, useMemo, useState } from 'react';
import { Asset } from '../shared/types';

interface ExportZipModalProps {
  isOpen: boolean;
  assets: Asset[];
  isBusy: boolean;
  onClose: () => void;
  onConfirm: (opts: { preserveFolders: boolean }) => void;
}

export default function ExportZipModal({ isOpen, assets, isBusy, onClose, onConfirm }: ExportZipModalProps) {
  const [preserveFolders, setPreserveFolders] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setPreserveFolders(true);
  }, [isOpen]);

  const canConfirm = useMemo(() => assets.length > 0 && !isBusy, [assets.length, isBusy]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-overlay-strong)] p-6">
      <div
        className="mh-popover w-full max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-zip-title"
        aria-describedby="export-zip-desc"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 id="export-zip-title" className="text-lg font-semibold">Exportar seleção como ZIP</h2>
            <p id="export-zip-desc" className="text-xs text-[var(--color-text-secondary)]">Escolha as opções e depois selecione o arquivo .zip de destino</p>
          </div>
          <button
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
            aria-label={`${assets.length} arquivos para exportar`}
          >
            {assets.map((a) => (
              <div key={a.id} className="overflow-hidden rounded bg-[var(--color-overlay-light)]" role="listitem">
                <div className="aspect-square">
                  <img src={`zona21thumb://${a.id}`} alt={a.fileName} className="h-full w-full object-cover" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <label className="flex items-center gap-2 rounded-lg bg-[var(--color-overlay-light)] border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={preserveFolders}
                disabled={isBusy}
                onChange={(e) => setPreserveFolders(e.target.checked)}
              />
              Preservar estrutura de pastas
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
          {isBusy && (
            <span className="text-sm text-[var(--color-text-secondary)]" role="status" aria-live="polite">
              Exportando...
            </span>
          )}
          <button
            type="button"
            onClick={() => onConfirm({ preserveFolders })}
            disabled={!canConfirm}
            className="mh-btn mh-btn-indigo px-4 py-2 text-sm"
            aria-busy={isBusy}
          >
            {isBusy ? 'Processando…' : 'Escolher arquivo e exportar'}
          </button>
        </div>
      </div>
    </div>
  );
}
