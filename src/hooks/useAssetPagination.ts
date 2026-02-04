import { useCallback, useRef } from 'react';
import { Asset } from '../shared/types';

const PAGE_SIZE = 100;

interface Filters {
  mediaType?: string;
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
  groupByDate?: boolean;
  flagged?: boolean;
  markingStatus?: string[];
  volumeUuid?: string | null;
  pathPrefix?: string | null;
  collectionId?: string | null;
  tags?: string[];
}

interface UseAssetPaginationOptions {
  assetsRef: React.MutableRefObject<Array<Asset | null>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  setAssetsVersion: React.Dispatch<React.SetStateAction<number>>;
  setSelectedAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export function useAssetPagination({
  assetsRef,
  setTotalCount,
  setAssetsVersion,
  setSelectedAsset,
  setSelectedIndex,
}: UseAssetPaginationOptions) {
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const inFlightPagesRef = useRef<Set<number>>(new Set());

  const loadPage = useCallback(
    async (pageIndex: number, f: Filters) => {
      if (loadedPagesRef.current.has(pageIndex)) return;
      if (inFlightPagesRef.current.has(pageIndex)) return;

      inFlightPagesRef.current.add(pageIndex);
      try {
        const offset = pageIndex * PAGE_SIZE;
        const { items, total } = await window.electronAPI.getAssetsPage(f as any, offset, PAGE_SIZE);
        setTotalCount(total);
        if (!assetsRef.current || assetsRef.current.length !== total) {
          assetsRef.current = Array.from({ length: total }, () => null);
        }
        for (let i = 0; i < items.length; i++) {
          assetsRef.current[offset + i] = items[i];
        }
        setAssetsVersion((v) => v + 1);
        loadedPagesRef.current.add(pageIndex);
      } catch (error) {
        console.error('Error loading assets page:', error);
      } finally {
        inFlightPagesRef.current.delete(pageIndex);
      }
    },
    [assetsRef, setTotalCount, setAssetsVersion]
  );

  const resetAndLoad = useCallback(
    async (f: Filters) => {
      loadedPagesRef.current.clear();
      inFlightPagesRef.current.clear();
      setSelectedAsset(null);
      setSelectedIndex(null);

      if (f.groupByDate) {
        try {
          const results = await window.electronAPI.getAssets(f as any);
          setTotalCount(results.length);
          assetsRef.current = results;
          setAssetsVersion((v) => v + 1);
        } catch (error) {
          console.error('Error loading assets:', error);
          setTotalCount(0);
          assetsRef.current = [];
          setAssetsVersion((v) => v + 1);
        }
        return;
      }

      await loadPage(0, f);
    },
    [assetsRef, setTotalCount, setAssetsVersion, setSelectedAsset, setSelectedIndex, loadPage]
  );

  const ensureRangeLoaded = useCallback(
    (startIndex: number, stopIndex: number, f: Filters) => {
      const startPage = Math.floor(Math.max(0, startIndex) / PAGE_SIZE);
      const stopPage = Math.floor(Math.max(0, stopIndex) / PAGE_SIZE);

      // Priority 1: load what the user is actually looking at (plus a tiny lookahead)
      const lookAhead = 1;
      for (let p = startPage; p <= Math.min(stopPage + lookAhead, startPage + 6); p++) {
        loadPage(p, f);
      }

      // Priority 2: keep the top stable by gradually filling gaps from page 0 upwards.
      let contiguous = 0;
      while (loadedPagesRef.current.has(contiguous)) contiguous++;
      const backfillBudget = 2;
      const target = Math.min(startPage, contiguous + backfillBudget);
      for (let p = contiguous; p <= target; p++) {
        loadPage(p, f);
      }
    },
    [loadPage]
  );

  return {
    loadedPagesRef,
    resetAndLoad,
    loadPage,
    ensureRangeLoaded,
    PAGE_SIZE,
  };
}
