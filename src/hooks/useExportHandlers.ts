import { useState, useCallback, useEffect } from 'react';
import { Asset } from '../shared/types';
import { onboardingService } from '../services/onboarding-service';

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
  // Copy state
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyProgress, setCopyProgress] = useState<CopyProgress | null>(null);

  // Zip state
  const [isZipOpen, setIsZipOpen] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipProgress | null>(null);
  const [zipJobId, setZipJobId] = useState<string | null>(null);

  // Progress listeners
  useEffect(() => {
    const unsubscribe = window.electronAPI.onExportCopyProgress((p: any) => {
      setCopyProgress(p);
      if (p?.done) {
        setCopyBusy(false);
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
        setZipBusy(false);
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
    async (opts: { preserveFolders: boolean; conflictDecision: 'rename' | 'overwrite' | 'skip' }) => {
      if (trayAssetIds.length === 0) return;
      setCopyBusy(true);
      setCopyProgress({ status: 'started', total: trayAssetIds.length, copied: 0, failed: 0, skipped: 0 });
      try {
        const result = await window.electronAPI.exportCopyAssets({ assetIds: trayAssetIds, ...opts });
        if (result.canceled) {
          setCopyBusy(false);
          return;
        }
        if (!result.success) {
          setCopyBusy(false);
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
        setIsCopyOpen(false);
      } finally {
        setCopyBusy(false);
      }
    },
    [trayAssetIds, pushToast, setLastOp]
  );

  const confirmZip = useCallback(
    async (opts: { preserveFolders: boolean }) => {
      if (trayAssetIds.length === 0) return;
      setZipBusy(true);
      setZipProgress({ status: 'started', total: trayAssetIds.length, added: 0, failed: 0 });
      setZipJobId(null);
      try {
        const res = await (window.electronAPI as any).exportZipAssets({ assetIds: trayAssetIds, ...opts });
        if (res?.canceled) {
          setZipBusy(false);
          return;
        }
        if (!res?.success) {
          setZipBusy(false);
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
        setIsZipOpen(false);
      } finally {
        setZipBusy(false);
      }
    },
    [trayAssetIds, pushToast, setLastOp]
  );

  const cancelZip = useCallback(async () => {
    if (!zipJobId) return;
    const fn = (window.electronAPI as any)?.cancelExportZip;
    if (typeof fn !== 'function') return;
    await (window.electronAPI as any).cancelExportZip(zipJobId);
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
      setIsZipOpen(true);
    },
    []
  );

  const handleTrayCopy = useCallback(
    (assetIds: string[]) => {
      if (!assetIds || assetIds.length === 0) return;
      setIsCopyOpen(true);
    },
    []
  );

  return {
    // Copy
    isCopyOpen,
    setIsCopyOpen,
    copyBusy,
    copyProgress,
    confirmCopy,
    handleTrayCopy,

    // Zip
    isZipOpen,
    setIsZipOpen,
    zipBusy,
    zipProgress,
    zipJobId,
    confirmZip,
    cancelZip,
    handleTrayExportZip,

    // General
    handleTrayExport,
  };
}
