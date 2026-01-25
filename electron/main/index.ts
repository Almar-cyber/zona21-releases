import { app, BrowserWindow, ipcMain, dialog, protocol, shell } from 'electron';
import crypto from 'crypto';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { dbService } from './database';
import { IndexerService } from './indexer';
import { VolumeManager } from './volume-manager';
import { PremiereXMLExporter } from './exporters/premiere-xml';
import { LightroomXMPExporter } from './exporters/lightroom-xmp';
import { ensureUniquePath, normalizePathPrefix } from './moveUtils';
import { logger, getLogPath } from './logger';
import { handleAndInfer } from './error-handler';

let mainWindow: BrowserWindow | null = null;
let indexerService: IndexerService;
let volumeManager: VolumeManager;
// Removido: flags de GPU podem causar tela branca em alguns sistemas
// app.disableHardwareAcceleration();

let autoUpdater: any = null;

const exportZipJobs = new Map<
  string,
  {
    archive: any;
    output: fs.WriteStream;
  }
>();

const UPDATE_SETTINGS_FILE = path.join(app.getPath('userData'), 'update-settings.json');
const UPDATE_FEED_URL = 'https://github.com/alexiaolivei/zona21/releases/latest';

type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version?: string; releaseName?: string; releaseNotes?: string }
  | { state: 'not-available' }
  | { state: 'download-progress'; percent?: number; transferred?: number; total?: number; bytesPerSecond?: number }
  | { state: 'downloaded'; version?: string; releaseName?: string; releaseNotes?: string }
  | { state: 'error'; message: string };

let lastUpdateStatus: UpdateStatus = { state: 'idle' };

function mapAssetRow(row: any) {
  return {
    ...row,
    fileName: row.file_name ?? row.fileName,
    fileSize: row.file_size ?? row.fileSize,
    relativePath: row.relative_path ?? row.relativePath,
    volumeUuid: row.volume_uuid ?? row.volumeUuid,
    partialHash: row.partial_hash ?? row.partialHash,
    mediaType: row.media_type ?? row.mediaType,
    createdAt: new Date(row.created_at ?? row.createdAt),
    indexedAt: new Date(row.indexed_at ?? row.indexedAt),
    width: row.width ?? 0,
    height: row.height ?? 0,
    codec: row.codec ?? null,
    container: row.container ?? null,
    frameRate: row.frame_rate ?? row.frameRate ?? null,
    duration: row.duration ?? null,
    timecodeStart: row.timecode_start ?? row.timecodeStart ?? null,
    audioChannels: row.audio_channels ?? row.audioChannels ?? null,
    audioSampleRate: row.audio_sample_rate ?? row.audioSampleRate ?? null,
    cameraMake: row.camera_make ?? row.cameraMake ?? null,
    cameraModel: row.camera_model ?? row.cameraModel ?? null,
    lens: row.lens ?? null,
    focalLength: row.focal_length ?? row.focalLength ?? null,
    aperture: row.aperture ?? null,
    shutterSpeed: row.shutter_speed ?? row.shutterSpeed ?? null,
    iso: row.iso ?? null,
    gpsLatitude: row.gps_latitude ?? row.gpsLatitude ?? null,
    gpsLongitude: row.gps_longitude ?? row.gpsLongitude ?? null,
    orientation: row.orientation ?? null,
    colorSpace: row.color_space ?? row.colorSpace ?? null,
    rating: row.rating ?? 0,
    colorLabel: row.color_label ?? row.colorLabel ?? null,
    flagged: row.flagged === 1 || row.flagged === true,
    rejected: row.rejected === 1 || row.rejected === true,
    notes: row.notes ?? '',
    tags: (() => {
      try {
        return JSON.parse(row.tags || '[]');
      } catch {
        return [];
      }
    })(),
    thumbnailPaths: (() => {
      try {
        return JSON.parse(row.thumbnail_paths || row.thumbnailPaths || '[]');
      } catch {
        return [];
      }
    })(),
    waveformPath: row.waveform_path ?? row.waveformPath ?? null,
    proxyPath: row.proxy_path ?? row.proxyPath ?? null,
    fullResPreviewPath: row.full_res_preview_path ?? row.fullResPreviewPath ?? null,
    status: row.status
  };
}

function readUpdateAutoCheck(): boolean {
  try {
    if (!fs.existsSync(UPDATE_SETTINGS_FILE)) return true;
    const raw = fs.readFileSync(UPDATE_SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}') as any;
    return parsed?.autoCheck !== false;
  } catch {
    return true;
  }
}

function writeUpdateAutoCheck(autoCheck: boolean): void {
  try {
    fs.writeFileSync(UPDATE_SETTINGS_FILE, JSON.stringify({ autoCheck: !!autoCheck }, null, 2));
  } catch {
    // ignore
  }
}

function emitUpdateStatus(next: UpdateStatus) {
  lastUpdateStatus = next;
  try {
    mainWindow?.webContents.send('update-status', next);
  } catch {
    // ignore
  }
}

function setupAutoUpdater() {
  try {
    if (!autoUpdater) {
      try {
        const mod = require('electron-updater');
        autoUpdater = mod?.autoUpdater;
      } catch {
        autoUpdater = null;
      }
    }

    if (!autoUpdater) {
      emitUpdateStatus({ state: 'error', message: 'Auto-update indisponível (electron-updater não encontrado).' });
      return;
    }

    autoUpdater.autoDownload = false;
    autoUpdater.allowPrerelease = true;
    
    // Configurar para GitHub Releases
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'alexiaolivei',
      repo: 'zona21',
      private: false
    } as any);

    autoUpdater.on('checking-for-update', () => emitUpdateStatus({ state: 'checking' }));
    autoUpdater.on('update-available', (info: any) =>
      emitUpdateStatus({
        state: 'available',
        version: info?.version,
        releaseName: info?.releaseName,
        releaseNotes: typeof info?.releaseNotes === 'string' ? info.releaseNotes : undefined
      })
    );
    autoUpdater.on('update-not-available', () => emitUpdateStatus({ state: 'not-available' }));
    autoUpdater.on('download-progress', (p: any) =>
      emitUpdateStatus({
        state: 'download-progress',
        percent: p?.percent,
        transferred: p?.transferred,
        total: p?.total,
        bytesPerSecond: p?.bytesPerSecond
      })
    );
    autoUpdater.on('update-downloaded', (info: any) =>
      emitUpdateStatus({
        state: 'downloaded',
        version: info?.version,
        releaseName: info?.releaseName,
        releaseNotes: typeof info?.releaseNotes === 'string' ? info.releaseNotes : undefined
      })
    );
    autoUpdater.on('error', (err: any) => {
      const msg = String(err?.message || err || 'Erro desconhecido');
      // Erros 404/network são comuns quando o servidor de update não está configurado
      // Não mostrar como erro, apenas logar e marcar como "not-available"
      if (msg.includes('404') || msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
        console.log('[AutoUpdater] Update server not available:', msg);
        emitUpdateStatus({ state: 'not-available' });
        return;
      }
      emitUpdateStatus({ state: 'error', message: msg });
    });
  } catch (e) {
    emitUpdateStatus({ state: 'error', message: (e as Error).message });
  }
}

function getStartMsForDatePreset(preset: unknown): number | null {
  const p = String(preset || '').toLowerCase();
  if (!p) return null;

  const now = new Date();
  if (p === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (p === 'week') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    // Week starting Monday
    const day = d.getDay(); // 0..6 (Sun..Sat)
    const diff = (day + 6) % 7; // Mon=0, Sun=6
    d.setDate(d.getDate() - diff);
    return d.getTime();
  }
  if (p === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (p === 'year') {
    const d = new Date(now.getFullYear(), 0, 1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  return null;
}

function parseDateYmdToStartMs(ymd: unknown): number | null {
  const s = String(ymd || '').trim();
  if (!s) return null;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt.getTime();
}

function parseDateYmdToEndMs(ymd: unknown): number | null {
  const start = parseDateYmdToStartMs(ymd);
  if (start === null) return null;
  return start + 24 * 60 * 60 * 1000 - 1;
}

function parseTagsFilter(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((t) => String(t)).map((t) => t.trim()).filter(Boolean);
  return String(raw)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function applyTagsWhereClause(
  wherePrefix: string,
  filters: any,
  params: any[],
  opts?: { tableAlias?: string }
): string {
  const alias = opts?.tableAlias ? `${opts.tableAlias}.` : '';
  let where = wherePrefix;

  const tags = parseTagsFilter(filters?.tags);
  if (tags.length === 0) return where;

  const rawExts = new Set(['.arw', '.cr2', '.cr3', '.nef', '.dng', '.raf', '.rw2', '.orf', '.pef']);

  for (const tag of tags) {
    const t = String(tag).toLowerCase();
    if (t === 'type:video') {
      where += ` AND ${alias}media_type = ?`;
      params.push('video');
      continue;
    }
    if (t === 'type:photo') {
      where += ` AND ${alias}media_type = ?`;
      params.push('photo');
      continue;
    }
    if (t === 'type:raw') {
      // RAW is a subset of photo based on extension.
      const patterns = Array.from(rawExts).map(() => `lower(${alias}file_name) LIKE ?`).join(' OR ');
      where += ` AND (${patterns})`;
      params.push(...Array.from(rawExts).map((ext) => `%${ext}`));
      continue;
    }

    // Normal tag stored in JSON array string (assets.tags)
    where += ` AND ${alias}tags LIKE ?`;
    params.push(`%"${tag}"%`);
  }

  return where;
}

const CACHE_DIR = path.join(app.getPath('userData'), 'cache');

const thumbRegenerationLocks = new Map<string, Promise<string | null>>();

const MAX_THUMB_REGEN_CONCURRENCY = 2;
let activeThumbRegenerations = 0;
const thumbRegenWaiters: Array<() => void> = [];

const DEFAULT_PROJECT_ID = 'default';
const FAVORITES_COLLECTION_ID = 'favorites';

const TELEMETRY_SETTINGS_FILE = path.join(app.getPath('userData'), 'telemetry.json');
const PREFERENCES_FILE = path.join(app.getPath('userData'), 'preferences.json');

interface Preferences {
  defaultExportPath?: string;
}

function readPreferences(): Preferences {
  try {
    if (fs.existsSync(PREFERENCES_FILE)) {
      const data = fs.readFileSync(PREFERENCES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading preferences:', error);
  }
  return {};
}

function writePreferences(prefs: Preferences): void {
  try {
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing preferences:', error);
  }
}

function readTelemetryConsent(): boolean | null {
  try {
    if (!fs.existsSync(TELEMETRY_SETTINGS_FILE)) return null;
    const raw = fs.readFileSync(TELEMETRY_SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw || '{}') as any;
    if (typeof parsed?.enabled === 'boolean') return parsed.enabled;
    return null;
  } catch {
    return null;
  }
}

function writeTelemetryConsent(enabled: boolean): void {
  try {
    fs.mkdirSync(path.dirname(TELEMETRY_SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(TELEMETRY_SETTINGS_FILE, JSON.stringify({ enabled, updatedAt: Date.now() }, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

function ensureFavoritesCollection(db: any) {
  try {
    const exists = db.prepare('SELECT id FROM collections WHERE id = ?').get(FAVORITES_COLLECTION_ID);
    if (exists) {
      // v0.1: Favorites becomes Marcados (UI name)
      try {
        db.prepare('UPDATE collections SET name = ? WHERE id = ? AND project_id = ?').run('Marcados', FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID);
      } catch {
        // ignore
      }
      return;
    }
    db.prepare(
      'INSERT INTO collections (id, project_id, name, type, smart_filter, asset_ids) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID, 'Marcados', 'manual', null, JSON.stringify([]));
  } catch {
    // ignore
  }
}

async function withThumbRegenSemaphore<T>(fn: () => Promise<T>): Promise<T> {
  if (activeThumbRegenerations >= MAX_THUMB_REGEN_CONCURRENCY) {
    await new Promise<void>((resolve) => {
      thumbRegenWaiters.push(resolve);
    });
  }

  activeThumbRegenerations++;
  try {
    return await fn();
  } finally {
    activeThumbRegenerations--;
    const next = thumbRegenWaiters.shift();
    if (next) next();
  }
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'zona21thumb',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  },
  {
    scheme: 'zona21file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

async function resolveDevServerUrl(): Promise<string | null> {
  // Em produção (app.isPackaged), sempre usar arquivos estáticos
  if (app.isPackaged) {
    console.log('[resolveDevServerUrl] app.isPackaged=true, usando arquivos estáticos');
    return null;
  }
  
  const fromEnv = process.env.VITE_DEV_SERVER_URL;
  if (fromEnv) {
    console.log('[resolveDevServerUrl] Usando VITE_DEV_SERVER_URL:', fromEnv);
    return fromEnv;
  }

  console.log('[resolveDevServerUrl] Procurando Vite dev server...');

  // Fallback: encontrar um Vite dev server em portas comuns (apenas em dev)
  const portsToTry = [5174, 5173, 5175, 5176, 5177, 5178, 5179, 5180];
  for (const port of portsToTry) {
    const url = `http://localhost:${port}`;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
      clearTimeout(t);
      
      console.log(`[resolveDevServerUrl] Porta ${port}: status=${res.status}`);
      
      if (!res.ok) continue;

      const contentType = String(res.headers.get('content-type') || '');
      if (!contentType.includes('text/html')) {
        console.log(`[resolveDevServerUrl] Porta ${port}: não é HTML (${contentType})`);
        continue;
      }

      const html = await res.text();
      const looksLikeZona21 = html.includes('<title>Zona21</title>') || html.includes('<title>Zona21');
      const looksLikeViteDev = html.includes('/@vite/client') || html.includes('/src/main.tsx');
      
      console.log(`[resolveDevServerUrl] Porta ${port}: looksLikeZona21=${looksLikeZona21}, looksLikeViteDev=${looksLikeViteDev}`);
      
      if (looksLikeZona21 || looksLikeViteDev) {
        console.log(`[resolveDevServerUrl] Encontrado Vite dev server em ${url}`);
        return url;
      }
    } catch (err) {
      console.log(`[resolveDevServerUrl] Porta ${port}: erro - ${(err as Error).message}`);
    }
  }

  console.log('[resolveDevServerUrl] Nenhum Vite dev server encontrado, usando dist/index.html');
  return null;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  // Diagnóstico: capturar erros do renderer no terminal (útil quando fica tela branca)
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[Renderer] did-fail-load', { errorCode, errorDescription, validatedURL });
  });
  mainWindow.webContents.on('dom-ready', () => {
    try {
      console.log('[Renderer] dom-ready', { url: mainWindow?.webContents.getURL() });
    } catch {
      console.log('[Renderer] dom-ready');
    }
  });
  mainWindow.webContents.on('did-finish-load', () => {
    try {
      console.log('[Renderer] did-finish-load', { url: mainWindow?.webContents.getURL() });
    } catch {
      console.log('[Renderer] did-finish-load');
    }
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Renderer] render-process-gone', details);
  });
  mainWindow.webContents.on('unresponsive', () => {
    console.error('[Renderer] unresponsive');
  });
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const type = level >= 2 ? 'error' : level === 1 ? 'warn' : 'log';
    // Evitar flood: mas manter stack/erro visível
    console[type](`[Renderer console:${type}] ${message} (${sourceId}:${line})`);
  });

  // VITE_DEV_SERVER_URL é definida automaticamente pelo vite-plugin-electron
  const devUrl = await resolveDevServerUrl();
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
  
  // Forçar exibição da janela após carregar
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupAutoUpdater();
  indexerService = new IndexerService(CACHE_DIR);
  volumeManager = new VolumeManager();

  protocol.registerFileProtocol('zona21thumb', (request, callback) => {
    (async () => {
      try {
        const url = new URL(request.url);
        const assetId = url.hostname;
        if (!assetId) return callback({ error: -6 });

        const db = dbService.getDatabase();

        const assetStmt = db.prepare(`
          SELECT a.media_type, a.relative_path, a.thumbnail_paths, v.mount_point
          FROM assets a
          LEFT JOIN volumes v ON a.volume_uuid = v.uuid
          WHERE a.id = ?
        `);
        const assetRow = assetStmt.get(assetId) as any;
        if (!assetRow) return callback({ error: -6 });

        let thumbnailPath: string | null = null;
        if (assetRow.thumbnail_paths) {
          try {
            const paths = JSON.parse(assetRow.thumbnail_paths);
            thumbnailPath = paths?.[0] ?? null;
          } catch {
            thumbnailPath = null;
          }
        }

        const preferredV2ThumbPath = path.join(CACHE_DIR, `${assetId}_thumb_v2.jpg`);
        if (fs.existsSync(preferredV2ThumbPath)) {
          // Best-effort DB update so subsequent loads use the higher-quality thumb.
          try {
            db.prepare('UPDATE assets SET thumbnail_paths = ? WHERE id = ?').run(JSON.stringify([preferredV2ThumbPath]), assetId);
          } catch {
            // ignore
          }
          return callback({ path: preferredV2ThumbPath, mimeType: 'image/jpeg' });
        }

        const isLegacyThumb = typeof thumbnailPath === 'string' && /_thumb\.jpg$/i.test(thumbnailPath);

        if (thumbnailPath && thumbnailPath.startsWith(CACHE_DIR) && fs.existsSync(thumbnailPath) && !isLegacyThumb) {
          return callback({ path: thumbnailPath, mimeType: 'image/jpeg' });
        }

        // Try regenerate
        const mountPoint = assetRow.mount_point as string | null | undefined;
        const relativePath = assetRow.relative_path as string | undefined;
        const mediaType = assetRow.media_type as 'video' | 'photo' | undefined;
        if (mountPoint && relativePath && mediaType) {
          const originalPath = path.join(mountPoint, relativePath);
          if (fs.existsSync(originalPath)) {
            let lock = thumbRegenerationLocks.get(assetId);
            if (!lock) {
              lock = (async () => {
                const regenerated = await withThumbRegenSemaphore(() =>
                  indexerService.ensureThumbnail(assetId, originalPath, mediaType)
                );
                if (regenerated && regenerated.startsWith(CACHE_DIR) && fs.existsSync(regenerated)) {
                  try {
                    const updateStmt = db.prepare('UPDATE assets SET thumbnail_paths = ? WHERE id = ?');
                    updateStmt.run(JSON.stringify([regenerated]), assetId);
                  } catch {
                    // ignore
                  }
                  return regenerated;
                }
                return null;
              })().finally(() => {
                thumbRegenerationLocks.delete(assetId);
              });
              thumbRegenerationLocks.set(assetId, lock);
            }

            const regenerated = await lock;
            if (regenerated && regenerated.startsWith(CACHE_DIR) && fs.existsSync(regenerated)) {
              return callback({ path: regenerated, mimeType: 'image/jpeg' });
            }
          }
        }

        return callback({ error: -6 });
      } catch {
        return callback({ error: -6 });
      }
    })();
  });

  protocol.registerFileProtocol('zona21file', (request, callback) => {
    (async () => {
      try {
        const url = new URL(request.url);
        const assetId = url.hostname;
        if (!assetId) return callback({ error: -6 });

        const db = dbService.getDatabase();
        const stmt = db.prepare(`
          SELECT a.relative_path, a.full_res_preview_path, a.thumbnail_paths, v.mount_point
          FROM assets a
          LEFT JOIN volumes v ON a.volume_uuid = v.uuid
          WHERE a.id = ?
        `);
        const row = stmt.get(assetId) as any;
        const mountPoint = row?.mount_point as string | null | undefined;
        const relativePath = row?.relative_path as string | undefined;
        const fullResPreviewPath = row?.full_res_preview_path as string | null | undefined;
        const thumbnailPathsRaw = row?.thumbnail_paths as string | null | undefined;

        // For RAW files, use full-res preview if available
        if (fullResPreviewPath && fs.existsSync(fullResPreviewPath)) {
          return callback({ path: fullResPreviewPath, mimeType: 'image/jpeg' });
        }

        if (!mountPoint || !relativePath) return callback({ error: -6 });

        const originalPath = path.join(mountPoint, relativePath);
        if (!fs.existsSync(originalPath)) return callback({ error: -6 });

        const rawExts = new Set(['.arw', '.cr2', '.cr3', '.nef', '.dng', '.raf', '.rw2', '.orf', '.pef']);
        const ext = path.extname(relativePath).toLowerCase();
        const isRaw = rawExts.has(ext);

        if (isRaw) {
          try {
            const generated = await indexerService.ensureRawFullResPreview(assetId, originalPath);
            if (generated && fs.existsSync(generated)) {
              try {
                db.prepare('UPDATE assets SET full_res_preview_path = ? WHERE id = ?').run(generated, assetId);
              } catch {
                // ignore
              }
              return callback({ path: generated, mimeType: 'image/jpeg' });
            }
          } catch {
            // ignore
          }

          // Fallback: serve thumbnail if present
          try {
            const parsed = thumbnailPathsRaw ? (JSON.parse(thumbnailPathsRaw) as unknown) : null;
            const first = Array.isArray(parsed) ? parsed[0] : null;
            if (typeof first === 'string' && fs.existsSync(first)) {
              return callback({ path: first, mimeType: 'image/jpeg' });
            }
          } catch {
            // ignore
          }

          return callback({ error: -6 });
        }

        return callback({ path: originalPath });
      } catch {
        return callback({ error: -6 });
      }
    })();
  });
  
  setupIpcHandlers();
  createWindow();

  if (readUpdateAutoCheck() && autoUpdater) {
    try {
      setTimeout(() => {
        try {
          autoUpdater.checkForUpdates();
        } catch {
          // ignore
        }
      }, 1500);
    } catch {
      // ignore
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    dbService.close();
    app.quit();
  }
});

function setupIpcHandlers() {
  ipcMain.handle('get-telemetry-consent', async () => {
    return readTelemetryConsent();
  });

  ipcMain.handle('set-telemetry-consent', async (_event, enabled: boolean) => {
    writeTelemetryConsent(!!enabled);
    return { success: true };
  });

  ipcMain.handle('open-external', async (_event, rawUrl: string) => {
    try {
      const url = String(rawUrl || '').trim();
      if (!url) return { success: false, error: 'Invalid URL' };
      if (!/^https:\/\//i.test(url)) return { success: false, error: 'Only https URLs are allowed' };
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('get-update-settings', async () => {
    return { autoCheck: readUpdateAutoCheck(), feedUrl: UPDATE_FEED_URL, status: lastUpdateStatus };
  });

  ipcMain.handle('set-update-auto-check', async (_event, enabled: boolean) => {
    try {
      writeUpdateAutoCheck(!!enabled);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      if (!autoUpdater) return { success: false, error: 'Auto-update indisponível.' };
      emitUpdateStatus({ state: 'checking' });
      const res = await autoUpdater.checkForUpdates();
      return { success: true, result: res };
    } catch (error) {
      const msg = (error as Error).message || 'Erro desconhecido';
      // Erros 404/network são comuns quando o servidor de update não está configurado
      if (msg.includes('404') || msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
        console.log('[AutoUpdater] Update server not available:', msg);
        emitUpdateStatus({ state: 'not-available' });
        return { success: true }; // Não é erro do ponto de vista do usuário
      }
      emitUpdateStatus({ state: 'error', message: msg });
      return { success: false, error: msg };
    }
  });

  ipcMain.handle('download-update', async () => {
    try {
      if (!autoUpdater) return { success: false, error: 'Auto-update indisponível.' };
      const res = await autoUpdater.downloadUpdate();
      return { success: true, result: res };
    } catch (error) {
      emitUpdateStatus({ state: 'error', message: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('install-update', async () => {
    try {
      if (!autoUpdater) return { success: false, error: 'Auto-update indisponível.' };
      setTimeout(() => {
        try {
          autoUpdater.quitAndInstall();
        } catch {
          // ignore
        }
      }, 250);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Select directory dialog
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select folder to index'
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  ipcMain.handle('select-move-destination', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Choose destination folder',
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Index directory
  ipcMain.handle('index-directory', async (_event, dirPath: string) => {
    try {
      const volume = volumeManager.getVolumeForPath(dirPath);

      mainWindow?.webContents.send('index-progress', {
        total: 0,
        indexed: 0,
        currentFile: null,
        status: 'scanning'
      });

      const files = await indexerService.scanDirectory(dirPath);

      mainWindow?.webContents.send('index-progress', {
        total: files.length,
        indexed: 0,
        currentFile: null,
        status: 'indexing'
      });
      
      const results = [];
      for (const file of files) {
        try {
          const asset = await indexerService.indexFile(file, volume.uuid, volume.mountPoint!);
          results.push(asset);
          
          // Send progress update
          mainWindow?.webContents.send('index-progress', {
            total: files.length,
            indexed: results.length,
            currentFile: file,
            status: 'indexing'
          });
        } catch (error) {
          console.error(`Error indexing ${file}:`, error);
        }
      }

      mainWindow?.webContents.send('index-progress', {
        total: files.length,
        indexed: results.length,
        currentFile: null,
        status: 'completed'
      });
      
      return { success: true, count: results.length };
    } catch (error) {
      const appError = handleAndInfer('index-directory', error);

      mainWindow?.webContents.send('index-progress', {
        total: 0,
        indexed: 0,
        currentFile: null,
        status: 'completed'
      });

      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Get all assets
  ipcMain.handle('get-assets', async (_event, filters?: any) => {
    const db = dbService.getDatabase();
    if (filters?.collectionId) {
      const collStmt = db.prepare('SELECT asset_ids FROM collections WHERE id = ?');
      const collRow = collStmt.get(filters.collectionId) as any;
      const assetIdsJson = collRow?.asset_ids || JSON.stringify([]);

      let where = "WHERE a.status = 'online'";
      const params: any[] = [assetIdsJson];

      if (filters.volumeUuid) {
        where += ' AND a.volume_uuid = ?';
        params.push(filters.volumeUuid);
      }
      if (filters.pathPrefix) {
        const prefix = String(filters.pathPrefix).replace(/\/+$/, '');
        where += ' AND a.relative_path LIKE ?';
        params.push(prefix.length > 0 ? `${prefix}/%` : '%');
      }
      if (filters.mediaType) {
        where += ' AND a.media_type = ?';
        params.push(filters.mediaType);
      }
      const startRange = parseDateYmdToStartMs(filters.dateFrom);
      const endRange = parseDateYmdToEndMs(filters.dateTo);
      if (startRange !== null) {
        where += ' AND a.created_at >= ?';
        params.push(startRange);
      } else {
        const startMs = getStartMsForDatePreset(filters.datePreset);
        if (startMs !== null) {
          where += ' AND a.created_at >= ?';
          params.push(startMs);
        }
      }
      if (endRange !== null) {
        where += ' AND a.created_at <= ?';
        params.push(endRange);
      }
      if (filters.flagged !== undefined) {
        where += ' AND a.flagged = ?';
        params.push(filters.flagged ? 1 : 0);
      }

      where = applyTagsWhereClause(where, filters, params, { tableAlias: 'a' });

      const stmt = db.prepare(`SELECT a.* FROM assets a JOIN json_each(?) ids ON a.id = ids.value ${where} ORDER BY a.created_at DESC`);
      const rows = stmt.all(...params);
      return rows.map((row: any) => mapAssetRow(row));
    }

    let query = "SELECT * FROM assets WHERE status = 'online'";
    const params: any[] = [];

    // Filtrar volumes hidden
    if (filters?.volumeUuid) {
      query += ' AND volume_uuid = ?';
      params.push(filters.volumeUuid);
    } else {
      query += ' AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)';
    }

    if (filters) {
      if (filters.pathPrefix) {
        const prefix = String(filters.pathPrefix).replace(/\/+$/, '');
        query += ' AND relative_path LIKE ?';
        params.push(prefix.length > 0 ? `${prefix}/%` : '%');
      }
      if (filters.mediaType) {
        query += ' AND media_type = ?';
        params.push(filters.mediaType);
      }
      const startRange = parseDateYmdToStartMs(filters.dateFrom);
      const endRange = parseDateYmdToEndMs(filters.dateTo);
      if (startRange !== null) {
        query += ' AND created_at >= ?';
        params.push(startRange);
      } else {
        const startMs = getStartMsForDatePreset(filters.datePreset);
        if (startMs !== null) {
          query += ' AND created_at >= ?';
          params.push(startMs);
        }
      }
      if (endRange !== null) {
        query += ' AND created_at <= ?';
        params.push(endRange);
      }
      if (filters.flagged !== undefined) {
        query += ' AND flagged = ?';
        params.push(filters.flagged ? 1 : 0);
      }

      query = applyTagsWhereClause(query, filters, params);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map((row: any) => mapAssetRow(row));
  });

  // Get assets page (for large libraries)
  ipcMain.handle('get-assets-page', async (_event, filters: any, offset: number, limit: number) => {
    const db = dbService.getDatabase();
    if (filters?.collectionId) {
      const collStmt = db.prepare('SELECT asset_ids FROM collections WHERE id = ?');
      const collRow = collStmt.get(filters.collectionId) as any;
      const assetIdsJson = collRow?.asset_ids || JSON.stringify([]);

      let where = "WHERE a.status = 'online'";
      const params: any[] = [assetIdsJson];

      if (filters.volumeUuid) {
        where += ' AND a.volume_uuid = ?';
        params.push(filters.volumeUuid);
      }
      if (filters.pathPrefix) {
        const prefix = String(filters.pathPrefix).replace(/\/+$/, '');
        where += ' AND a.relative_path LIKE ?';
        params.push(prefix.length > 0 ? `${prefix}/%` : '%');
      }
      if (filters.mediaType) {
        where += ' AND a.media_type = ?';
        params.push(filters.mediaType);
      }
      if (filters.fileExtension) {
        where += ' AND lower(a.file_name) LIKE ?';
        params.push(`%${filters.fileExtension.toLowerCase()}`);
      }
      const startMs = getStartMsForDatePreset(filters.datePreset);
      if (startMs !== null) {
        where += ' AND a.created_at >= ?';
        params.push(startMs);
      }
      if (filters.flagged !== undefined) {
        where += ' AND a.flagged = ?';
        params.push(filters.flagged ? 1 : 0);
      }

      where = applyTagsWhereClause(where, filters, params, { tableAlias: 'a' });

      const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM assets a JOIN json_each(?) ids ON a.id = ids.value ${where}`);
      const totalRow = totalStmt.get(...params) as any;
      const total = totalRow?.count ?? 0;

      const itemsStmt = db.prepare(
        `SELECT a.* FROM assets a JOIN json_each(?) ids ON a.id = ids.value ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
      );
      const rows = itemsStmt.all(...params, limit, offset);

      const items = rows.map((row: any) => mapAssetRow(row));

      return { items, total };
    }

    let where = "WHERE a.status = 'online'";
    const params: any[] = [];

    // Sempre excluir assets de volumes hidden (a menos que um volumeUuid específico seja passado)
    if (filters?.volumeUuid) {
      where += ' AND a.volume_uuid = ?';
      params.push(filters.volumeUuid);
    } else {
      // Excluir assets de volumes hidden
      where += ' AND a.volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)';
    }

    if (filters) {
      if (filters.pathPrefix) {
        const prefix = String(filters.pathPrefix).replace(/\/+$/, '');
        where += ' AND a.relative_path LIKE ?';
        params.push(prefix.length > 0 ? `${prefix}/%` : '%');
      }
      if (filters.mediaType) {
        where += ' AND a.media_type = ?';
        params.push(filters.mediaType);
      }
      if (filters.fileExtension) {
        where += ' AND lower(a.file_name) LIKE ?';
        params.push(`%${filters.fileExtension.toLowerCase()}`);
      }
      const startRange = parseDateYmdToStartMs(filters.dateFrom);
      const endRange = parseDateYmdToEndMs(filters.dateTo);
      if (startRange !== null) {
        where += ' AND a.created_at >= ?';
        params.push(startRange);
      } else {
        const startMs = getStartMsForDatePreset(filters.datePreset);
        if (startMs !== null) {
          where += ' AND a.created_at >= ?';
          params.push(startMs);
        }
      }
      if (endRange !== null) {
        where += ' AND a.created_at <= ?';
        params.push(endRange);
      }
      if (filters.flagged !== undefined) {
        where += ' AND a.flagged = ?';
        params.push(filters.flagged ? 1 : 0);
      }

      where = applyTagsWhereClause(where, filters, params, { tableAlias: 'a' });
    }

    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM assets a ${where}`);
    const totalRow = totalStmt.get(...params) as any;
    const total = totalRow?.count ?? 0;

    const itemsStmt = db.prepare(`SELECT a.* FROM assets a ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`);
    const rows = itemsStmt.all(...params, limit, offset);

    const items = rows.map((row: any) => mapAssetRow(row));

    return { items, total };
  });

  ipcMain.handle('get-culling-stats', async () => {
    const db = dbService.getDatabase();
    const totalRow = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'online' AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)").get() as any;
    const flaggedRow = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'online' AND flagged = 1 AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)").get() as any;
    
    return {
      totalCount: totalRow?.count || 0,
      flaggedCount: flaggedRow?.count || 0
    };
  });

  ipcMain.handle('get-available-tags', async () => {
    const db = dbService.getDatabase();
    const rows = db.prepare("SELECT tags FROM assets WHERE status = 'online' AND tags IS NOT NULL AND tags != '' AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)").all() as any[];
    const set = new Set<string>();
    for (const r of rows) {
      try {
        const parsed = JSON.parse(r.tags || '[]');
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            const s = String(t).trim();
            if (s) set.add(s);
          }
        }
      } catch {
        // ignore malformed tags
      }
    }

    // Synthetic tags for "type"
    set.add('type:photo');
    set.add('type:video');
    set.add('type:raw');

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  ipcMain.handle('get-collections', async () => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);

    const flaggedCountRow = db.prepare('SELECT COUNT(*) as c FROM assets WHERE flagged = 1').get() as any;
    const flaggedCount = Number(flaggedCountRow?.c ?? 0) || 0;

    const rows = db.prepare('SELECT id, name, type, asset_ids FROM collections WHERE project_id = ? ORDER BY name COLLATE NOCASE').all(DEFAULT_PROJECT_ID) as any[];
    return rows.map((r) => {
      if (r.id === FAVORITES_COLLECTION_ID) {
        return { id: r.id as string, name: 'Marcados', type: 'smart', count: flaggedCount };
      }
      let count = 0;
      try {
        const ids = JSON.parse(r.asset_ids || '[]');
        count = Array.isArray(ids) ? ids.length : 0;
      } catch {
        count = 0;
      }
      return { id: r.id as string, name: r.name as string, type: r.type as string, count };
    });
  });

  ipcMain.handle('create-collection', async (_event, name: string) => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);

    const trimmed = String(name || '').trim();
    if (!trimmed) return { success: false, error: 'Invalid name' };

    const id = crypto.randomUUID();
    db.prepare(
      'INSERT INTO collections (id, project_id, name, type, smart_filter, asset_ids) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, DEFAULT_PROJECT_ID, trimmed, 'manual', null, JSON.stringify([]));

    return { success: true, id, name: trimmed };
  });

  ipcMain.handle('rename-collection', async (_event, collectionId: string, name: string) => {
    try {
      const db = dbService.getDatabase();
      ensureFavoritesCollection(db);

      const id = String(collectionId || '').trim();
      const trimmed = String(name || '').trim();
      if (!id) return { success: false, error: 'Invalid collection' };
      if (id === FAVORITES_COLLECTION_ID) return { success: false, error: 'Cannot rename Favorites' };
      if (!trimmed) return { success: false, error: 'Invalid name' };

      const row = db.prepare('SELECT id FROM collections WHERE id = ? AND project_id = ?').get(id, DEFAULT_PROJECT_ID) as any;
      if (!row) return { success: false, error: 'Collection not found' };

      db.prepare('UPDATE collections SET name = ? WHERE id = ? AND project_id = ?').run(trimmed, id, DEFAULT_PROJECT_ID);
      return { success: true, id, name: trimmed };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('delete-collection', async (_event, collectionId: string) => {
    try {
      const db = dbService.getDatabase();
      ensureFavoritesCollection(db);

      const id = String(collectionId || '').trim();
      if (!id) return { success: false, error: 'Invalid collection' };
      if (id === FAVORITES_COLLECTION_ID) return { success: false, error: 'Cannot delete Favorites' };

      const row = db.prepare('SELECT id FROM collections WHERE id = ? AND project_id = ?').get(id, DEFAULT_PROJECT_ID) as any;
      if (!row) return { success: false, error: 'Collection not found' };

      db.prepare('DELETE FROM collections WHERE id = ? AND project_id = ?').run(id, DEFAULT_PROJECT_ID);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('add-assets-to-collection', async (_event, collectionId: string, assetIds: string[]) => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);

    const row = db.prepare('SELECT asset_ids FROM collections WHERE id = ? AND project_id = ?').get(collectionId, DEFAULT_PROJECT_ID) as any;
    if (!row) return { success: false, error: 'Collection not found' };

    let existing: string[] = [];
    try {
      const parsed = JSON.parse(row.asset_ids || '[]');
      existing = Array.isArray(parsed) ? parsed : [];
    } catch {
      existing = [];
    }

    const merged = Array.from(new Set([...
      existing,
      ...((assetIds || []).map((s) => String(s)).filter(Boolean))
    ]));

    db.prepare('UPDATE collections SET asset_ids = ? WHERE id = ? AND project_id = ?').run(JSON.stringify(merged), collectionId, DEFAULT_PROJECT_ID);
    return { success: true, count: merged.length };
  });

  ipcMain.handle('remove-assets-from-collection', async (_event, collectionId: string, assetIds: string[]) => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);

    const row = db.prepare('SELECT asset_ids FROM collections WHERE id = ? AND project_id = ?').get(collectionId, DEFAULT_PROJECT_ID) as any;
    if (!row) return { success: false, error: 'Collection not found' };

    let existing: string[] = [];
    try {
      const parsed = JSON.parse(row.asset_ids || '[]');
      existing = Array.isArray(parsed) ? parsed.map((s) => String(s)) : [];
    } catch {
      existing = [];
    }

    const toRemove = new Set(((assetIds || []).map((s) => String(s)).filter(Boolean)));
    const next = existing.filter((id) => !toRemove.has(id));

    db.prepare('UPDATE collections SET asset_ids = ? WHERE id = ? AND project_id = ?').run(JSON.stringify(next), collectionId, DEFAULT_PROJECT_ID);
    return { success: true, count: next.length, removed: existing.length - next.length };
  });

  ipcMain.handle('toggle-favorites', async (_event, assetIds: string[]) => {
    try {
      const db = dbService.getDatabase();
      ensureFavoritesCollection(db);

      const row = db.prepare('SELECT asset_ids FROM collections WHERE id = ? AND project_id = ?').get(FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID) as any;
      if (!row) return { success: false, error: 'Favorites not found' };

      let existing: string[] = [];
      try {
        const parsed = JSON.parse(row.asset_ids || '[]');
        existing = Array.isArray(parsed) ? parsed : [];
      } catch {
        existing = [];
      }

      const set = new Set(existing);
      let added = 0;
      let removed = 0;

      for (const rawId of assetIds || []) {
        const id = String(rawId).trim();
        if (!id) continue;
        if (set.has(id)) {
          set.delete(id);
          removed++;
        } else {
          set.add(id);
          added++;
        }
      }

      const next = Array.from(set);
      db.prepare('UPDATE collections SET asset_ids = ? WHERE id = ? AND project_id = ?').run(JSON.stringify(next), FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID);
      return { success: true, added, removed, count: next.length };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('get-favorites-ids', async () => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);
    const row = db.prepare('SELECT asset_ids FROM collections WHERE id = ? AND project_id = ?').get(FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID) as any;
    try {
      const parsed = JSON.parse(row?.asset_ids || '[]');
      return Array.isArray(parsed) ? parsed.map((s) => String(s)) : [];
    } catch {
      return [];
    }
  });

  ipcMain.handle('get-folder-children', async (_event, volumeUuid: string | null, parentPath: string | null) => {
    const db = dbService.getDatabase();
    const prefix = (parentPath ? String(parentPath) : '').replace(/\/+$/, '');
    const prefixWithSlash = prefix.length > 0 ? `${prefix}/` : '';
    const prefixLen = prefixWithSlash.length;

    const whereParts: string[] = ["status = 'online'"];
    const params: any[] = [prefixLen];

    if (volumeUuid) {
      whereParts.push('volume_uuid = ?');
      params.push(volumeUuid);
    }

    if (prefixWithSlash.length > 0) {
      whereParts.push('relative_path LIKE ?');
      params.push(`${prefixWithSlash}%`);
    }

    const where = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
    const stmt = db.prepare(`
      WITH filtered AS (
        SELECT relative_path, substr(relative_path, ? + 1) AS rest
        FROM assets
        ${where}
      )
      SELECT
        substr(rest, 1, instr(rest, '/') - 1) AS name,
        COUNT(*) AS assetCount
      FROM filtered
      WHERE instr(rest, '/') > 0
      GROUP BY name
      HAVING name IS NOT NULL AND name <> ''
      ORDER BY name COLLATE NOCASE
    `);

    const rows = stmt.all(...params) as any[];
    return rows.map((r) => ({
      name: r.name as string,
      path: prefix.length > 0 ? `${prefix}/${r.name}` : (r.name as string),
      assetCount: Number(r.assetCount) || 0
    }));
  });

  // Get assets by ids (Selection Tray)
  ipcMain.handle('get-assets-by-ids', async (_event, assetIds: string[]) => {
    if (!assetIds || assetIds.length === 0) return [];

    const db = dbService.getDatabase();
    const placeholders = assetIds.map(() => '?').join(',');
    const stmt = db.prepare(`SELECT * FROM assets WHERE id IN (${placeholders})`);
    const rows = stmt.all(...assetIds);

    return rows.map((row: any) => mapAssetRow(row));
  });

  ipcMain.handle('get-duplicate-groups', async () => {
    const db = dbService.getDatabase();

    const groupsStmt = db.prepare(`
      SELECT partial_hash as partialHash, file_size as fileSize, COUNT(*) as count
      FROM assets
      WHERE status != 'missing'
      GROUP BY partial_hash, file_size
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 200
    `);

    const rows = groupsStmt.all() as Array<{ partialHash: string; fileSize: number; count: number }>;

    const idsStmt = db.prepare(`
      SELECT id
      FROM assets
      WHERE status != 'missing' AND partial_hash = ? AND file_size = ?
      ORDER BY created_at DESC
    `);

    const samplesStmt = db.prepare(`
      SELECT id, file_name as fileName, relative_path as relativePath
      FROM assets
      WHERE status != 'missing' AND partial_hash = ? AND file_size = ?
      ORDER BY created_at DESC
      LIMIT 6
    `);

    return rows.map((g) => {
      const assetIds = (idsStmt.all(g.partialHash, g.fileSize) as Array<{ id: string }>).map((r) => r.id);
      const samples = samplesStmt.all(g.partialHash, g.fileSize) as Array<{ id: string; fileName: string; relativePath: string }>;
      return {
        partialHash: g.partialHash,
        fileSize: g.fileSize,
        count: g.count,
        assetIds,
        samples
      };
    });
  });

  // Update asset
  ipcMain.handle('update-asset', async (_event, assetId: string, updates: any) => {
    const db = dbService.getDatabase();
    const fields = [];
    const values = [];

    if (updates.rating !== undefined) {
      fields.push('rating = ?');
      values.push(updates.rating);
    }
    if (updates.flagged !== undefined) {
      fields.push('flagged = ?');
      values.push(updates.flagged ? 1 : 0);
    }
    if (updates.rejected !== undefined) {
      fields.push('rejected = ?');
      values.push(updates.rejected ? 1 : 0);
    }
    if (updates.colorLabel !== undefined) {
      fields.push('color_label = ?');
      values.push(updates.colorLabel);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    if (fields.length === 0) return { success: false };

    values.push(assetId);
    const query = `UPDATE assets SET ${fields.join(', ')} WHERE id = ?`;
    
    const stmt = db.prepare(query);
    stmt.run(...values);

    return { success: true };
  });

  // Get volumes
  ipcMain.handle('get-volumes', async () => {
    return volumeManager.getAllVolumes();
  });

  ipcMain.handle('eject-volume', async (_event, uuid: string) => {
    return volumeManager.ejectVolume(String(uuid || ''));
  });

  ipcMain.handle('hide-volume', async (_event, uuid: string) => {
    return volumeManager.hideVolume(String(uuid || ''));
  });

  ipcMain.handle('rename-volume', async (_event, uuid: string, label: string) => {
    return volumeManager.renameVolume(String(uuid || ''), String(label || ''));
  });

  // Search assets
  ipcMain.handle('search-assets', async (_event, searchTerm: string) => {
    const db = dbService.getDatabase();
    const stmt = db.prepare(`
      SELECT assets.* FROM assets
      JOIN assets_fts ON assets.rowid = assets_fts.rowid
      WHERE assets_fts MATCH ?
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    const rows = stmt.all(searchTerm);
    return rows.map((row: any) => ({
      ...row,
      createdAt: new Date(row.created_at),
      indexedAt: new Date(row.indexed_at),
      flagged: row.flagged === 1,
      rejected: row.rejected === 1,
      tags: JSON.parse(row.tags || '[]'),
      thumbnailPaths: JSON.parse(row.thumbnail_paths || '[]')
    }));
  });

  // Get thumbnail as base64
  ipcMain.handle('get-thumbnail', async (_event, assetId: string) => {
    const db = dbService.getDatabase();
    const stmt = db.prepare('SELECT thumbnail_paths FROM assets WHERE id = ?');
    const row = stmt.get(assetId) as any;

    let thumbnailPath: string | null = null;
    if (row && row.thumbnail_paths) {
      try {
        const paths = JSON.parse(row.thumbnail_paths);
        thumbnailPath = paths?.[0] ?? null;
      } catch {
        thumbnailPath = null;
      }
    }

    if (thumbnailPath && thumbnailPath.startsWith(CACHE_DIR) && fs.existsSync(thumbnailPath)) {
      return `zona21thumb://${assetId}`;
    }

    // Thumbnail missing OR DB has no thumbnail -> try to regenerate from original file
    try {
      const infoStmt = db.prepare(`
        SELECT a.media_type, a.relative_path, v.mount_point
        FROM assets a
        LEFT JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.id = ?
      `);
      const info = infoStmt.get(assetId) as any;
      const mountPoint = info?.mount_point as string | null | undefined;
      const relativePath = info?.relative_path as string | undefined;
      const mediaType = info?.media_type as 'video' | 'photo' | undefined;

      if (mountPoint && relativePath && mediaType) {
        const originalPath = path.join(mountPoint, relativePath);
        if (fs.existsSync(originalPath)) {
          let lock = thumbRegenerationLocks.get(assetId);
          if (!lock) {
            lock = (async () => {
              const regenerated = await withThumbRegenSemaphore(() =>
                indexerService.ensureThumbnail(assetId, originalPath, mediaType)
              );
              if (regenerated && regenerated.startsWith(CACHE_DIR) && fs.existsSync(regenerated)) {
                try {
                  const updateStmt = db.prepare('UPDATE assets SET thumbnail_paths = ? WHERE id = ?');
                  updateStmt.run(JSON.stringify([regenerated]), assetId);
                } catch {
                  // ignore
                }
                return regenerated;
              }
              return null;
            })().finally(() => {
              thumbRegenerationLocks.delete(assetId);
            });
            thumbRegenerationLocks.set(assetId, lock);
          }

          const regenerated = await lock;
          if (regenerated) {
            return `zona21thumb://${assetId}`;
          }
        }
      }
    } catch {
      // ignore
    }

    // Could not regenerate -> clear db reference to avoid repeated attempts
    try {
      const clearStmt = db.prepare('UPDATE assets SET thumbnail_paths = ? WHERE id = ?');
      clearStmt.run(JSON.stringify([]), assetId);
    } catch {
      // ignore
    }

    return null;
  });

  ipcMain.handle('export-copy-assets', async (_event, raw: any) => {
    try {
      const assetIds = (Array.isArray(raw) ? raw : raw?.assetIds || [])
        .map((s: any) => String(s))
        .filter(Boolean);
      const preserveFolders = Boolean(Array.isArray(raw) ? false : raw?.preserveFolders);
      const conflictDecision = String(Array.isArray(raw) ? 'rename' : raw?.conflictDecision || 'rename');

      if (!assetIds || assetIds.length === 0) {
        return { success: false, error: 'No assets selected' };
      }

      if (!['rename', 'overwrite', 'skip'].includes(conflictDecision)) {
        return { success: false, error: 'Invalid conflict decision' };
      }

      const destDialog = await dialog.showOpenDialog(mainWindow!, {
        title: 'Choose destination folder',
        properties: ['openDirectory', 'createDirectory']
      });

      if (destDialog.canceled || destDialog.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const destinationDir = destDialog.filePaths[0];
      if (!destinationDir || !fs.existsSync(destinationDir)) {
        return { success: false, error: 'Invalid destination directory' };
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT a.id, a.relative_path, a.file_name, v.mount_point
        FROM assets a
        LEFT JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.id IN (${placeholders})
      `);
      const rows = stmt.all(...assetIds) as any[];

      const results: Array<{ assetId: string; sourcePath?: string; destPath?: string; success: boolean; error?: string }> = [];

      const total = rows.length;
      let copiedSoFar = 0;
      let failedSoFar = 0;
      let skippedSoFar = 0;
      let skippedMissingSoFar = 0;
      let skippedOfflineSoFar = 0;

      const sendProgress = (payload: any) => {
        try {
          mainWindow?.webContents.send('export-copy-progress', payload);
        } catch {
          // ignore
        }
      };

      sendProgress({
        status: 'started',
        total,
        copied: 0,
        failed: 0,
        skipped: 0,
        skippedMissing: 0,
        skippedOffline: 0
      });

      for (const row of rows) {
        const assetId = row?.id as string;
        const mountPoint = row?.mount_point as string | null | undefined;
        const relativePath = row?.relative_path as string | undefined;
        const fileName = (row?.file_name as string | undefined) ?? (relativePath ? path.basename(relativePath) : 'file');

        if (!assetId || !mountPoint || !relativePath) {
          skippedSoFar++;
          skippedOfflineSoFar++;
          results.push({ assetId: assetId ?? 'unknown', success: false, error: 'Volume not mounted (offline)' });
          sendProgress({
            status: 'progress',
            total,
            copied: copiedSoFar,
            failed: failedSoFar,
            skipped: skippedSoFar,
            skippedMissing: skippedMissingSoFar,
            skippedOffline: skippedOfflineSoFar,
            currentAssetId: assetId ?? 'unknown'
          });
          continue;
        }

        const sourcePath = path.join(mountPoint, relativePath);
        if (!fs.existsSync(sourcePath)) {
          skippedSoFar++;
          skippedMissingSoFar++;
          results.push({ assetId, sourcePath, success: false, error: 'Source file not found (missing)' });
          sendProgress({
            status: 'progress',
            total,
            copied: copiedSoFar,
            failed: failedSoFar,
            skipped: skippedSoFar,
            skippedMissing: skippedMissingSoFar,
            skippedOffline: skippedOfflineSoFar,
            currentAssetId: assetId
          });
          continue;
        }

        try {
          const relDir = preserveFolders ? path.dirname(relativePath) : '';
          const baseDir = relDir && relDir !== '.' ? path.join(destinationDir, relDir) : destinationDir;
          await fs.promises.mkdir(baseDir, { recursive: true });

          const baseDestPath = path.join(baseDir, fileName);
          const exists = fs.existsSync(baseDestPath);

          if (exists && conflictDecision === 'skip') {
            skippedSoFar++;
            results.push({ assetId, sourcePath, destPath: baseDestPath, success: true });
            sendProgress({
              status: 'progress',
              total,
              copied: copiedSoFar,
              failed: failedSoFar,
              skipped: skippedSoFar,
              skippedMissing: skippedMissingSoFar,
              skippedOffline: skippedOfflineSoFar,
              currentAssetId: assetId
            });
            continue;
          }

          if (exists && conflictDecision === 'rename') {
            const destPath = await ensureUniquePath(baseDir, fileName);
            await fs.promises.copyFile(sourcePath, destPath, fs.constants.COPYFILE_EXCL);
            copiedSoFar++;
            results.push({ assetId, sourcePath, destPath, success: true });
            sendProgress({
              status: 'progress',
              total,
              copied: copiedSoFar,
              failed: failedSoFar,
              skipped: skippedSoFar,
              skippedMissing: skippedMissingSoFar,
              skippedOffline: skippedOfflineSoFar,
              currentAssetId: assetId
            });
            continue;
          }

          if (exists && conflictDecision === 'overwrite') {
            await fs.promises.copyFile(sourcePath, baseDestPath);
            copiedSoFar++;
            results.push({ assetId, sourcePath, destPath: baseDestPath, success: true });
            sendProgress({
              status: 'progress',
              total,
              copied: copiedSoFar,
              failed: failedSoFar,
              skipped: skippedSoFar,
              skippedMissing: skippedMissingSoFar,
              skippedOffline: skippedOfflineSoFar,
              currentAssetId: assetId
            });
            continue;
          }

          await fs.promises.copyFile(sourcePath, baseDestPath, fs.constants.COPYFILE_EXCL);
          copiedSoFar++;
          results.push({ assetId, sourcePath, destPath: baseDestPath, success: true });
          sendProgress({
            status: 'progress',
            total,
            copied: copiedSoFar,
            failed: failedSoFar,
            skipped: skippedSoFar,
            skippedMissing: skippedMissingSoFar,
            skippedOffline: skippedOfflineSoFar,
            currentAssetId: assetId
          });
        } catch (error) {
          const message = (error as Error)?.message ?? 'Unknown error';
          failedSoFar++;
          results.push({ assetId, sourcePath, success: false, error: message });
          sendProgress({
            status: 'progress',
            total,
            copied: copiedSoFar,
            failed: failedSoFar,
            skipped: skippedSoFar,
            skippedMissing: skippedMissingSoFar,
            skippedOffline: skippedOfflineSoFar,
            currentAssetId: assetId
          });
        }
      }

      sendProgress({
        status: 'done',
        total,
        copied: copiedSoFar,
        failed: failedSoFar,
        skipped: skippedSoFar,
        skippedMissing: skippedMissingSoFar,
        skippedOffline: skippedOfflineSoFar,
        destinationDir
      });

      return {
        success: true,
        destinationDir,
        copied: copiedSoFar,
        failed: failedSoFar,
        skipped: skippedSoFar,
        skippedMissing: skippedMissingSoFar,
        skippedOffline: skippedOfflineSoFar,
        preserveFolders,
        conflictDecision,
        results
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('export-zip-assets', async (_event, raw: any) => {
    try {
      const assetIds = (raw?.assetIds || []).map((s: any) => String(s)).filter(Boolean);
      const preserveFolders = Boolean(raw?.preserveFolders);
      if (assetIds.length === 0) return { success: false, error: 'No assets selected' };

      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Export selection as ZIP',
        defaultPath: 'Zona21_Export.zip',
        filters: [{ name: 'ZIP Files', extensions: ['zip'] }]
      });
      if (result.canceled || !result.filePath) return { success: false, canceled: true };
      const zipPath = result.filePath;

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT a.id, a.relative_path, a.file_name, v.mount_point
        FROM assets a
        LEFT JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.id IN (${placeholders})
      `);
      const rows = stmt.all(...assetIds) as any[];

      const jobId = crypto.randomUUID();
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      exportZipJobs.set(jobId, { archive, output });

      const send = (payload: any) => {
        try {
          mainWindow?.webContents.send('export-zip-progress', payload);
        } catch {
          // ignore
        }
      };

      const total = rows.length;
      let added = 0;
      let failed = 0;
      let skippedMissing = 0;
      let skippedOffline = 0;
      const usedNames = new Set<string>();

      const makeUniqueName = (name: string) => {
        const parsed = path.posix.parse(name);
        let attempt = 0;
        while (true) {
          const suffix = attempt === 0 ? '' : ` (${attempt})`;
          const candidate = path.posix.join(parsed.dir, `${parsed.name}${suffix}${parsed.ext}`);
          if (!usedNames.has(candidate)) {
            usedNames.add(candidate);
            return candidate;
          }
          attempt++;
        }
      };

      archive.on('warning', () => {
        // ignore
      });
      archive.on('error', (err: any) => {
        send({ status: 'error', jobId, error: err?.message ?? 'Archive error' });
      });

      output.on('close', () => {
        exportZipJobs.delete(jobId);
      });

      archive.pipe(output);
      send({ status: 'started', jobId, total, added: 0, failed: 0, skippedMissing: 0, skippedOffline: 0, path: zipPath });

      for (const row of rows) {
        const assetId = String(row?.id || '');
        const mountPoint = row?.mount_point as string | null | undefined;
        const relativePath = row?.relative_path as string | undefined;
        const fileName = (row?.file_name as string | undefined) ?? (relativePath ? path.basename(relativePath) : 'file');

        if (!assetId || !mountPoint || !relativePath) {
          skippedOffline++;
          send({ status: 'progress', jobId, total, added, failed, skippedMissing, skippedOffline, currentAssetId: assetId || 'unknown' });
          continue;
        }

        const sourcePath = path.join(mountPoint, relativePath);
        if (!fs.existsSync(sourcePath)) {
          skippedMissing++;
          send({ status: 'progress', jobId, total, added, failed, skippedMissing, skippedOffline, currentAssetId: assetId });
          continue;
        }

        try {
          const relDir = preserveFolders ? path.posix.dirname(relativePath.split(path.sep).join('/')) : '';
          const inner = relDir && relDir !== '.' ? path.posix.join(relDir, fileName) : fileName;
          const entryName = makeUniqueName(inner);
          archive.file(sourcePath, { name: entryName });
          added++;
          send({ status: 'progress', jobId, total, added, failed, skippedMissing, skippedOffline, currentAssetId: assetId });
        } catch {
          failed++;
          send({ status: 'progress', jobId, total, added, failed, skippedMissing, skippedOffline, currentAssetId: assetId });
        }
      }

      await archive.finalize();
      send({ status: 'done', jobId, total, added, failed, skippedMissing, skippedOffline, path: zipPath });
      return { success: true, jobId, path: zipPath, added, failed, skippedMissing, skippedOffline };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('cancel-export-zip', async (_event, jobId: string) => {
    const id = String(jobId || '').trim();
    if (!id) return { success: false, error: 'Missing jobId' };
    const job = exportZipJobs.get(id);
    if (!job) return { success: false, error: 'Job not found' };
    try {
      job.archive.abort();
    } catch {
      // ignore
    }
    try {
      job.output.destroy();
    } catch {
      // ignore
    }
    exportZipJobs.delete(id);
    try {
      mainWindow?.webContents.send('export-zip-progress', { status: 'canceled', jobId: id });
    } catch {
      // ignore
    }
    return { success: true };
  });

  ipcMain.handle('reveal-path', async (_event, p: string) => {
    try {
      const target = String(p || '').trim();
      if (!target) return { success: false, error: 'Missing path' };
      shell.showItemInFolder(target);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('reveal-asset', async (_event, assetId: string) => {
    try {
      const id = String(assetId || '').trim();
      if (!id) return { success: false, error: 'Missing assetId' };

      const db = dbService.getDatabase();
      const row = db
        .prepare(
          `
          SELECT a.relative_path as relativePath, v.mount_point as mountPoint
          FROM assets a
          LEFT JOIN volumes v ON v.uuid = a.volume_uuid
          WHERE a.id = ?
        `
        )
        .get(id) as any;

      if (!row) return { success: false, error: 'Asset not found' };
      const mountPoint = row.mountPoint as string | null;
      const relativePath = row.relativePath as string | null;

      if (!mountPoint || !relativePath) {
        return { success: false, error: 'Asset is on a disconnected volume' };
      }

      const abs = path.join(String(mountPoint), String(relativePath));
      shell.showItemInFolder(abs);
      return { success: true, path: abs };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('plan-move-assets', async (_event, payload: any) => {
    try {
      const assetIds = (payload?.assetIds || []).map((s: any) => String(s)).filter(Boolean);
      if (assetIds.length === 0) return { success: false, error: 'No assets selected' };

      const destinationMode = payload?.destinationMode === 'dialog' ? 'dialog' : 'tree';
      const destinationDir = destinationMode === 'dialog' ? String(payload?.destinationDir || '') : '';
      const destinationVolumeUuid = destinationMode === 'tree' ? String(payload?.destinationVolumeUuid || '') : '';
      const destinationPathPrefixRaw = destinationMode === 'tree' ? String(payload?.destinationPathPrefix || '') : '';
      const destinationPathPrefix = normalizePathPrefix(destinationPathPrefixRaw);

      let baseDestinationDir: string;

      if (destinationMode === 'dialog') {
        if (!destinationDir) return { success: false, canceled: true };
        if (!fs.existsSync(destinationDir)) return { success: false, error: 'Invalid destination directory' };
        baseDestinationDir = destinationDir;
      } else {
        if (!destinationVolumeUuid) return { success: false, error: 'Select a volume in the sidebar' };
        const vol = volumeManager.getAllVolumes().find((v) => v.uuid === destinationVolumeUuid);
        if (!vol || !vol.mountPoint) return { success: false, error: 'Destination volume not mounted' };
        baseDestinationDir = destinationPathPrefix ? path.join(vol.mountPoint, destinationPathPrefix) : vol.mountPoint;
        await fs.promises.mkdir(baseDestinationDir, { recursive: true });
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT a.id, a.relative_path, a.file_name
        FROM assets a
        WHERE a.id IN (${placeholders})
      `);
      const rows = stmt.all(...assetIds) as any[];

      let conflictsCount = 0;
      for (const row of rows) {
        const relativePath = row?.relative_path as string | undefined;
        const fileName = (row?.file_name as string | undefined) ?? (relativePath ? path.basename(relativePath) : 'file');
        const destPath = path.join(baseDestinationDir, fileName);
        if (fs.existsSync(destPath)) conflictsCount++;
      }

      return { success: true, destinationDir: baseDestinationDir, conflictsCount };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('execute-move-assets', async (_event, payload: any) => {
    try {
      const assetIds = (payload?.assetIds || []).map((s: any) => String(s)).filter(Boolean);
      if (assetIds.length === 0) return { success: false, error: 'No assets selected' };

      const conflictDecision = payload?.conflictDecision;
      if (!['overwrite', 'rename', 'cancel'].includes(conflictDecision)) {
        return { success: false, error: 'Invalid conflict decision' };
      }
      if (conflictDecision === 'cancel') return { success: false, canceled: true };

      const destinationMode = payload?.destinationMode === 'dialog' ? 'dialog' : 'tree';
      const destinationDir = destinationMode === 'dialog' ? String(payload?.destinationDir || '') : '';
      const destinationVolumeUuid = destinationMode === 'tree' ? String(payload?.destinationVolumeUuid || '') : '';
      const destinationPathPrefixRaw = destinationMode === 'tree' ? String(payload?.destinationPathPrefix || '') : '';
      const destinationPathPrefix = normalizePathPrefix(destinationPathPrefixRaw);

      let baseDestinationDir: string;
      let destVolumeUuid: string;
      let destMountPoint: string;

      if (destinationMode === 'dialog') {
        if (!destinationDir) return { success: false, canceled: true };
        if (!fs.existsSync(destinationDir)) return { success: false, error: 'Invalid destination directory' };

        const vol = volumeManager.getVolumeForPath(destinationDir);
        if (!vol.mountPoint) return { success: false, error: 'Destination volume not mounted' };
        destVolumeUuid = vol.uuid;
        destMountPoint = vol.mountPoint;
        baseDestinationDir = destinationDir;
      } else {
        if (!destinationVolumeUuid) return { success: false, error: 'Select a volume in the sidebar' };
        const vol = volumeManager.getAllVolumes().find((v) => v.uuid === destinationVolumeUuid);
        if (!vol || !vol.mountPoint) return { success: false, error: 'Destination volume not mounted' };
        destVolumeUuid = vol.uuid;
        destMountPoint = vol.mountPoint;
        baseDestinationDir = destinationPathPrefix ? path.join(vol.mountPoint, destinationPathPrefix) : vol.mountPoint;
        await fs.promises.mkdir(baseDestinationDir, { recursive: true });
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT a.id, a.relative_path, a.file_name, a.file_size, a.volume_uuid, v.mount_point
        FROM assets a
        LEFT JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.id IN (${placeholders})
      `);
      const rows = stmt.all(...assetIds) as any[];

      const results: Array<{ assetId: string; sourcePath?: string; destPath?: string; success: boolean; error?: string }> = [];

      for (const row of rows) {
        const assetId = row?.id as string;
        const srcMount = row?.mount_point as string | null | undefined;
        const relativePath = row?.relative_path as string | undefined;
        const fileName = (row?.file_name as string | undefined) ?? (relativePath ? path.basename(relativePath) : 'file');

        if (!assetId || !srcMount || !relativePath) {
          results.push({ assetId: assetId ?? 'unknown', success: false, error: 'Missing volume mount point or relative path' });
          continue;
        }

        const sourcePath = path.join(srcMount, relativePath);
        if (!fs.existsSync(sourcePath)) {
          results.push({ assetId, sourcePath, success: false, error: 'Source file not found' });
          continue;
        }

        const destPath =
          conflictDecision === 'rename'
            ? await ensureUniquePath(baseDestinationDir, fileName)
            : path.join(baseDestinationDir, fileName);
        try {
          try {
            await fs.promises.rename(sourcePath, destPath);
          } catch (e: any) {
            if (e?.code === 'EXDEV') {
              await fs.promises.copyFile(sourcePath, destPath);
              await fs.promises.unlink(sourcePath);
            } else {
              throw e;
            }
          }

          const nextRelativePath = path.relative(destMountPoint, destPath);
          const size = (() => {
            try {
              return fs.statSync(destPath).size;
            } catch {
              return row?.file_size ?? 0;
            }
          })();

          const update = db.prepare('UPDATE assets SET volume_uuid = ?, relative_path = ?, file_name = ?, file_size = ? WHERE id = ?');
          update.run(destVolumeUuid, nextRelativePath, path.basename(destPath), size, assetId);

          results.push({ assetId, sourcePath, destPath, success: true });
        } catch (error) {
          results.push({ assetId, sourcePath, destPath, success: false, error: (error as Error).message });
        }
      }

      const moved = results.filter((r) => r.success).length;
      const failed = results.length - moved;
      return { success: true, moved, failed, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('trash-assets', async (_event, assetIds: string[]) => {
    try {
      if (!assetIds || assetIds.length === 0) {
        return { success: false, error: 'No assets selected' };
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT a.id, a.relative_path, v.mount_point
        FROM assets a
        LEFT JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.id IN (${placeholders})
      `);
      const rows = stmt.all(...assetIds) as any[];

      const results: Array<{ assetId: string; sourcePath?: string; success: boolean; error?: string }> = [];
      const trashedIds: string[] = [];

      for (const row of rows) {
        const assetId = row?.id as string;
        const mountPoint = row?.mount_point as string | null | undefined;
        const relativePath = row?.relative_path as string | undefined;

        if (!assetId || !mountPoint || !relativePath) {
          results.push({ assetId: assetId ?? 'unknown', success: false, error: 'Missing volume mount point or relative path' });
          continue;
        }

        const sourcePath = path.join(mountPoint, relativePath);
        if (!fs.existsSync(sourcePath)) {
          results.push({ assetId, sourcePath, success: false, error: 'Source file not found' });
          continue;
        }

        try {
          await shell.trashItem(sourcePath);
          trashedIds.push(assetId);
          results.push({ assetId, sourcePath, success: true });
        } catch (error) {
          results.push({ assetId, sourcePath, success: false, error: (error as Error).message });
        }
      }

      if (trashedIds.length > 0) {
        const updatePlaceholders = trashedIds.map(() => '?').join(',');
        const update = db.prepare(`UPDATE assets SET status = 'missing', thumbnail_paths = ? WHERE id IN (${updatePlaceholders})`);
        try {
          update.run(JSON.stringify([]), ...trashedIds);
        } catch {
          // ignore
        }
      }

      const trashed = trashedIds.length;
      const failed = results.length - trashed;
      return { success: true, trashed, failed, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Export to Premiere/Resolve
  ipcMain.handle('export-premiere', async (_event, assetIds: string[]) => {
    try {
      const prefs = readPreferences();
      const defaultPath = prefs.defaultExportPath 
        ? path.join(prefs.defaultExportPath, 'Zona21_Export.xml')
        : 'Zona21_Export.xml';

      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Export to Premiere Pro',
        defaultPath,
        filters: [{ name: 'XML Files', extensions: ['xml'] }]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const stmt = db.prepare(`SELECT * FROM assets WHERE id IN (${placeholders})`);
      const rows = stmt.all(...assetIds) as any[];
      
      const assets = rows.map(row => ({
        ...row,
        createdAt: new Date(row.created_at),
        flagged: row.flagged === 1,
        rejected: row.rejected === 1,
        tags: JSON.parse(row.tags || '[]')
      }));

      const exporter = new PremiereXMLExporter();
      await exporter.export(assets, result.filePath);

      return { success: true, path: result.filePath };
    } catch (error) {
      console.error('Error exporting to Premiere:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Export to Lightroom (XMP sidecars)
  ipcMain.handle('export-lightroom', async (_event, assetIds: string[]) => {
    try {
      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const stmt = db.prepare(`SELECT * FROM assets WHERE id IN (${placeholders})`);
      const rows = stmt.all(...assetIds) as any[];
      
      const assets = rows.map(row => ({
        ...row,
        createdAt: new Date(row.created_at),
        flagged: row.flagged === 1,
        rejected: row.rejected === 1,
        tags: JSON.parse(row.tags || '[]')
      }));

      // Get volume mount point for the first asset
      const firstAsset = assets[0];
      const volume = volumeManager.getAllVolumes().find(v => v.uuid === firstAsset.volume_uuid);
      
      if (!volume || !volume.mountPoint) {
        return { success: false, error: 'Volume not mounted' };
      }

      const exporter = new LightroomXMPExporter();
      const count = await exporter.export(assets, volume.mountPoint);

      return { success: true, count };
    } catch (error) {
      console.error('Error exporting to Lightroom:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Export logs for support
  ipcMain.handle('export-logs', async () => {
    try {
      const logPath = getLogPath();
      if (!logPath || !fs.existsSync(logPath)) {
        return { success: false, error: 'Nenhum arquivo de log encontrado.' };
      }

      const result = await dialog.showSaveDialog(mainWindow!, {
        title: 'Exportar Logs',
        defaultPath: `zona21-logs-${new Date().toISOString().slice(0, 10)}.log`,
        filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      await fs.promises.copyFile(logPath, result.filePath);
      logger.info('ExportLogs', `Logs exported to ${result.filePath}`);
      return { success: true, path: result.filePath };
    } catch (error) {
      logger.error('ExportLogs', 'Failed to export logs', { error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('get-log-path', async () => {
    return { path: getLogPath() };
  });

  ipcMain.handle('get-default-export-path', async () => {
    try {
      const prefs = readPreferences();
      return { path: prefs.defaultExportPath || null };
    } catch (error) {
      return { path: null, error: (error as Error).message };
    }
  });

  ipcMain.handle('set-default-export-path', async (_event, exportPath: string | null) => {
    try {
      const prefs = readPreferences();
      if (exportPath) {
        prefs.defaultExportPath = exportPath;
      } else {
        delete prefs.defaultExportPath;
      }
      writePreferences(prefs);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('clear-app-data', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'zona21.db');
      const cachePath = path.join(userDataPath, 'cache');
      const logsPath = path.join(userDataPath, 'logs');
      
      // Close database connection
      dbService.close();
      
      // Delete files
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      if (fs.existsSync(cachePath)) fs.rmSync(cachePath, { recursive: true, force: true });
      if (fs.existsSync(logsPath)) fs.rmSync(logsPath, { recursive: true, force: true });
      
      // App will restart to reinitialize
      app.relaunch();
      app.exit(0);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}
