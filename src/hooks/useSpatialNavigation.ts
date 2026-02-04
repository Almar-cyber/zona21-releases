import { useCallback, useEffect, useRef } from 'react';

interface SpatialData {
  x: number;
  y: number;
  rect: DOMRect;
}

export function useSpatialNavigation(assetsVersion: number) {
  const spatialIndexRef = useRef<Map<number, SpatialData>>(new Map());
  const spatialIndexVersionRef = useRef(0);

  const rebuildSpatialIndex = useCallback(() => {
    const nodes = Array.from(document.querySelectorAll('[data-asset-index]')) as HTMLElement[];
    const newIndex = new Map<number, SpatialData>();

    for (const node of nodes) {
      const raw = node.getAttribute('data-asset-index');
      if (!raw) continue;
      const idx = Number(raw);
      if (!Number.isFinite(idx)) continue;

      const rect = node.getBoundingClientRect();
      newIndex.set(idx, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        rect,
      });
    }

    spatialIndexRef.current = newIndex;
    spatialIndexVersionRef.current++;
  }, []);

  // Invalidate spatial index on assets change
  useEffect(() => {
    rebuildSpatialIndex();
  }, [assetsVersion, rebuildSpatialIndex]);

  // Debounced scroll/resize listener to update spatial index
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;

    const handleScrollOrResize = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        rebuildSpatialIndex();
      }, 150);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [rebuildSpatialIndex]);

  const findVisualNeighborIndex = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down', fromIndex: number): number | null => {
      if (spatialIndexRef.current.size === 0) {
        rebuildSpatialIndex();
      }

      const fromData = spatialIndexRef.current.get(fromIndex);
      if (!fromData) return null;

      const fromCx = fromData.x;
      const fromCy = fromData.y;

      let best: { idx: number; score: number } | null = null;
      const tol = 6;

      for (const [idx, data] of spatialIndexRef.current.entries()) {
        if (idx === fromIndex) continue;

        const cx = data.x;
        const cy = data.y;
        const dx = cx - fromCx;
        const dy = cy - fromCy;

        if (direction === 'left' && dx >= -tol) continue;
        if (direction === 'right' && dx <= tol) continue;
        if (direction === 'up' && dy >= -tol) continue;
        if (direction === 'down' && dy <= tol) continue;

        const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
        const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
        const score = primary * 1 + secondary * 2;

        if (!best || score < best.score) best = { idx, score };
      }

      return best?.idx ?? null;
    },
    [rebuildSpatialIndex]
  );

  return {
    findVisualNeighborIndex,
    rebuildSpatialIndex,
  };
}
