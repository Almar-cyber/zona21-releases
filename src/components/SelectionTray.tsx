import { useState } from 'react';
import { Asset } from '../shared/types';
import MaterialIcon from './MaterialIcon.tsx';

interface SelectionTrayProps {
  selectedAssets: Asset[];
  currentCollectionId: string | null;
  isBusy?: boolean;
  onRemoveFromSelection: (assetId: string) => void;
  onClearSelection: () => void;
  onCopySelected: (assetIds: string[]) => void;
  onMoveSelected: (assetIds: string[]) => void;
  onTrashSelected: (assetIds: string[]) => void;
  onExportSelected: (type: 'premiere' | 'lightroom') => void;
  onExportZipSelected: (assetIds: string[]) => void;
  onRemoveFromCollection?: (assetIds: string[]) => void;
}

export default function SelectionTray({
  selectedAssets,
  currentCollectionId,
  isBusy,
  onRemoveFromSelection,
  onClearSelection,
  onCopySelected,
  onMoveSelected,
  onTrashSelected,
  onExportSelected,
  onExportZipSelected,
  onRemoveFromCollection
}: SelectionTrayProps) {
  const busy = !!isBusy;
  const [isExportOpen, setIsExportOpen] = useState(false);

  void onRemoveFromSelection;
  void onCopySelected;

  if (selectedAssets.length === 0) return null;

  const ids = selectedAssets.map((a) => a.id);
  const selectionLabel = selectedAssets.length === 1 ? '1 selecionado' : `${selectedAssets.length} selecionados`;

  const btnBase =
    'mh-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold';
  const btnSecondary = `${btnBase} mh-btn-gray`;
  const btnPrimary = `${btnBase} mh-btn-gray`;
  const btnDanger = `${btnBase} mh-btn-gray text-red-300`;
  const btnRemoveFromCollection = `${btnBase} mh-btn-gray text-red-300`;

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-2 shadow-2xl backdrop-blur-xl">
        <div className="px-3 py-2 text-sm font-semibold text-white">
          {selectionLabel}
        </div>
        <div className="mx-1 h-6 w-px bg-white/10" />
        <button
          type="button"
          onClick={() => onMoveSelected(ids)}
          disabled={busy}
          className={btnPrimary}
          title="Mover"
        >
          <MaterialIcon name="drive_file_move" className="text-[18px]" />
          <span>Mover</span>
        </button>

        {currentCollectionId && onRemoveFromCollection && (
          <button
            type="button"
            onClick={() => onRemoveFromCollection(ids)}
            disabled={busy}
            className={btnRemoveFromCollection}
            title="Remover da coleção"
          >
            <MaterialIcon name="remove" className="text-[18px]" />
            <span>Remover</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          disabled={busy}
          className={`${btnSecondary} ${isExportOpen ? 'mh-btn-selected' : ''}`}
          title="Exportar"
          aria-pressed={isExportOpen}
        >
          <MaterialIcon name="ios_share" className="text-[18px]" />
          <span>Exportar</span>
        </button>
        <button
          type="button"
          onClick={() => onTrashSelected(ids)}
          disabled={busy}
          className={btnDanger}
          title="Apagar"
        >
          <MaterialIcon name="delete" className="text-[18px]" />
          <span>Apagar</span>
        </button>
        <div className="mx-1 h-6 w-px bg-white/10" />
        <button
          type="button"
          onClick={onClearSelection}
          disabled={busy}
          className={btnSecondary}
          title="Limpar seleção"
        >
          <MaterialIcon name="close" className="text-[18px]" />
          <span>Limpar</span>
        </button>
      </div>

      {isExportOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setIsExportOpen(false)}>
          <div
            className="mh-popover w-full max-w-sm p-4 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Formato de exportação"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Exportar</div>
              <button
                type="button"
                className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
                onClick={() => setIsExportOpen(false)}
                aria-label="Fechar"
              >
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-400">Escolha um formato</div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="mh-btn mh-btn-gray w-full px-3 py-2 text-left text-sm"
                disabled={busy}
                onClick={() => {
                  onExportSelected('premiere');
                  setIsExportOpen(false);
                }}
              >
                XML
                <div className="text-xs text-gray-400">Premiere / Resolve</div>
              </button>

              <button
                type="button"
                className="mh-btn mh-btn-gray w-full px-3 py-2 text-left text-sm"
                disabled={busy}
                onClick={() => {
                  onExportSelected('lightroom');
                  setIsExportOpen(false);
                }}
              >
                XMP
                <div className="text-xs text-gray-400">Lightroom</div>
              </button>

              <button
                type="button"
                className="mh-btn mh-btn-gray w-full px-3 py-2 text-left text-sm"
                disabled={busy}
                onClick={() => {
                  onExportZipSelected(ids);
                  setIsExportOpen(false);
                }}
              >
                ZIP
                <div className="text-xs text-gray-400">Empacotar arquivos selecionados</div>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                onClick={() => setIsExportOpen(false)}
                disabled={busy}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
