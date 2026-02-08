import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Asset } from '../shared/types';
import Icon from './Icon.tsx';

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
  onMarkApprove?: (assetIds: string[]) => void;
  onMarkFavorite?: (assetIds: string[]) => void;
  onMarkReject?: (assetIds: string[]) => void;
  onClearMarking?: (assetIds: string[]) => void;
  onAddToCollection?: (assetIds: string[]) => void;
}

const btnClass = 'flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-medium)] transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none';
const labelClass = 'text-[10px] leading-none';
const dividerClass = 'h-8 w-px mx-1 bg-[rgba(var(--overlay-rgb),0.10)]';

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
  onMarkApprove,
  onMarkFavorite,
  onMarkReject,
  onClearMarking,
}: SelectionTrayProps) {
  const busy = !!isBusy;
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [thumbErrorById, setThumbErrorById] = useState<Record<string, boolean>>({});
  const [forceUpdate, setForceUpdate] = useState(0);

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

  const isMarkingView = currentCollectionId?.startsWith('__marking_') ?? false;
  const isRealCollection = !!currentCollectionId && !currentCollectionId.startsWith('__');

  return (
    <div key={forceUpdate} className="fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 z-[60] flex justify-center px-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div
        className={`flex items-center gap-0.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-floating)]/95 px-3 py-2 shadow-2xl backdrop-blur-xl transition-opacity ${busy ? 'opacity-70' : ''}`}
        role="toolbar"
        aria-label={`Ações para ${selectedAssets.length} ${selectedAssets.length === 1 ? 'item selecionado' : 'itens selecionados'}`}
      >
        {/* Count badge */}
        <div className="flex flex-col items-center justify-center w-14 h-14">
          <div className="text-lg font-bold text-[var(--color-text-primary)] leading-none">
            {busy ? (
              <Icon name="progress_activity" size={20} className="animate-spin text-[var(--color-text-muted)]" />
            ) : (
              selectedAssets.length
            )}
          </div>
          <span className={`${labelClass} text-[var(--color-text-muted)] mt-0.5`}>
            {selectedAssets.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* Divider */}
        <div className={dividerClass} />

        {/* Marking actions */}
        {onMarkApprove && (
          <button title="Aprovar (A)" aria-label="Aprovar selecionados" type="button" onClick={() => onMarkApprove(ids)} disabled={busy} className={btnClass}>
            <Icon name="check_circle" size={20} aria-hidden="true" />
            <span className={labelClass}>Aprovar</span>
          </button>
        )}

        {onMarkFavorite && (
          <button title="Favoritar (F)" aria-label="Favoritar selecionados" type="button" onClick={() => onMarkFavorite(ids)} disabled={busy} className={btnClass}>
            <Icon name="star" size={20} aria-hidden="true" />
            <span className={labelClass}>Favoritar</span>
          </button>
        )}

        {onMarkReject && (
          <button title="Desprezar (D)" aria-label="Desprezar selecionados" type="button" onClick={() => onMarkReject(ids)} disabled={busy} className={btnClass}>
            <Icon name="close" size={20} aria-hidden="true" />
            <span className={labelClass}>Desprezar</span>
          </button>
        )}

        {/* Divider */}
        <div className={dividerClass} />

        {/* Exportar */}
        <button title="Exportar arquivos" aria-label="Exportar arquivos" type="button" onClick={() => setIsExportOpen(true)} disabled={busy} className={btnClass}>
          <Icon name="ios_share" size={20} aria-hidden="true" />
          <span className={labelClass}>Exportar</span>
        </button>

        {/* Desmarcar - Only in __marking_* views */}
        {isMarkingView && onClearMarking && (
          <>
            <div className={dividerClass} />
            <button title="Desmarcar selecionados" aria-label="Desmarcar selecionados" type="button" onClick={() => onClearMarking(ids)} disabled={busy} className={btnClass}>
              <Icon name="remove_circle" size={20} aria-hidden="true" />
              <span className={labelClass}>Desmarcar</span>
            </button>
          </>
        )}

        {/* Remove from collection - Only for real collections */}
        {isRealCollection && onRemoveFromCollection && (
          <>
            <div className={dividerClass} />
            <button title="Remover da coleção" aria-label="Remover da coleção" type="button" onClick={() => onRemoveFromCollection(ids)} disabled={busy} className={btnClass}>
              <Icon name="playlist_remove" size={20} aria-hidden="true" />
              <span className={labelClass}>Remover</span>
            </button>
          </>
        )}

        {/* Divider */}
        <div className={dividerClass} />

        {/* Apagar */}
        <button title="Apagar arquivos" aria-label="Apagar arquivos selecionados" type="button" onClick={() => onOpenReview('delete', selectedAssets)} disabled={busy} className={btnClass}>
          <Icon name="delete" size={20} aria-hidden="true" />
          <span className={labelClass}>Apagar</span>
        </button>

        {/* Close */}
        <div className={dividerClass} />
        <button
          title="Limpar seleção (Esc)"
          aria-label="Limpar seleção (Esc)"
          type="button"
          onClick={onClearSelection}
          disabled={busy}
          className="flex items-center justify-center w-10 h-14 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-medium)] transition-colors disabled:opacity-40"
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

            {/* Preview do que será exportado */}
            <div className="mt-4 p-3 bg-[var(--color-overlay-light)] rounded-lg border border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)] mb-2">Será exportado:</div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="photo_library" size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {selectedAssets.length} arquivo{selectedAssets.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Grid de preview */}
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
