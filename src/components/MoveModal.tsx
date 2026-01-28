import { useEffect, useMemo, useState } from 'react';
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
      <div className="mh-popover w-full max-w-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-lg font-semibold">Mover arquivos selecionados</div>
            <div className="text-xs text-gray-400">Prévia + confirmação obrigatória</div>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="mh-btn mh-btn-gray px-3 py-1 text-sm"
          >
            Fechar
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="text-sm font-medium text-gray-200">Prévia</div>
          <div className="mt-2 grid max-h-48 grid-cols-8 gap-2 overflow-y-auto">
            {assets.map((a) => (
              <div key={a.id} className="overflow-hidden rounded bg-white/5">
                <div className="aspect-square">
                  <img src={`zona21thumb://${a.id}`} alt={a.fileName} className="h-full w-full object-cover" />
                </div>
              </div>
            ))}
          </div>

          {step === 'setup' && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onDestinationModeChange('tree')}
                  disabled={isBusy}
                  className={`rounded-lg px-4 py-3 text-left transition disabled:opacity-50 ${
                    destinationMode === 'tree' ? 'bg-[#4F46E5] text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="text-sm font-semibold">Usar pasta atual (árvore)</div>
                  <div className="mt-1 text-xs opacity-90">
                    Destino: {currentVolumeUuid ? `${currentVolumeUuid}${currentPathPrefix ? `/${currentPathPrefix}` : ''}` : 'Selecione um volume/pasta na barra lateral'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onDestinationModeChange('dialog')}
                  disabled={isBusy}
                  className={`rounded-lg px-4 py-3 text-left transition disabled:opacity-50 ${
                    destinationMode === 'dialog' ? 'bg-[#4F46E5] text-white' : 'bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="text-sm font-semibold">Escolher pasta (diálogo do sistema)</div>
                  <div className="mt-1 text-xs opacity-90">Escolha qualquer pasta de destino (pode ser outro volume)</div>
                </button>
              </div>

              {destinationMode === 'dialog' && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-400">Destino selecionado</div>
                    <div className="truncate text-sm text-gray-200">{destinationDir ?? 'Nenhuma pasta selecionada'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={onPickDestinationDialog}
                    disabled={isBusy}
                    className="mh-btn mh-btn-gray ml-4 px-3 py-1 text-xs"
                  >
                    Escolher
                  </button>
                </div>
              )}

              <label className="mt-4 flex items-center gap-2 text-sm text-gray-200">
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
            <div className="mt-5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="text-sm font-semibold text-yellow-200">Conflitos de nome detectados</div>
              <div className="mt-1 text-xs text-yellow-200/90">
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

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || isBusy || step !== 'setup'}
            className="mh-btn mh-btn-indigo px-4 py-2 text-sm"
          >
            {isBusy ? 'Processando…' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
