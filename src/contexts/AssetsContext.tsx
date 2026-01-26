import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { Asset } from '../shared/types';
import { Filters } from '../hooks/useFilters';

interface AssetsContextValue {
  // State
  assets: Array<Asset | null>;
  totalCount: number;
  isLoading: boolean;
  
  // Refs
  assetsRef: React.RefObject<Array<Asset | null>>;
  
  // Actions
  loadAssets: (filters: Filters, reset?: boolean) => Promise<void>;
  loadMoreAssets: (filters: Filters) => Promise<void>;
  resetAssets: () => void;
  getAssetAtIndex: (index: number) => Asset | null;
  updateAssetInList: (assetId: string, updates: Partial<Asset>) => void;
}

const AssetsContext = createContext<AssetsContextValue | null>(null);

const PAGE_SIZE = 500;

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  const assetsRef = useRef<Array<Asset | null>>([]);
  const [assetsVersion, setAssetsVersion] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const currentOffsetRef = useRef(0);

  const loadAssets = useCallback(async (filters: Filters, reset = true) => {
    setIsLoading(true);
    
    try {
      if (reset) {
        currentOffsetRef.current = 0;
        assetsRef.current = [];
      }

      const result = await window.electronAPI.getAssetsPage(
        {
          mediaType: filters.mediaType,
          flagged: filters.flagged,
          volumeUuid: filters.volumeUuid,
          pathPrefix: filters.pathPrefix,
          collectionId: filters.collectionId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          groupByDate: filters.groupByDate
        },
        currentOffsetRef.current,
        PAGE_SIZE
      );

      if (reset) {
        // Initialize sparse array
        assetsRef.current = new Array(result.total).fill(null);
      }

      // Fill in loaded items
      result.items.forEach((item, i) => {
        assetsRef.current[currentOffsetRef.current + i] = item;
      });

      setTotalCount(result.total);
      currentOffsetRef.current += result.items.length;
      setAssetsVersion(v => v + 1);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreAssets = useCallback(async (filters: Filters) => {
    if (isLoading || currentOffsetRef.current >= totalCount) return;
    
    setIsLoading(true);
    
    try {
      const result = await window.electronAPI.getAssetsPage(
        {
          mediaType: filters.mediaType,
          flagged: filters.flagged,
          volumeUuid: filters.volumeUuid,
          pathPrefix: filters.pathPrefix,
          collectionId: filters.collectionId,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          groupByDate: filters.groupByDate
        },
        currentOffsetRef.current,
        PAGE_SIZE
      );

      result.items.forEach((item, i) => {
        assetsRef.current[currentOffsetRef.current + i] = item;
      });

      currentOffsetRef.current += result.items.length;
      setAssetsVersion(v => v + 1);
    } catch (error) {
      console.error('Error loading more assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, totalCount]);

  const resetAssets = useCallback(() => {
    assetsRef.current = [];
    currentOffsetRef.current = 0;
    setTotalCount(0);
    setAssetsVersion(v => v + 1);
  }, []);

  const getAssetAtIndex = useCallback((index: number): Asset | null => {
    return assetsRef.current[index] ?? null;
  }, []);

  const updateAssetInList = useCallback((assetId: string, updates: Partial<Asset>) => {
    const index = assetsRef.current.findIndex(a => a?.id === assetId);
    if (index !== -1 && assetsRef.current[index]) {
      assetsRef.current[index] = { ...assetsRef.current[index]!, ...updates };
      setAssetsVersion(v => v + 1);
    }
  }, []);

  // Memoize assets array to prevent unnecessary re-renders
  const assets = useMemo(() => {
    // This triggers re-computation when assetsVersion changes
    void assetsVersion;
    return [...assetsRef.current];
  }, [assetsVersion]);

  const value: AssetsContextValue = {
    assets,
    totalCount,
    isLoading,
    assetsRef,
    loadAssets,
    loadMoreAssets,
    resetAssets,
    getAssetAtIndex,
    updateAssetInList
  };

  return (
    <AssetsContext.Provider value={value}>
      {children}
    </AssetsContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetsContext);
  if (!context) {
    throw new Error('useAssets must be used within AssetsProvider');
  }
  return context;
}
