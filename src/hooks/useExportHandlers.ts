import { useState, useCallback, useEffect } from 'react';
import { Asset } from '../shared/types';
import { onboardingService } from '../services/onboarding-service';
import type { ExportMode } from '../components/UnifiedExportModal';

export interface LastOperation {
  kind: 'copy' | 'zip' | 'export';
  title: string;
  destinationDir?: string;
  path?: string;
  count?: number;
  copied?: number;
  skipped?: number;
  skippedMissing?: number;
  skippedOffline?: number;
  failed?: number;
  added?: number;
}

interface CopyProgress {
  status: string;
  total: number;
  copied: number;
  failed: number;
  skipped?: number;
  skippedMissing?: number;
  skippedOffline?: number;
  done?: boolean;
}

interface ZipProgress {
  status: string;
  total: number;
  added: number;
  failed: number;
  skippedMissing?: number;
  skippedOffline?: number;
  done?: boolean;
  error?: string;
  jobId?: string;
}

interface UseExportHandlersOptions {
  trayAssetIds: string[];
  pushToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
  setLastOp: React.Dispatch<React.SetStateAction<LastOperation | null>>;
}

export function useExportHandlers({ trayAssetIds, pushToast, setLastOp }: UseExportHandlersOptions) {
  // Unified export modal state
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    mode: ExportMode | null;
    collectionId?: string | null;
  }>({ isOpen: false, mode: null, collectionId: null });

  const [exportBusy, setExportBusy] = useState(false);

  // Progress state (kept separate due to different structures)
  const [copyProgress, setCopyProgress] = useState<CopyProgress | null>(null);
  const [zipProgress, setZipProgress] = useState<ZipProgress | null>(null);
  const [zipJobId, setZipJobId] = useState<string | null>(null);

  // Progress listeners
  useEffect(() => {
    const unsubscribe = window.electronAPI.onExportCopyProgress((p: any) => {
      setCopyProgress(p);
      if (p?.done) {
        setExportBusy(false);
      }
    });
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onExportZipProgress((p: any) => {
      setZipProgress(p);
      if (p?.jobId) setZipJobId(String(p.jobId));
      if (p?.done || p?.error) {
        setExportBusy(false);
      }
    });
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const confirmCopy = useCallback(
    async (opts: { preserveFolders: boolean; conflictDecision?: 'rename' | 'overwrite' | 'skip' }) => {
      if (trayAssetIds.length === 0) return;
      setExportBusy(true);
      setCopyProgress({ status: 'started', total: trayAssetIds.length, copied: 0, failed: 0, skipped: 0 });
      try {
        const result = await window.electronAPI.exportCopyAssets({ assetIds: trayAssetIds, ...opts });
        if (result.canceled) {
          setExportBusy(false);
          setCopyProgress(null);
          return;
        }
        if (!result.success) {
          setExportBusy(false);
          setCopyProgress(null);
          pushToast({ type: 'error', message: `Falha ao copiar: ${result.error || 'Erro desconhecido'}` });
          return;
        }
        setLastOp({
          kind: 'copy',
          title: 'Cópia concluída',
          destinationDir: result.destinationDir,
          copied: result.copied ?? 0,
          skipped: result.skipped ?? 0,
          skippedMissing: result.skippedMissing ?? 0,
          skippedOffline: result.skippedOffline ?? 0,
          failed: result.failed ?? 0,
        });
        pushToast({ type: 'success', message: 'Cópia concluída' });
        setExportModalState({ isOpen: false, mode: null });
      } finally {
        setExportBusy(false);
      }
    },
    [trayAssetIds, pushToast, setLastOp]
  );

  const confirmZip = useCallback(
    async (opts: { preserveFolders: boolean }) => {
      if (trayAssetIds.length === 0) return;
      setExportBusy(true);
      setZipProgress({ status: 'started', total: trayAssetIds.length, added: 0, failed: 0 });
      setZipJobId(null);
      try {
        const res = await window.electronAPI.exportZipAssets({ assetIds: trayAssetIds, ...opts });
        if (res?.canceled) {
          setExportBusy(false);
          setZipProgress(null);
          return;
        }
        if (!res?.success) {
          setExportBusy(false);
          setZipProgress(null);
          pushToast({ type: 'error', message: `Falha ao exportar ZIP: ${res?.error || 'Erro desconhecido'}` });
          return;
        }
        setZipJobId(res.jobId ? String(res.jobId) : null);
        setLastOp({
          kind: 'zip',
          title: 'ZIP exportado',
          path: res.path,
          added: res.added,
          skippedMissing: res.skippedMissing,
          skippedOffline: res.skippedOffline,
          failed: res.failed,
        });
        pushToast({ type: 'success', message: 'ZIP exportado' });
        setExportModalState({ isOpen: false, mode: null });
      } finally {
        setExportBusy(false);
      }
    },
    [trayAssetIds, pushToast, setLastOp]
  );

  const cancelZip = useCallback(async () => {
    if (!zipJobId) return;
    await window.electronAPI.cancelExportZip(zipJobId);
  }, [zipJobId]);

  const handleTrayExport = useCallback(
    async (type: 'premiere' | 'lightroom') => {
      if (trayAssetIds.length === 0) return;
      if (type === 'premiere') {
        const result = await window.electronAPI.exportPremiere(trayAssetIds);
        if (result.success) {
          setLastOp({ kind: 'export', title: 'XML exportado', path: result.path });
          pushToast({ type: 'success', message: 'XML exportado' });
          onboardingService.trackEvent('project-exported');
          onboardingService.updateChecklistItem('export-project', true);
        } else if (!result.canceled) {
          pushToast({ type: 'error', message: `Falha ao exportar: ${result.error || 'Erro desconhecido'}` });
        }
      } else {
        const result = await window.electronAPI.exportLightroom(trayAssetIds);
        if (result.success) {
          setLastOp({ kind: 'export', title: 'XMP exportado', count: result.count });
          pushToast({ type: 'success', message: `Exportado(s) ${result.count} XMP` });
          onboardingService.trackEvent('project-exported');
          onboardingService.updateChecklistItem('export-project', true);
        } else {
          pushToast({ type: 'error', message: `Falha ao exportar: ${result.error || 'Erro desconhecido'}` });
        }
      }
    },
    [trayAssetIds, pushToast, setLastOp]
  );

  const handleTrayExportZip = useCallback(
    (assetIds: string[]) => {
      if (!assetIds || assetIds.length === 0) return;
      setExportModalState({ isOpen: true, mode: 'zip' });
    },
    []
  );

  const handleTrayCopy = useCallback(
    (assetIds: string[]) => {
      if (!assetIds || assetIds.length === 0) return;
      setExportModalState({ isOpen: true, mode: 'copy' });
    },
    []
  );

  // Unified handlers
  const openExportModal = useCallback((mode: ExportMode, collectionId?: string) => {
    setExportModalState({ isOpen: true, mode, collectionId });
  }, []);

  const closeExportModal = useCallback(() => {
    if (exportBusy) return; // Prevent closing while busy
    setExportModalState({ isOpen: false, mode: null, collectionId: null });
  }, [exportBusy]);

  const confirmCollectionExport = useCallback(
    async (opts: { preserveFolders: boolean; conflictDecision?: 'rename' | 'overwrite' | 'skip' }) => {
      const { collectionId } = exportModalState;
      if (!collectionId) {
        pushToast({ type: 'error', message: 'ID da coleção não encontrado' });
        return;
      }

      setExportBusy(true);
      setCopyProgress({ status: 'started', total: 0, copied: 0, failed: 0 });

      try {
        const result = await window.electronAPI.exportCollectionFolder(collectionId);
        if (result.canceled) {
          setExportBusy(false);
          setCopyProgress(null);
          return;
        }
        if (!result.success) {
          setExportBusy(false);
          setCopyProgress(null);
          pushToast({ type: 'error', message: `Falha ao exportar coleção: ${result.error || 'Erro desconhecido'}` });
          return;
        }

        setLastOp({
          kind: 'copy',
          title: `Coleção "${result.collectionName}" exportada`,
          destinationDir: result.destinationDir,
          copied: result.copied ?? 0,
          skippedMissing: result.skippedMissing ?? 0,
          failed: result.failed ?? 0,
        });
        pushToast({ type: 'success', message: `Coleção "${result.collectionName}" exportada` });
        setExportModalState({ isOpen: false, mode: null, collectionId: null });
      } finally {
        setExportBusy(false);
      }
    },
    [exportModalState, pushToast, setLastOp]
  );

  const confirmExport = useCallback(
    async (opts: { preserveFolders: boolean; conflictDecision?: 'rename' | 'overwrite' | 'skip' }) => {
      const { mode } = exportModalState;
      if (!mode) return;

      switch (mode) {
        case 'copy':
          return await confirmCopy(opts);
        case 'zip':
          return await confirmZip(opts);
        case 'collection':
          return await confirmCollectionExport(opts);
      }
    },
    [exportModalState, confirmCopy, confirmZip, confirmCollectionExport]
  );

  return {
    // Unified export modal
    exportModalState,
    openExportModal,
    closeExportModal,
    exportBusy,
    confirmExport,

    // Progress (kept separate due to different structures)
    copyProgress,
    zipProgress,
    zipJobId,
    cancelZip, // Only ZIP has cancellation

    // Direct exports (XML/XMP - no modal)
    handleTrayExport,

    // Legacy handlers (for backward compatibility during migration)
    handleTrayCopy,
    handleTrayExportZip,
  };
}
