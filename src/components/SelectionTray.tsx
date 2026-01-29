import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Asset } from '../shared/types';
import Icon from './Icon.tsx';
import { Tooltip } from './Tooltip';

interface SelectionTrayProps {
  selectedAssets: Asset[];
  currentCollectionId: string | null;
  isBusy?: boolean;
  onRemoveFromSelection: (assetId: string) => void;
  onClearSelection: () => void;
  onCopySelected: (assetIds: string[]) => void;
  onTrashSelected: (assetIds: string[]) => void;
  onExportSelected: (type: 'premiere' | 'lightroom') => void;
  onExportZipSelected: (assetIds: string[]) => void;
  onOpenReview: (action: 'delete' | 'export', assets: Asset[]) => void;
  onRemoveFromCollection?: (assetIds: string[]) => void;
  onSmartRename?: (assetIds: string[]) => void;
  onOpenCompare?: (assets: Asset[]) => void;
  onOpenBatchEdit?: () => void;
  onOpenInstagram?: () => void;
}

export default function SelectionTray({
  selectedAssets,
  currentCollectionId,
  isBusy,
  onRemoveFromSelection,
  onClearSelection,
  onCopySelected,
  onTrashSelected,
  onExportSelected,
  onExportZipSelected,
  onOpenReview,
  onRemoveFromCollection,
  onSmartRename,
  onOpenCompare,
  onOpenBatchEdit,
  onOpenInstagram
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
              className="relative h-10 w-10 rounded-lg overflow-hidden border-2 border-[#0d0d1a] bg-white/10 shadow-md"
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
                  <Icon
                    name={asset.mediaType === 'video' ? 'videocam' : 'image'}
                    size={14}
                    className="text-gray-500"
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
          {/* Remove from collection */}
          {currentCollectionId && onRemoveFromCollection && (
            <button
                title="Remover da coleção"
                type="button"
                onClick={() => onRemoveFromCollection(ids)}
                disabled={busy}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-white/10 flex items-center gap-1.5 text-sm font-medium text-orange-400 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Icon name="playlist_remove" size={18} />
                <span className="hidden sm:inline">Remover</span>
              </button>
          )}

          {/* Exportar */}
          <button
              title="Exportar arquivos"
              type="button"
              onClick={() => setIsExportOpen(true)}
              disabled={busy}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-white/10 flex items-center gap-1.5 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-white/10"
            >
              <Icon name="ios_share" size={18} />
              <span className="hidden sm:inline">Exportar</span>
            </button>

          {/* Divider - Hidden on mobile */}
          <div className="hidden sm:block h-6 w-px bg-white/10" />

          {/* AI Actions */}
          {onSmartRename && (
            <Tooltip content="Renomear com base em tags de IA detectadas" position="top">
              <button
                title="Smart Rename"
                type="button"
                onClick={() => onSmartRename(ids)}
                disabled={busy}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-purple-600/20 flex items-center gap-1.5 text-sm font-medium text-purple-400 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <Icon name="auto_awesome" size={18} />
                <span className="hidden sm:inline">Smart Rename</span>
              </button>
            </Tooltip>
          )}

          {/* Compare Mode - 2 a 4 fotos */}
          {onOpenCompare && selectedAssets.length >= 2 && selectedAssets.length <= 4 && (
            <Tooltip content="Comparar fotos lado a lado (Cmd+C)" position="top">
              <button
                title="Comparar"
                type="button"
                onClick={() => onOpenCompare(selectedAssets)}
                disabled={busy}
                data-onboarding="compare-button"
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-blue-600/20 flex items-center gap-1.5 text-sm font-medium text-blue-400 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <Icon name="compare" size={18} />
                <span className="hidden sm:inline">Comparar</span>
              </button>
            </Tooltip>
          )}

          {/* Batch Edit - Quick Edit em lote */}
          {onOpenBatchEdit && selectedAssets.length >= 1 && (
            <Tooltip content="Aplicar mesma edição em todas as fotos (Cmd+B)" position="top">
              <button
                title="Edição em Lote"
                type="button"
                onClick={() => onOpenBatchEdit()}
                disabled={busy}
                data-onboarding="batch-edit"
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-purple-600/20 flex items-center gap-1.5 text-sm font-medium text-purple-400 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <Icon name="magic" size={18} />
                <span className="hidden sm:inline">Editar Lote</span>
              </button>
            </Tooltip>
          )}

          {/* Instagram Scheduler */}
          {onOpenInstagram && selectedAssets.length >= 1 && (
            <Tooltip content="Agendar post no Instagram" position="top">
              <button
                title="Instagram Scheduler"
                type="button"
                onClick={() => onOpenInstagram()}
                disabled={busy}
                data-onboarding="instagram"
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-orange-500/30 flex items-center gap-1.5 text-sm font-medium text-pink-400 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-pink-500/20"
              >
                <Icon name="photo_library" size={18} />
                <span className="hidden sm:inline">Instagram</span>
              </button>
            </Tooltip>
          )}

          {/* Apagar - Danger */}
          <button
              title="Apagar arquivos"
              type="button"
              onClick={() => onOpenReview('delete', selectedAssets)}
              disabled={busy}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-red-600/20 flex items-center gap-1.5 text-sm font-medium text-red-400 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Icon name="delete" size={18} />
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
            <Icon name="close" size={18} />
          </button>
      </div>

      {isExportOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setIsExportOpen(false)}>
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
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-400">Escolha um formato</div>

            {/* Preview do que será exportado */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs text-gray-400 mb-2">Será exportado:</div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="photo_library" size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-white">
                  {selectedAssets.length} arquivo{selectedAssets.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Preview de thumbnails (primeiros 6) */}
              <div className="flex gap-1.5 flex-wrap">
                {previewAssets.map(asset => (
                  <div
                    key={asset.id}
                    className="relative w-10 h-10 rounded overflow-hidden bg-white/10"
                  >
                    {asset.thumbnailPaths && asset.thumbnailPaths.length > 0 && !thumbErrorById[asset.id] ? (
                      <img
                        src={`zona21thumb://${asset.id}`}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => {
                          setThumbErrorById((prev) => ({ ...prev, [asset.id]: true }));
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon
                          name={asset.mediaType === 'video' ? 'videocam' : 'image'}
                          size={16}
                          className="text-gray-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-[10px] text-gray-400 font-medium">
                    +{remainingCount}
                  </div>
                )}
              </div>
            </div>

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
        </div>,
        document.body
      )}
    </div>
  );
}
