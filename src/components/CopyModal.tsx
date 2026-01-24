import { useEffect, useMemo, useState } from 'react';
import { Asset } from '../shared/types';

type ConflictDecision = 'rename' | 'overwrite' | 'skip';

interface CopyModalProps {
  isOpen: boolean;
  assets: Asset[];
  isBusy: boolean;
  onClose: () => void;
  onConfirm: (opts: { preserveFolders: boolean; conflictDecision: ConflictDecision }) => void;
}

export default function CopyModal({ isOpen, assets, isBusy, onClose, onConfirm }: CopyModalProps) {
  const [preserveFolders, setPreserveFolders] = useState(true);
  const [conflictDecision, setConflictDecision] = useState<ConflictDecision>('rename');

  useEffect(() => {
    if (!isOpen) return;
    setPreserveFolders(true);
    setConflictDecision('rename');
  }, [isOpen]);

  const canConfirm = useMemo(() => assets.length > 0 && !isBusy, [assets.length, isBusy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-3xl rounded-lg bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <div className="text-lg font-semibold">Copiar arquivos selecionados</div>
            <div className="text-xs text-gray-400">Escolha as opções e depois selecione a pasta de destino</div>
          </div>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50"
          >
            Fechar
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="text-sm font-medium text-gray-200">Prévia</div>
          <div className="mt-2 grid max-h-48 grid-cols-8 gap-2 overflow-y-auto">
            {assets.map((a) => (
              <div key={a.id} className="overflow-hidden rounded bg-gray-800">
                <div className="aspect-square">
                  <img src={`zona21thumb://${a.id}`} alt={a.fileName} className="h-full w-full object-cover" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded bg-gray-800 px-4 py-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={preserveFolders}
                disabled={isBusy}
                onChange={(e) => setPreserveFolders(e.target.checked)}
              />
              Preservar estrutura de pastas
            </label>

            <div className="rounded bg-gray-800 px-4 py-3">
              <div className="text-xs text-gray-400">Em caso de conflito de nome</div>
              <select
                value={conflictDecision}
                disabled={isBusy}
                onChange={(e) => setConflictDecision(e.target.value as ConflictDecision)}
                className="mt-1 w-full rounded bg-gray-700 px-3 py-2 text-sm text-white"
              >
                <option value="rename">Renomear</option>
                <option value="overwrite">Sobrescrever</option>
                <option value="skip">Ignorar</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-800 px-5 py-4">
          <button
            type="button"
            onClick={() => onConfirm({ preserveFolders, conflictDecision })}
            disabled={!canConfirm}
            className="rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {isBusy ? 'Processando…' : 'Escolher destino e copiar'}
          </button>
        </div>
      </div>
    </div>
  );
}
