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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
      <div className="mh-popover w-full max-w-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-lg font-semibold">Exportar seleção como ZIP</div>
            <div className="text-xs text-gray-400">Escolha as opções e depois selecione o arquivo .zip de destino</div>
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

          <div className="mt-5">
            <label className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-200">
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

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => onConfirm({ preserveFolders })}
            disabled={!canConfirm}
            className="mh-btn mh-btn-indigo px-4 py-2 text-sm"
          >
            {isBusy ? 'Processando…' : 'Escolher arquivo e exportar'}
          </button>
        </div>
      </div>
    </div>
  );
}
