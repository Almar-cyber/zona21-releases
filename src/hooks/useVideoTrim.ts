/**
 * Hook para funcionalidade de Video Trim
 *
 * - Thumbnails gerados via <video> + <canvas> (browser-nativo, sem FFmpeg)
 * - Trim e extração de áudio via IPC → FFmpeg (main process)
 * - Progress tracking via eventos IPC
 */

import { useState, useCallback, useEffect } from 'react';

export interface TrimOptions {
  startTime: number;
  endTime: number;
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
  done?: boolean;
  error?: string;
}

export function useVideoTrim() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<TrimProgress | null>(null);
  const [trimmedFilePath, setTrimmedFilePath] = useState<string | null>(null);

  // Listen for progress events from backend
  useEffect(() => {
    const unsubscribe = window.electronAPI.onVideoTrimProgress((progressData: TrimProgress) => {
      setProgress(progressData);

      if (progressData.done) {
        setIsProcessing(false);
      }

      if (progressData.error) {
        setProgress(null);
        setIsProcessing(false);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  /**
   * Get video metadata (fallback via IPC/ffprobe)
   */
  const getMetadata = useCallback(async (
    assetId: string
  ): Promise<VideoMetadata | null> => {
    try {
      const result = await window.electronAPI.videoTrimGetMetadata(assetId);

      if (result?.success) {
        return {
          duration: result.duration ?? 0,
          width: result.width ?? 0,
          height: result.height ?? 0,
          codec: result.codec ?? 'unknown',
          frameRate: result.fps ?? 0,
          bitrate: 0,
          format: 'unknown',
        };
      }

      console.error('Get metadata failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Get metadata error:', error);
      return null;
    }
  }, []);

  /**
   * Gera filmstrip thumbnails via <video> + <canvas> (browser-nativo)
   * Retorna array de data URLs (base64 JPEG)
   */
  const generateThumbnails = useCallback(async (
    assetId: string,
    count: number = 10,
    duration?: number
  ): Promise<string[] | null> => {
    try {
      const videoUrl = `zona21file://${assetId}`;
      const video = document.createElement('video');
      video.preload = 'auto';
      video.crossOrigin = 'anonymous';
      video.muted = true;

      return new Promise<string[] | null>((resolve) => {
        const thumbnails: string[] = [];
        let currentIndex = 0;
        let videoDuration = duration || 0;

        const cleanup = () => {
          video.removeAttribute('src');
          video.load();
        };

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        const seekToNext = () => {
          if (currentIndex >= count || videoDuration <= 0) {
            cleanup();
            resolve(thumbnails.length > 0 ? thumbnails : null);
            return;
          }

          const time = (currentIndex / count) * videoDuration + (videoDuration / count / 2);
          video.currentTime = Math.min(Math.max(0, time), videoDuration - 0.1);
        };

        video.onseeked = () => {
          if (!ctx) return;

          // Configurar tamanho do canvas proporcionalmente
          const aspectRatio = video.videoWidth / video.videoHeight;
          canvas.width = 120;
          canvas.height = Math.round(120 / aspectRatio);

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
          currentIndex++;
          seekToNext();
        };

        video.onloadeddata = () => {
          if (!videoDuration) {
            videoDuration = video.duration;
          }
          // Configurar dimensões iniciais
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            seekToNext();
          } else {
            cleanup();
            resolve(null);
          }
        };

        video.onerror = () => {
          console.error('Failed to load video for thumbnails:', assetId);
          cleanup();
          // Fallback para IPC (FFmpeg) se browser falhar
          window.electronAPI.videoTrimGenerateThumbnails(assetId, count)
            .then((result) => {
              if (result?.success && result?.thumbnails) {
                resolve(result.thumbnails);
              } else {
                resolve(null);
              }
            })
            .catch(() => resolve(null));
        };

        // Timeout safety (30s para todos os thumbnails)
        setTimeout(() => {
          if (thumbnails.length < count) {
            cleanup();
            resolve(thumbnails.length > 0 ? thumbnails : null);
          }
        }, 30000);

        video.src = videoUrl;
      });
    } catch (error) {
      console.error('Generate thumbnails error:', error);
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
  ): Promise<string | { success: false; error: string } | null> => {
    setIsProcessing(true);

    try {
      const result = await window.electronAPI.videoTrimTrim(
        assetId,
        options,
        outputPath
      );

      if (result?.success && result?.outputPath) {
        setTrimmedFilePath(result.outputPath);
        return result.outputPath;
      }

      console.error('Trim failed:', result?.error);
      return { success: false, error: result?.error || 'FFmpeg não encontrado ou falha no processo' };
    } catch (error) {
      console.error('Trim error:', error);
      setProgress(null);
      return { success: false, error: String(error) };
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

    try {
      const result = await window.electronAPI.videoTrimTrimReencode(
        assetId,
        options,
        outputPath
      );

      if (result?.success && result?.outputPath) {
        setTrimmedFilePath(result.outputPath);
        return result.outputPath;
      }

      console.error('Trim with re-encode failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Trim with re-encode error:', error);
      setProgress(null);
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
  ): Promise<{ success: boolean; outputPath?: string; error?: string }> => {
    setIsProcessing(true);

    try {
      const result = await window.electronAPI.videoTrimExtractAudio(
        assetId,
        outputPath
      );

      if (result?.success && result?.outputPath) {
        return { success: true, outputPath: result.outputPath };
      }

      console.error('Extract audio failed:', result?.error);
      return { success: false, error: result?.error || 'Falha desconhecida' };
    } catch (error) {
      console.error('Extract audio error:', error);
      setProgress(null);
      return { success: false, error: (error as Error).message };
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
  ): Promise<{ success: boolean; outputPath?: string; error?: string }> => {
    setIsProcessing(true);

    try {
      const result = await window.electronAPI.videoTrimExtractTrimmedAudio(
        assetId,
        options,
        outputPath
      );

      if (result?.success && result?.outputPath) {
        return { success: true, outputPath: result.outputPath };
      }

      console.error('Extract trimmed audio failed:', result?.error);
      return { success: false, error: result?.error || 'Falha desconhecida' };
    } catch (error) {
      console.error('Extract trimmed audio error:', error);
      setProgress(null);
      return { success: false, error: (error as Error).message };
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
    generateThumbnails,
    formatTime,
    formatTimeDetailed,
    clearTrim
  };
}
