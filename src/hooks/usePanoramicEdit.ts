/**
 * Hook for Panoramic/360 Editing functionality
 *
 * Provides interface for 360/panoramic editing operations:
 * - Reframe 360 video to flat projection
 * - Video stabilization
 * - 360 photo reframing and orientation adjustment
 * - LRV proxy workflow
 * - Get 360 metadata
 * - Progress tracking
 */

import { useState, useCallback } from 'react';

// Type definitions matching backend
export interface ReframeOptions {
  outputProjection: 'flat' | 'equirectangular';
  outputAspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  fov: number;          // Field of view (60-120 degrees)
  yaw: number;          // Horizontal pan (-180 to 180)
  pitch: number;        // Vertical tilt (-90 to 90)
  roll: number;         // Rotation (-180 to 180)
  outputResolution?: { width: number; height: number };
}

export interface PhotoReframeOptions {
  fov: number;
  yaw: number;
  pitch: number;
  roll: number;
  outputWidth: number;
  outputHeight: number;
}

export interface StabilizeOptions {
  shakiness?: number;   // 1-10, default 5
  accuracy?: number;    // 1-15, default 15
  smoothing?: number;   // 0-100, default 30
}

export interface Video360Metadata {
  projectionType: string;
  isSpherical: boolean;
  hasGyroData: boolean;
  originalResolution: { width: number; height: number };
  duration: number;
  codec: string;
  frameRate: number;
}

export interface PanoramicProgress {
  percent: number;
  currentTime: number;
  targetTime: number;
  operation: 'reframing' | 'stabilizing' | 'detecting';
}

export function usePanoramicEdit() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<PanoramicProgress | null>(null);
  const [metadata, setMetadata] = useState<Video360Metadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get 360 video metadata
   */
  const getMetadata = useCallback(async (
    assetId: string
  ): Promise<Video360Metadata | null> => {
    try {
      setError(null);
      const result = await (window as any).electronAPI?.panoramicGetMetadata?.(assetId);

      if (result?.success && result?.metadata) {
        setMetadata(result.metadata);
        return result.metadata;
      }

      console.error('Get metadata failed:', result?.error);
      setError('Failed to get 360 metadata');
      return null;
    } catch (err) {
      console.error('Get metadata error:', err);
      setError('Error getting 360 metadata');
      return null;
    }
  }, []);

  /**
   * Reframe 360 video to flat projection
   */
  const reframeVideo = useCallback(async (
    assetId: string,
    options: ReframeOptions
  ): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);
    setProgress({ percent: 0, currentTime: 0, targetTime: 0, operation: 'reframing' });

    try {
      const result = await (window as any).electronAPI?.panoramicReframeVideo?.(
        assetId,
        options
      );

      if (result?.success && result?.filePath) {
        setProgress({ percent: 100, currentTime: 0, targetTime: 0, operation: 'reframing' });
        return result.filePath;
      }

      console.error('Reframe video failed:', result?.error);
      setError('Failed to reframe video');
      return null;
    } catch (err) {
      console.error('Reframe video error:', err);
      setError('Error reframing video');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Stabilize 360 video
   */
  const stabilizeVideo = useCallback(async (
    assetId: string,
    options: StabilizeOptions = {}
  ): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);
    setProgress({ percent: 0, currentTime: 0, targetTime: 0, operation: 'detecting' });

    try {
      const result = await (window as any).electronAPI?.panoramicStabilize?.(
        assetId,
        options
      );

      if (result?.success && result?.filePath) {
        setProgress({ percent: 100, currentTime: 0, targetTime: 0, operation: 'stabilizing' });
        return result.filePath;
      }

      console.error('Stabilize video failed:', result?.error);
      setError('Failed to stabilize video');
      return null;
    } catch (err) {
      console.error('Stabilize video error:', err);
      setError('Error stabilizing video');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Reframe 360 photo to flat projection
   */
  const reframePhoto = useCallback(async (
    assetId: string,
    options: PhotoReframeOptions
  ): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await (window as any).electronAPI?.panoramicReframePhoto?.(
        assetId,
        options
      );

      if (result?.success && result?.filePath) {
        return result.filePath;
      }

      console.error('Reframe photo failed:', result?.error);
      setError('Failed to reframe photo');
      return null;
    } catch (err) {
      console.error('Reframe photo error:', err);
      setError('Error reframing photo');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Adjust 360 photo orientation (without reframing)
   */
  const adjustPhotoOrientation = useCallback(async (
    assetId: string,
    yaw: number,
    pitch: number,
    roll: number
  ): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await (window as any).electronAPI?.panoramicAdjustPhotoOrientation?.(
        assetId,
        yaw,
        pitch,
        roll
      );

      if (result?.success && result?.filePath) {
        return result.filePath;
      }

      console.error('Adjust photo orientation failed:', result?.error);
      setError('Failed to adjust photo orientation');
      return null;
    } catch (err) {
      console.error('Adjust photo orientation error:', err);
      setError('Error adjusting photo orientation');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Link LRV proxy file to master file
   */
  const linkLRV = useCallback(async (
    lrvAssetId: string
  ): Promise<any | null> => {
    try {
      setError(null);
      const result = await (window as any).electronAPI?.panoramicLinkLRV?.(lrvAssetId);

      if (result?.success) {
        return result.masterAsset;
      }

      console.error('Link LRV failed:', result?.error);
      setError('Failed to link LRV to master');
      return null;
    } catch (err) {
      console.error('Link LRV error:', err);
      setError('Error linking LRV to master');
      return null;
    }
  }, []);

  /**
   * Apply edits made on LRV to master file
   */
  const applyLRVEdits = useCallback(async (
    lrvAssetId: string,
    masterAssetId: string,
    operations: any[]
  ): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await (window as any).electronAPI?.panoramicApplyLRVEdits?.(
        lrvAssetId,
        masterAssetId,
        operations
      );

      if (result?.success && result?.filePath) {
        return result.filePath;
      }

      console.error('Apply LRV edits failed:', result?.error);
      setError('Failed to apply LRV edits');
      return null;
    } catch (err) {
      console.error('Apply LRV edits error:', err);
      setError('Error applying LRV edits');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setMetadata(null);
    setError(null);
  }, []);

  return {
    // State
    isProcessing,
    progress,
    metadata,
    error,

    // Video operations
    getMetadata,
    reframeVideo,
    stabilizeVideo,

    // Photo operations
    reframePhoto,
    adjustPhotoOrientation,

    // LRV proxy workflow
    linkLRV,
    applyLRVEdits,

    // Utilities
    clearError,
    reset
  };
}
