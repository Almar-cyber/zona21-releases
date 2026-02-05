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
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-mode-title"
    >
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d1a]/95 border-b border-white/10 backdrop-blur-xl">
        {/* Left: Navigation */}
        <nav className="flex items-center gap-3" aria-label="Navegação entre grupos">
          <button
            type="button"
            onClick={compareMode.previousGroup}
            disabled={!compareMode.canGoPrevious}
            className="mh-btn mh-btn-gray h-9 w-9 flex items-center justify-center disabled:opacity-30"
            title="Grupo anterior (←)"
            aria-label="Grupo anterior"
          >
            <Icon name="chevron_left" size={20} aria-hidden="true" />
          </button>

          <div id="compare-mode-title" className="text-sm text-white font-medium" aria-live="polite">
            Grupo {compareMode.currentGroupIndex + 1} de {compareMode.totalGroups}
          </div>

          <button
            type="button"
            onClick={compareMode.nextGroup}
            disabled={!compareMode.canGoNext}
            className="mh-btn mh-btn-gray h-9 w-9 flex items-center justify-center disabled:opacity-30"
            title="Próximo grupo (→ ou Space)"
            aria-label="Próximo grupo"
          >
            <Icon name="chevron_right" size={20} aria-hidden="true" />
          </button>
        </nav>

        {/* Center: Layout & Zoom controls */}
        <div className="flex items-center gap-3">
          {/* Layout selector */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5" role="group" aria-label="Seletor de layout">
            <span className="text-xs text-gray-400 mr-1" id="layout-label">Layout:</span>
            {([2, 3, 4] as CompareLayout[]).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => compareMode.setLayout(num)}
                aria-pressed={compareMode.layout === num}
                aria-label={`${num} colunas`}
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
          <div className="flex items-center gap-2" role="group" aria-label="Controles de zoom">
            <button
              type="button"
              onClick={zoomSync.zoomOut}
              disabled={zoomSync.zoomPanState.scale <= 1}
              className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center disabled:opacity-30"
              title="Zoom out (-)"
              aria-label="Diminuir zoom"
            >
              <Icon name="remove" size={18} aria-hidden="true" />
            </button>

            <div className="text-xs text-white font-mono w-12 text-center" aria-live="polite" aria-label={`Zoom atual: ${(zoomSync.zoomPanState.scale * 100).toFixed(0)}%`}>
              {(zoomSync.zoomPanState.scale * 100).toFixed(0)}%
            </div>

            <button
              type="button"
              onClick={zoomSync.zoomIn}
              disabled={zoomSync.zoomPanState.scale >= 10}
              className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center disabled:opacity-30"
              title="Zoom in (+)"
              aria-label="Aumentar zoom"
            >
              <Icon name="add" size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={zoomSync.resetZoomPan}
              className="mh-btn mh-btn-gray h-8 px-3 text-xs"
              title="Reset zoom (0)"
              aria-label="Resetar zoom"
            >
              Reset
            </button>
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Sync toggles */}
          <div className="flex items-center gap-2" role="group" aria-label="Controles de sincronização">
            <button
              type="button"
              onClick={zoomSync.toggleSync}
              aria-pressed={zoomSync.isSyncEnabled}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
                zoomSync.isSyncEnabled
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Sincronizar zoom entre painéis"
              aria-label={zoomSync.isSyncEnabled ? 'Sincronização ativada' : 'Sincronização desativada'}
            >
              <Icon name={zoomSync.isSyncEnabled ? 'link' : 'link_off'} size={16} aria-hidden="true" />
              Sync
            </button>

            <button
              type="button"
              onClick={zoomSync.togglePan}
              disabled={zoomSync.zoomPanState.scale <= 1}
              aria-pressed={zoomSync.isPanEnabled}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-30 ${
                zoomSync.isPanEnabled
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Ativar pan/arrasto"
              aria-label={zoomSync.isPanEnabled ? 'Pan ativado' : 'Pan desativado'}
            >
              <Icon name="pan_tool" size={16} aria-hidden="true" />
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
          aria-label="Fechar modo de comparação"
        >
          <Icon name="close" size={18} aria-hidden="true" />
          Fechar
        </button>
      </div>

      {/* Main content: Comparison grid */}
      <main className="flex-1 p-4 overflow-auto" aria-label="Grade de comparação de fotos">
        <div className={`grid ${gridCols} gap-4 h-full`} role="list">
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
      </main>

      {/* Bottom toolbar: Keyboard shortcuts help */}
      <footer className="px-4 py-2 bg-[#0d0d1a]/95 border-t border-white/10 backdrop-blur-xl" aria-label="Atalhos de teclado">
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
      </footer>
    </div>,
    document.body
  );
}
