/**
 * Gerenciador do Worker de Indexação
 * Controla o worker thread e comunica com o renderer
 */
import { Worker } from 'worker_threads';
import path from 'path';
import { BrowserWindow } from 'electron';
import { dbService } from './database';

interface IndexerState {
  isRunning: boolean;
  isPaused: boolean;
  total: number;
  indexed: number;
  currentFile: string | null;
}

class IndexerManager {
  private worker: Worker | null = null;
  private mainWindow: BrowserWindow | null = null;
  private state: IndexerState = {
    isRunning: false,
    isPaused: false,
    total: 0,
    indexed: 0,
    currentFile: null
  };
  private pendingAssets: any[] = [];
  private saveInterval: NodeJS.Timeout | null = null;

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
  }

  getState(): IndexerState {
    return { ...this.state };
  }

  async start(dirPath: string, volumeUuid: string, volumeMountPoint: string, cacheDir: string): Promise<void> {
    if (this.worker) {
      this.stop();
    }

    this.state = {
      isRunning: true,
      isPaused: false,
      total: 0,
      indexed: 0,
      currentFile: null
    };
    this.pendingAssets = [];

    // Criar worker
    const workerPath = path.join(__dirname, 'indexer-worker.js');
    this.worker = new Worker(workerPath);

    // Configurar handlers
    this.worker.on('message', (message) => this.handleWorkerMessage(message));
    this.worker.on('error', (error: Error) => this.handleWorkerError(error));
    this.worker.on('exit', (code) => this.handleWorkerExit(code));

    // Iniciar salvamento periódico no banco (a cada 2 segundos)
    this.saveInterval = setInterval(() => this.flushPendingAssets(), 2000);

    // Enviar comando de início
    this.worker.postMessage({
      type: 'start',
      dirPath,
      volumeUuid,
      volumeMountPoint,
      cacheDir
    });

    // Notificar UI
    this.sendProgress('scanning');
  }

  pause(): void {
    if (this.worker && this.state.isRunning && !this.state.isPaused) {
      this.worker.postMessage({ type: 'pause' });
      this.state.isPaused = true;
      this.sendProgress('paused');
    }
  }

  resume(): void {
    if (this.worker && this.state.isRunning && this.state.isPaused) {
      this.worker.postMessage({ type: 'resume' });
      this.state.isPaused = false;
      this.sendProgress('indexing');
    }
  }

  cancel(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'cancel' });
      this.state.isRunning = false;
      this.sendProgress('cancelled');
    }
  }

  stop(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }

    // Salvar assets pendentes
    this.flushPendingAssets();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.state.isRunning = false;
  }

  private handleWorkerMessage(message: any): void {
    switch (message.type) {
      case 'ready':
        console.log('[IndexerManager] Worker ready');
        break;

      case 'progress':
        this.state.total = message.total || this.state.total;
        this.state.indexed = message.indexed || this.state.indexed;
        this.state.currentFile = message.currentFile || null;
        this.sendProgress(message.status || 'indexing');
        break;

      case 'completed':
        this.state.total = message.total || this.state.total;
        this.state.indexed = message.indexed || this.state.indexed;
        this.state.isRunning = false;

        // Adicionar resultados finais
        if (message.results && Array.isArray(message.results)) {
          this.pendingAssets.push(...message.results);
          // Flush early if pending assets exceed memory threshold (1000 items)
          if (this.pendingAssets.length > 1000) {
            this.flushPendingAssets();
          }
        }

        // Salvar tudo e notificar
        this.flushPendingAssets();
        this.sendProgress('completed');
        this.stop();
        break;

      case 'paused':
        this.state.isPaused = true;
        this.sendProgress('paused');
        break;

      case 'cancelled':
        this.state.isRunning = false;
        this.flushPendingAssets();
        this.sendProgress('cancelled');
        this.stop();
        break;

      case 'error':
        console.error('[IndexerManager] Worker error:', message.error);
        this.state.isRunning = false;
        this.sendProgress('error');
        this.stop();
        break;
    }
  }

  private handleWorkerError(error: Error): void {
    console.error('[IndexerManager] Worker error:', error);
    this.state.isRunning = false;
    this.sendProgress('error');
    this.stop();
  }

  private handleWorkerExit(code: number): void {
    console.log('[IndexerManager] Worker exited with code:', code);
    if (code !== 0 && this.state.isRunning) {
      this.state.isRunning = false;
      this.sendProgress('error');
    }
    this.worker = null;
  }

  private sendProgress(status: string): void {
    this.mainWindow?.webContents.send('index-progress', {
      total: this.state.total,
      indexed: this.state.indexed,
      currentFile: this.state.currentFile,
      status,
      isPaused: this.state.isPaused
    });
  }

  private flushPendingAssets(): void {
    if (this.pendingAssets.length === 0) return;

    const db = dbService.getDatabase();
    const insertStmt = db.prepare(`
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

    const insertMany = db.transaction((assets: any[]) => {
      for (const asset of assets) {
        try {
          insertStmt.run(
            asset.id, asset.volumeUuid, asset.relativePath, asset.fileName, asset.fileSize, asset.partialHash, asset.mediaType,
            asset.width || null, asset.height || null, asset.createdAt ? new Date(asset.createdAt).getTime() : null,
            asset.codec || null, asset.container || null, asset.frameRate || null, asset.duration || null, asset.timecodeStart || null, asset.audioChannels || null, asset.audioSampleRate || null,
            asset.cameraMake || null, asset.cameraModel || null, asset.lens || null, asset.focalLength || null, asset.aperture || null, asset.shutterSpeed || null, asset.iso || null,
            asset.gpsLatitude || null, asset.gpsLongitude || null, asset.orientation || null, asset.colorSpace || null,
            asset.rating || 0, asset.colorLabel || null, asset.flagged ? 1 : 0, asset.rejected ? 1 : 0, JSON.stringify(asset.tags || []), asset.notes || '',
            JSON.stringify(asset.thumbnailPaths || []), asset.waveformPath || null, asset.proxyPath || null, asset.fullResPreviewPath || null,
            asset.indexedAt ? new Date(asset.indexedAt).getTime() : Date.now(), asset.status || 'online'
          );
        } catch (err) {
          console.error('[IndexerManager] Error saving asset:', asset.id, err);
        }
      }
    });

    try {
      insertMany(this.pendingAssets);
      console.log(`[IndexerManager] Saved ${this.pendingAssets.length} assets to database`);

      this.pendingAssets = [];
    } catch (err) {
      console.error('[IndexerManager] Error in batch save:', err);
    }
  }
}

export const indexerManager = new IndexerManager();
