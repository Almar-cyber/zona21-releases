import { useEffect, useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { Asset } from '../shared/types';
import AssetCard from './AssetCard.tsx';
import { useResponsiveGrid } from './LibraryGrid.tsx';
import EmptyStateUnified from './EmptyStateUnified.tsx';
import { Grid, GridItem } from './Grid.tsx';

interface LibraryProps {
  assets: Array<Asset | null>;
  totalCount: number;
  onAssetClick: (asset: Asset, index: number, e: MouseEvent) => void;
  onAssetDoubleClick: (asset: Asset, index: number) => void;
  onImportPaths: (paths: string[]) => void;
  onLassoSelect: (assetIds: string[], additive: boolean) => void;
  onToggleMarked: (assetId: string) => void;
  markedIds: ReadonlySet<string>;
  onToggleSelection: (assetId: string, e: MouseEvent) => void;
  selectedAssetId: string | null;
  trayAssetIds: ReadonlySet<string>;
  onRangeRendered: (startIndex: number, stopIndex: number) => void;
  groupByDate?: boolean;
  viewerAsset: Asset | null;
  onIndexDirectory?: () => void;
  emptyStateType?: 'files' | 'collection' | 'flagged';
}

export default function Library({ assets, totalCount, onAssetClick, onAssetDoubleClick, onImportPaths, onLassoSelect, onToggleMarked, markedIds, onToggleSelection, selectedAssetId, trayAssetIds, onRangeRendered, groupByDate, viewerAsset, onIndexDirectory, emptyStateType = 'files' }: LibraryProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const gridConfig = useResponsiveGrid();
  const [lasso, setLasso] = useState<null | {
    isActive: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    additive: boolean;
  }>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (totalCount <= 0) return;
    onRangeRendered(0, Math.max(0, totalCount - 1));
  }, [onRangeRendered, totalCount]);

  useEffect(() => {
    if (!lasso?.isActive) return;

    const onMove = (e: globalThis.MouseEvent) => {
      setLasso((prev) => {
        if (!prev?.isActive) return prev;
        return { ...prev, currentX: e.clientX, currentY: e.clientY };
      });
    };

    const onUp = (_e: globalThis.MouseEvent) => {
      setLasso((prev) => {
        if (!prev?.isActive) return null;

        const el = containerRef.current;
        if (!el) return null;
        const ids: string[] = [];

        // DOM intersection based selection (works consistently with virtualized / justified layouts)
        const selLeft = Math.min(prev.startX, prev.currentX);
        const selTop = Math.min(prev.startY, prev.currentY);
        const selRight = Math.max(prev.startX, prev.currentX);
        const selBottom = Math.max(prev.startY, prev.currentY);

        const nodes = el.querySelectorAll('[data-asset-id]');
        nodes.forEach((node) => {
          const n = node as HTMLElement;
          const assetId = n.getAttribute('data-asset-id');
          if (!assetId) return;

          const r = n.getBoundingClientRect();
          const intersects = !(r.right < selLeft || r.left > selRight || r.bottom < selTop || r.top > selBottom);
          if (intersects) ids.push(assetId);
        });

        if (ids.length > 0) onLassoSelect(Array.from(new Set(ids)), prev.additive);
        return null;
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [lasso?.isActive, onLassoSelect]);


  const { colWidth, gap = 14 } = gridConfig;
  // Calcular largura da coluna para garantir 5 colunas em desktop
  const columnWidth = Math.min(colWidth, 180);

  
  // Compute filtered assets with indices
  const filteredAssets: Array<{ asset: Asset; index: number }> = [];
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    if (a) filteredAssets.push({ asset: a, index: i });
  }

  // Compute drag asset IDs array
  const dragAssetIdsArray = trayAssetIds.size > 1 ? Array.from(trayAssetIds) : undefined;

  // Group by date
  const groupedByDate = (() => {
    if (!groupByDate) return null;
    const groups = new Map<string, Array<{ asset: Asset; index: number }>>();
    for (const { asset, index } of filteredAssets) {
      const d = new Date(asset.createdAt as any);
      const key = Number.isNaN(d.getTime()) ? 'Data desconhecida' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
      const arr = groups.get(key) || [];
      arr.push({ asset, index });
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  })();

  if (totalCount === 0) {
    const getTipText = () => {
      switch (emptyStateType) {
        case 'collection':
          return 'Selecione mídias na biblioteca e arraste-as para cá, ou use o botão "Mover" na barra de seleção.';
        case 'flagged':
          return 'Pressione "F" ou clique na bandeira em qualquer mídia para marcá-la.';
        default:
          return 'Você pode arrastar e soltar pastas diretamente na janela para indexá-las rapidamente.';
      }
    };
    
    return (
      <EmptyStateUnified
        type={emptyStateType}
        onAction={emptyStateType === 'files' ? onIndexDirectory : undefined}
        ctaText={emptyStateType === 'files' ? 'Adicionar pasta' : undefined}
        tipText={getTipText()}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-transparent"
      style={{ width: '100%', height: '100%' }}
      onMouseDown={(e: any) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement | null)?.closest?.('[data-asset-card="true"]')) return;
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // ensure the click is within the library area
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
        setLasso({ isActive: true, startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY, additive: !!e.shiftKey });
      }}
      onDragEnter={(e: DragEvent) => {
        e.preventDefault();
        const types = Array.from(e.dataTransfer?.types || []);
        const isInternal = types.includes('application/x-zona21-asset-id') || types.includes('application/x-zona21-asset-ids');
        if (!isInternal) setIsDragOver(true);
      }}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        const types = Array.from(e.dataTransfer?.types || []);
        const isInternal = types.includes('application/x-zona21-asset-id') || types.includes('application/x-zona21-asset-ids');
        if (isInternal) {
          setIsDragOver(false);
          e.dataTransfer.dropEffect = 'move';
          return;
        }
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
      }}
      onDragLeave={(e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        const paths = files
          .map((f: any) => String(f?.path || ''))
          .filter(Boolean);
        if (paths.length > 0) onImportPaths(paths);
      }}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 border-2 border-dashed border-white/20">
          <div className="text-center">
            <div className="text-lg font-semibold">Solte para importar</div>
            <div className="text-sm text-gray-300">Solte uma pasta para indexar</div>
          </div>
        </div>
      )}

      {lasso?.isActive && (() => {
        const el = containerRef.current;
        const rect = el?.getBoundingClientRect();
        if (!rect) return null;
        const left = Math.min(lasso.startX, lasso.currentX) - rect.left;
        const top = Math.min(lasso.startY, lasso.currentY) - rect.top;
        const width = Math.abs(lasso.currentX - lasso.startX);
        const height = Math.abs(lasso.currentY - lasso.startY);
        return (
          <div
            className="absolute z-[55] border border-white/30 bg-white/10"
            style={{ left, top, width, height }}
          />
        );
      })()}

      <div className="w-full h-full overflow-y-auto overflow-x-hidden pr-2">
        <div className="w-full p-4">
          {groupedByDate ? (
            <div className="space-y-6">
              {groupedByDate.map(([key, items]) => (
                <div key={key}>
                  <div className="mb-3 flex items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{key}</div>
                    <div className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>({items.length})</div>
                  </div>
                  <Grid variant="responsive" minColumnWidth={columnWidth} gap={gap}>
                    {items.map(({ asset, index }) => (
                      <GridItem key={asset.id} data-asset-index={index}>
                        <AssetCard
                          asset={asset}
                          index={index}
                          tileWidth={columnWidth}
                          tileHeight={columnWidth}
                          onClick={onAssetClick}
                          onDoubleClick={() => onAssetDoubleClick(asset, index)}
                          onToggleMarked={onToggleMarked}
                                                    onToggleSelection={onToggleSelection}
                          isSelected={selectedAssetId === asset.id}
                          isInTray={trayAssetIds.has(asset.id)}
                          isMarked={markedIds.has(asset.id)}
                          dragAssetIds={trayAssetIds.size > 1 && trayAssetIds.has(asset.id) ? Array.from(trayAssetIds) : undefined}
                        />
                      </GridItem>
                    ))}
                  </Grid>
                </div>
              ))}
            </div>
          ) : (
            <Grid variant="responsive" minColumnWidth={columnWidth} gap={gap}>
              {/* Renderizar apenas assets carregados para evitar desalinhamento com esqueletos */}
              {filteredAssets.map(({ asset, index }) => (
                  <GridItem key={asset.id} data-asset-index={index}>
                    <AssetCard
                      asset={asset}
                      index={index}
                      tileWidth={columnWidth}
                      tileHeight={columnWidth}
                      onClick={onAssetClick}
                      onDoubleClick={() => onAssetDoubleClick(asset, index)}
                      onToggleMarked={onToggleMarked}
                                            onToggleSelection={onToggleSelection}
                      isSelected={selectedAssetId === asset.id}
                      isInTray={trayAssetIds.has(asset.id)}
                      isMarked={markedIds.has(asset.id)}
                      dragAssetIds={dragAssetIdsArray}
                    />
                  </GridItem>
                ))}
            </Grid>
          )}
      </div>
    </div>
  </div>
);
}
