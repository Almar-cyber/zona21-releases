import { useCallback, useRef } from 'react';
import { Asset } from '../shared/types';

const PAGE_SIZE = 100;
// Maximum pages to keep in memory - prevents unbounded memory growth
// At 100 assets per page, 30 pages = 3000 assets max in memory
const MAX_LOADED_PAGES = 30;

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
  // Track last access time for LRU eviction
  const pageAccessTimeRef = useRef<Map<number, number>>(new Map());

  // Evict pages that are furthest from the current page to stay under MAX_LOADED_PAGES
  const evictDistantPages = useCallback((currentPage: number) => {
    if (loadedPagesRef.current.size <= MAX_LOADED_PAGES) return;

    // Get all loaded pages with their distance from current page
    const pagesWithDistance = Array.from(loadedPagesRef.current)
      .map(p => ({
        page: p,
        distance: Math.abs(p - currentPage),
        accessTime: pageAccessTimeRef.current.get(p) || 0
      }))
      // Sort by distance (farthest first), then by access time (oldest first)
      .sort((a, b) => {
        if (b.distance !== a.distance) return b.distance - a.distance;
        return a.accessTime - b.accessTime;
      });

    // Evict pages until we're under the limit
    const pagesToEvict = pagesWithDistance.slice(0, loadedPagesRef.current.size - MAX_LOADED_PAGES);
    for (const { page } of pagesToEvict) {
      // Clear assets in this page
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      for (let i = start; i < end && i < assetsRef.current.length; i++) {
        assetsRef.current[i] = null;
      }
      loadedPagesRef.current.delete(page);
      pageAccessTimeRef.current.delete(page);
    }
  }, [assetsRef]);

  const loadPage = useCallback(
    async (pageIndex: number, f: Filters) => {
      if (loadedPagesRef.current.has(pageIndex)) {
        // Update access time for already loaded page
        pageAccessTimeRef.current.set(pageIndex, Date.now());
        return;
      }
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
        pageAccessTimeRef.current.set(pageIndex, Date.now());

        // Evict distant pages to stay under memory limit
        evictDistantPages(pageIndex);
      } catch (error) {
        console.error('Error loading assets page:', error);
      } finally {
        inFlightPagesRef.current.delete(pageIndex);
      }
    },
    [assetsRef, setTotalCount, setAssetsVersion, evictDistantPages]
  );

  const resetAndLoad = useCallback(
    async (f: Filters) => {
      loadedPagesRef.current.clear();
      inFlightPagesRef.current.clear();
      pageAccessTimeRef.current.clear();
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
