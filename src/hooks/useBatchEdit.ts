/**
 * Hook for Batch Quick Edit functionality
 *
 * Allows applying the same edit operation to multiple photos simultaneously
 * with progress tracking and celebration messages.
 */

import { useState, useCallback } from 'react';
import { QuickEditOperation, ASPECT_RATIO_PRESETS } from './useQuickEdit';

export interface BatchProgress {
  current: number;
  total: number;
  percent: number;
  currentAssetId: string;
}

export interface BatchResult {
  assetId: string;
  filePath: string;
  success: boolean;
  error?: string;
}

export function useBatchEdit() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [results, setResults] = useState<BatchResult[]>([]);

  /**
   * Apply batch edits to multiple assets
   */
  const applyBatchEdits = useCallback(async (
    assetIds: string[],
    operations: QuickEditOperation
  ): Promise<BatchResult[]> => {
    setIsProcessing(true);
    setProgress({ current: 0, total: assetIds.length, percent: 0, currentAssetId: '' });
    setResults([]);

    try {
      const result = await (window as any).electronAPI?.quickEditBatchApply?.(
        assetIds,
        operations
      );

      if (result?.success && result?.results) {
        setResults(result.results);
        setProgress({
          current: assetIds.length,
          total: assetIds.length,
          percent: 100,
          currentAssetId: ''
        });
        return result.results;
      }

      console.error('Batch edit failed:', result?.error);
      return [];
    } catch (error) {
      console.error('Batch edit error:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Apply crop preset to multiple assets
   */
  const applyBatchCropPreset = useCallback(async (
    assetIds: string[],
    presetName: string
  ): Promise<BatchResult[]> => {
    setIsProcessing(true);
    setProgress({ current: 0, total: assetIds.length, percent: 0, currentAssetId: '' });
    setResults([]);

    try {
      const result = await (window as any).electronAPI?.quickEditBatchCropPreset?.(
        assetIds,
        presetName
      );

      if (result?.success && result?.results) {
        setResults(result.results);
        setProgress({
          current: assetIds.length,
          total: assetIds.length,
          percent: 100,
          currentAssetId: ''
        });
        return result.results;
      }

      console.error('Batch crop preset failed:', result?.error);
      return [];
    } catch (error) {
      console.error('Batch crop preset error:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Apply resize to multiple assets
   */
  const applyBatchResize = useCallback(async (
    assetIds: string[],
    presetName: string
  ): Promise<BatchResult[]> => {
    setIsProcessing(true);
    setProgress({ current: 0, total: assetIds.length, percent: 0, currentAssetId: '' });
    setResults([]);

    try {
      const result = await (window as any).electronAPI?.quickEditBatchResize?.(
        assetIds,
        presetName
      );

      if (result?.success && result?.results) {
        setResults(result.results);
        setProgress({
          current: assetIds.length,
          total: assetIds.length,
          percent: 100,
          currentAssetId: ''
        });
        return result.results;
      }

      console.error('Batch resize failed:', result?.error);
      return [];
    } catch (error) {
      console.error('Batch resize error:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Batch rotate clockwise
   */
  const batchRotateClockwise = useCallback(async (
    assetIds: string[]
  ): Promise<BatchResult[]> => {
    setIsProcessing(true);
    setProgress({ current: 0, total: assetIds.length, percent: 0, currentAssetId: '' });
    setResults([]);

    try {
      const result = await (window as any).electronAPI?.quickEditBatchRotateCW?.(assetIds);

      if (result?.success && result?.results) {
        setResults(result.results);
        setProgress({
          current: assetIds.length,
          total: assetIds.length,
          percent: 100,
          currentAssetId: ''
        });
        return result.results;
      }

      console.error('Batch rotate failed:', result?.error);
      return [];
    } catch (error) {
      console.error('Batch rotate error:', error);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Calculate time saved (estimate)
   */
  const calculateTimeSaved = useCallback((count: number, operationType: string): number => {
    // Estimate time per operation (in seconds)
    const timePerOp: Record<string, number> = {
      crop: 30,
      resize: 20,
      rotate: 10,
      flip: 10
    };

    const timePerItem = timePerOp[operationType] || 20;
    return Math.round(count * timePerItem);
  }, []);

  /**
   * Format time saved for display
   */
  const formatTimeSaved = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} segundos`;
    }

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes < 60) {
      return secs > 0 ? `${minutes} minutos e ${secs} segundos` : `${minutes} minutos`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} horas e ${mins} minutos`;
  }, []);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setProgress(null);
  }, []);

  return {
    isProcessing,
    progress,
    results,
    applyBatchEdits,
    applyBatchCropPreset,
    applyBatchResize,
    batchRotateClockwise,
    calculateTimeSaved,
    formatTimeSaved,
    clearResults,
    presets: ASPECT_RATIO_PRESETS
  };
}
