/**
 * CompareTabMenu - Menus contextuais para CompareTab
 *
 * Left Menu: Asset list & navigation
 * Right Menu: Layout controls, zoom, marking tools
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

export type CompareLayout = 2 | 3 | 4;
export type MarkingStatus = 'approved' | 'rejected' | 'unmarked';

interface CompareTabMenuProps {
  assets: Asset[];
  activePaneIndex: number;
  layout: CompareLayout;

  // Navigation
  onSelectPane?: (index: number) => void;
  onPreviousGroup?: () => void;
  onNextGroup?: () => void;
  currentGroup?: number;
  totalGroups?: number;

  // Layout
  onChangeLayout?: (layout: CompareLayout) => void;

  // Zoom
  zoom: number;
  syncZoom: boolean;
  syncPan: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onToggleSyncZoom?: () => void;
  onToggleSyncPan?: () => void;

  // Marking
  decisions?: Record<string, MarkingStatus>;
  onMarkPane?: (status: MarkingStatus) => void;
  onApplyDecisions?: () => void;

  // View options
  showMetadata?: boolean;
  showFilename?: boolean;
  onToggleMetadata?: () => void;
  onToggleFilename?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function CompareTabMenu({
  assets,
  activePaneIndex,
  layout,
  onSelectPane,
  onPreviousGroup,
  onNextGroup,
  currentGroup = 1,
  totalGroups = 1,
  onChangeLayout,
  zoom,
  syncZoom,
  syncPan,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleSyncZoom,
  onToggleSyncPan,
  decisions = {},
  onMarkPane,
  onApplyDecisions,
  showMetadata = false,
  showFilename = true,
  onToggleMetadata,
  onToggleFilename,
}: CompareTabMenuProps) {
  const { getMenuState, toggleMenu, setMenuWidth } = useMenu();
  const tabType = 'compare';
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

  // Count decisions
  const approvedCount = Object.values(decisions).filter(d => d === 'approved').length;
  const rejectedCount = Object.values(decisions).filter(d => d === 'rejected').length;
  const pendingCount = assets.length - approvedCount - rejectedCount;

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      {/* Left Menu - Asset List & Navigation */}
      <ContextualMenu
        side="left"
        isCollapsed={menuState.left.isCollapsed}
        onToggleCollapse={handleToggleLeft}
        width={menuState.left.width}
        onWidthChange={handleLeftWidthChange}
        floatingIcon="collections"
      >
        {/* Asset Thumbnails */}
        <MenuSection
          title="Assets em Comparação"
          icon="collections"
          collapsible
          defaultExpanded
          storageKey="compare-assets"
        >
          <div className="space-y-2">
            {assets.map((asset, index) => (
              <button
                key={asset.id}
                onClick={() => onSelectPane?.(index)}
                className={`
                  w-full flex items-center gap-3 p-2 rounded-lg transition-colors
                  ${activePaneIndex === index
                    ? 'bg-purple-500/20 border-2 border-purple-500'
                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                  }
                `}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 bg-black/20 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={`zona21thumb://${asset.id}`}
                    alt={asset.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-white truncate">
                    {index + 1}. {asset.fileName}
                  </div>
                  <div className="text-xs text-white/50">
                    {decisions[asset.id] === 'approved' && '✓ Aprovado'}
                    {decisions[asset.id] === 'rejected' && '✗ Rejeitado'}
                    {!decisions[asset.id] && '○ Pendente'}
                  </div>
                </div>

                {/* Keyboard hint */}
                <div className="text-xs text-white/30 font-mono">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </MenuSection>

        {/* Navigation */}
        <MenuSection
          title="Navegação"
          icon="navigation"
          collapsible
          defaultExpanded
          storageKey="compare-navigation"
        >
          <div className="space-y-3">
            {/* Group info */}
            <div className="px-3 py-2 bg-white/5 rounded-lg text-center">
              <div className="text-sm text-white/70 mb-1">Grupo</div>
              <div className="text-lg font-bold text-white">
                {currentGroup} / {totalGroups}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onPreviousGroup}
                disabled={currentGroup <= 1}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
              >
                <Icon name="arrow_back" className="inline mr-1" />
                Anterior
              </button>
              <button
                onClick={onNextGroup}
                disabled={currentGroup >= totalGroups}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
              >
                Próximo
                <Icon name="arrow_forward" className="inline ml-1" />
              </button>
            </div>
          </div>
        </MenuSection>

        {/* Decisions Summary */}
        <MenuSection
          title="Resumo de Decisões"
          icon="assessment"
          collapsible
          defaultExpanded
          storageKey="compare-decisions"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 bg-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="check_circle" className="text-green-400" />
                <span className="text-sm text-white">Aprovados</span>
              </div>
              <span className="text-sm font-bold text-white">{approvedCount}</span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-red-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="cancel" className="text-red-400" />
                <span className="text-sm text-white">Rejeitados</span>
              </div>
              <span className="text-sm font-bold text-white">{rejectedCount}</span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="radio_button_unchecked" className="text-white/50" />
                <span className="text-sm text-white">Pendentes</span>
              </div>
              <span className="text-sm font-bold text-white">{pendingCount}</span>
            </div>

            {/* Apply button */}
            {(approvedCount > 0 || rejectedCount > 0) && (
              <button
                onClick={onApplyDecisions}
                className="w-full px-4 py-2 mt-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium text-sm transition-colors"
              >
                <Icon name="done" className="inline mr-2" />
                Aplicar e Fechar (Esc)
              </button>
            )}
          </div>
        </MenuSection>
      </ContextualMenu>

      {/* Right Menu - Compare Tools */}
      <ContextualMenu
        side="right"
        isCollapsed={menuState.right.isCollapsed}
        onToggleCollapse={handleToggleRight}
        width={menuState.right.width}
        onWidthChange={handleRightWidthChange}
        floatingIcon="tune"
      >
        {/* Layout Controls */}
        <MenuSection
          title="Layout"
          icon="view_module"
          collapsible
          defaultExpanded
          storageKey="compare-layout"
        >
          <div className="space-y-3">
            <div className="text-xs text-white/50 mb-2">Colunas</div>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((cols) => (
                <button
                  key={cols}
                  onClick={() => onChangeLayout?.(cols as CompareLayout)}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-all
                    ${layout === cols
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                    }
                  `}
                >
                  {cols}
                </button>
              ))}
            </div>

            {/* Visual preview */}
            <div className="p-3 bg-white/5 rounded-lg">
              <div className={`grid gap-1 grid-cols-${layout}`}>
                {Array.from({ length: layout }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-video rounded ${
                      i === activePaneIndex ? 'bg-purple-500/50' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </MenuSection>

        {/* Zoom & Pan */}
        <MenuSection
          title="Zoom & Pan"
          icon="zoom_in"
          collapsible
          defaultExpanded
          storageKey="compare-zoom"
        >
          <div className="space-y-3">
            {/* Current zoom */}
            <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
              <span className="text-sm text-white/70">Zoom:</span>
              <span className="text-sm font-medium text-white">{Math.round(zoom)}%</span>
            </div>

            {/* Zoom buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onZoomOut}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors"
              >
                <Icon name="remove" />
              </button>
              <button
                onClick={onResetZoom}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
              >
                Reset
              </button>
              <button
                onClick={onZoomIn}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors"
              >
                <Icon name="add" />
              </button>
            </div>

            {/* Sync options */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <button
                onClick={onToggleSyncZoom}
                className={`
                  w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center justify-between
                  ${syncZoom ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white hover:bg-white/10'}
                `}
              >
                <span>Sincronizar Zoom</span>
                <Icon name={syncZoom ? 'check_box' : 'check_box_outline_blank'} />
              </button>

              <button
                onClick={onToggleSyncPan}
                className={`
                  w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center justify-between
                  ${syncPan ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white hover:bg-white/10'}
                `}
              >
                <span>Sincronizar Pan</span>
                <Icon name={syncPan ? 'check_box' : 'check_box_outline_blank'} />
              </button>
            </div>
          </div>
        </MenuSection>

        {/* Marking Tools */}
        <MenuSection
          title="Marcação"
          icon="check_circle"
          collapsible
          defaultExpanded
          storageKey="compare-marking"
        >
          <div className="space-y-2">
            <div className="text-xs text-white/50 mb-2">
              Painel ativo: {activePaneIndex + 1}
            </div>

            <button
              onClick={() => onMarkPane?.('approved')}
              className="w-full px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-between"
            >
              <span>Aprovar</span>
              <span className="text-xs opacity-70">(A)</span>
            </button>

            <button
              onClick={() => onMarkPane?.('rejected')}
              className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-between"
            >
              <span>Rejeitar</span>
              <span className="text-xs opacity-70">(D)</span>
            </button>

            <button
              onClick={() => onMarkPane?.('unmarked')}
              className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-between"
            >
              <span>Neutro</span>
              <span className="text-xs opacity-70">(N)</span>
            </button>
          </div>
        </MenuSection>

        {/* View Options */}
        <MenuSection
          title="Opções de Visualização"
          icon="visibility"
          collapsible
          defaultExpanded={false}
          storageKey="compare-view-options"
        >
          <div className="space-y-2">
            <button
              onClick={onToggleMetadata}
              className={`
                w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center justify-between
                ${showMetadata ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white hover:bg-white/10'}
              `}
            >
              <span>Mostrar Metadados</span>
              <Icon name={showMetadata ? 'check_box' : 'check_box_outline_blank'} />
            </button>

            <button
              onClick={onToggleFilename}
              className={`
                w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left flex items-center justify-between
                ${showFilename ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white hover:bg-white/10'}
              `}
            >
              <span>Mostrar Nome do Arquivo</span>
              <Icon name={showFilename ? 'check_box' : 'check_box_outline_blank'} />
            </button>
          </div>
        </MenuSection>
      </ContextualMenu>
    </>
  );
}
