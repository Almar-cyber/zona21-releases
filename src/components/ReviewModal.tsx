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
      />

      {/* Modal */}
      <div
        className="relative bg-[#1a0d2e] border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              action === 'delete' ? 'bg-red-500/20' : 'bg-blue-500/20'
            }`}>
              <Icon
                name={actionIcon}
                size={20}
                className={action === 'delete' ? 'text-red-400' : 'text-blue-400'}
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Revisar seleção
              </h2>
              <p className="text-sm text-gray-400">
                {assets.length} {assets.length === 1 ? 'foto será' : 'fotos serão'} {actionText}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Fechar (Esc)"
          >
            <Icon name="close" size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ReviewGrid assets={currentAssets} onRemove={onRemoveAsset} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-3 border-t border-b border-white/10">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Página anterior (←)"
            >
              <Icon name="chevron_left" size={20} className="text-gray-400" />
            </button>

            <span className="text-sm text-gray-400">
              Página {currentPage + 1} de {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Próxima página (→)"
            >
              <Icon name="chevron_right" size={20} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-white/10">
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
          >
            <Icon name={actionIcon} size={16} />
            {actionVerb} {assets.length > 0 && `(${assets.length})`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
