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
  const [thumbErrorById, setThumbErrorById] = useState<Record<string, boolean>>({});

  void onRemoveFromSelection;
  void onCopySelected;

  if (selectedAssets.length === 0) return null;

  const ids = selectedAssets.map((a) => a.id);

  const btnAction = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-white';

  const maxPreviewThumbs = 4;
  const previewAssets = selectedAssets.slice(0, maxPreviewThumbs);
  const remainingCount = selectedAssets.length - maxPreviewThumbs;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-[60] flex justify-center px-4 w-full sm:w-auto">
      <div className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-[#0d0d1a]/95 px-3 sm:px-4 py-2 sm:py-3 shadow-2xl backdrop-blur-xl">
        
        {/* Thumbnail Preview - Hidden on mobile */}
        <div className="hidden sm:flex items-center -space-x-2">
          {previewAssets.slice(0, 2).map((asset, idx) => (
            <div
              key={asset.id}
              className="relative h-10 w-10 rounded-lg overflow-hidden border-2 border-[#0d0d1a] bg-gray-800 shadow-md"
              style={{ zIndex: idx }}
            >
              {asset.thumbnailPaths && asset.thumbnailPaths.length > 0 && !thumbErrorById[asset.id] ? (
                <img
                  src={`zona21thumb://${asset.id}`}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => {
                    setThumbErrorById((prev) => ({ ...prev, [asset.id]: true }));
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-700">
                  <MaterialIcon
                    name={asset.mediaType === 'video' ? 'videocam' : 'image'}
                    className="text-gray-500 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Count badge */}
        <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/10 text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
          {selectedAssets.length} {selectedAssets.length === 1 ? 'item' : 'itens'}
        </div>

        {/* Divider - Hidden on mobile */}
        <div className="hidden sm:block h-6 w-px bg-white/10" />

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mover - Primary action */}
          <button
              title="Mover arquivos"
              type="button"
              onClick={() => onMoveSelected(ids)}
              disabled={busy}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-[#5B5BD6] hover:bg-[#4C4CC4] flex items-center gap-1.5 text-sm font-medium text-white transition-colors"
            >
              <MaterialIcon name="drive_file_move" className="text-base sm:text-lg" />
              <span className="hidden sm:inline">Mover</span>
            </button>

          {/* Remove from collection */}
          {currentCollectionId && onRemoveFromCollection && (
            <button
                title="Remover da coleção"
                type="button"
                onClick={() => onRemoveFromCollection(ids)}
                disabled={busy}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-white/10 flex items-center gap-1.5 text-sm font-medium text-orange-400 transition-colors"
              >
                <MaterialIcon name="playlist_remove" className="text-base sm:text-lg" />
                <span className="hidden sm:inline">Remover</span>
              </button>
          )}

          {/* Exportar */}
          <button
              title="Exportar arquivos"
              type="button"
              onClick={() => setIsExportOpen(true)}
              disabled={busy}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-white/10 flex items-center gap-1.5 text-sm font-medium text-white transition-colors"
            >
              <MaterialIcon name="ios_share" className="text-base sm:text-lg" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

          {/* Apagar - Danger */}
          <button
              title="Apagar arquivos"
              type="button"
              onClick={() => onTrashSelected(ids)}
              disabled={busy}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-red-600/20 flex items-center gap-1.5 text-sm font-medium text-red-400 transition-colors"
            >
              <MaterialIcon name="delete" className="text-base sm:text-lg" />
              <span className="hidden sm:inline">Apagar</span>
            </button>
        </div>

        {/* Close button */}
        <button
          title="Limpar seleção (Esc)"
            type="button"
            onClick={onClearSelection}
            disabled={busy}
            className="h-9 sm:h-10 w-9 sm:w-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors ml-1"
          >
            <MaterialIcon name="close" className="text-base sm:text-lg" />
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
