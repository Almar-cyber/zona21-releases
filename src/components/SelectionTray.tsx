import { useState, useEffect } from 'react';
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
  openExportModal: (mode: 'copy' | 'zip' | 'collection') => void;
  onOpenReview: (action: 'delete' | 'export', assets: Asset[]) => void;
  onRemoveFromCollection?: (assetIds: string[]) => void;
  onOpenCompare?: (assets: Asset[]) => void;
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
  openExportModal,
  onOpenReview,
  onRemoveFromCollection,
  onOpenCompare
}: SelectionTrayProps) {
  const busy = !!isBusy;
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [thumbErrorById, setThumbErrorById] = useState<Record<string, boolean>>({});
  const [forceUpdate, setForceUpdate] = useState(0);

  // Forçar atualização quando o modal de exportação abrir
  useEffect(() => {
    if (isExportOpen) {
      setForceUpdate(prev => prev + 1);
    }
  }, [isExportOpen]);

  void onRemoveFromSelection;
  void onCopySelected;
  void onTrashSelected;

  if (selectedAssets.length === 0) return null;

  const ids = selectedAssets.map((a) => a.id);

  const maxPreviewThumbs = 4;
  const previewAssets = selectedAssets.slice(0, maxPreviewThumbs);
  const remainingCount = selectedAssets.length - maxPreviewThumbs;

  return (
    <div key={forceUpdate} className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-[60] flex justify-center px-4 w-full sm:w-auto">
      <div
        className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-floating)]/95 px-3 sm:px-4 py-2 sm:py-3 shadow-2xl backdrop-blur-xl"
        role="toolbar"
        aria-label={`Ações para ${selectedAssets.length} ${selectedAssets.length === 1 ? 'item selecionado' : 'itens selecionados'}`}
      >
        
        {/* Thumbnail Preview - Hidden on mobile */}
        <div className="hidden sm:flex items-center -space-x-2">
          {previewAssets.slice(0, 2).map((asset, idx) => (
            <div
              key={asset.id}
              className="relative h-10 w-10 rounded-lg overflow-hidden border-2 border-[var(--color-surface-floating)] bg-[rgba(var(--overlay-rgb),0.10)] shadow-md"
              style={{ zIndex: idx }}
            >
              {asset.thumbnailPaths && asset.thumbnailPaths.length > 0 && !thumbErrorById[asset.id] ? (
                <img
                  src={`zona21thumb://${asset.id}`}
                  alt={`Miniatura de ${asset.fileName}`}
                  className="h-full w-full object-cover"
                  onError={() => {
                    setThumbErrorById((prev) => ({ ...prev, [asset.id]: true }));
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[rgba(var(--overlay-rgb),0.10)]">
                  <Icon
                    name={asset.mediaType === 'video' ? 'videocam' : 'image'}
                    size={14}
                    className="text-[var(--color-text-muted)]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Count badge */}
        <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[rgba(var(--overlay-rgb),0.10)] text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
          {selectedAssets.length} {selectedAssets.length === 1 ? 'item' : 'itens'}
        </div>

        {/* Divider - Hidden on mobile */}
        <div className="hidden sm:block h-6 w-px bg-[rgba(var(--overlay-rgb),0.10)]" />

        {/* Action buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Remove from collection */}
          {currentCollectionId && onRemoveFromCollection && (
            <button
                title="Remover da coleção"
                aria-label="Remover da coleção"
                type="button"
                onClick={() => onRemoveFromCollection(ids)}
                disabled={busy}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-[var(--color-overlay-medium)] flex items-center gap-1.5 text-sm font-medium text-[var(--color-warning)] transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Icon name="playlist_remove" size={18} aria-hidden="true" />
                <span className="hidden sm:inline">Remover</span>
              </button>
          )}

          {/* Exportar */}
          <button
              title="Exportar arquivos"
              aria-label="Exportar arquivos"
              type="button"
              onClick={() => setIsExportOpen(true)}
              disabled={busy}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-[var(--color-overlay-medium)] flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Icon name="ios_share" size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

          {/* Divider - Hidden on mobile */}
          <div className="hidden sm:block h-6 w-px bg-[rgba(var(--overlay-rgb),0.10)]" />

          {/* Compare Mode - 2 a 4 fotos */}
          {onOpenCompare && selectedAssets.length >= 2 && selectedAssets.length <= 4 && (
            <Tooltip content="Comparar fotos lado a lado (Cmd+C)" position="top">
              <button
                type="button"
                onClick={() => onOpenCompare(selectedAssets)}
                disabled={busy}
                data-onboarding="compare-button"
                aria-label="Comparar fotos lado a lado"
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-[var(--color-overlay-medium)] flex items-center gap-1.5 text-sm font-medium text-[var(--color-info)] transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Icon name="compare" size={18} />
                <span className="hidden sm:inline">Comparar</span>
              </button>
            </Tooltip>
          )}

          {/* Apagar - Danger */}
          <button
              title="Apagar arquivos"
              aria-label="Apagar arquivos selecionados"
              type="button"
              onClick={() => onOpenReview('delete', selectedAssets)}
              disabled={busy}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg hover:bg-[var(--color-overlay-medium)] flex items-center gap-1.5 text-sm font-medium text-[var(--color-danger-text)] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Icon name="delete" size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Apagar</span>
            </button>
        </div>

        {/* Close button */}
        <button
          title="Limpar seleção (Esc)"
            aria-label="Limpar seleção (Esc)"
            type="button"
            onClick={onClearSelection}
            disabled={busy}
            className="h-9 sm:h-10 w-9 sm:w-10 flex items-center justify-center rounded-lg hover:bg-[var(--color-overlay-medium)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors ml-1"
          >
            <Icon name="close" size={18} aria-hidden="true" />
          </button>
      </div>

      {isExportOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onMouseDown={() => setIsExportOpen(false)}>
          <div
            className="mh-popover w-full max-w-sm p-4 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Formato de exportação"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">Exportar</div>
              <button
                type="button"
                className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
                onClick={() => setIsExportOpen(false)}
                aria-label="Fechar"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">Escolha um formato</div>

            {/* Preview do que será exportado - usando mesmo padrão do ReviewGrid - UPDATED */}
            <div className="mt-4 p-3 bg-[var(--color-overlay-light)] rounded-lg border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Será exportado:</div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="photo_library" size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {selectedAssets.length} arquivo{selectedAssets.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Grid de preview igual ao ReviewGrid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {previewAssets.map(asset => (
                  <div
                    key={asset.id}
                    className="relative aspect-square rounded overflow-hidden bg-black/40 border border-[var(--color-border)] group"
                  >
                    {asset.thumbnailPaths && asset.thumbnailPaths.length > 0 && !thumbErrorById[asset.id] ? (
                      <img
                        src={`zona21thumb://${asset.id}`}
                        alt={asset.fileName}
                        className="w-full h-full object-cover"
                        onError={() => {
                          setThumbErrorById((prev) => ({ ...prev, [asset.id]: true }));
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                        <Icon
                          name={asset.mediaType === 'video' ? 'videocam' : 'image'}
                          size={16}
                          className="text-[var(--color-text-muted)]"
                        />
                      </div>
                    )}

                    {/* Hover overlay com nome */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end p-1 opacity-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white truncate drop-shadow-lg leading-tight">
                        {asset.fileName}
                      </p>
                    </div>

                    {/* Badge de tipo de mídia para vídeos */}
                    {asset.mediaType === 'video' && asset.duration && (
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] text-white">
                        {Math.floor(asset.duration / 60)}:{String(Math.floor(asset.duration % 60)).padStart(2, '0')}
                      </div>
                    )}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="aspect-square rounded bg-[rgba(var(--overlay-rgb),0.10)] border border-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-text-muted)] font-medium">
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
                  openExportModal('copy');
                  setIsExportOpen(false);
                }}
              >
                Copiar
                <div className="text-xs text-[var(--color-text-muted)]">Copiar arquivos para pasta</div>
              </button>

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
                <div className="text-xs text-[var(--color-text-muted)]">Premiere / Resolve</div>
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
                <div className="text-xs text-[var(--color-text-muted)]">Lightroom</div>
              </button>

              <button
                type="button"
                className="mh-btn mh-btn-gray w-full px-3 py-2 text-left text-sm"
                disabled={busy}
                onClick={() => {
                  openExportModal('zip');
                  setIsExportOpen(false);
                }}
              >
                ZIP
                <div className="text-xs text-[var(--color-text-muted)]">Empacotar arquivos selecionados</div>
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
