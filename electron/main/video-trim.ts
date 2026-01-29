/**
 * Video Trim Module
 *
 * Provides basic video editing operations:
 * - Trim (cut video from start to end time)
 * - Extract audio (MP3)
 * - Get video duration and metadata
 *
 * Uses FFmpeg for video processing.
 */

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
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

export interface TrimOptions {
  startTime: number;  // Start time in seconds
  endTime: number;    // End time in seconds
}

export interface VideoMetadata {
  duration: number;     // Duration in seconds
  width: number;        // Video width
  height: number;       // Video height
  codec: string;        // Video codec
  frameRate: number;    // Frame rate (fps)
  bitrate: number;      // Bitrate in kbps
  format: string;       // Container format
}

export interface TrimProgress {
  percent: number;      // Progress percentage (0-100)
  currentTime: number;  // Current processing time in seconds
  targetTime: number;   // Target duration in seconds
}

export class VideoTrimService {
  private tempDir: string;

  constructor(tempDir: string) {
    this.tempDir = tempDir;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  /**
   * Get video metadata using ffprobe
   */
  async getMetadata(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          codec: videoStream.codec_name || 'unknown',
          frameRate: this.parseFrameRate(videoStream.r_frame_rate || '0/0'),
          bitrate: Math.round((metadata.format.bit_rate || 0) / 1000), // Convert to kbps
          format: metadata.format.format_name || 'unknown'
        });
      });
    });
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
   * Trim video from startTime to endTime
   */
  async trimVideo(
    assetId: string,
    options: TrimOptions,
    outputPath?: string,
    onProgress?: (progress: TrimProgress) => void
  ): Promise<string> {
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

    // Validate times
    if (options.startTime < 0 || options.endTime <= options.startTime) {
      throw new Error('Invalid trim times');
    }

    // Generate output path if not provided
    if (!outputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_trimmed_${timestamp}${ext}`);
    }

    const duration = options.endTime - options.startTime;

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .setStartTime(options.startTime)
        .setDuration(duration)
        .output(outputPath!)
        // Use copy codec for fast trimming (no re-encoding)
        // This is much faster but only works on keyframes
        .outputOptions([
          '-c copy',           // Copy streams without re-encoding
          '-avoid_negative_ts make_zero' // Ensure timestamps are positive
        ]);

      // Progress callback
      if (onProgress) {
        command.on('progress', (progress) => {
          // FFmpeg progress.timemark is in format "00:00:10.00"
          const currentTime = this.parseTimemark(progress.timemark || '00:00:00');
          const percent = Math.min(100, (currentTime / duration) * 100);

          onProgress({
            percent: Math.round(percent),
            currentTime,
            targetTime: duration
          });
        });
      }

      command
        .on('end', () => {
          console.log('[VideoTrimService] Trim completed:', outputPath);
          resolve(outputPath!);
        })
        .on('error', (err) => {
          console.error('[VideoTrimService] Trim error:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Trim video with re-encoding (slower but more accurate)
   * Use this if copy codec fails or precision is needed
   */
  async trimVideoReencode(
    assetId: string,
    options: TrimOptions,
    outputPath?: string,
    onProgress?: (progress: TrimProgress) => void
  ): Promise<string> {
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

    if (options.startTime < 0 || options.endTime <= options.startTime) {
      throw new Error('Invalid trim times');
    }

    if (!outputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_trimmed_${timestamp}${ext}`);
    }

    const duration = options.endTime - options.startTime;

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .setStartTime(options.startTime)
        .setDuration(duration)
        .output(outputPath!)
        // Re-encode with good quality settings
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast',      // Encoding speed/quality tradeoff
          '-crf 23'            // Quality (lower = better, 18-28 is good range)
        ]);

      if (onProgress) {
        command.on('progress', (progress) => {
          const currentTime = this.parseTimemark(progress.timemark || '00:00:00');
          const percent = Math.min(100, (currentTime / duration) * 100);

          onProgress({
            percent: Math.round(percent),
            currentTime,
            targetTime: duration
          });
        });
      }

      command
        .on('end', () => {
          console.log('[VideoTrimService] Trim with re-encode completed:', outputPath);
          resolve(outputPath!);
        })
        .on('error', (err) => {
          console.error('[VideoTrimService] Trim with re-encode error:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Extract audio from video to MP3
   */
  async extractAudio(
    assetId: string,
    outputPath?: string,
    onProgress?: (progress: TrimProgress) => void
  ): Promise<string> {
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
      const basename = path.basename(inputPath, path.extname(inputPath));
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_audio_${timestamp}.mp3`);
    }

    // Get duration for progress calculation
    const metadata = await this.getMetadata(inputPath);

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .output(outputPath!)
        .noVideo()                    // Remove video stream
        .audioCodec('libmp3lame')     // MP3 codec
        .audioBitrate('192k')         // Good quality
        .audioChannels(2)             // Stereo
        .audioFrequency(44100);       // Standard sample rate

      if (onProgress) {
        command.on('progress', (progress) => {
          const currentTime = this.parseTimemark(progress.timemark || '00:00:00');
          const percent = Math.min(100, (currentTime / metadata.duration) * 100);

          onProgress({
            percent: Math.round(percent),
            currentTime,
            targetTime: metadata.duration
          });
        });
      }

      command
        .on('end', () => {
          console.log('[VideoTrimService] Audio extraction completed:', outputPath);
          resolve(outputPath!);
        })
        .on('error', (err) => {
          console.error('[VideoTrimService] Audio extraction error:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Extract audio from trimmed section
   */
  async extractTrimmedAudio(
    assetId: string,
    options: TrimOptions,
    outputPath?: string,
    onProgress?: (progress: TrimProgress) => void
  ): Promise<string> {
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

    if (options.startTime < 0 || options.endTime <= options.startTime) {
      throw new Error('Invalid trim times');
    }

    if (!outputPath) {
      const basename = path.basename(inputPath, path.extname(inputPath));
      const timestamp = Date.now();
      outputPath = path.join(this.tempDir, `${basename}_audio_trimmed_${timestamp}.mp3`);
    }

    const duration = options.endTime - options.startTime;

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .setStartTime(options.startTime)
        .setDuration(duration)
        .output(outputPath!)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .audioChannels(2)
        .audioFrequency(44100);

      if (onProgress) {
        command.on('progress', (progress) => {
          const currentTime = this.parseTimemark(progress.timemark || '00:00:00');
          const percent = Math.min(100, (currentTime / duration) * 100);

          onProgress({
            percent: Math.round(percent),
            currentTime,
            targetTime: duration
          });
        });
      }

      command
        .on('end', () => {
          console.log('[VideoTrimService] Trimmed audio extraction completed:', outputPath);
          resolve(outputPath!);
        })
        .on('error', (err) => {
          console.error('[VideoTrimService] Trimmed audio extraction error:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Parse FFmpeg timemark (format: "00:00:10.00") to seconds
   */
  private parseTimemark(timemark: string): number {
    const parts = timemark.split(':');
    if (parts.length !== 3) return 0;

    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseFloat(parts[2]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Format seconds to timecode (HH:MM:SS.ms)
   */
  formatTimecode(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
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
}

// Export singleton instance (will be initialized in main process)
let videoTrimService: VideoTrimService | null = null;

export function initVideoTrimService(tempDir: string): void {
  videoTrimService = new VideoTrimService(tempDir);
}

export function getVideoTrimService(): VideoTrimService {
  if (!videoTrimService) {
    throw new Error('VideoTrimService not initialized');
  }
  return videoTrimService;
}
