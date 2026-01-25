import { useState } from 'react';
import { Asset } from '../shared/types';
import MaterialIcon from './MaterialIcon.tsx';
import { Tooltip } from './Tooltip';

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
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[100] flex justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0d1a]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
        {/* Thumbnail Previews - Stack visual */}
        <div className="flex items-center -space-x-3">
          {previewAssets.map((asset, idx) => (
            <div
              key={asset.id}
              className="relative h-14 w-14 rounded-lg overflow-hidden border-2 border-[#0d0d1a] bg-gray-800 shadow-lg hover:z-10 hover:scale-105 transition-transform"
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
                    className="text-gray-500 text-base"
                  />
                </div>
              )}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="h-14 w-14 rounded-lg border-2 border-[#0d0d1a] bg-white/5 flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-gray-300">+{remainingCount}</span>
            </div>
          )}
        </div>

        {/* Count badge */}
        <div className="px-3 py-1.5 rounded-full bg-white/5 text-sm font-semibold text-white">
          {selectedAssets.length} {selectedAssets.length === 1 ? 'item' : 'itens'}
        </div>

        <div className="h-8 w-px bg-white/10" />

        {/* Action buttons with labels */}
        <button
          type="button"
          onClick={() => onMoveSelected(ids)}
          disabled={busy}
          className={`${btnAction} mh-btn-indigo`}
        >
          <MaterialIcon name="drive_file_move" className="text-lg" />
          <span>Mover</span>
        </button>

        {currentCollectionId && onRemoveFromCollection && (
          <button
            type="button"
            onClick={() => onRemoveFromCollection(ids)}
            disabled={busy}
            className={`${btnAction} mh-btn-gray hover:bg-orange-500/10 !text-white`}
            style={{ color: 'white !important' }}
          >
            <MaterialIcon name="playlist_remove" className="text-lg text-orange-400" />
            <span className="text-orange-400">Remover</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          disabled={busy}
          className={`${btnAction} mh-btn-gray`}
        >
          <MaterialIcon name="ios_share" className="text-lg" />
          <span>Exportar</span>
        </button>

        <button
          type="button"
          onClick={() => onTrashSelected(ids)}
          disabled={busy}
          className={`${btnAction} bg-red-500/90 hover:bg-red-500 border-red-600/50 text-white`}
        >
          <MaterialIcon name="delete" className="text-lg" />
          <span>Apagar</span>
        </button>

        <div className="h-8 w-px bg-white/10" />

        <Tooltip content="Limpar seleção (Esc)" position="top">
          <button
            type="button"
            onClick={onClearSelection}
            disabled={busy}
            className="h-10 w-10 flex items-center justify-center rounded-lg mh-btn-gray"
          >
            <MaterialIcon name="close" className="text-lg" />
          </button>
        </Tooltip>
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
