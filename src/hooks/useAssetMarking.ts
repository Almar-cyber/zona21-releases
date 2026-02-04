import { useCallback, useRef } from 'react';
import { Asset } from '../shared/types';
import { onboardingService } from '../services/onboarding-service';

export type MarkingStatus = 'unmarked' | 'approved' | 'favorite' | 'rejected';

export function getNextMarkingStatus(current: MarkingStatus, action: 'approve' | 'reject' | 'favorite'): MarkingStatus {
  if (action === 'approve') {
    if (current === 'unmarked') return 'approved';
    if (current === 'approved') return 'unmarked';
    if (current === 'favorite') return 'approved';
    if (current === 'rejected') return 'approved';
  } else if (action === 'reject') {
    if (current === 'unmarked') return 'rejected';
    if (current === 'approved') return 'rejected';
    if (current === 'favorite') return 'rejected';
    if (current === 'rejected') return 'unmarked';
  } else if (action === 'favorite') {
    if (current === 'unmarked') return 'favorite';
    if (current === 'approved') return 'favorite';
    if (current === 'favorite') return 'approved';
    if (current === 'rejected') return 'favorite';
  }
  return current;
}

interface UseAssetMarkingOptions {
  assetsRef: React.MutableRefObject<Array<Asset | null>>;
  setAssetsVersion: React.Dispatch<React.SetStateAction<number>>;
  selectedIndex: number | null;
  totalCount: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setTrayAssetIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
  pushToast: (toast: { type: 'success' | 'error' | 'info'; message: string; timeoutMs?: number }) => void;
  filtersRef: React.MutableRefObject<{ markingStatus?: string[] | undefined }>;
  resetAndLoad: (filters: any) => Promise<void>;
  ensureRangeLoaded: (start: number, end: number, filters: any) => void;
  productivityStats: {
    incrementApproved: (count: number) => void;
    incrementRejected: (count: number) => void;
  };
}

export function useAssetMarking({
  assetsRef,
  setAssetsVersion,
  selectedIndex,
  totalCount,
  setSelectedIndex,
  setTrayAssetIds,
  setSelectedAsset,
  pushToast,
  filtersRef,
  resetAndLoad,
  ensureRangeLoaded,
  productivityStats,
}: UseAssetMarkingOptions) {
  const handleMarkAssets = useCallback(
    async (assetIds: string[], action: 'approve' | 'reject' | 'favorite', advance?: boolean, usedKeyboard: boolean = false) => {
      if (!assetIds || assetIds.length === 0) return;

      const assets = assetIds.map((id) => assetsRef.current.find((a) => a?.id === id)).filter(Boolean) as Asset[];
      if (assets.length === 0) return;

      const updates: { id: string; newStatus: MarkingStatus }[] = assets.map((asset) => ({
        id: asset.id,
        newStatus: getNextMarkingStatus((asset.markingStatus || 'unmarked') as MarkingStatus, action),
      }));

      for (const { id, newStatus } of updates) {
        await window.electronAPI.updateAsset(id, { markingStatus: newStatus });
        for (let i = 0; i < assetsRef.current.length; i++) {
          const a = assetsRef.current[i];
          if (a && a.id === id) {
            assetsRef.current[i] = { ...a, markingStatus: newStatus };
            break;
          }
        }
      }

      setAssetsVersion((v) => v + 1);

      // Track productivity stats
      if (action === 'approve' || action === 'favorite') {
        productivityStats.incrementApproved(assetIds.length);
      } else if (action === 'reject') {
        productivityStats.incrementRejected(assetIds.length);
      }

      // Track onboarding events
      if (action === 'approve') {
        onboardingService.trackEvent('asset-approved');
      } else if (action === 'favorite') {
        onboardingService.trackEvent('asset-favorited');
      } else if (action === 'reject') {
        onboardingService.trackEvent('asset-rejected');
      }

      if (usedKeyboard) {
        onboardingService.trackEvent('keyboard-shortcut-used');
      } else {
        onboardingService.trackEvent('mouse-click-used');
      }

      const stats = onboardingService.getState().stats;
      if (stats.photosMarked >= 5) {
        onboardingService.updateChecklistItem('mark-5-photos', true);
      }
      if (usedKeyboard && stats.keyboardUsageCount > 0) {
        onboardingService.updateChecklistItem('use-keyboard', true);
      }

      if (assetIds.length >= 2) {
        const actionLabel = action === 'approve' ? 'aprovados' : action === 'reject' ? 'desprezados' : 'favoritados';
        pushToast({ type: 'success', message: `${assetIds.length} arquivos ${actionLabel}`, timeoutMs: 2000 });
      }

      window.dispatchEvent(new CustomEvent('zona21-markings-changed'));

      if (filtersRef.current.markingStatus) {
        await resetAndLoad(filtersRef.current);
      }

      if (advance && selectedIndex !== null) {
        const nextIndex = selectedIndex + 1;
        if (nextIndex < totalCount) {
          setSelectedIndex(nextIndex);
          setTrayAssetIds([]);
          const maybe = assetsRef.current[nextIndex];
          if (maybe) {
            setSelectedAsset(maybe);
          } else {
            ensureRangeLoaded(nextIndex, nextIndex, filtersRef.current);
          }
          queueMicrotask(() => {
            const element = document.querySelector(`[data-asset-index="${nextIndex}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
          });
        }
      }
    },
    [assetsRef, setAssetsVersion, selectedIndex, totalCount, setSelectedIndex, setTrayAssetIds, setSelectedAsset, pushToast, filtersRef, resetAndLoad, ensureRangeLoaded, productivityStats]
  );

  const handleClearMarking = useCallback(
    async (assetIds: string[]) => {
      if (!assetIds || assetIds.length === 0) return;

      for (const id of assetIds) {
        await window.electronAPI.updateAsset(id, { markingStatus: 'unmarked' });
        for (let i = 0; i < assetsRef.current.length; i++) {
          const a = assetsRef.current[i];
          if (a && a.id === id) {
            assetsRef.current[i] = { ...a, markingStatus: 'unmarked' };
            break;
          }
        }
      }
      setAssetsVersion((v) => v + 1);
      window.dispatchEvent(new CustomEvent('zona21-markings-changed'));
      if (assetIds.length >= 2) {
        pushToast({ type: 'info', message: `${assetIds.length} arquivos desmarcados`, timeoutMs: 2000 });
      }

      if (filtersRef.current.markingStatus) {
        await resetAndLoad(filtersRef.current);
      }
    },
    [assetsRef, setAssetsVersion, pushToast, filtersRef, resetAndLoad]
  );

  return {
    handleMarkAssets,
    handleClearMarking,
  };
}
