import { useState, useCallback } from 'react';

interface UseMoveAssetsOptions {
  trayAssetIds: string[];
  setTrayAssetIds: React.Dispatch<React.SetStateAction<string[]>>;
  setTrayAssets: React.Dispatch<React.SetStateAction<any[]>>;
  filtersRef: React.MutableRefObject<{ volumeUuid: string | null; pathPrefix: string | null }>;
  resetAndLoad: (filters: any) => Promise<void>;
  pushToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export function useMoveAssets({
  trayAssetIds,
  setTrayAssetIds,
  setTrayAssets,
  filtersRef,
  resetAndLoad,
  pushToast,
}: UseMoveAssetsOptions) {
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [moveDestinationMode, setMoveDestinationMode] = useState<'tree' | 'dialog'>('tree');
  const [moveDestinationDir, setMoveDestinationDir] = useState<string | null>(null);
  const [moveDestinationPathPrefix, setMoveDestinationPathPrefix] = useState<string | null>(null);
  const [moveUnderstood, setMoveUnderstood] = useState(false);
  const [moveBusy, setMoveBusy] = useState(false);
  const [moveConflictsCount, setMoveConflictsCount] = useState(0);

  const handleMoveAssetsToFolder = useCallback(
    (assetIds: string[], pathPrefix: string | null) => {
      const ids = (assetIds || []).map((s) => String(s)).filter(Boolean);
      if (ids.length === 0) return;
      setTrayAssetIds(ids);
      setMoveDestinationMode('tree');
      setMoveDestinationDir(null);
      setMoveDestinationPathPrefix(pathPrefix);
      setMoveUnderstood(false);
      setMoveConflictsCount(0);
      setIsMoveOpen(true);
    },
    [setTrayAssetIds]
  );

  const closeMoveModal = useCallback(() => {
    if (moveBusy) return;
    setIsMoveOpen(false);
    setMoveBusy(false);
    setMoveConflictsCount(0);
  }, [moveBusy]);

  const pickMoveDestinationDialog = useCallback(async () => {
    const dir = await window.electronAPI.selectMoveDestination();
    if (!dir) return;
    setMoveDestinationDir(dir);
  }, []);

  const planMove = useCallback(async () => {
    if (trayAssetIds.length === 0) return;
    setMoveBusy(true);
    try {
      const res = await window.electronAPI.planMoveAssets({
        assetIds: trayAssetIds,
        destinationMode: moveDestinationMode,
        destinationDir: moveDestinationMode === 'dialog' ? moveDestinationDir : null,
        destinationVolumeUuid: moveDestinationMode === 'tree' ? filtersRef.current.volumeUuid : null,
        destinationPathPrefix: moveDestinationMode === 'tree' ? (moveDestinationPathPrefix ?? filtersRef.current.pathPrefix) : null,
      });
      if (!res.success) {
        if (!res.canceled) pushToast({ type: 'error', message: `Falha ao mover: ${res.error || 'Erro desconhecido'}` });
        return;
      }
      setMoveConflictsCount(res.conflictsCount ?? 0);
      if ((res.conflictsCount ?? 0) === 0) {
        const exec = await window.electronAPI.executeMoveAssets({
          assetIds: trayAssetIds,
          destinationMode: moveDestinationMode,
          destinationDir: moveDestinationMode === 'dialog' ? moveDestinationDir : null,
          destinationVolumeUuid: moveDestinationMode === 'tree' ? filtersRef.current.volumeUuid : null,
          destinationPathPrefix: moveDestinationMode === 'tree' ? (moveDestinationPathPrefix ?? filtersRef.current.pathPrefix) : null,
          conflictDecision: 'rename',
        });
        if (!exec.success) {
          if (!exec.canceled) pushToast({ type: 'error', message: `Falha ao mover: ${exec.error || 'Erro desconhecido'}` });
          return;
        }
        setTrayAssetIds([]);
        setTrayAssets([]);
        closeMoveModal();
        await resetAndLoad(filtersRef.current);
      }
    } finally {
      setMoveBusy(false);
    }
  }, [trayAssetIds, moveDestinationMode, moveDestinationDir, moveDestinationPathPrefix, filtersRef, pushToast, setTrayAssetIds, setTrayAssets, closeMoveModal, resetAndLoad]);

  const resolveMoveConflicts = useCallback(
    async (decision: 'overwrite' | 'rename' | 'cancel') => {
      if (decision === 'cancel') {
        closeMoveModal();
        return;
      }
      setMoveBusy(true);
      try {
        const exec = await window.electronAPI.executeMoveAssets({
          assetIds: trayAssetIds,
          destinationMode: moveDestinationMode,
          destinationDir: moveDestinationMode === 'dialog' ? moveDestinationDir : null,
          destinationVolumeUuid: moveDestinationMode === 'tree' ? filtersRef.current.volumeUuid : null,
          destinationPathPrefix: moveDestinationMode === 'tree' ? (moveDestinationPathPrefix ?? filtersRef.current.pathPrefix) : null,
          conflictDecision: decision,
        });
        if (!exec.success) {
          if (!exec.canceled) pushToast({ type: 'error', message: `Falha ao mover: ${exec.error || 'Erro desconhecido'}` });
          return;
        }
        setTrayAssetIds([]);
        setTrayAssets([]);
        closeMoveModal();
        await resetAndLoad(filtersRef.current);
      } finally {
        setMoveBusy(false);
      }
    },
    [trayAssetIds, moveDestinationMode, moveDestinationDir, moveDestinationPathPrefix, filtersRef, pushToast, setTrayAssetIds, setTrayAssets, closeMoveModal, resetAndLoad]
  );

  return {
    isMoveOpen,
    setIsMoveOpen,
    moveDestinationMode,
    setMoveDestinationMode,
    moveDestinationDir,
    moveDestinationPathPrefix,
    moveUnderstood,
    setMoveUnderstood,
    moveBusy,
    moveConflictsCount,
    handleMoveAssetsToFolder,
    closeMoveModal,
    pickMoveDestinationDialog,
    planMove,
    resolveMoveConflicts,
  };
}
