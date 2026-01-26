import React, { createContext, useContext } from 'react';
import { useFilters, Filters } from '../hooks/useFilters';

interface FiltersContextValue {
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

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const filtersHook = useFilters();

  return (
    <FiltersContext.Provider value={filtersHook}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFiltersContext() {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFiltersContext must be used within FiltersProvider');
  }
  return context;
}
