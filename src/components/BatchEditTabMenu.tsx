/**
 * BatchEditTabMenu - Menus contextuais para BatchEditTab
 *
 * Left Menu: Preview grid & progress
 * Right Menu: Operations & presets
 */

import React from 'react';
import { ContextualMenu } from './ContextualMenu';
import { MenuSection, MenuSectionItem } from './MenuSection';
import { useMenu } from '../contexts/MenuContext';
import Icon from './Icon';

// ============================================================================
// Types
// ============================================================================

export type BatchOperation = 'crop' | 'resize' | 'rotate' | 'flip';
export type FlipDirection = 'horizontal' | 'vertical';

interface BatchEditAsset {
  id: string;
  name: string;
  thumbnail?: string;
}

interface BatchEditTabMenuProps {
  assets: BatchEditAsset[];
  selectedOperation: BatchOperation | null;
  selectedPreset: string | null;

  // Operations
  onSelectOperation?: (operation: BatchOperation) => void;
  onSelectPreset?: (preset: string) => void;
  onApply?: () => void;
  onCancel?: () => void;

  // Progress
  isProcessing?: boolean;
  progress?: {
    current: number;
    total: number;
    successful: number;
    failed: number;
  };

  // Results
  timeSaved?: number;
}

// ============================================================================
// Constants
// ============================================================================

const CROP_PRESETS = [
  { id: '1:1', name: '1:1 (Quadrado)', icon: 'crop_square' },
  { id: '4:5', name: '4:5 (Instagram)', icon: 'crop_portrait' },
  { id: '16:9', name: '16:9 (Widescreen)', icon: 'crop_16_9' },
  { id: '9:16', name: '9:16 (Stories)', icon: 'crop_portrait' },
];

const RESIZE_PRESETS = [
  { id: 'instagram', name: 'Instagram (1080px)', icon: 'photo_size_select_large' },
  { id: 'web', name: 'Web (2000px)', icon: 'web' },
  { id: '4k', name: '4K (3840px)', icon: 'hd' },
  { id: 'thumbnail', name: 'Thumbnail (500px)', icon: 'photo_size_select_small' },
];

const OPERATIONS = [
  { id: 'crop' as BatchOperation, name: 'Cortar', icon: 'crop', description: 'Aplicar proporção de corte' },
  { id: 'resize' as BatchOperation, name: 'Redimensionar', icon: 'photo_size_select_large', description: 'Alterar dimensões' },
  { id: 'rotate' as BatchOperation, name: 'Rotacionar', icon: 'rotate_right', description: 'Rotacionar 90° horário' },
  { id: 'flip' as BatchOperation, name: 'Espelhar', icon: 'flip', description: 'Espelhar horizontal/vertical' },
];

// ============================================================================
// Component
// ============================================================================

export function BatchEditTabMenu({
  assets,
  selectedOperation,
  selectedPreset,
  onSelectOperation,
  onSelectPreset,
  onApply,
  onCancel,
  isProcessing = false,
  progress,
  timeSaved,
}: BatchEditTabMenuProps) {
  const { getMenuState, toggleMenu, setMenuWidth } = useMenu();
  const tabType = 'batch-edit';
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

  // Get presets for current operation
  const getPresetsForOperation = () => {
    switch (selectedOperation) {
      case 'crop':
        return CROP_PRESETS;
      case 'resize':
        return RESIZE_PRESETS;
      default:
        return [];
    }
  };

  const presets = getPresetsForOperation();

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <>
      {/* Left Menu - Preview Grid & Progress */}
      <ContextualMenu
        side="left"
        isCollapsed={menuState.left.isCollapsed}
        onToggleCollapse={handleToggleLeft}
        width={menuState.left.width}
        onWidthChange={handleLeftWidthChange}
        floatingIcon="photo_library"
      >
        {/* Asset Preview Grid */}
        <MenuSection
          title="Assets Selecionados"
          icon="collections"
          collapsible
          defaultExpanded
          storageKey="batch-assets"
        >
          <div className="grid grid-cols-2 gap-2">
            {assets.slice(0, 8).map((asset) => (
              <div
                key={asset.id}
                className="aspect-square bg-black/20 rounded-lg overflow-hidden"
              >
                {asset.thumbnail && (
                  <img
                    src={`file://${asset.thumbnail}`}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
            {assets.length > 8 && (
              <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">+{assets.length - 8}</div>
                  <div className="text-xs text-white/50">mais</div>
                </div>
              </div>
            )}
          </div>
        </MenuSection>

        {/* Selection Info */}
        <MenuSection
          title="Informações"
          icon="info"
          collapsible
          defaultExpanded
          storageKey="batch-info"
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between px-3 py-2 bg-white/5 rounded-lg">
              <span className="text-white/70">Total:</span>
              <span className="text-white font-medium">{assets.length} arquivos</span>
            </div>

            {selectedOperation && (
              <div className="flex justify-between px-3 py-2 bg-purple-500/20 rounded-lg">
                <span className="text-white/70">Operação:</span>
                <span className="text-purple-300 font-medium">
                  {OPERATIONS.find(op => op.id === selectedOperation)?.name}
                </span>
              </div>
            )}

            {selectedPreset && (
              <div className="flex justify-between px-3 py-2 bg-purple-500/20 rounded-lg">
                <span className="text-white/70">Preset:</span>
                <span className="text-purple-300 font-medium">{selectedPreset}</span>
              </div>
            )}
          </div>
        </MenuSection>

        {/* Progress (during processing) */}
        {isProcessing && progress && (
          <MenuSection
            title="Progresso"
            icon="hourglass_empty"
            collapsible={false}
            storageKey="batch-progress"
          >
            <div className="space-y-3">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Processando...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 bg-green-500/20 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-300">{progress.successful}</div>
                  <div className="text-xs text-white/50">Sucesso</div>
                </div>
                <div className="px-3 py-2 bg-red-500/20 rounded-lg text-center">
                  <div className="text-lg font-bold text-red-300">{progress.failed}</div>
                  <div className="text-xs text-white/50">Falhas</div>
                </div>
              </div>
            </div>
          </MenuSection>
        )}

        {/* Results (after completion) */}
        {!isProcessing && progress && progress.current === progress.total && (
          <MenuSection
            title="Resultado"
            icon="check_circle"
            collapsible={false}
            storageKey="batch-results"
          >
            <div className="space-y-3">
              <div className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="check_circle" className="text-green-400" />
                  <span className="text-sm font-medium text-white">Concluído!</span>
                </div>
                <div className="text-xs text-white/70">
                  {progress.successful} de {progress.total} arquivos processados com sucesso
                </div>
              </div>

              {timeSaved && (
                <div className="px-4 py-3 bg-purple-500/20 rounded-lg">
                  <div className="text-xs text-white/70 mb-1">Tempo economizado:</div>
                  <div className="text-lg font-bold text-purple-300">
                    ~{Math.round(timeSaved / 60)} min
                  </div>
                </div>
              )}
            </div>
          </MenuSection>
        )}
      </ContextualMenu>

      {/* Right Menu - Operations & Presets */}
      <ContextualMenu
        side="right"
        isCollapsed={menuState.right.isCollapsed}
        onToggleCollapse={handleToggleRight}
        width={menuState.right.width}
        onWidthChange={handleRightWidthChange}
        floatingIcon="build"
      >
        {/* Operation Selector */}
        <MenuSection
          title="Selecione a Operação"
          icon="build"
          collapsible
          defaultExpanded
          storageKey="batch-operations"
        >
          <div className="grid grid-cols-2 gap-2">
            {OPERATIONS.map((operation) => (
              <button
                key={operation.id}
                onClick={() => onSelectOperation?.(operation.id)}
                disabled={isProcessing}
                className={`
                  p-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  ${selectedOperation === operation.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white'
                  }
                `}
              >
                <Icon name={operation.icon} className="text-2xl mb-2" />
                <div className="text-sm font-medium">{operation.name}</div>
              </button>
            ))}
          </div>

          {/* Operation description */}
          {selectedOperation && (
            <div className="mt-3 px-3 py-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/70">
                {OPERATIONS.find(op => op.id === selectedOperation)?.description}
              </div>
            </div>
          )}
        </MenuSection>

        {/* Presets (for crop and resize) */}
        {selectedOperation && presets.length > 0 && (
          <MenuSection
            title="Escolha o Preset"
            icon="bookmark"
            collapsible
            defaultExpanded
            storageKey="batch-presets"
          >
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset?.(preset.id)}
                  disabled={isProcessing}
                  className={`
                    p-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${selectedPreset === preset.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                    }
                  `}
                >
                  <Icon name={preset.icon} className="text-2xl mb-2" />
                  <div className="text-xs font-medium">{preset.name}</div>
                </button>
              ))}
            </div>
          </MenuSection>
        )}

        {/* Flip Direction (for flip operation) */}
        {selectedOperation === 'flip' && (
          <MenuSection
            title="Direção"
            icon="flip"
            collapsible
            defaultExpanded
            storageKey="batch-flip-direction"
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSelectPreset?.('horizontal')}
                disabled={isProcessing}
                className={`
                  p-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  ${selectedPreset === 'horizontal'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white'
                  }
                `}
              >
                <Icon name="swap_horiz" className="text-2xl mb-2" />
                <div className="text-sm font-medium">Horizontal</div>
              </button>

              <button
                onClick={() => onSelectPreset?.('vertical')}
                disabled={isProcessing}
                className={`
                  p-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  ${selectedPreset === 'vertical'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white'
                  }
                `}
              >
                <Icon name="swap_vert" className="text-2xl mb-2" />
                <div className="text-sm font-medium">Vertical</div>
              </button>
            </div>
          </MenuSection>
        )}

        {/* Actions */}
        <MenuSection
          title="Ações"
          icon="play_arrow"
          collapsible={false}
          storageKey="batch-actions"
        >
          <div className="space-y-2">
            <button
              onClick={onApply}
              disabled={!selectedOperation || isProcessing ||
                        (presets.length > 0 && !selectedPreset)}
              className="
                w-full px-6 py-3
                bg-gradient-to-r from-purple-500 to-pink-500
                hover:from-purple-600 hover:to-pink-600
                disabled:from-gray-700 disabled:to-gray-700
                rounded-lg text-white font-medium
                transition-all
                disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isProcessing ? (
                <>
                  <Icon name="hourglass_empty" className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Icon name="play_arrow" />
                  <span>Aplicar Alterações</span>
                </>
              )}
            </button>

            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="
                w-full px-6 py-3
                bg-white/5 hover:bg-white/10
                disabled:opacity-50 disabled:cursor-not-allowed
                rounded-lg text-white font-medium
                transition-colors
                flex items-center justify-center gap-2
              "
            >
              <Icon name="close" />
              <span>Cancelar</span>
            </button>
          </div>
        </MenuSection>

        {/* Tips */}
        <MenuSection
          title="Dicas"
          icon="lightbulb"
          collapsible
          defaultExpanded={false}
          storageKey="batch-tips"
        >
          <div className="text-xs text-white/70 space-y-2">
            <div className="flex items-start gap-2">
              <Icon name="info" className="text-sm mt-0.5 flex-shrink-0" />
              <span>As operações são aplicadas a todos os arquivos selecionados.</span>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="info" className="text-sm mt-0.5 flex-shrink-0" />
              <span>Os arquivos originais são preservados.</span>
            </div>
            <div className="flex items-start gap-2">
              <Icon name="info" className="text-sm mt-0.5 flex-shrink-0" />
              <span>Use Esc para cancelar a qualquer momento.</span>
            </div>
          </div>
        </MenuSection>
      </ContextualMenu>
    </>
  );
}
