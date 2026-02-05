/**
 * Panoramic Edit Module
 *
 * Provides 360/panoramic editing operations for Insta360 and GoPro cameras:
 * - Reframing (convert 360° equirectangular → flat video/photo)
 * - Orientation adjustment (yaw, pitch, roll)
 * - Video stabilization
 * - LRV proxy workflow support
 *
 * Supports:
 * - .insv (Insta360 360 video)
 * - .lrv (GoPro low-res proxy video)
 * - .insp (Insta360 360 photo)
 *
 * Uses FFmpeg v360 filter for projection conversions.
 */

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { getFfmpegPath, getFfprobePath } from './binary-paths';
import { dbService } from './database';

// Configure FFmpeg paths
const ffmpegPath = getFfmpegPath();
const ffprobePath = getFfprobePath();

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

// ============================================================================
// Type Definitions
// ============================================================================

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
  projectionType: string;    // 'equirectangular', 'cubemap', etc.
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

// ============================================================================
// Service Class
// ============================================================================

export class PanoramicEditService {
  private tempDir: string;

  constructor(tempDir: string) {
    this.tempDir = tempDir;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Cleanup old files on init
    this.cleanupOldFiles();
  }

  // ==========================================================================
  // Video 360 Operations
  // ==========================================================================

  /**
   * Reframe 360 video to flat projection
   */
  async reframe360ToFlat(
    assetId: string,
    options: ReframeOptions,
    outputPath?: string,
    onProgress?: (progress: PanoramicProgress) => void
  ): Promise<string> {
    const { inputPath, asset } = await this.getAssetPath(assetId);

    // Validate options
    this.validateReframeOptions(options);

    // Generate output path if not provided
    if (!outputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_reframed_${timestamp}.mp4`);
    }

    // Get output dimensions based on aspect ratio
    const dimensions = this.getOutputDimensions(options.outputAspectRatio, options.outputResolution);

    return new Promise((resolve, reject) => {
      // Build v360 filter
      const v360Filter = `v360=input=e:output=flat:h_fov=${options.fov}:v_fov=${options.fov}:yaw=${options.yaw}:pitch=${options.pitch}:roll=${options.roll}`;
      const scaleFilter = `scale=${dimensions.width}:${dimensions.height}`;

      const command = ffmpeg(inputPath)
        .videoFilters([v360Filter, scaleFilter])
        .videoCodec('libx264')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart'  // Enable web streaming
        ])
        .audioCodec('aac')
        .audioBitrate('192k')
        .on('start', (commandLine) => {
          console.log('[PanoramicEdit] FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress({
              percent: Math.round(progress.percent),
              currentTime: progress.timemark ? this.parseTimemark(progress.timemark) : 0,
              targetTime: asset.duration || 0,
              operation: 'reframing'
            });
          }
        })
        .on('end', () => {
          console.log('[PanoramicEdit] Reframing complete:', outputPath);
          resolve(outputPath!);
        })
        .on('error', (err) => {
          console.error('[PanoramicEdit] Reframing error:', err);
          reject(new Error(`Reframing failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  /**
   * Stabilize 360 video using vidstab (two-pass)
   */
  async stabilize360Video(
    assetId: string,
    options: StabilizeOptions = {},
    outputPath?: string,
    onProgress?: (progress: PanoramicProgress) => void
  ): Promise<string> {
    const { inputPath, asset } = await this.getAssetPath(assetId);

    const shakiness = options.shakiness || 5;
    const accuracy = options.accuracy || 15;
    const smoothing = options.smoothing || 30;

    // Generate output path if not provided
    if (!outputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_stabilized_${timestamp}${ext}`);
    }

    // Transforms file for vidstab
    const transformsPath = path.join(this.tempDir, `transforms_${Date.now()}.trf`);

    try {
      // Pass 1: Detect motion
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoFilters(`vidstabdetect=shakiness=${shakiness}:accuracy=${accuracy}:result=${transformsPath}`)
          .outputOptions(['-f null'])
          .output('-')
          .on('start', (commandLine) => {
            console.log('[PanoramicEdit] Stabilize pass 1:', commandLine);
          })
          .on('progress', (progress) => {
            if (onProgress && progress.percent) {
              onProgress({
                percent: Math.round(progress.percent / 2), // First pass = 0-50%
                currentTime: progress.timemark ? this.parseTimemark(progress.timemark) : 0,
                targetTime: asset.duration || 0,
                operation: 'detecting'
              });
            }
          })
          .on('end', () => {
            console.log('[PanoramicEdit] Motion detection complete');
            resolve();
          })
          .on('error', (err) => {
            reject(new Error(`Motion detection failed: ${err.message}`));
          })
          .run();
      });

      // Pass 2: Apply stabilization
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoFilters(`vidstabtransform=input=${transformsPath}:smoothing=${smoothing}`)
          .videoCodec('libx264')
          .outputOptions(['-preset fast', '-crf 23'])
          .audioCodec('copy')
          .on('start', (commandLine) => {
            console.log('[PanoramicEdit] Stabilize pass 2:', commandLine);
          })
          .on('progress', (progress) => {
            if (onProgress && progress.percent) {
              onProgress({
                percent: 50 + Math.round(progress.percent / 2), // Second pass = 50-100%
                currentTime: progress.timemark ? this.parseTimemark(progress.timemark) : 0,
                targetTime: asset.duration || 0,
                operation: 'stabilizing'
              });
            }
          })
          .on('end', () => {
            console.log('[PanoramicEdit] Stabilization complete:', outputPath);
            resolve();
          })
          .on('error', (err) => {
            reject(new Error(`Stabilization failed: ${err.message}`));
          })
          .save(outputPath!);
      });

      // Cleanup transforms file
      if (fs.existsSync(transformsPath)) {
        fs.unlinkSync(transformsPath);
      }

      return outputPath;
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(transformsPath)) {
        fs.unlinkSync(transformsPath);
      }
      throw error;
    }
  }

  /**
   * Extract 360 video metadata
   */
  async extract360Metadata(assetId: string): Promise<Video360Metadata> {
    const { inputPath } = await this.getAssetPath(assetId);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Metadata extraction failed: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        // Check for spherical metadata (simplified check)
        const isSpherical = Boolean(
          videoStream.width && videoStream.height &&
          (videoStream.width / videoStream.height) === 2 // 2:1 ratio = equirectangular
        );

        resolve({
          projectionType: isSpherical ? 'equirectangular' : 'flat',
          isSpherical,
          hasGyroData: false, // Would need deeper inspection of metadata
          originalResolution: {
            width: videoStream.width || 0,
            height: videoStream.height || 0
          },
          duration: metadata.format.duration || 0,
          codec: videoStream.codec_name || 'unknown',
          frameRate: this.parseFrameRate(videoStream.r_frame_rate || '0/0')
        });
      });
    });
  }

  // ==========================================================================
  // Photo 360 Operations
  // ==========================================================================

  /**
   * Reframe 360 photo to flat projection
   */
  async reframe360Photo(
    assetId: string,
    options: PhotoReframeOptions,
    outputPath?: string
  ): Promise<string> {
    const { inputPath } = await this.getAssetPath(assetId);

    // Generate output path if not provided
    if (!outputPath) {
      const basename = path.basename(inputPath, path.extname(inputPath));
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_reframed_${timestamp}.jpg`);
    }

    // For photos, we'll use FFmpeg to extract a frame with v360 filter
    return new Promise((resolve, reject) => {
      const v360Filter = `v360=input=e:output=flat:h_fov=${options.fov}:v_fov=${options.fov}:yaw=${options.yaw}:pitch=${options.pitch}:roll=${options.roll}`;
      const scaleFilter = `scale=${options.outputWidth}:${options.outputHeight}`;

      ffmpeg(inputPath)
        .inputOptions(['-loop 1', '-t 1']) // Treat as 1-second video
        .videoFilters([v360Filter, scaleFilter])
        .outputOptions(['-frames:v 1']) // Extract single frame
        .on('start', (commandLine) => {
          console.log('[PanoramicEdit] Photo reframe command:', commandLine);
        })
        .on('end', () => {
          console.log('[PanoramicEdit] Photo reframing complete:', outputPath);
          resolve(outputPath!);
        })
        .on('error', (err) => {
          console.error('[PanoramicEdit] Photo reframing error:', err);
          reject(new Error(`Photo reframing failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  /**
   * Adjust 360 photo orientation (without reframing)
   */
  async adjust360PhotoOrientation(
    assetId: string,
    yaw: number,
    pitch: number,
    roll: number,
    outputPath?: string
  ): Promise<string> {
    const { inputPath } = await this.getAssetPath(assetId);

    // Generate output path if not provided
    if (!outputPath) {
      const basename = path.basename(inputPath, path.extname(inputPath));
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_oriented_${timestamp}.jpg`);
    }

    // Apply orientation adjustment while keeping equirectangular projection
    return new Promise((resolve, reject) => {
      const v360Filter = `v360=input=e:output=e:yaw=${yaw}:pitch=${pitch}:roll=${roll}`;

      ffmpeg(inputPath)
        .inputOptions(['-loop 1', '-t 1'])
        .videoFilters(v360Filter)
        .outputOptions(['-frames:v 1'])
        .on('end', () => {
          console.log('[PanoramicEdit] Photo orientation complete:', outputPath);
          resolve(outputPath!);
        })
        .on('error', (err) => {
          reject(new Error(`Photo orientation failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  // ==========================================================================
  // LRV Proxy Workflow
  // ==========================================================================

  /**
   * Link LRV proxy file to its high-res master file
   * GoPro naming convention: GX010123.LRV → GX010123.MP4
   */
  async linkLRVToMaster(lrvAssetId: string): Promise<any | null> {
    const db = dbService.getDatabase();

    // Get LRV asset
    const lrvAsset = db.prepare(`
      SELECT * FROM assets WHERE id = ?
    `).get(lrvAssetId) as any;

    if (!lrvAsset) {
      return null;
    }

    // Extract base name without extension
    const lrvFileName = lrvAsset.file_name;
    const baseName = path.basename(lrvFileName, '.lrv').toUpperCase();

    // Look for master file (GX010123.MP4)
    const masterName = baseName + '.MP4';

    const masterAsset = db.prepare(`
      SELECT * FROM assets
      WHERE volume_uuid = ?
      AND file_name = ?
      LIMIT 1
    `).get(lrvAsset.volume_uuid, masterName) as any;

    if (!masterAsset) {
      // Also try lowercase
      const masterNameLower = baseName + '.mp4';
      const masterAssetLower = db.prepare(`
        SELECT * FROM assets
        WHERE volume_uuid = ?
        AND file_name = ?
        LIMIT 1
      `).get(lrvAsset.volume_uuid, masterNameLower) as any;

      return masterAssetLower || null;
    }

    return masterAsset;
  }

  /**
   * Apply edits made on LRV to master file
   * (Future implementation - for now just returns master path)
   */
  async applyLRVEditsToMaster(
    lrvAssetId: string,
    masterAssetId: string,
    operations: any[]
  ): Promise<string> {
    // TODO: Implement operation transposition
    // For now, just return master file path
    const { inputPath } = await this.getAssetPath(masterAssetId);
    return inputPath;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Get asset file path from database
   */
  private async getAssetPath(assetId: string): Promise<{ inputPath: string; asset: any }> {
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

    return { inputPath, asset };
  }

  /**
   * Validate reframe options
   */
  private validateReframeOptions(options: ReframeOptions): void {
    if (options.fov < 60 || options.fov > 120) {
      throw new Error('FOV must be between 60 and 120 degrees');
    }

    if (options.yaw < -180 || options.yaw > 180) {
      throw new Error('Yaw must be between -180 and 180 degrees');
    }

    if (options.pitch < -90 || options.pitch > 90) {
      throw new Error('Pitch must be between -90 and 90 degrees');
    }

    if (options.roll < -180 || options.roll > 180) {
      throw new Error('Roll must be between -180 and 180 degrees');
    }
  }

  /**
   * Get output dimensions based on aspect ratio
   */
  private getOutputDimensions(
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:3',
    customResolution?: { width: number; height: number }
  ): { width: number; height: number } {
    if (customResolution) {
      return customResolution;
    }

    // Default high-quality resolutions
    switch (aspectRatio) {
      case '16:9':
        return { width: 1920, height: 1080 };
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:3':
        return { width: 1600, height: 1200 };
      default:
        return { width: 1920, height: 1080 };
    }
  }

  /**
   * Parse frame rate string (e.g., "30000/1001" -> 29.97)
   */
  private parseFrameRate(frameRateStr: string): number {
    const parts = frameRateStr.split('/');
    if (parts.length !== 2) return 0;

    const num = parseInt(parts[0], 10);
    const den = parseInt(parts[1], 10);

    if (den === 0) return 0;
    return num / den;
  }

  /**
   * Parse FFmpeg timemark (HH:MM:SS.MS) to seconds
   */
  private parseTimemark(timemark: string): number {
    const parts = timemark.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Cleanup old temporary files (older than 24 hours)
   */
  private cleanupOldFiles(): void {
    if (!fs.existsSync(this.tempDir)) {
      return;
    }

    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    try {
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          console.log('[PanoramicEdit] Cleaned up old file:', file);
        }
      }
    } catch (error) {
      console.error('[PanoramicEdit] Cleanup error:', error);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: PanoramicEditService | null = null;

export function getPanoramicEditService(cacheDir?: string): PanoramicEditService {
  if (!serviceInstance) {
    const tempDir = cacheDir
      ? path.join(cacheDir, 'panoramic-edit')
      : path.join(process.cwd(), '.cache', 'panoramic-edit');

    serviceInstance = new PanoramicEditService(tempDir);
  }
  return serviceInstance;
}
