import { useState, useCallback } from 'react';
import { Asset } from '../shared/types';
import { ipcInvoke } from '../shared/ipcInvoke';

interface UseReviewModalOptions {
  trayAssetIds: string[];
  setTrayAssetIds: React.Dispatch<React.SetStateAction<string[]>>;
  setTrayAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  pushToast: (toast: { type: 'success' | 'error' | 'info'; message: string; timeoutMs?: number }) => void;
  filtersRef: React.MutableRefObject<any>;
  resetAndLoad: (filters: any) => Promise<void>;
  setIsZipOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useReviewModal({
  setTrayAssetIds,
  setTrayAssets,
  pushToast,
  filtersRef,
  resetAndLoad,
  setIsZipOpen,
}: UseReviewModalOptions) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'delete' | 'export' | null>(null);
  const [reviewAssets, setReviewAssets] = useState<Asset[]>([]);

  const handleOpenReview = useCallback((action: 'delete' | 'export', assets: Asset[]) => {
    if (assets.length === 0) return;
    setReviewAction(action);
    setReviewAssets(assets);
    setIsReviewOpen(true);
  }, []);

  const handleReviewRemoveAsset = useCallback((assetId: string) => {
    setReviewAssets((prev) => prev.filter((a) => a.id !== assetId));
    setTrayAssetIds((prev) => prev.filter((id) => id !== assetId));
  }, [setTrayAssetIds]);

  const handleTrayClear = useCallback(() => {
    setTrayAssetIds([]);
    setTrayAssets([]);
  }, [setTrayAssetIds, setTrayAssets]);

  const handleReviewConfirm = useCallback(async () => {
    const assetIds = reviewAssets.map((a) => a.id);

    if (reviewAction === 'delete') {
      setIsReviewOpen(false);
      try {
        const res = await ipcInvoke<any>('App.trashAssets', window.electronAPI.trashAssets, assetIds);
        if (!res.success) {
          pushToast({ type: 'error', message: `Falha ao enviar para a lixeira: ${res.error || 'Erro desconhecido'}` });
          return;
        }

        pushToast({
          type: 'success',
          message: `🎉 Você organizou ${assetIds.length} foto${assetIds.length > 1 ? 's' : ''}!`,
          timeoutMs: 3000,
        });

        handleTrayClear();
        await resetAndLoad(filtersRef.current);
      } catch (error) {
        console.error('Error trashing selected assets:', error);
        pushToast({ type: 'error', message: 'Falha ao enviar para a lixeira. Tente novamente.' });
      }
    } else if (reviewAction === 'export') {
      setIsReviewOpen(false);
      setIsZipOpen(true);

      pushToast({
        type: 'success',
        message: `📦 Preparando exportação de ${assetIds.length} arquivo${assetIds.length > 1 ? 's' : ''}!`,
        timeoutMs: 3000,
      });
    }
  }, [reviewAction, reviewAssets, pushToast, handleTrayClear, resetAndLoad, filtersRef, setIsZipOpen]);

  return {
    isReviewOpen,
    setIsReviewOpen,
    reviewAction,
    reviewAssets,
    handleOpenReview,
    handleReviewRemoveAsset,
    handleReviewConfirm,
  };
}
