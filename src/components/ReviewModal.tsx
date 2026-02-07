import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Asset } from '../shared/types';
import Icon from './Icon';
import ReviewGrid from './ReviewGrid';

interface ReviewModalProps {
  isOpen: boolean;
  assets: Asset[];
  action: 'delete' | 'export';
  onClose: () => void;
  onConfirm: () => void;
  onRemoveAsset: (assetId: string) => void;
}

export default function ReviewModal({
  isOpen,
  assets,
  action,
  onClose,
  onConfirm,
  onRemoveAsset
}: ReviewModalProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 16; // Grid 4x4
  const totalPages = Math.ceil(assets.length / ITEMS_PER_PAGE);
  const currentAssets = assets.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Reset página ao abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
    }
  }, [isOpen]);

  // Atalhos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevenir se input/textarea focado
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (assets.length > 0) {
          onConfirm();
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(0, prev - 1));
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, assets.length, totalPages, onClose, onConfirm]);

  // Ajustar página se assets mudarem (remoção individual)
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  if (!isOpen) return null;

  const actionText = action === 'delete' ? 'apagadas' : 'exportadas';
  const actionVerb = action === 'delete' ? 'Apagar' : 'Exportar';
  const actionIcon = action === 'delete' ? 'delete' : 'file_download';
  const buttonClass = action === 'delete' ? 'mh-btn-danger' : 'mh-btn-indigo';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="mh-popover relative max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        aria-describedby="review-modal-desc"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              action === 'delete' ? 'bg-[var(--color-status-rejected-bg)]' : 'bg-[rgba(var(--color-accent-glow-rgb),0.15)]'
            }`} aria-hidden="true">
              <Icon
                name={actionIcon}
                size={20}
                className={action === 'delete' ? 'text-[var(--color-status-rejected)]' : 'text-[var(--color-primary-light)]'}
              />
            </div>
            <div>
              <h2 id="review-modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                Revisar seleção
              </h2>
              <p id="review-modal-desc" className="text-sm text-[var(--color-text-secondary)]">
                {assets.length} {assets.length === 1 ? 'foto será' : 'fotos serão'} {actionText}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--color-overlay-medium)] flex items-center justify-center transition-colors"
            title="Fechar (Esc)"
            aria-label="Fechar modal de revisão"
          >
            <Icon name="close" size={20} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ReviewGrid assets={currentAssets} onRemove={onRemoveAsset} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-4 py-3 border-t border-b border-[var(--color-border)]" aria-label="Paginação da revisão">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="w-8 h-8 rounded-lg hover:bg-[var(--color-overlay-medium)] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Página anterior (←)"
              aria-label="Página anterior"
            >
              <Icon name="chevron_left" size={20} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
            </button>

            <span className="text-sm text-[var(--color-text-secondary)]" aria-live="polite">
              Página {currentPage + 1} de {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="w-8 h-8 rounded-lg hover:bg-[var(--color-overlay-medium)] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Próxima página (→)"
              aria-label="Próxima página"
            >
              <Icon name="chevron_right" size={20} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
            </button>
          </nav>
        )}

        {/* Footer */}
        <footer className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="mh-btn mh-btn-gray px-4 py-2"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={assets.length === 0}
            className={`mh-btn ${buttonClass} px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`${actionVerb} ${assets.length} ${assets.length === 1 ? 'arquivo' : 'arquivos'}`}
          >
            <Icon name={actionIcon} size={16} aria-hidden="true" />
            {actionVerb} {assets.length > 0 && `(${assets.length})`}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
