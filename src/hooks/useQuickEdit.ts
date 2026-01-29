/**
 * Hook for Quick Edit functionality
 *
 * Provides interface for basic photo editing operations:
 * - Crop (with aspect ratio presets)
 * - Rotate (90° CW/CCW)
 * - Flip (horizontal/vertical)
 * - Resize (with Instagram presets)
 */

import { useState, useCallback } from 'react';

export interface CropOptions {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ResizeOptions {
  width: number;
  height: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface RotateOptions {
  angle: 90 | 180 | 270;
}

export interface FlipOptions {
  horizontal?: boolean;
  vertical?: boolean;
}

export interface QuickEditOperation {
  crop?: CropOptions;
  rotate?: RotateOptions;
  flip?: FlipOptions;
  resize?: ResizeOptions;
}

export interface AspectRatioPreset {
  name: string;
  ratio: number;
  width: number;
  height: number;
}

// Instagram and common aspect ratio presets
export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { name: 'Instagram Square', ratio: 1, width: 1080, height: 1080 },
  { name: 'Instagram Portrait', ratio: 4/5, width: 1080, height: 1350 },
  { name: 'Instagram Story', ratio: 9/16, width: 1080, height: 1920 },
  { name: 'Instagram Landscape', ratio: 1.91, width: 1080, height: 566 },
  { name: '16:9 Landscape', ratio: 16/9, width: 1920, height: 1080 },
  { name: '4:3 Standard', ratio: 4/3, width: 1600, height: 1200 },
  { name: '3:2 Classic', ratio: 3/2, width: 1800, height: 1200 },
  { name: '21:9 Ultrawide', ratio: 21/9, width: 2560, height: 1097 },
  { name: 'Free Form', ratio: 0, width: 0, height: 0 },
];

export function useQuickEdit() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedFilePath, setEditedFilePath] = useState<string | null>(null);

  /**
   * Apply quick edit operations to an asset
   */
  const applyEdits = useCallback(async (
    assetId: string,
    operations: QuickEditOperation,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await (window as any).electronAPI?.quickEditApply?.(
        assetId,
        operations,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setEditedFilePath(result.filePath);
        return result.filePath;
      }

      console.error('Quick edit failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Quick edit error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Apply crop with aspect ratio preset
   */
  const applyCropPreset = useCallback(async (
    assetId: string,
    presetName: string,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await (window as any).electronAPI?.quickEditCropPreset?.(
        assetId,
        presetName,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setEditedFilePath(result.filePath);
        return result.filePath;
      }

      console.error('Crop preset failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Crop preset error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Rotate image 90° clockwise
   */
  const rotateClockwise = useCallback(async (
    assetId: string,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await (window as any).electronAPI?.quickEditRotateCW?.(
        assetId,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setEditedFilePath(result.filePath);
        return result.filePath;
      }

      console.error('Rotate clockwise failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Rotate clockwise error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Rotate image 90° counter-clockwise
   */
  const rotateCounterClockwise = useCallback(async (
    assetId: string,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await (window as any).electronAPI?.quickEditRotateCCW?.(
        assetId,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setEditedFilePath(result.filePath);
        return result.filePath;
      }

      console.error('Rotate counter-clockwise failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Rotate counter-clockwise error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Flip image horizontally
   */
  const flipHorizontal = useCallback(async (
    assetId: string,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await (window as any).electronAPI?.quickEditFlipH?.(
        assetId,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setEditedFilePath(result.filePath);
        return result.filePath;
      }

      console.error('Flip horizontal failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Flip horizontal error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Flip image vertically
   */
  const flipVertical = useCallback(async (
    assetId: string,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await (window as any).electronAPI?.quickEditFlipV?.(
        assetId,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setEditedFilePath(result.filePath);
        return result.filePath;
      }

      console.error('Flip vertical failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Flip vertical error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Resize to Instagram preset
   */
  const resizeToInstagram = useCallback(async (
    assetId: string,
    presetName: string,
    outputPath?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const result = await (window as any).electronAPI?.quickEditResizeInstagram?.(
        assetId,
        presetName,
        outputPath
      );

      if (result?.success && result?.filePath) {
        setEditedFilePath(result.filePath);
        return result.filePath;
      }

      console.error('Resize to Instagram failed:', result?.error);
      return null;
    } catch (error) {
      console.error('Resize to Instagram error:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Calculate crop dimensions for a given aspect ratio
   */
  const calculateCropForAspectRatio = useCallback((
    imageWidth: number,
    imageHeight: number,
    targetRatio: number
  ): CropOptions => {
    const currentRatio = imageWidth / imageHeight;

    let cropWidth: number;
    let cropHeight: number;
    let left: number;
    let top: number;

    if (currentRatio > targetRatio) {
      // Image is wider, crop from sides
      cropHeight = imageHeight;
      cropWidth = Math.round(imageHeight * targetRatio);
      left = Math.round((imageWidth - cropWidth) / 2);
      top = 0;
    } else {
      // Image is taller, crop from top/bottom
      cropWidth = imageWidth;
      cropHeight = Math.round(imageWidth / targetRatio);
      left = 0;
      top = Math.round((imageHeight - cropHeight) / 2);
    }

    return { left, top, width: cropWidth, height: cropHeight };
  }, []);

  /**
   * Clear edited file path
   */
  const clearEdit = useCallback(() => {
    setEditedFilePath(null);
  }, []);

  return {
    isProcessing,
    editedFilePath,
    applyEdits,
    applyCropPreset,
    rotateClockwise,
    rotateCounterClockwise,
    flipHorizontal,
    flipVertical,
    resizeToInstagram,
    calculateCropForAspectRatio,
    clearEdit,
    presets: ASPECT_RATIO_PRESETS
  };
}
