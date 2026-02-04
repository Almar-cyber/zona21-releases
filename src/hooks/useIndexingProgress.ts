import { useState, useEffect, useRef, useCallback } from 'react';
import { IndexProgress } from '../shared/types';
import { ipcInvoke } from '../shared/ipcInvoke';
import { onboardingService } from '../services/onboarding-service';

interface UseIndexingProgressOptions {
  filtersRef: React.MutableRefObject<any>;
  resetAndLoad: (filters: any) => Promise<void>;
  pushToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export function useIndexingProgress({ filtersRef, resetAndLoad, pushToast }: UseIndexingProgressOptions) {
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState<IndexProgress>({
    total: 0,
    indexed: 0,
    currentFile: null,
    status: 'idle',
  });
  const [indexStartTime, setIndexStartTime] = useState<number | null>(null);

  const lastReloadTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(0);
  const currentIndexRunIdRef = useRef<string | null>(null);
  const completionToastShownRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onIndexProgress((progress) => {
      const now = Date.now();
      if (progress.status === 'indexing' && now - lastProgressUpdateRef.current < 200) {
        return;
      }
      lastProgressUpdateRef.current = now;
      setIndexProgress(progress);
      if (progress.status === 'scanning' || progress.status === 'indexing') {
        setIsIndexing(true);

        if (progress.status === 'scanning') {
          currentIndexRunIdRef.current = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          completionToastShownRef.current = false;
        }

        if (progress.indexed === 10) {
          window.dispatchEvent(new CustomEvent('zona21-volumes-changed'));
        }

        const timeSinceLastReload = now - lastReloadTimeRef.current;
        const shouldReload =
          progress.indexed === 20 ||
          (progress.indexed > 20 && progress.indexed % 50 === 0 && timeSinceLastReload > 1500);

        if (shouldReload) {
          lastReloadTimeRef.current = now;
          resetAndLoad(filtersRef.current);
        }
      }
      if (progress.status === 'completed') {
        setIsIndexing(false);
        setIndexStartTime(null);
        window.dispatchEvent(new CustomEvent('zona21-volumes-changed'));

        setTimeout(() => {
          resetAndLoad(filtersRef.current);
        }, 200);

        if (progress.total > 0 && !completionToastShownRef.current) {
          completionToastShownRef.current = true;
          pushToast({
            type: 'success',
            message: `✅ Indexação concluída! ${progress.total} arquivos processados com sucesso.`,
          });
        }
      }
    });
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, [filtersRef, resetAndLoad, pushToast]);

  const handleIndexDirectory = useCallback(async () => {
    const dirPath = await window.electronAPI.selectDirectory();
    if (!dirPath) return;
    setIsIndexing(true);
    setIndexStartTime(Date.now());
    setIndexProgress({ total: 0, indexed: 0, currentFile: dirPath, status: 'scanning' });
    try {
      await ipcInvoke('App.indexDirectory', window.electronAPI.indexDirectory, dirPath);
      onboardingService.trackEvent('folder-added');
      onboardingService.updateChecklistItem('import-folder', true);
    } catch (error) {
      console.error('Error indexing directory:', error);
      pushToast({
        type: 'error',
        message: 'Não foi possível indexar esta pasta. Verifique se ela existe e se você tem permissão de acesso.',
      });
      setIsIndexing(false);
      setIndexStartTime(null);
      setIndexProgress({ total: 0, indexed: 0, currentFile: null, status: 'idle' });
    }
  }, [pushToast]);

  const handleImportPaths = useCallback(
    async (paths: string[]) => {
      const items = (paths || []).map((p) => String(p)).filter(Boolean);
      if (items.length === 0) return;

      setIsIndexing(true);
      setIndexStartTime(Date.now());
      setIndexProgress({ total: 0, indexed: 0, currentFile: items[0], status: 'scanning' });
      try {
        for (const p of items) {
          setIndexProgress({ total: 0, indexed: 0, currentFile: p, status: 'scanning' });
          await ipcInvoke('App.indexDirectory', window.electronAPI.indexDirectory, p);
        }
      } catch (error) {
        console.error('Error indexing dropped paths:', error);
        pushToast({
          type: 'error',
          message: 'Não foi possível processar os arquivos arrastados. Verifique se são pastas válidas.',
        });
        setIsIndexing(false);
        setIndexStartTime(null);
        setIndexProgress({ total: 0, indexed: 0, currentFile: null, status: 'idle' });
      }
    },
    [pushToast]
  );

  return {
    isIndexing,
    indexProgress,
    indexStartTime,
    handleIndexDirectory,
    handleImportPaths,
  };
}
