/**
 * Quick Edit Module
 *
 * Provides basic non-destructive photo editing operations:
 * - Crop (with aspect ratio presets)
 * - Rotate (90° CW/CCW)
 * - Flip (horizontal/vertical)
 * - Resize (with Instagram presets)
 *
 * Uses Sharp for image processing.
 */

import fs from 'fs';
import path from 'path';
import { sharp } from './indexer-sharp-fallback';
import { dbService } from './database';

// Disable sharp cache to prevent memory bloat
if (sharp) {
  try {
    sharp.cache(false);
  } catch {
    // ignore
  }
}

export interface CropOptions {
  left: number;    // Pixels from left
  top: number;     // Pixels from top
  width: number;   // Crop width in pixels
  height: number;  // Crop height in pixels
}

export interface ResizeOptions {
  width: number;   // Target width
  height: number;  // Target height
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'; // Default: 'cover'
}

export interface RotateOptions {
  angle: 90 | 180 | 270; // Rotation angle in degrees
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
  ratio: number; // width / height
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
  { name: 'Free Form', ratio: 0, width: 0, height: 0 }, // User-defined
];

export class QuickEditService {
  private tempDir: string;

  constructor(tempDir: string) {
    this.tempDir = tempDir;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  /**
   * Apply quick edit operations to an asset
   * Returns path to the edited file
   */
  async applyEdits(
    assetId: string,
    operations: QuickEditOperation,
    outputPath?: string
  ): Promise<string> {
    if (!sharp) {
      throw new Error('Sharp is not available');
    }

    // Get asset from database
    const db = dbService.getDatabase();
    const asset = db.prepare(`
      SELECT a.*, v.mount_point
      FROM assets a
      LEFT JOIN volumes v ON a.volume_uuid = v.uuid
      WHERE a.id = ?
    `).get(assetId) as any;

    if (!asset || !asset.mount_point) {
      throw new Error(`Asset not found or volume not mounted: ${assetId}`);
    }

    const inputPath = path.join(asset.mount_point, asset.relative_path);
    if (!fs.existsSync(inputPath)) {
      throw new Error(`File not found: ${inputPath}`);
    }

    // Generate output path if not provided
    if (!outputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_edited_${timestamp}${ext}`);
    }

    // Load image
    let image = sharp(inputPath);

    // Apply operations in order: crop → rotate → flip → resize

    // 1. Crop
    if (operations.crop) {
      const { left, top, width, height } = operations.crop;
      image = image.extract({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height)
      });
    }

    // 2. Rotate
    if (operations.rotate) {
      image = image.rotate(operations.rotate.angle);
    }

    // 3. Flip
    if (operations.flip) {
      if (operations.flip.horizontal) {
        image = image.flop();
      }
      if (operations.flip.vertical) {
        image = image.flip();
      }
    }

    // 4. Resize
    if (operations.resize) {
      const { width, height, fit = 'cover' } = operations.resize;
      image = image.resize(width, height, { fit });
    }

    // Save to output path
    await image.toFile(outputPath);

    return outputPath;
  }

  /**
   * Apply crop with aspect ratio preset
   */
  async applyCropPreset(
    assetId: string,
    presetName: string,
    outputPath?: string
  ): Promise<string> {
    const preset = ASPECT_RATIO_PRESETS.find(p => p.name === presetName);
    if (!preset) {
      throw new Error(`Preset not found: ${presetName}`);
    }

    const db = dbService.getDatabase();
    const asset = db.prepare(`
      SELECT a.*, v.mount_point
      FROM assets a
      LEFT JOIN volumes v ON a.volume_uuid = v.uuid
      WHERE a.id = ?
    `).get(assetId) as any;

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    const imageWidth = asset.width || 0;
    const imageHeight = asset.height || 0;

    if (imageWidth === 0 || imageHeight === 0) {
      throw new Error('Asset dimensions not available');
    }

    // Calculate crop dimensions to match aspect ratio
    const targetRatio = preset.ratio;
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

    // Apply crop
    const operations: QuickEditOperation = {
      crop: { left, top, width: cropWidth, height: cropHeight }
    };

    return this.applyEdits(assetId, operations, outputPath);
  }

  /**
   * Rotate image 90° clockwise
   */
  async rotateClockwise(assetId: string, outputPath?: string): Promise<string> {
    const operations: QuickEditOperation = {
      rotate: { angle: 90 }
    };
    return this.applyEdits(assetId, operations, outputPath);
  }

  /**
   * Rotate image 90° counter-clockwise
   */
  async rotateCounterClockwise(assetId: string, outputPath?: string): Promise<string> {
    const operations: QuickEditOperation = {
      rotate: { angle: 270 }
    };
    return this.applyEdits(assetId, operations, outputPath);
  }

  /**
   * Flip image horizontally
   */
  async flipHorizontal(assetId: string, outputPath?: string): Promise<string> {
    const operations: QuickEditOperation = {
      flip: { horizontal: true }
    };
    return this.applyEdits(assetId, operations, outputPath);
  }

  /**
   * Flip image vertically
   */
  async flipVertical(assetId: string, outputPath?: string): Promise<string> {
    const operations: QuickEditOperation = {
      flip: { vertical: true }
    };
    return this.applyEdits(assetId, operations, outputPath);
  }

  /**
   * Resize to Instagram preset
   */
  async resizeToInstagram(
    assetId: string,
    presetName: string,
    outputPath?: string
  ): Promise<string> {
    const preset = ASPECT_RATIO_PRESETS.find(p => p.name === presetName);
    if (!preset) {
      throw new Error(`Preset not found: ${presetName}`);
    }

    const operations: QuickEditOperation = {
      resize: {
        width: preset.width,
        height: preset.height,
        fit: 'cover'
      }
    };

    return this.applyEdits(assetId, operations, outputPath);
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    if (!sharp) {
      throw new Error('Sharp is not available');
    }

    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  }

  /**
   * Calculate crop dimensions for a given aspect ratio
   */
  calculateCropForAspectRatio(
    imageWidth: number,
    imageHeight: number,
    targetRatio: number
  ): CropOptions {
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
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stat = await fs.promises.stat(filePath);

        if (now - stat.mtimeMs > maxAge) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Apply batch edit operations to multiple assets
   * Returns array of output paths
   */
  async applyBatchEdits(
    assetIds: string[],
    operations: QuickEditOperation,
    onProgress?: (current: number, total: number, assetId: string) => void
  ): Promise<Array<{ assetId: string; filePath: string; success: boolean; error?: string }>> {
    const results: Array<{ assetId: string; filePath: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < assetIds.length; i++) {
      const assetId = assetIds[i];

      try {
        // Call progress callback
        if (onProgress) {
          onProgress(i + 1, assetIds.length, assetId);
        }

        // Apply edits to this asset
        const filePath = await this.applyEdits(assetId, operations);

        results.push({
          assetId,
          filePath,
          success: true
        });
      } catch (error) {
        console.error(`Batch edit failed for asset ${assetId}:`, error);
        results.push({
          assetId,
          filePath: '',
          success: false,
          error: (error as Error).message
        });
      }
    }

    return results;
  }

  /**
   * Apply crop preset to multiple assets (batch)
   */
  async applyBatchCropPreset(
    assetIds: string[],
    presetName: string,
    onProgress?: (current: number, total: number, assetId: string) => void
  ): Promise<Array<{ assetId: string; filePath: string; success: boolean; error?: string }>> {
    const results: Array<{ assetId: string; filePath: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < assetIds.length; i++) {
      const assetId = assetIds[i];

      try {
        if (onProgress) {
          onProgress(i + 1, assetIds.length, assetId);
        }

        const filePath = await this.applyCropPreset(assetId, presetName);

        results.push({
          assetId,
          filePath,
          success: true
        });
      } catch (error) {
        console.error(`Batch crop preset failed for asset ${assetId}:`, error);
        results.push({
          assetId,
          filePath: '',
          success: false,
          error: (error as Error).message
        });
      }
    }

    return results;
  }

  /**
   * Apply resize to multiple assets (batch)
   */
  async applyBatchResize(
    assetIds: string[],
    presetName: string,
    onProgress?: (current: number, total: number, assetId: string) => void
  ): Promise<Array<{ assetId: string; filePath: string; success: boolean; error?: string }>> {
    const results: Array<{ assetId: string; filePath: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < assetIds.length; i++) {
      const assetId = assetIds[i];

      try {
        if (onProgress) {
          onProgress(i + 1, assetIds.length, assetId);
        }

        const filePath = await this.resizeToInstagram(assetId, presetName);

        results.push({
          assetId,
          filePath,
          success: true
        });
      } catch (error) {
        console.error(`Batch resize failed for asset ${assetId}:`, error);
        results.push({
          assetId,
          filePath: '',
          success: false,
          error: (error as Error).message
        });
      }
    }

    return results;
  }

  /**
   * Batch rotate clockwise
   */
  async batchRotateClockwise(
    assetIds: string[],
    onProgress?: (current: number, total: number, assetId: string) => void
  ): Promise<Array<{ assetId: string; filePath: string; success: boolean; error?: string }>> {
    const results: Array<{ assetId: string; filePath: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < assetIds.length; i++) {
      const assetId = assetIds[i];

      try {
        if (onProgress) {
          onProgress(i + 1, assetIds.length, assetId);
        }

        const filePath = await this.rotateClockwise(assetId);

        results.push({
          assetId,
          filePath,
          success: true
        });
      } catch (error) {
        console.error(`Batch rotate failed for asset ${assetId}:`, error);
        results.push({
          assetId,
          filePath: '',
          success: false,
          error: (error as Error).message
        });
      }
    }

    return results;
  }
}

// Export singleton instance (will be initialized in main process)
let quickEditService: QuickEditService | null = null;

export function initQuickEditService(tempDir: string): void {
  quickEditService = new QuickEditService(tempDir);
}

export function getQuickEditService(): QuickEditService {
  if (!quickEditService) {
    throw new Error('QuickEditService not initialized');
  }
  return quickEditService;
}
