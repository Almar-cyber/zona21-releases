import { useState, useEffect, useRef, useCallback } from 'react';
import { IndexProgress } from '../shared/types';

interface UseIndexingReturn {
  isIndexing: boolean;
  indexProgress: IndexProgress;
  indexStartTime: Date | null;
  startIndexing: (dirPath: string) => Promise<void>;
  pauseIndexing: () => void;
  resumeIndexing: () => void;
  cancelIndexing: () => void;
}

const initialProgress: IndexProgress = {
  total: 0,
  indexed: 0,
  currentFile: null,
  status: 'idle'
};

export function useIndexing(onIndexComplete?: () => void): UseIndexingReturn {
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState<IndexProgress>(initialProgress);
  const [indexStartTime, setIndexStartTime] = useState<Date | null>(null);
  
  const lastProgressUpdateRef = useRef<number>(0);

  // Listener para progresso de indexação
  useEffect(() => {
    const handleProgress = (progress: IndexProgress) => {
      // Throttle atualizações: máximo 5x por segundo
      const now = Date.now();
      if (progress.status === 'indexing' && now - lastProgressUpdateRef.current < 200) {
        return;
      }
      lastProgressUpdateRef.current = now;
      
      setIndexProgress(progress);
      
      if (progress.status === 'scanning' || progress.status === 'indexing') {
        setIsIndexing(true);
      }
      
      if (progress.status === 'completed' || progress.status === 'cancelled' || progress.status === 'error') {
        setIsIndexing(false);
        setIndexStartTime(null);
        onIndexComplete?.();
      }
    };

    const unsubscribe = window.electronAPI.onIndexProgress(handleProgress);
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, [onIndexComplete]);

  const startIndexing = useCallback(async (dirPath: string) => {
    setIsIndexing(true);
    setIndexStartTime(new Date());
    setIndexProgress({
      total: 0,
      indexed: 0,
      currentFile: null,
      status: 'scanning'
    });
    
    try {
      await window.electronAPI.indexDirectory(dirPath);
    } catch (error) {
      console.error('Error starting indexing:', error);
      setIsIndexing(false);
      setIndexStartTime(null);
    }
  }, []);

  const pauseIndexing = useCallback(() => {
    window.electronAPI.indexPause();
  }, []);

  const resumeIndexing = useCallback(() => {
    window.electronAPI.indexResume();
  }, []);

  const cancelIndexing = useCallback(() => {
    window.electronAPI.indexCancel();
  }, []);

  return {
    isIndexing,
    indexProgress,
    indexStartTime,
    startIndexing,
    pauseIndexing,
    resumeIndexing,
    cancelIndexing
  };
}
