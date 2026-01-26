import { useState, useRef, useEffect, useCallback } from 'react';

export interface Filters {
  mediaType?: 'video' | 'photo';
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
  groupByDate: boolean;
  flagged?: boolean;
  volumeUuid: string | null;
  pathPrefix: string | null;
  collectionId: string | null;
}

const initialFilters: Filters = {
  mediaType: undefined,
  datePreset: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  groupByDate: false,
  flagged: undefined,
  volumeUuid: null,
  pathPrefix: null,
  collectionId: null
};

interface UseFiltersReturn {
  filters: Filters;
  filtersRef: React.RefObject<Filters>;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  selectVolume: (uuid: string | null) => void;
  selectFolder: (pathPrefix: string | null) => void;
  selectCollection: (collectionId: string | null) => void;
  setMediaType: (mediaType: 'video' | 'photo' | undefined) => void;
  setFlagged: (flagged: boolean | undefined) => void;
  setGroupByDate: (groupByDate: boolean) => void;
  setDateRange: (from: string | undefined, to: string | undefined) => void;
  setDatePreset: (preset: string | undefined) => void;
  resetFilters: () => void;
}

export function useFilters(): UseFiltersReturn {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const filtersRef = useRef<Filters>(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const selectVolume = useCallback((uuid: string | null) => {
    setFilters(prev => ({
      ...prev,
      volumeUuid: uuid,
      pathPrefix: null,
      collectionId: null,
      flagged: undefined
    }));
  }, []);

  const selectFolder = useCallback((pathPrefix: string | null) => {
    setFilters(prev => ({
      ...prev,
      pathPrefix,
      collectionId: null,
      flagged: undefined
    }));
  }, []);

  const selectCollection = useCallback((collectionId: string | null) => {
    setFilters(prev => ({
      ...prev,
      collectionId,
      volumeUuid: null,
      pathPrefix: null,
      flagged: undefined
    }));
  }, []);

  const setMediaType = useCallback((mediaType: 'video' | 'photo' | undefined) => {
    setFilters(prev => ({ ...prev, mediaType }));
  }, []);

  const setFlagged = useCallback((flagged: boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      flagged,
      volumeUuid: flagged ? null : prev.volumeUuid,
      pathPrefix: flagged ? null : prev.pathPrefix,
      collectionId: flagged ? null : prev.collectionId
    }));
  }, []);

  const setGroupByDate = useCallback((groupByDate: boolean) => {
    setFilters(prev => ({ ...prev, groupByDate }));
  }, []);

  const setDateRange = useCallback((from: string | undefined, to: string | undefined) => {
    setFilters(prev => ({ ...prev, dateFrom: from, dateTo: to }));
  }, []);

  const setDatePreset = useCallback((preset: string | undefined) => {
    setFilters(prev => ({ ...prev, datePreset: preset }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  return {
    filters,
    filtersRef,
    setFilters,
    selectVolume,
    selectFolder,
    selectCollection,
    setMediaType,
    setFlagged,
    setGroupByDate,
    setDateRange,
    setDatePreset,
    resetFilters
  };
}
