import { useEffect, useMemo, useState, useRef } from 'react';
import { Asset } from '../shared/types';

type DestinationMode = 'tree' | 'dialog';
type ConflictDecision = 'overwrite' | 'rename' | 'cancel';

interface MoveModalProps {
  isOpen: boolean;
  assets: Asset[];
  currentVolumeUuid: string | null;
  currentPathPrefix: string | null;
  destinationDir: string | null;
  destinationMode: DestinationMode;
  conflictsCount: number;
  isBusy: boolean;
  understood: boolean;
  onUnderstoodChange: (v: boolean) => void;
  onDestinationModeChange: (mode: DestinationMode) => void;
  onPickDestinationDialog: () => void;
  onClose: () => void;
  onConfirm: () => void;
  onResolveConflicts: (decision: ConflictDecision) => void;
}

export default function MoveModal({
  isOpen,
  assets,
  currentVolumeUuid,
  currentPathPrefix,
  destinationDir,
  destinationMode,
  conflictsCount,
  isBusy,
  understood,
  onUnderstoodChange,
  onDestinationModeChange,
  onPickDestinationDialog,
  onClose,
  onConfirm,
  onResolveConflicts
}: MoveModalProps) {
  const [step, setStep] = useState<'setup' | 'conflicts'>('setup');
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

  useEffect(() => {
    if (!isOpen) {
      setStep('setup');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (conflictsCount > 0) setStep('conflicts');
    else setStep('setup');
  }, [isOpen, conflictsCount]);

  const canConfirm = useMemo(() => {
    if (!understood) return false;
    if (assets.length === 0) return false;
    if (destinationMode === 'tree') return Boolean(currentVolumeUuid);
    return Boolean(destinationDir);
  }, [understood, assets.length, destinationMode, currentVolumeUuid, destinationDir]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
      <div
        ref={dialogRef}
        className="mh-popover w-full max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-modal-title"
        aria-describedby="move-modal-desc"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 id="move-modal-title" className="text-lg font-semibold">Mover arquivos selecionados</h2>
            <p id="move-modal-desc" className="text-xs text-[var(--color-text-secondary)]">Prévia + confirmação obrigatória</p>
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
            aria-label={`${assets.length} arquivos selecionados para mover`}
          >
            {assets.map((a) => (
              <div key={a.id} className="overflow-hidden rounded bg-[var(--color-overlay-light)]" role="listitem">
                <div className="aspect-square">
                  <img src={`zona21thumb://${a.id}`} alt={a.fileName} className="h-full w-full object-cover" />
                </div>
              </div>
            ))}
          </div>

          {step === 'setup' && (
            <>
              <fieldset className="mt-5">
                <legend className="sr-only">Escolha o método de destino</legend>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Método de destino">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={destinationMode === 'tree'}
                    onClick={() => onDestinationModeChange('tree')}
                    disabled={isBusy}
                    className={`rounded-lg px-4 py-3 text-left transition disabled:opacity-50 ${
                      destinationMode === 'tree' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-overlay-light)] text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-medium)] border border-[var(--color-border)]'
                    }`}
                  >
                    <div className="text-sm font-semibold">Usar pasta atual (árvore)</div>
                    <div className="mt-1 text-xs opacity-90">
                      Destino: {currentVolumeUuid ? `${currentVolumeUuid}${currentPathPrefix ? `/${currentPathPrefix}` : ''}` : 'Selecione um volume/pasta na barra lateral'}
                    </div>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={destinationMode === 'dialog'}
                    onClick={() => onDestinationModeChange('dialog')}
                    disabled={isBusy}
                    className={`rounded-lg px-4 py-3 text-left transition disabled:opacity-50 ${
                      destinationMode === 'dialog' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-overlay-light)] text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-medium)] border border-[var(--color-border)]'
                    }`}
                  >
                    <div className="text-sm font-semibold">Escolher pasta (diálogo do sistema)</div>
                    <div className="mt-1 text-xs opacity-90">Escolha qualquer pasta de destino (pode ser outro volume)</div>
                  </button>
                </div>
              </fieldset>

              {destinationMode === 'dialog' && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--color-overlay-light)] border border-[var(--color-border)] px-4 py-3">
                  <div className="min-w-0">
                    <span className="text-xs text-[var(--color-text-secondary)]" id="dest-label">Destino selecionado</span>
                    <div className="truncate text-sm text-[var(--color-text-primary)]" aria-labelledby="dest-label">{destinationDir ?? 'Nenhuma pasta selecionada'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={onPickDestinationDialog}
                    disabled={isBusy}
                    className="mh-btn mh-btn-gray ml-4 px-3 py-1 text-xs"
                    aria-label="Escolher pasta de destino"
                  >
                    Escolher
                  </button>
                </div>
              )}

              <label className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => onUnderstoodChange(e.target.checked)}
                  disabled={isBusy}
                />
                Entendi (esta ação move os arquivos fisicamente no disco)
              </label>
            </>
          )}

          {step === 'conflicts' && (
            <div className="mt-5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4">
              <div className="text-sm font-semibold text-[var(--color-warning)]">Conflitos de nome detectados</div>
              <div className="mt-1 text-xs text-[var(--color-warning)]/90">
                {conflictsCount} arquivo(s) já existem no destino. Escolha como proceder.
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onResolveConflicts('overwrite')}
                  className="mh-btn mh-btn-danger px-3 py-2 text-xs"
                >
                  Substituir existentes
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onResolveConflicts('rename')}
                  className="mh-btn mh-btn-indigo px-3 py-2 text-xs"
                >
                  Renomear
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onResolveConflicts('cancel')}
                  className="mh-btn mh-btn-gray px-3 py-2 text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
          {isBusy && (
            <span className="text-sm text-[var(--color-text-secondary)]" role="status" aria-live="polite">
              Processando arquivos...
            </span>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || isBusy || step !== 'setup'}
            className="mh-btn mh-btn-indigo px-4 py-2 text-sm"
            aria-busy={isBusy}
          >
            {isBusy ? 'Processando…' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
