/**
 * Video Trim Module
 *
 * Operações básicas de edição de vídeo:
 * - Trim (cortar vídeo de start a end)
 * - Extração de áudio (MP3)
 * - Metadata via ffprobe
 *
 * Usa child_process.spawn direto (sem fluent-ffmpeg).
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFile } from 'child_process';
import { getFfmpegPath, getFfprobePath, validateFfmpegBinaries } from './binary-paths';
import { dbService } from './database';

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

/**
 * Resolve o filePath de um asset a partir do ID
 */
function resolveAssetPath(assetId: string): string {
  const db = dbService.getDatabase();
  const asset = db.prepare(`
    SELECT a.*, v.mount_point
    FROM assets a
    LEFT JOIN volumes v ON a.volume_uuid = v.uuid
    WHERE a.id = ?
  `).get(assetId) as any;

  if (!asset || !asset.mount_point) {
    throw new Error(`Asset não encontrado ou volume não montado: ${assetId}`);
  }

  const filePath = path.join(asset.mount_point, asset.relative_path);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  return filePath;
}

/**
 * Parseia progress do stderr do FFmpeg
 * FFmpeg escreve linhas como: frame=  123 fps= 30 ... time=00:00:04.12 ...
 */
function parseFFmpegProgress(stderrData: string, totalDuration: number): TrimProgress | null {
  const timeMatch = stderrData.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
  if (!timeMatch) return null;

  const currentTime = parseInt(timeMatch[1]) * 3600 +
                     parseInt(timeMatch[2]) * 60 +
                     parseFloat(timeMatch[3]);

  return {
    percent: Math.min(100, Math.round((currentTime / totalDuration) * 100)),
    currentTime,
    targetTime: totalDuration
  };
}

export class VideoTrimService {
  private tempDir: string;

  constructor(tempDir: string) {
    this.tempDir = tempDir;
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const validation = validateFfmpegBinaries();
    if (!validation.success) {
      console.error('[VideoTrimService] FFmpeg validation failed:', validation.error);
    } else {
      console.log('[VideoTrimService] FFmpeg OK:', validation.ffmpegPath);
      console.log('[VideoTrimService] FFprobe OK:', validation.ffprobePath);
    }
  }

  /**
   * Get video metadata usando ffprobe direto
   */
  async getMetadata(filePath: string): Promise<VideoMetadata> {
    const ffprobePath = getFfprobePath();
    if (!ffprobePath) throw new Error('FFprobe não encontrado');

    return new Promise((resolve, reject) => {
      execFile(ffprobePath, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ], { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('[VideoTrimService] ffprobe error:', error.message, stderr);
          return reject(new Error(`FFprobe falhou: ${error.message}`));
        }

        try {
          const data = JSON.parse(stdout);
          const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');
          if (!videoStream) {
            return reject(new Error('Nenhum stream de vídeo encontrado'));
          }

          const [num, den] = (videoStream.r_frame_rate || '0/1').split('/').map(Number);

          resolve({
            duration: parseFloat(data.format?.duration || '0'),
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            codec: videoStream.codec_name || 'unknown',
            frameRate: den ? num / den : 0,
            bitrate: Math.round((parseInt(data.format?.bit_rate || '0', 10)) / 1000),
            format: data.format?.format_name || 'unknown'
          });
        } catch (e) {
          reject(new Error(`Falha ao parsear saída do ffprobe: ${(e as Error).message}`));
        }
      });
    });
  }

  /**
   * Check if video has an audio stream
   */
  async hasAudioStream(inputPath: string): Promise<boolean> {
    const ffprobePath = getFfprobePath();
    if (!ffprobePath) {
      throw new Error('FFprobe não encontrado');
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(ffprobePath, [
        '-v', 'error',
        '-select_streams', 'a:0',
        '-show_entries', 'stream=codec_type',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        inputPath
      ]);

      let stdout = '';
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 && stdout.trim() === 'audio') {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Get best available audio codec for extraction
   */
  async getBestAudioCodec(ffmpegPath: string): Promise<{ codec: string; ext: string }> {
    // Try codecs in order of preference: libmp3lame (best), aac (good), libvorbis (fallback)
    const codecOptions = [
      { codec: 'libmp3lame', ext: 'mp3' },
      { codec: 'aac', ext: 'm4a' },
      { codec: 'libvorbis', ext: 'ogg' },
    ];

    for (const option of codecOptions) {
      const available = await this.checkCodecAvailable(ffmpegPath, option.codec);
      if (available) {
        console.log(`[VideoTrimService] Using audio codec: ${option.codec}`);
        return option;
      }
    }

    throw new Error('Nenhum codec de áudio disponível no FFmpeg');
  }

  /**
   * Check if specific codec is available in FFmpeg build
   */
  async checkCodecAvailable(ffmpegPath: string, codecName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(ffmpegPath, ['-codecs']);
      let stdout = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.on('close', () => {
        // Check if codec is in the list with encode capability
        const regex = new RegExp(`\\sE.{4}\\s${codecName}\\s`, 'i');
        resolve(regex.test(stdout));
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Trim rápido (copy codec, sem re-encoding)
   */
  async trimVideo(
    assetId: string,
    options: TrimOptions,
    outputPath?: string,
    onProgress?: (progress: TrimProgress) => void
  ): Promise<string> {
    const ffmpegPath = getFfmpegPath();
    if (!ffmpegPath) throw new Error('FFmpeg não encontrado');

    const inputPath = resolveAssetPath(assetId);
    this.validateTrimOptions(options);

    if (!outputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      outputPath = path.join(this.tempDir, `${basename}_trimmed_${Date.now()}${ext}`);
    }

    const duration = options.endTime - options.startTime;

    const args = [
      '-ss', options.startTime.toString(),
      '-i', inputPath,
      '-t', duration.toString(),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-y',
      outputPath
    ];

    return this.runFFmpeg(ffmpegPath, args, duration, onProgress, outputPath);
  }

  /**
   * Trim com re-encoding (mais lento, mais preciso)
   */
  async trimVideoReencode(
    assetId: string,
    options: TrimOptions,
    outputPath?: string,
    onProgress?: (progress: TrimProgress) => void
  ): Promise<string> {
    const ffmpegPath = getFfmpegPath();
    if (!ffmpegPath) throw new Error('FFmpeg não encontrado');

    const inputPath = resolveAssetPath(assetId);
    this.validateTrimOptions(options);

    if (!outputPath) {
      const ext = path.extname(inputPath);
      const basename = path.basename(inputPath, ext);
      outputPath = path.join(this.tempDir, `${basename}_trimmed_${Date.now()}${ext}`);
    }

    const duration = options.endTime - options.startTime;

    const args = [
      '-ss', options.startTime.toString(),
      '-i', inputPath,
      '-t', duration.toString(),
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-avoid_negative_ts', 'make_zero',
      '-y',
      outputPath
    ];

    return this.runFFmpeg(ffmpegPath, args, duration, onProgress, outputPath);
  }

  /**
   * Extrai áudio completo para MP3
   */
  async extractAudio(
    assetId: string,
    outputPath?: string,
    onProgress?: (progress: TrimProgress) => void
  ): Promise<string> {
    const ffmpegPath = getFfmpegPath();
    if (!ffmpegPath) throw new Error('FFmpeg não encontrado');

    const inputPath = resolveAssetPath(assetId);

    // Check if video has audio stream
    const hasAudio = await this.hasAudioStream(inputPath);
    if (!hasAudio) {
      throw new Error('Este vídeo não possui trilha de áudio');
    }

    // Detect best available codec
    const { codec, ext } = await this.getBestAudioCodec(ffmpegPath);

    if (!outputPath) {
      const basename = path.basename(inputPath, path.extname(inputPath));
      outputPath = path.join(this.tempDir, `${basename}_audio_${Date.now()}.${ext}`);
    }

    // Obter duração para cálculo de progresso
    const metadata = await this.getMetadata(inputPath);

    const args = [
      '-i', inputPath,
      '-vn',
      '-acodec', codec,
      '-ab', '192k',
      '-ac', '2',
      '-ar', '44100',
      '-y',
      outputPath
    ];

    return this.runFFmpeg(ffmpegPath, args, metadata.duration, onProgress, outputPath);
  }

  /**
   * Extrai áudio de trecho selecionado
   */
  async extractTrimmedAudio(
    assetId: string,
    options: TrimOptions,
    outputPath?: string,
    onProgress?: (progress: TrimProgress) => void
  ): Promise<string> {
    const ffmpegPath = getFfmpegPath();
    if (!ffmpegPath) throw new Error('FFmpeg não encontrado');

    const inputPath = resolveAssetPath(assetId);
    this.validateTrimOptions(options);

    // Check if video has audio stream
    const hasAudio = await this.hasAudioStream(inputPath);
    if (!hasAudio) {
      throw new Error('Este vídeo não possui trilha de áudio');
    }

    // Detect best available codec
    const { codec, ext } = await this.getBestAudioCodec(ffmpegPath);

    if (!outputPath) {
      const basename = path.basename(inputPath, path.extname(inputPath));
      outputPath = path.join(this.tempDir, `${basename}_audio_trimmed_${Date.now()}.${ext}`);
    }

    const duration = options.endTime - options.startTime;

    const args = [
      '-ss', options.startTime.toString(),
      '-i', inputPath,
      '-t', duration.toString(),
      '-vn',
      '-acodec', codec,
      '-ab', '192k',
      '-ac', '2',
      '-ar', '44100',
      '-y',
      outputPath
    ];

    return this.runFFmpeg(ffmpegPath, args, duration, onProgress, outputPath);
  }

  /**
   * Gera filmstrip thumbnails para timeline (fallback - preferir browser-native)
   */
  async generateFilmstripThumbnails(
    assetId: string,
    count: number = 20
  ): Promise<string[]> {
    const ffmpegPath = getFfmpegPath();
    if (!ffmpegPath) throw new Error('FFmpeg não encontrado');

    const inputPath = resolveAssetPath(assetId);

    const filmstripDir = path.join(this.tempDir, `filmstrip_${assetId}`);
    if (!fs.existsSync(filmstripDir)) {
      fs.mkdirSync(filmstripDir, { recursive: true });
    }

    // Check cache
    const existingFiles = await fs.promises.readdir(filmstripDir);
    const jpgFiles = existingFiles.filter(f => f.endsWith('.jpg'));
    if (jpgFiles.length >= count) {
      jpgFiles.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
      return jpgFiles.slice(0, count).map(f => path.join(filmstripDir, f));
    }

    // Limpar parciais
    for (const f of existingFiles) {
      await fs.promises.unlink(path.join(filmstripDir, f));
    }

    // Obter duração
    const metadata = await this.getMetadata(inputPath);
    const duration = metadata.duration;

    // Gerar cada thumbnail sequencialmente
    const paths: string[] = [];
    for (let i = 0; i < count; i++) {
      const time = (i / count) * duration + (duration / count / 2);
      const thumbPath = path.join(filmstripDir, `thumb_${i + 1}.jpg`);

      await new Promise<void>((resolve) => {
        const args = [
          '-ss', Math.min(time, duration - 0.1).toString(),
          '-i', inputPath,
          '-frames:v', '1',
          '-vf', 'scale=120:-1',
          '-q:v', '5',
          '-y',
          thumbPath
        ];

        const proc = spawn(ffmpegPath, args);
        proc.on('close', (code) => {
          if (code === 0) {
            paths.push(thumbPath);
            resolve();
          } else {
            // Skip failed thumbnails silently
            resolve();
          }
        });
        proc.on('error', () => resolve());
      });
    }

    return paths;
  }

  /**
   * Limpa arquivos temporários com mais de 24h
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stat = await fs.promises.stat(filePath);

        if (now - stat.mtimeMs > maxAge) {
          if (stat.isDirectory()) {
            await fs.promises.rm(filePath, { recursive: true, force: true });
          } else {
            await fs.promises.unlink(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Falha ao limpar temp files:', error);
    }
  }

  /**
   * Parse FFmpeg error and return user-friendly message
   */
  private parseFFmpegError(stderrBuffer: string, exitCode: number): string {
    const stderr = stderrBuffer.toLowerCase();

    // Check for specific error patterns
    if (stderr.includes('unknown encoder')) {
      return 'Codec de áudio não disponível. Tente atualizar o FFmpeg.';
    }

    if (stderr.includes('no such file') || stderr.includes('does not exist')) {
      return 'Arquivo de vídeo não encontrado.';
    }

    if (stderr.includes('permission denied')) {
      return 'Sem permissão para acessar o arquivo.';
    }

    if (stderr.includes('disk full') || stderr.includes('no space')) {
      return 'Espaço em disco insuficiente.';
    }

    if (stderr.includes('invalid data found')) {
      return 'Arquivo de vídeo corrompido ou formato inválido.';
    }

    // Extract actual error lines from stderr
    const errorLines = stderrBuffer.split('\n')
      .filter(l => l.includes('Error') || l.includes('error'));

    if (errorLines.length > 0) {
      return errorLines.slice(-3).join('\n');
    }

    return `FFmpeg falhou com código ${exitCode}`;
  }

  /**
   * Verify that output file exists and has content
   */
  private async verifyOutputFile(outputPath: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(outputPath);

      if (!stats.isFile()) {
        throw new Error('Output não é um arquivo válido');
      }

      if (stats.size === 0) {
        throw new Error('Arquivo de output está vazio');
      }

      console.log(`[VideoTrimService] Output verificado: ${outputPath} (${stats.size} bytes)`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Arquivo de output não foi criado');
      }
      throw error;
    }
  }

  /**
   * Executa FFmpeg com progress tracking
   */
  private runFFmpeg(
    ffmpegPath: string,
    args: string[],
    totalDuration: number,
    onProgress?: (progress: TrimProgress) => void,
    outputPath?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('[VideoTrimService] Executando:', ffmpegPath, args.join(' '));
      const proc = spawn(ffmpegPath, args);
      let stderrBuffer = '';

      proc.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderrBuffer += chunk;

        if (onProgress && totalDuration > 0) {
          const progress = parseFFmpegProgress(chunk, totalDuration);
          if (progress) {
            onProgress(progress);
          }
        }
      });

      proc.on('close', async (code) => {
        if (code === 0) {
          try {
            // Verify output file was created and has content
            await this.verifyOutputFile(outputPath!);
            console.log('[VideoTrimService] Concluído:', outputPath);
            resolve(outputPath!);
          } catch (verifyError) {
            console.error('[VideoTrimService] Verificação falhou:', verifyError);
            reject(verifyError);
          }
        } else {
          const errorMsg = this.parseFFmpegError(stderrBuffer, code ?? -1);
          console.error('[VideoTrimService] Erro:', errorMsg);
          reject(new Error(errorMsg));
        }
      });

      proc.on('error', (err) => {
        console.error('[VideoTrimService] Spawn error:', err);
        reject(new Error(`Falha ao executar FFmpeg: ${err.message}`));
      });
    });
  }

  private validateTrimOptions(options: TrimOptions): void {
    if (options.startTime < 0 || options.endTime <= options.startTime) {
      throw new Error('Tempos de trim inválidos');
    }
  }
}

// Singleton
let videoTrimService: VideoTrimService | null = null;

export function initVideoTrimService(tempDir: string): void {
  videoTrimService = new VideoTrimService(tempDir);
}

export function getVideoTrimService(): VideoTrimService {
  if (!videoTrimService) {
    throw new Error('VideoTrimService não inicializado');
  }
  return videoTrimService;
}
