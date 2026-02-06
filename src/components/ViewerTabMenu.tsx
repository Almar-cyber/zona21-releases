/**
 * ViewerTabMenu - Menus contextuais para ViewerTab
 *
 * Left Menu: File info & navigation
 * Right Menu: Metadata, edit tools, zoom controls
 */

import React from 'react';
import { ContextualMenu } from './ContextualMenu';
import { MenuSection, MenuSectionItem } from './MenuSection';
import { useMenu } from '../contexts/MenuContext';
import Icon from './Icon';
import type { Asset } from '../shared/types';

// ============================================================================
// Types
// ============================================================================

interface ViewerTabMenuProps {
  asset: Asset | null;
  zoom: number;
  fitMode: 'fit' | '100';

  // Navigation
  onPrevious?: () => void;
  onNext?: () => void;
  onJumpToLibrary?: () => void;

  // Zoom
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleFit?: () => void;

  // Edit
  onToggleQuickEdit?: () => void;
  onToggleVideoTrim?: () => void;
  onRotate?: () => void;

  // Marking
  onMarkFavorite?: () => void;
  onMarkApproved?: () => void;
  onMarkRejected?: () => void;

  // Notes
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ViewerTabMenu({
  asset,
  zoom,
  fitMode,
  onPrevious,
  onNext,
  onJumpToLibrary,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleFit,
  onToggleQuickEdit,
  onToggleVideoTrim,
  onRotate,
  onMarkFavorite,
  onMarkApproved,
  onMarkRejected,
  notes = '',
  onNotesChange,
}: ViewerTabMenuProps) {
  const { getMenuState, toggleMenu, setMenuWidth } = useMenu();
  const tabType = 'viewer';
  const menuState = getMenuState(tabType);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleToggleLeft = () => toggleMenu(tabType, 'left');
  const handleToggleRight = () => toggleMenu(tabType, 'right');

  const handleLeftWidthChange = (width: number) => {
    setMenuWidth(tabType, 'left', width);
  };

  const handleRightWidthChange = (width: number) => {
    setMenuWidth(tabType, 'right', width);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      {/* Left Menu - File Info & Navigation */}
      <ContextualMenu
        side="left"
        isCollapsed={menuState.left.isCollapsed}
        onToggleCollapse={handleToggleLeft}
        width={menuState.left.width}
        onWidthChange={handleLeftWidthChange}
        floatingIcon="info"
      >
        {asset ? (
          <>
            {/* File Preview */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="w-full aspect-video bg-[var(--color-overlay-light)] rounded-lg overflow-hidden mb-3">
                {Array.isArray(asset.thumbnailPaths) && asset.thumbnailPaths.length > 0 ? (
                  <img
                    src={`zona21thumb://${asset.id}`}
                    alt={asset.fileName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name={asset.mediaType === 'video' ? 'videocam' : 'image'} className="text-2xl text-[var(--color-text-muted)]" />
                  </div>
                )}
              </div>
              <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {asset.fileName}
              </div>
            </div>

            {/* File Details */}
            <MenuSection
              title="Detalhes"
              icon="description"
              collapsible
              defaultExpanded
              storageKey="viewer-details"
            >
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Formato:</span>
                  <span className="text-[var(--color-text-primary)]">{(asset.fileName.split('.').pop() || '').toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Tamanho:</span>
                  <span className="text-[var(--color-text-primary)]">{formatFileSize(asset.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Dimensões:</span>
                  <span className="text-[var(--color-text-primary)]">{asset.width}x{asset.height}</span>
                </div>
                {asset.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Data:</span>
                    <span className="text-[var(--color-text-primary)]">
                      {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {/* Path with reveal button */}
                <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
                  <div className="text-[var(--color-text-muted)] text-xs mb-1">Caminho:</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-[var(--color-text-secondary)] text-xs truncate">
                      {asset.relativePath}
                    </div>
                    <button
                      onClick={() => window.electronAPI?.revealAsset(asset.id)}
                      className="p-1 hover:bg-[var(--color-overlay-light)] rounded"
                      title="Mostrar no Finder"
                    >
                      <Icon name="folder_open" className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </MenuSection>

            {/* Navigation */}
            <MenuSection
              title="Navegação"
              icon="navigation"
              collapsible
              defaultExpanded
              storageKey="viewer-navigation"
            >
              <div className="space-y-1">
                <MenuSectionItem
                  icon="arrow_back"
                  label="Arquivo Anterior"
                  onClick={onPrevious}
                />
                <MenuSectionItem
                  icon="arrow_forward"
                  label="Próximo Arquivo"
                  onClick={onNext}
                />
                <MenuSectionItem
                  icon="home"
                  label="Voltar para Biblioteca"
                  onClick={onJumpToLibrary}
                />
              </div>
            </MenuSection>

            {/* Related Files */}
            <MenuSection
              title="Arquivos Relacionados"
              icon="collections"
              collapsible
              defaultExpanded={false}
              storageKey="viewer-related"
            >
              <div className="text-sm text-[var(--color-text-muted)] text-center py-4">
                Mesma pasta
              </div>
            </MenuSection>
          </>
        ) : (
          <div className="p-4 text-sm text-[var(--color-text-muted)] text-center">
            Nenhum arquivo selecionado
          </div>
        )}
      </ContextualMenu>

      {/* Right Menu - Properties & Edit Tools */}
      <ContextualMenu
        side="right"
        isCollapsed={menuState.right.isCollapsed}
        onToggleCollapse={handleToggleRight}
        width={menuState.right.width}
        onWidthChange={handleRightWidthChange}
        floatingIcon="tune"
      >
        {asset ? (
          <>
            {/* Zoom Controls */}
            <MenuSection
              title="Zoom"
              icon="zoom_in"
              collapsible
              defaultExpanded
              storageKey="viewer-zoom"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-overlay-light)] rounded-lg">
                  <span className="text-sm text-[var(--color-text-secondary)]">Nível:</span>
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{Math.round(zoom)}%</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onZoomOut}
                    className="px-3 py-2 bg-[var(--color-overlay-light)] hover:bg-[var(--color-overlay-medium)] rounded-lg text-sm font-medium text-[var(--color-text-primary)] transition-colors"
                  >
                    <Icon name="remove" className="inline mr-1" />
                    Menos
                  </button>
                  <button
                    onClick={onZoomIn}
                    className="px-3 py-2 bg-[var(--color-overlay-light)] hover:bg-[var(--color-overlay-medium)] rounded-lg text-sm font-medium text-[var(--color-text-primary)] transition-colors"
                  >
                    <Icon name="add" className="inline mr-1" />
                    Mais
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onToggleFit}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      fitMode === 'fit'
                        ? 'bg-purple-500 text-white'
                        : 'bg-[var(--color-overlay-light)] hover:bg-[var(--color-overlay-medium)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    Ajustar
                  </button>
                  <button
                    onClick={onResetZoom}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      fitMode === '100'
                        ? 'bg-purple-500 text-white'
                        : 'bg-[var(--color-overlay-light)] hover:bg-[var(--color-overlay-medium)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    100%
                  </button>
                </div>
              </div>
            </MenuSection>

            {/* Metadata */}
            {(asset.cameraMake || asset.cameraModel || asset.lens || asset.iso || asset.aperture || asset.shutterSpeed || asset.focalLength || asset.codec || asset.container) && (
              <MenuSection
                title="Metadados"
                icon="info"
                collapsible
                defaultExpanded={false}
                storageKey="viewer-metadata"
              >
                <div className="space-y-2 text-sm">
                  {(asset.cameraMake || asset.cameraModel) && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Câmera:</span>
                      <span className="text-[var(--color-text-primary)] text-right">{`${asset.cameraMake || ''} ${asset.cameraModel || ''}`.trim()}</span>
                    </div>
                  )}
                  {asset.lens && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Lente:</span>
                      <span className="text-[var(--color-text-primary)] text-right">{asset.lens}</span>
                    </div>
                  )}
                  {asset.iso && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">ISO:</span>
                      <span className="text-[var(--color-text-primary)]">{asset.iso}</span>
                    </div>
                  )}
                  {asset.aperture && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Abertura:</span>
                      <span className="text-[var(--color-text-primary)]">f/{asset.aperture}</span>
                    </div>
                  )}
                  {asset.shutterSpeed && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Velocidade:</span>
                      <span className="text-[var(--color-text-primary)]">{asset.shutterSpeed}s</span>
                    </div>
                  )}
                  {asset.focalLength && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Focal:</span>
                      <span className="text-[var(--color-text-primary)]">{asset.focalLength}mm</span>
                    </div>
                  )}
                  {asset.codec && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Codec:</span>
                      <span className="text-[var(--color-text-primary)]">{asset.codec}</span>
                    </div>
                  )}
                  {asset.container && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Container:</span>
                      <span className="text-[var(--color-text-primary)]">{asset.container}</span>
                    </div>
                  )}
                </div>
              </MenuSection>
            )}

            {/* Notes */}
            <MenuSection
              title="Notas"
              icon="note"
              collapsible
              defaultExpanded={false}
              storageKey="viewer-notes"
            >
              <textarea
                value={notes}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Adicione notas sobre este arquivo..."
                className="w-full px-3 py-2 bg-[var(--color-overlay-light)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] resize-none h-32 text-sm"
              />
            </MenuSection>

            {/* Edit Tools */}
            <MenuSection
              title="Ferramentas"
              icon="build"
              collapsible
              defaultExpanded
              storageKey="viewer-tools"
            >
              <div className="space-y-1">
                {asset.mediaType === 'photo' && (
                  <MenuSectionItem
                    icon="tune"
                    label="Quick Edit (E)"
                    onClick={onToggleQuickEdit}
                  />
                )}
                {asset.mediaType === 'video' && (
                  <MenuSectionItem
                    icon="content_cut"
                    label="Video Trim (V)"
                    onClick={onToggleVideoTrim}
                  />
                )}
                <MenuSectionItem
                  icon="rotate_right"
                  label="Rotacionar 90°"
                  onClick={onRotate}
                />
              </div>
            </MenuSection>

            {/* Marking */}
            <MenuSection
              title="Marcação"
              icon="check_circle"
              collapsible
              defaultExpanded
              storageKey="viewer-marking"
            >
              <div className="space-y-1">
                <MenuSectionItem
                  icon="favorite"
                  label="Favorito (F)"
                  onClick={onMarkFavorite}
                  active={asset.flagged}
                />
                <MenuSectionItem
                  icon="check_circle"
                  label="Aprovado (A)"
                  onClick={onMarkApproved}
                  active={asset.markingStatus === 'approved'}
                />
                <MenuSectionItem
                  icon="cancel"
                  label="Rejeitado (D)"
                  onClick={onMarkRejected}
                  active={asset.markingStatus === 'rejected'}
                />
              </div>
            </MenuSection>
          </>
        ) : (
          <div className="p-4 text-sm text-[var(--color-text-muted)] text-center">
            Nenhum arquivo selecionado
          </div>
        )}
      </ContextualMenu>
    </>
  );
}
