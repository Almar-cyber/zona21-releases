import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Asset, MarkingStatus } from '../shared/types';
import { useZoomSync } from '../hooks/useZoomSync';
import { useCompareMode, CompareLayout } from '../hooks/useCompareMode';
import ComparePane from './ComparePane';
import Icon from './Icon';

interface CompareModeProps {
  isOpen: boolean;
  assets: Asset[];
  initialLayout?: CompareLayout;
  onClose: () => void;
  onApplyDecisions: (decisions: { assetId: string; decision: MarkingStatus }[]) => void;
}

export default function CompareMode({
  isOpen,
  assets,
  initialLayout = 2,
  onClose,
  onApplyDecisions,
}: CompareModeProps) {
  const zoomSync = useZoomSync();
  const compareMode = useCompareMode(assets, initialLayout);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Pane selection (1-4)
      if (e.key >= '1' && e.key <= '4') {
        const paneIndex = parseInt(e.key) - 1;
        if (paneIndex < compareMode.currentGroup.length) {
          compareMode.setActivePane(paneIndex);
        }
        return;
      }

      // Marking shortcuts
      if (e.key.toLowerCase() === 'a') {
        compareMode.markActivePane('approved');
        // No confetti - keep it professional
        return;
      }
      if (e.key.toLowerCase() === 'd') {
        compareMode.markActivePane('rejected');
        // No confetti - keep it professional
        return;
      }
      if (e.key.toLowerCase() === 'n') {
        compareMode.markActivePane('unmarked');
        return;
      }

      // Navigation
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        compareMode.nextGroup();
        return;
      }
      if (e.key === 'ArrowRight') {
        compareMode.nextGroup();
        return;
      }
      if (e.key === 'ArrowLeft') {
        compareMode.previousGroup();
        return;
      }

      // Close
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      // Zoom
      if (e.key === '+' || e.key === '=') {
        zoomSync.zoomIn();
        return;
      }
      if (e.key === '-' || e.key === '_') {
        zoomSync.zoomOut();
        return;
      }
      if (e.key === '0') {
        zoomSync.resetZoomPan();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, compareMode, zoomSync]);

  const handleClose = () => {
    // Apply decisions before closing
    onApplyDecisions(compareMode.decisions);
    onClose();
  };

  if (!isOpen) return null;

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[compareMode.layout];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d1a]/95 border-b border-white/10 backdrop-blur-xl">
        {/* Left: Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={compareMode.previousGroup}
            disabled={!compareMode.canGoPrevious}
            className="mh-btn mh-btn-gray h-9 w-9 flex items-center justify-center disabled:opacity-30"
            title="Grupo anterior (←)"
          >
            <Icon name="chevron_left" size={20} />
          </button>

          <div className="text-sm text-white font-medium">
            Grupo {compareMode.currentGroupIndex + 1} de {compareMode.totalGroups}
          </div>

          <button
            type="button"
            onClick={compareMode.nextGroup}
            disabled={!compareMode.canGoNext}
            className="mh-btn mh-btn-gray h-9 w-9 flex items-center justify-center disabled:opacity-30"
            title="Próximo grupo (→ ou Space)"
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>

        {/* Center: Layout & Zoom controls */}
        <div className="flex items-center gap-3">
          {/* Layout selector */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5">
            <span className="text-xs text-gray-400 mr-1">Layout:</span>
            {([2, 3, 4] as CompareLayout[]).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => compareMode.setLayout(num)}
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                  compareMode.layout === num
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={`${num} colunas`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={zoomSync.zoomOut}
              disabled={zoomSync.zoomPanState.scale <= 1}
              className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center disabled:opacity-30"
              title="Zoom out (-)"
            >
              <Icon name="remove" size={18} />
            </button>

            <div className="text-xs text-white font-mono w-12 text-center">
              {(zoomSync.zoomPanState.scale * 100).toFixed(0)}%
            </div>

            <button
              type="button"
              onClick={zoomSync.zoomIn}
              disabled={zoomSync.zoomPanState.scale >= 10}
              className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center disabled:opacity-30"
              title="Zoom in (+)"
            >
              <Icon name="add" size={18} />
            </button>

            <button
              type="button"
              onClick={zoomSync.resetZoomPan}
              className="mh-btn mh-btn-gray h-8 px-3 text-xs"
              title="Reset zoom (0)"
            >
              Reset
            </button>
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Sync toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={zoomSync.toggleSync}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
                zoomSync.isSyncEnabled
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Sincronizar zoom entre painéis"
            >
              <Icon name={zoomSync.isSyncEnabled ? 'link' : 'link_off'} size={16} />
              Sync
            </button>

            <button
              type="button"
              onClick={zoomSync.togglePan}
              disabled={zoomSync.zoomPanState.scale <= 1}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-30 ${
                zoomSync.isPanEnabled
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Ativar pan/arrasto"
            >
              <Icon name="pan_tool" size={16} />
              Pan
            </button>
          </div>
        </div>

        {/* Right: Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="mh-btn mh-btn-gray h-9 px-4 flex items-center gap-2"
          title="Fechar (Esc)"
        >
          <Icon name="close" size={18} />
          Fechar
        </button>
      </div>

      {/* Main content: Comparison grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className={`grid ${gridCols} gap-4 h-full`}>
          {compareMode.currentGroup.map((asset, index) => (
            <ComparePane
              key={asset.id}
              asset={asset}
              isActive={compareMode.activePaneIndex === index}
              zoomPanState={zoomSync.zoomPanState}
              isPanEnabled={zoomSync.isPanEnabled}
              isSyncEnabled={zoomSync.isSyncEnabled}
              decision={compareMode.getDecision(asset.id)}
              paneNumber={index + 1}
              onSelect={() => compareMode.setActivePane(index)}
              onMark={(decision) => compareMode.markAsset(asset.id, decision)}
            />
          ))}
        </div>
      </div>

      {/* Bottom toolbar: Keyboard shortcuts help */}
      <div className="px-4 py-2 bg-[#0d0d1a]/95 border-t border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500">
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">1-4</kbd> Selecionar painel</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">A</kbd> Aprovar</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">D</kbd> Rejeitar</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">N</kbd> Neutro</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">Space</kbd> Próximo</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">←→</kbd> Navegar</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">+/-</kbd> Zoom</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400">Esc</kbd> Fechar</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
