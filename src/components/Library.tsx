import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { gsap, Flip } from 'gsap/all';
import { Asset } from '../shared/types';
import AssetCard from './AssetCard.tsx';

gsap.registerPlugin(Flip);

interface LibraryProps {
  assets: Array<Asset | null>;
  totalCount: number;
  onAssetClick: (asset: Asset, index: number, e: MouseEvent) => void;
  onAssetDoubleClick: (asset: Asset, index: number) => void;
  onImportPaths: (paths: string[]) => void;
  onLassoSelect: (assetIds: string[], additive: boolean) => void;
  onToggleMarked: (assetId: string) => void;
  markedIds: ReadonlySet<string>;
  onTrashAsset: (assetId: string) => void;
  selectedAssetId: string | null;
  trayAssetIds: ReadonlySet<string>;
  onRangeRendered: (startIndex: number, stopIndex: number) => void;
  groupByDate?: boolean;
  viewerAsset: Asset | null;
  layoutKey: string;
}

export default function Library({ assets, totalCount, onAssetClick, onAssetDoubleClick, onImportPaths, onLassoSelect, onToggleMarked, markedIds, onTrashAsset, selectedAssetId, trayAssetIds, onRangeRendered, groupByDate, layoutKey }: LibraryProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLargeGrid, setIsLargeGrid] = useState(false);
  const [lasso, setLasso] = useState<null | {
    isActive: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    additive: boolean;
  }>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridAnimRootRef = useRef<HTMLDivElement | null>(null);
  const prevFlipStateRef = useRef<any>(null);
  
  useEffect(() => {
    prevFlipStateRef.current = null;
  }, [layoutKey]);

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


  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 1024px)');
    if (!mq) return;

    const onChange = () => setIsLargeGrid(mq.matches);
    onChange();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    // Safari fallback
    (mq as any).addListener?.(onChange);
    return () => (mq as any).removeListener?.(onChange);
  }, []);

  const layoutParams = useMemo(() => {
    const minCol = isLargeGrid ? 200 : 220;
    const gap = isLargeGrid ? 12 : 14;
    return { minCol, gap };
  }, [isLargeGrid]);

  
  const columnWidth = layoutParams.minCol;

  
  const hasLoadingGaps = useMemo(() => {
    const cap = Math.min(totalCount, 600);
    for (let i = 0; i < cap; i++) {
      if (!assets[i]) return true;
    }
    return false;
  }, [assets, totalCount]);

  const skeletonCard = useMemo(() => {
    return (
      <div
        className="w-full rounded-lg overflow-hidden border border-white/10 bg-white/5"
        style={{ aspectRatio: '1 / 1' }}
      />
    );
  }, []);

  const groupedByDate = useMemo(() => {
    if (!groupByDate) return null;
    const groups = new Map<string, Array<{ asset: Asset; index: number }>>();
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      if (!a) continue;
      const d = new Date(a.createdAt as any);
      const key = Number.isNaN(d.getTime()) ? 'Data desconhecida' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
      const arr = groups.get(key) || [];
      arr.push({ asset: a, index: i });
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [assets, groupByDate]);

  useEffect(() => {
    const root = gridAnimRootRef.current;
    if (!root) return;

    if (hasLoadingGaps) {
      prevFlipStateRef.current = null;
      return;
    }

    const targets = root.querySelectorAll('[data-asset-id]');
    if (!targets || targets.length === 0) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) return;
    if (targets.length > 250) return;

    // Prevent stacked FLIP animations causing overlaps when items are added/removed quickly
    gsap.killTweensOf(targets);
    Flip.killFlipsOf(targets);
    gsap.set(targets as any, { clearProps: 'transform,top,left,width,height,position' });

    const prev = prevFlipStateRef.current;
    if (prev) {
      Flip.from(prev, {
        targets,
        duration: 0.35,
        ease: 'power2.out',
        absolute: true,
        prune: true,
        nested: true,
        stagger: 0.005,
        onEnter: (els: Element[]) => {
          gsap.fromTo(
            els as any,
            { opacity: 0, scale: 0.985 },
            { opacity: 1, scale: 1, duration: 0.18, ease: 'power2.out', overwrite: true }
          );
        },
        onLeave: (els: Element[]) => {
          gsap.to(els as any, { opacity: 0, scale: 0.985, duration: 0.18, ease: 'power2.out', overwrite: true });
        }
      });
    }

    prevFlipStateRef.current = Flip.getState(targets);
  }, [groupByDate, groupedByDate, totalCount, assets, hasLoadingGaps]);

  if (totalCount === 0) {
    return (
      <div className="relative flex-1 min-w-0 min-h-0">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="mh-popover w-full max-w-lg p-6 text-center">
            <div className="text-5xl">📁</div>
            <div className="mt-3 text-lg font-semibold text-white">Nenhum arquivo encontrado</div>
            <div className="mt-1 text-sm text-gray-300">Clique em "Adicionar pasta" para indexar suas mídias</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-w-0 min-h-0 bg-transparent"
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

      <div className="h-full w-full min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
        <div ref={gridAnimRootRef} className="w-full px-2 sm:px-3 lg:px-4 py-4">
          <div className="w-full max-w-none">
          {groupedByDate ? (
            <div className="space-y-6">
              {groupedByDate.map(([key, items]) => (
                <div key={key}>
                  <div className="mb-3 flex items-center text-sm text-gray-200">
                    <div className="font-semibold">{key}</div>
                    <div className="ml-2 text-xs text-gray-400">({items.length})</div>
                  </div>
                  <div
                    style={{
                      columnWidth: `${columnWidth}px`,
                      columnGap: `${layoutParams.gap}px`
                    }}
                  >
                    {items.map(({ asset, index }) => (
                      <div
                        key={asset.id}
                        data-asset-index={index}
                        style={{
                          breakInside: 'avoid',
                          marginBottom: `${layoutParams.gap}px`
                        }}
                      >
                        <AssetCard
                          asset={asset}
                          index={index}
                          onClick={(e: MouseEvent) => onAssetClick(asset, index, e)}
                          onDoubleClick={() => onAssetDoubleClick(asset, index)}
                          onToggleMarked={onToggleMarked}
                          onTrashAsset={onTrashAsset}
                          isSelected={selectedAssetId === asset.id}
                          isInTray={trayAssetIds.has(asset.id)}
                          isMarked={markedIds.has(asset.id)}
                          dragAssetIds={trayAssetIds.size > 1 && trayAssetIds.has(asset.id) ? Array.from(trayAssetIds) : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                columnWidth: `${columnWidth}px`,
                columnGap: `${layoutParams.gap}px`
              }}
            >
              {Array.from({ length: totalCount }, (_v, index) => {
                const asset = assets[index];
                
                if (!asset) {
                  return (
                    <div
                      key={`sk-${index}`}
                      style={{
                        breakInside: 'avoid',
                        marginBottom: `${layoutParams.gap}px`,
                        aspectRatio: '1 / 1'
                      }}
                    >
                      {skeletonCard}
                    </div>
                  );
                }
                return (
                  <div
                    key={asset.id}
                    data-asset-index={index}
                    style={{
                      breakInside: 'avoid',
                      marginBottom: `${layoutParams.gap}px`
                    }}
                  >
                    <AssetCard
                      asset={asset}
                      index={index}
                      onClick={(e: MouseEvent) => onAssetClick(asset, index, e)}
                      onDoubleClick={() => onAssetDoubleClick(asset, index)}
                      onToggleMarked={onToggleMarked}
                      onTrashAsset={onTrashAsset}
                      isSelected={selectedAssetId === asset.id}
                      isInTray={trayAssetIds.has(asset.id)}
                      isMarked={markedIds.has(asset.id)}
                      dragAssetIds={trayAssetIds.size > 1 && trayAssetIds.has(asset.id) ? Array.from(trayAssetIds) : undefined}
                    />
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
