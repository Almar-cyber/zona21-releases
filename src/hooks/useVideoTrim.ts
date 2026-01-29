/**
 * Hook for Video Trim functionality
 *
 * Provides interface for basic video editing operations:
 * - Trim (cut video from start to end time)
 * - Extract audio (MP3)
 * - Get video metadata
 * - Progress tracking
 */

import { useState, useCallback } from 'react';

export interface TrimOptions {
  startTime: number;  // Start time in seconds
  endTime: number;    // End time in seconds
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  frameRate: number;
  bitrate: number;
  format: string;
}

export interface TrimProgress {
  percent: number;
  currentTime: number;
  targetTime: number;
}

export function useVideoTrim() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<TrimProgress | null>(null);
  const [trimmedFilePath, setTrimmedFilePath] = useState<string | null>(null);

  /**
   * Get video metadata
   */
  const getMetadata = useCallback(async (
    assetId: string
  ): Promise<VideoMetadata | null> => {
    try {
      const result = await (window as any).electronAPI?.videoTrimGetMetadata?.(assetId);

      if (result?.success && result?.metadata) {
        return result.metadata;
      }

      console.error('Get metadata failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Get metadata error:', error);
      return null;
    }
  }, []);

  /**
   * Trim video (fast, uses copy codec)
   */
  const trimVideo = useCallback(async (
    assetId: string,
    options: TrimOptions,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    setProgress({ percent: 0, currentTime: 0, targetTime: options.endTime - options.startTime });

    try {
      const result = await (window as any).electronAPI?.videoTrimTrim?.(
        assetId,
        options,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setTrimmedFilePath(result.filePath);
        setProgress({ percent: 100, currentTime: options.endTime - options.startTime, targetTime: options.endTime - options.startTime });
        return result.filePath;
      }

      console.error('Trim failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Trim error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Trim video with re-encoding (slower but more accurate)
   */
  const trimVideoReencode = useCallback(async (
    assetId: string,
    options: TrimOptions,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    setProgress({ percent: 0, currentTime: 0, targetTime: options.endTime - options.startTime });

    try {
      const result = await (window as any).electronAPI?.videoTrimTrimReencode?.(
        assetId,
        options,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setTrimmedFilePath(result.filePath);
        setProgress({ percent: 100, currentTime: options.endTime - options.startTime, targetTime: options.endTime - options.startTime });
        return result.filePath;
      }

      console.error('Trim with re-encode failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Trim with re-encode error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Extract audio from entire video
   */
  const extractAudio = useCallback(async (
    assetId: string,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    setProgress(null);

    try {
      const result = await (window as any).electronAPI?.videoTrimExtractAudio?.(
        assetId,
        outputPath
      );

      if (result?.success && result?.filePath) {
        return result.filePath;
      }

      console.error('Extract audio failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Extract audio error:', error);
      return null;
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  /**
   * Extract audio from trimmed section
   */
  const extractTrimmedAudio = useCallback(async (
    assetId: string,
    options: TrimOptions,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    setProgress({ percent: 0, currentTime: 0, targetTime: options.endTime - options.startTime });

    try {
      const result = await (window as any).electronAPI?.videoTrimExtractTrimmedAudio?.(
        assetId,
        options,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setProgress({ percent: 100, currentTime: options.endTime - options.startTime, targetTime: options.endTime - options.startTime });
        return result.filePath;
      }

      console.error('Extract trimmed audio failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Extract trimmed audio error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Format seconds to HH:MM:SS
   */
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Format seconds to MM:SS.ms for display
   */
  const formatTimeDetailed = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);

    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  }, []);

  /**
   * Clear trimmed file path
   */
  const clearTrim = useCallback(() => {
    setTrimmedFilePath(null);
    setProgress(null);
  }, []);

  return {
    isProcessing,
    progress,
    trimmedFilePath,
    getMetadata,
    trimVideo,
    trimVideoReencode,
    extractAudio,
    extractTrimmedAudio,
    formatTime,
    formatTimeDetailed,
    clearTrim
  };
}
