import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { exiftool } from 'exiftool-vendored';
import { dbService } from './database';
import { Asset, MediaType } from '../../src/shared/types';
import { getFfmpegPath, getFfprobePath, logBinaryPaths } from './binary-paths';

const stat = promisify(fs.stat);

const THUMB_VERSION = 'v2';
const THUMB_SIZE = 512;
const THUMB_JPEG_QUALITY = 90;

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.mxf', '.m4v', '.mpg', '.mpeg'];
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.cr2', '.cr3', '.arw', '.nef', '.dng', '.heic', '.heif'];

// Flag para indicar se ffmpeg está disponível
let ffmpegAvailable = false;

export class IndexerService {
  private cacheDir: string;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Log de diagnóstico em produção
    logBinaryPaths();

    // Configurar ffmpeg/ffprobe com paths corretos para produção
    try {
      const ffmpegPath = getFfmpegPath();
      const ffprobePath = getFfprobePath();

      if (ffmpegPath) {
        ffmpeg.setFfmpegPath(ffmpegPath);
        console.log('[IndexerService] ffmpeg configurado:', ffmpegPath);
      }
      if (ffprobePath) {
        ffmpeg.setFfprobePath(ffprobePath);
        console.log('[IndexerService] ffprobe configurado:', ffprobePath);
      }
      
      ffmpegAvailable = !!(ffmpegPath && ffprobePath);
      console.log('[IndexerService] ffmpeg disponível:', ffmpegAvailable);
    } catch (err) {
      console.error('[IndexerService] Erro ao configurar ffmpeg:', err);
      ffmpegAvailable = false;
    }
  }

  getCacheDir(): string {
    return this.cacheDir;
  }

  async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const scan = async (currentPath: string) => {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          // Ignorar arquivos ocultos e arquivos de metadados do macOS (._*)
          if (entry.name.startsWith('.') || entry.name.startsWith('._')) {
            continue;
          }
          
          const ext = path.extname(entry.name).toLowerCase();
          if (VIDEO_EXTENSIONS.includes(ext) || PHOTO_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    await scan(dirPath);
    return files;
  }

  async indexFile(filePath: string, volumeUuid: string, volumeMountPoint: string): Promise<Asset> {
    const stats = await stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mediaType: MediaType = VIDEO_EXTENSIONS.includes(ext) ? 'video' : 'photo';
    
    const relativePath = path.relative(volumeMountPoint, filePath);
    
    // Calcular hash com fallback
    let partialHash = '';
    try {
      partialHash = await this.calculatePartialHash(filePath);
    } catch (err) {
      console.warn('[IndexerService] Falha ao calcular hash:', filePath, err);
      partialHash = crypto.createHash('sha256').update(filePath + stats.size).digest('hex');
    }

    const id = crypto
      .createHash('sha256')
      .update(`${volumeUuid}:${relativePath}`)
      .digest('hex')
      .slice(0, 36);
    
    const asset: Partial<Asset> = {
      id,
      volumeUuid,
      relativePath,
      fileName: path.basename(filePath),
      fileSize: stats.size,
      partialHash,
      mediaType,
      createdAt: stats.birthtime,
      rating: 0,
      flagged: false,
      rejected: false,
      tags: [],
      notes: '',
      colorLabel: null,
      thumbnailPaths: [],
      waveformPath: null,
      proxyPath: null,
      fullResPreviewPath: null,
      indexedAt: new Date(),
      status: 'online'
    };

    // Extrair apenas metadados básicos (rápido) - thumbnails são gerados lazy
    if (mediaType === 'video') {
      // Para vídeos, só extrair metadados se ffprobe disponível
      // Thumbnail será gerado sob demanda
      try {
        const videoMeta = await this.extractVideoMetadata(filePath);
        Object.assign(asset, videoMeta);
      } catch (err) {
        // Continuar sem metadados de vídeo - serão extraídos depois
      }
    } else {
      // Para fotos, extrair EXIF básico (pode ser lento para alguns formatos)
      // Usar timeout para não travar
      try {
        const photoMeta = await Promise.race([
          this.extractPhotoMetadata(filePath),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]) as any;
        Object.assign(asset, photoMeta);
      } catch (err) {
        // Continuar sem metadados - serão extraídos depois se necessário
      }
    }
    // Thumbnails serão gerados sob demanda via ensureThumbnail()

    // Save to database
    this.saveAsset(asset as Asset);
    
    return asset as Asset;
  }

  async ensureThumbnail(assetId: string, filePath: string, mediaType: MediaType): Promise<string | null> {
    try {
      const thumbPath =
        mediaType === 'video'
          ? await this.generateVideoThumbnail(filePath, assetId)
          : await this.generatePhotoThumbnail(filePath, assetId);

      if (thumbPath && fs.existsSync(thumbPath)) {
        return thumbPath;
      }
      return null;
    } catch {
      return null;
    }
  }

  async ensureRawFullResPreview(assetId: string, filePath: string): Promise<string | null> {
    try {
      const previewPath = path.join(this.cacheDir, `${assetId}_fullres.jpg`);
      if (fs.existsSync(previewPath)) {
        try {
          const s = await stat(previewPath);
          if (s.size > 0) return previewPath;
        } catch {
          // ignore and regenerate
        }
      }

      const generated = await this.generateRawFullResPreview(filePath, assetId);
      if (generated && fs.existsSync(generated)) {
        try {
          const s = await stat(generated);
          if (s.size > 0) return generated;
        } catch {
          return null;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private async calculatePartialHash(filePath: string): Promise<string> {
    const buffer = Buffer.alloc(65536); // 64KB
    const fd = await fs.promises.open(filePath, 'r');
    await fd.read(buffer, 0, 65536, 0);
    await fd.close();
    
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async extractVideoMetadata(filePath: string): Promise<Partial<Asset>> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          // Em produção, ffprobe pode falhar (binário ausente/permissões). Não quebrar a indexação.
          resolve({
            width: 0,
            height: 0,
            codec: null,
            container: path.extname(filePath).slice(1),
            frameRate: null,
            duration: null,
            timecodeStart: null,
            audioChannels: null,
            audioSampleRate: null,
            cameraMake: null,
            cameraModel: null,
            lens: null,
            focalLength: null,
            aperture: null,
            shutterSpeed: null,
            iso: null,
            gpsLatitude: null,
            gpsLongitude: null,
            orientation: null,
            colorSpace: null
          });
          return;
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        const calculateFrameRate = (rFrameRate: string | undefined): number | null => {
          if (!rFrameRate) return null;
          const parts = rFrameRate.split('/');
          if (parts.length === 2) {
            return parseInt(parts[0]) / parseInt(parts[1]);
          }
          return parseFloat(rFrameRate);
        };

        resolve({
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          codec: videoStream?.codec_name || null,
          container: path.extname(filePath).slice(1),
          frameRate: calculateFrameRate(videoStream?.r_frame_rate),
          duration: metadata.format.duration || null,
          timecodeStart: videoStream?.tags?.timecode || null,
          audioChannels: audioStream?.channels || null,
          audioSampleRate: audioStream?.sample_rate || null,
          cameraMake: null,
          cameraModel: null,
          lens: null,
          focalLength: null,
          aperture: null,
          shutterSpeed: null,
          iso: null,
          gpsLatitude: null,
          gpsLongitude: null,
          orientation: null,
          colorSpace: null
        });
      });
    });
  }

  private async extractPhotoMetadata(filePath: string): Promise<Partial<Asset>> {
    try {
      const tags = await exiftool.read(filePath);
      
      // Para arquivos RAW e outros formatos, usar dimensões do EXIF
      const width = tags.ImageWidth || tags.ExifImageWidth || 0;
      const height = tags.ImageHeight || tags.ExifImageHeight || 0;

      const parseOrientation = (raw: any): number | null => {
        if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
        if (typeof raw === 'string') {
          const s = raw.trim().toLowerCase();
          if (s === 'horizontal (normal)' || s === 'horizontal') return 1;
          if (s.includes('mirror horizontal')) return 2;
          if (s.includes('rotate 180')) return 3;
          if (s.includes('mirror vertical')) return 4;
          if (s.includes('mirror horizontal and rotate 270') || s.includes('mirror horizontal and rotate 90')) return 5;
          if (s.includes('rotate 90')) return 6;
          if (s.includes('mirror horizontal and rotate 90') || s.includes('mirror horizontal and rotate 270')) return 7;
          if (s.includes('rotate 270')) return 8;

          const n = Number(raw);
          if (Number.isFinite(n)) return n;
        }
        const fallback = (tags as any)['Orientation#'];
        if (typeof fallback === 'number' && Number.isFinite(fallback)) return fallback;
        return null;
      };

      const o = parseOrientation((tags as any).Orientation);
      const needsSwap = o != null && o >= 5 && o <= 8;
      const wNum = typeof width === 'number' ? width : 0;
      const hNum = typeof height === 'number' ? height : 0;
      const normW = needsSwap ? hNum : wNum;
      const normH = needsSwap ? wNum : hNum;

      return {
        width: normW,
        height: normH,
        codec: null,
        container: null,
        frameRate: null,
        duration: null,
        timecodeStart: null,
        audioChannels: null,
        audioSampleRate: null,
        cameraMake: tags.Make || null,
        cameraModel: tags.Model || null,
        lens: tags.LensModel || null,
        focalLength: typeof tags.FocalLength === 'number' ? tags.FocalLength : null,
        aperture: typeof tags.FNumber === 'number' ? tags.FNumber : null,
        shutterSpeed: typeof tags.ShutterSpeed === 'string' ? tags.ShutterSpeed : null,
        iso: tags.ISO || null,
        gpsLatitude: tags.GPSLatitude || null,
        gpsLongitude: tags.GPSLongitude || null,
        orientation: o,
        colorSpace: tags.ColorSpace || null
      };
    } catch (error) {
      console.error('Error extracting photo metadata:', error);
      return {
        width: 0,
        height: 0,
        codec: null,
        container: null,
        frameRate: null,
        duration: null,
        timecodeStart: null,
        audioChannels: null,
        audioSampleRate: null,
        cameraMake: null,
        cameraModel: null,
        lens: null,
        focalLength: null,
        aperture: null,
        shutterSpeed: null,
        iso: null,
        gpsLatitude: null,
        gpsLongitude: null,
        orientation: null,
        colorSpace: null
      };
    }
  }

  private async generateVideoThumbnail(filePath: string, assetId: string): Promise<string> {
    const thumbnailPath = path.join(this.cacheDir, `${assetId}_thumb_${THUMB_VERSION}.jpg`);
    
    return new Promise((resolve) => {
      ffmpeg(filePath)
        .screenshots({
          timestamps: ['10%'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: `${THUMB_SIZE}x?`
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', async () => {
          try {
            const p = await this.createPlaceholderThumbnail(thumbnailPath);
            resolve(p);
          } catch {
            resolve(thumbnailPath);
          }
        });
    });
  }

  private async generateRawFullResPreview(filePath: string, assetId: string): Promise<string | null> {
    const previewPath = path.join(this.cacheDir, `${assetId}_fullres.jpg`);
    
    try {
      const tempJpegPath = path.join(this.cacheDir, `${assetId}_${Date.now()}_fullres_temp.jpg`);
      const extractAttempts: Array<() => Promise<void>> = [
        () => exiftool.extractBinaryTag('JpgFromRaw', filePath, tempJpegPath),
        () => exiftool.extractBinaryTag('PreviewImage', filePath, tempJpegPath),
        () => exiftool.extractPreview(filePath, tempJpegPath)
      ];

      let extracted = false;
      for (const attempt of extractAttempts) {
        try {
          await attempt();
          if (fs.existsSync(tempJpegPath)) {
            const s = await stat(tempJpegPath);
            if (s.size > 0) {
              extracted = true;
              break;
            }
          }
        } catch {
          // ignore
        }
      }

      if (!extracted || !fs.existsSync(tempJpegPath)) {
        return null;
      }

      // Normalize orientation for extracted previews - fallback sem sharp
      await fs.promises.copyFile(tempJpegPath, previewPath);
      
      try {
        await fs.promises.unlink(tempJpegPath);
      } catch {
        // ignore
      }
      
      return previewPath;
    } catch (error) {
      console.error(`Error generating full-res preview for ${filePath}:`, error);
      return null;
    }
  }

  private async generatePhotoThumbnail(filePath: string, assetId: string): Promise<string> {
    const thumbnailPath = path.join(this.cacheDir, `${assetId}_thumb_${THUMB_VERSION}.jpg`);
    const ext = path.extname(filePath).toLowerCase();

    const safeUnlink = async (p: string | null) => {
      if (!p) return;
      try {
        await fs.promises.unlink(p);
      } catch (error) {
        const code = (error as any)?.code;
        if (code === 'ENOENT') return;
        throw error;
      }
    };
    
    // Para arquivos RAW, extrair JPEG embutido com exiftool
    const rawExtensions = ['.arw', '.cr2', '.cr3', '.nef', '.dng', '.raf', '.rw2', '.orf', '.pef'];
    
    if (rawExtensions.includes(ext)) {
      let tempJpegPath: string | null = null;
      try {
        tempJpegPath = path.join(this.cacheDir, `${assetId}_${Date.now()}_temp.jpg`);
        const extractAttempts: Array<() => Promise<void>> = [
          () => exiftool.extractBinaryTag('JpgFromRaw', filePath, tempJpegPath!),
          () => exiftool.extractBinaryTag('PreviewImage', filePath, tempJpegPath!),
          () => exiftool.extractBinaryTag('ThumbnailImage', filePath, tempJpegPath!),
          () => exiftool.extractPreview(filePath, tempJpegPath!)
        ];

        let extracted = false;
        for (const attempt of extractAttempts) {
          try {
            await attempt();
            if (tempJpegPath && fs.existsSync(tempJpegPath)) {
              const s = await stat(tempJpegPath);
              if (s.size > 0) {
                extracted = true;
                break;
              }
            }
          } catch {
            // ignore
          }
        }

        if (!extracted) {
          return this.createPlaceholderThumbnail(thumbnailPath);
        }

        if (!tempJpegPath || !fs.existsSync(tempJpegPath)) {
          return this.createPlaceholderThumbnail(thumbnailPath);
        }

        try {
          const s = await stat(tempJpegPath);
          if (s.size <= 0) {
            return this.createPlaceholderThumbnail(thumbnailPath);
          }
        } catch {
          return this.createPlaceholderThumbnail(thumbnailPath);
        }

        // Com sharp removido, apenas copia o arquivo
        await fs.promises.copyFile(tempJpegPath!, thumbnailPath);

        try {
          await safeUnlink(tempJpegPath);
        } catch {
          // ignore
        }
        
        return thumbnailPath;
      } catch (error) {
        console.error(`Error extracting RAW preview for ${filePath}:`, error);
        // Fallback: criar thumbnail placeholder
        try {
          await safeUnlink(tempJpegPath);
        } catch {
          // ignore
        }
        return this.createPlaceholderThumbnail(thumbnailPath);
      }
    }
    
    // Para JPG, PNG, etc - sharp removido, apenas copia
    try {
      await fs.promises.copyFile(filePath, thumbnailPath);
      return thumbnailPath;
    } catch (error) {
      console.error(`Error copying thumbnail for ${filePath}:`, error);
      return this.createPlaceholderThumbnail(thumbnailPath);
    }
  }

  private async createPlaceholderThumbnail(thumbnailPath: string): Promise<string> {
    // Criar thumbnail placeholder simples - sem sharp
    // Apenas cria um arquivo vazio por enquanto
    await fs.promises.writeFile(thumbnailPath, '');
    return thumbnailPath;
  }

  private saveAsset(asset: Asset) {
    const db = dbService.getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO assets (
        id, volume_uuid, relative_path, file_name, file_size, partial_hash, media_type,
        width, height, created_at,
        codec, container, frame_rate, duration, timecode_start, audio_channels, audio_sample_rate,
        camera_make, camera_model, lens, focal_length, aperture, shutter_speed, iso,
        gps_latitude, gps_longitude, orientation, color_space,
        rating, color_label, flagged, rejected, tags, notes,
        thumbnail_paths, waveform_path, proxy_path, full_res_preview_path,
        indexed_at, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      asset.id, asset.volumeUuid, asset.relativePath, asset.fileName, asset.fileSize, asset.partialHash, asset.mediaType,
      asset.width, asset.height, asset.createdAt.getTime(),
      asset.codec, asset.container, asset.frameRate, asset.duration, asset.timecodeStart, asset.audioChannels, asset.audioSampleRate,
      asset.cameraMake, asset.cameraModel, asset.lens, asset.focalLength, asset.aperture, asset.shutterSpeed, asset.iso,
      asset.gpsLatitude, asset.gpsLongitude, asset.orientation, asset.colorSpace,
      asset.rating, asset.colorLabel, asset.flagged ? 1 : 0, asset.rejected ? 1 : 0, JSON.stringify(asset.tags), asset.notes,
      JSON.stringify(asset.thumbnailPaths), asset.waveformPath, asset.proxyPath, asset.fullResPreviewPath,
      asset.indexedAt.getTime(), asset.status
    );
  }
}
