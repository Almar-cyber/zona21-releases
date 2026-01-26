import { useState, useCallback } from 'react';
import { Asset } from '../shared/types';

interface UseSelectionReturn {
  selectedAsset: Asset | null;
  selectedIndex: number | null;
  trayAssetIds: string[];
  trayAssets: Asset[];
  setSelectedAsset: (asset: Asset | null) => void;
  setSelectedIndex: (index: number | null) => void;
  selectAssetAtIndex: (asset: Asset, index: number) => void;
  addToTray: (assetId: string) => void;
  removeFromTray: (assetId: string) => void;
  setTrayAssetIds: React.Dispatch<React.SetStateAction<string[]>>;
  setTrayAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  clearSelection: () => void;
  toggleSelection: (assetId: string) => void;
}

export function useSelection(): UseSelectionReturn {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [trayAssetIds, setTrayAssetIds] = useState<string[]>([]);
  const [trayAssets, setTrayAssets] = useState<Asset[]>([]);

  const selectAssetAtIndex = useCallback((asset: Asset, index: number) => {
    setSelectedIndex(index);
    setSelectedAsset(asset);
    setTrayAssetIds([asset.id]);
  }, []);

  const addToTray = useCallback((assetId: string) => {
    setTrayAssetIds(prev => {
      if (prev.includes(assetId)) return prev;
      return [...prev, assetId];
    });
  }, []);

  const removeFromTray = useCallback((assetId: string) => {
    setTrayAssetIds(prev => prev.filter(id => id !== assetId));
    setTrayAssets(prev => prev.filter(a => a.id !== assetId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAsset(null);
    setSelectedIndex(null);
    setTrayAssetIds([]);
    setTrayAssets([]);
  }, []);

  const toggleSelection = useCallback((assetId: string) => {
    setTrayAssetIds(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      }
      return [...prev, assetId];
    });
  }, []);

  return {
    selectedAsset,
    selectedIndex,
    trayAssetIds,
    trayAssets,
    setSelectedAsset,
    setSelectedIndex,
    selectAssetAtIndex,
    addToTray,
    removeFromTray,
    setTrayAssetIds,
    setTrayAssets,
    clearSelection,
    toggleSelection
  };
}
