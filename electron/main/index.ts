import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, dialog, protocol, shell } from 'electron';

import crypto from 'crypto';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { dbService } from './database';
import { IndexerService } from './indexer';
import { VolumeManager } from './volume-manager';
import { PremiereXMLExporter } from './exporters/premiere-xml';
import { initQuickEditService } from './quick-edit';
import { initVideoTrimService } from './video-trim';
import { LightroomXMPExporter } from './exporters/lightroom-xmp';
import { ensureUniquePath, normalizePathPrefix } from './moveUtils';
import { logger, getLogPath } from './logger';
import { handleAndInfer } from './error-handler';
import { registerIpcHandlers, getCollectionAssetIds } from './ipc';
import { instagramScheduler } from './instagram/instagram-scheduler';

let mainWindow: BrowserWindow | null = null;
let indexerService: IndexerService;
let volumeManager: VolumeManager;

// Helper para enviar mensagens de forma segura (evita crash se renderer não está disponível)
function safeSend(channel: string, ...args: any[]) {
  try {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send(channel, ...args);
    }
  } catch (error) {
    // Silenciosamente ignora erros de envio
  }
}
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

// Inicializado quando o app estiver pronto
let UPDATE_SETTINGS_FILE: string;
const UPDATE_FEED_URL = 'https://github.com/Almar-cyber/zona21/releases/latest';

// Helper para obter o caminho do arquivo de settings (inicializa sob demanda)
function getUpdateSettingsFile(): string {
  if (!UPDATE_SETTINGS_FILE) {
    UPDATE_SETTINGS_FILE = path.join(app.getPath('userData'), 'update-settings.json');
  }
  return UPDATE_SETTINGS_FILE;
}

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
    markingStatus: row.marking_status ?? row.markingStatus ?? 'unmarked',
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
    const settingsFile = getUpdateSettingsFile();
    if (!fs.existsSync(settingsFile)) return true;
    const raw = fs.readFileSync(settingsFile, 'utf8');
    const parsed = JSON.parse(raw || '{}') as any;
    return parsed?.autoCheck !== false;
  } catch {
    return true;
  }
}

function writeUpdateAutoCheck(autoCheck: boolean): void {
  try {
    const settingsFile = getUpdateSettingsFile();
    fs.writeFileSync(settingsFile, JSON.stringify({ autoCheck: !!autoCheck }, null, 2));
  } catch {
    // ignore
  }
}

function emitUpdateStatus(next: UpdateStatus) {
  lastUpdateStatus = next;
  safeSend('update-status', next);
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
    // Evita que usuários recebam builds beta por acidente
    autoUpdater.allowPrerelease = false;
    
    // Configurar para GitHub Releases (repo público)
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'Almar-cyber',
      repo: 'zona21-releases',
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

// Lazy initialization para paths que dependem de app.ready
let CACHE_DIR: string;
let TELEMETRY_SETTINGS_FILE: string;
let PREFERENCES_FILE: string;

function getUserDataPaths() {
  if (!CACHE_DIR) {
    const userData = app.getPath('userData');
    CACHE_DIR = path.join(userData, 'cache');
    TELEMETRY_SETTINGS_FILE = path.join(userData, 'telemetry.json');
    PREFERENCES_FILE = path.join(userData, 'preferences.json');
  }
  return { CACHE_DIR, TELEMETRY_SETTINGS_FILE, PREFERENCES_FILE };
}

const thumbRegenerationLocks = new Map<string, Promise<string | null>>();

const MAX_THUMB_REGEN_CONCURRENCY = 2;
let activeThumbRegenerations = 0;
const thumbRegenWaiters: Array<() => void> = [];

const DEFAULT_PROJECT_ID = 'default';
const FAVORITES_COLLECTION_ID = 'favorites';

interface Preferences {
  defaultExportPath?: string;
}

function readPreferences(): Preferences {
  try {
    const { PREFERENCES_FILE } = getUserDataPaths();
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
    const { PREFERENCES_FILE } = getUserDataPaths();
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing preferences:', error);
  }
}

function readTelemetryConsent(): boolean | null {
  try {
    const { TELEMETRY_SETTINGS_FILE } = getUserDataPaths();
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
    const { TELEMETRY_SETTINGS_FILE } = getUserDataPaths();
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

// Register custom protocols before app ready
// NOTE: Temporarily disabled for dev mode - these will be registered in app.whenReady() instead
// try {
//   if (protocol && typeof protocol.registerSchemesAsPrivileged === 'function') {
//     protocol.registerSchemesAsPrivileged([
//       {
//         scheme: 'zona21thumb',
//         privileges: {
//           standard: true,
//           secure: true,
//           supportFetchAPI: true,
//           corsEnabled: true
//         }
//       },
//       {
//         scheme: 'zona21file',
//         privileges: {
//           standard: true,
//           secure: true,
//           supportFetchAPI: true,
//           corsEnabled: true
//         }
//       }
//     ]);
//   }
// } catch (error) {
//   console.error('[Protocol] Error registering custom protocols:', error);
// }

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
  // In Electron Forge, __dirname points to .vite/build
  // Preload script is at .vite/build/preload.js in dev mode
  const preloadPath = path.join(__dirname, 'preload.js');

  console.log('[createWindow] __dirname:', __dirname);
  console.log('[createWindow] preloadPath:', preloadPath);
  console.log('[createWindow] preload exists:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  // Diagnóstico: capturar erros do renderer no terminal (útil quando fica tela branca)
  mainWindow.webContents.on('did-fail-load', (_event: any, errorCode: number, errorDescription: string, validatedURL: string) => {
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
  mainWindow.webContents.on('render-process-gone', (_event: any, details: any) => {
    console.error('[Renderer] render-process-gone', details);
  });
  mainWindow.webContents.on('unresponsive', () => {
    console.error('[Renderer] unresponsive');
  });
  mainWindow.webContents.on('console-message', (_event: any, level: number, message: string, line: number, sourceId: string) => {
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
  // Handle OAuth callback on macOS - setup deep link listener after app is ready
  (app as any).on('open-url', (event: Event, url: string) => {
    event.preventDefault();
    logger.info('deep-link', 'Received deep link', { url });

    try {
      const urlObj = new URL(url);

      // OAuth callback
      if (urlObj.pathname === '/oauth/callback') {
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');

        if (error) {
          logger.error('deep-link', 'OAuth error received', { error });
          safeSend('oauth-error', { provider: 'instagram', error });
          return;
        }

        if (code) {
          logger.info('deep-link', 'OAuth code received, processing...');
          // Importar dinamicamente para evitar circular dependency
          import('./oauth/oauth-manager').then(({ oauthManager }) => {
            oauthManager.handleOAuthCallback(code).then(token => {
              logger.info('deep-link', 'OAuth token obtained successfully');
              safeSend('oauth-success', { provider: 'instagram', token });
            }).catch(err => {
              logger.error('deep-link', 'Failed to handle OAuth callback', err);
              safeSend('oauth-error', { provider: 'instagram', error: err.message });
            });
          });
        }
      }
    } catch (error) {
      logger.error('deep-link', 'Failed to parse deep link URL', error);
    }
  });

  // Setup deep link handler for OAuth callbacks (zona21://oauth/callback)
  if ((process as any).defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('zona21', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('zona21');
  }

  setupAutoUpdater();

  // Initialize user data paths now that app is ready
  const { CACHE_DIR: cacheDir } = getUserDataPaths();
  indexerService = new IndexerService(cacheDir);
  volumeManager = new VolumeManager();

  // Initialize Quick Edit Service with temp directory
  const quickEditTempDir = path.join(cacheDir, 'quick-edit');
  initQuickEditService(quickEditTempDir);

  // Initialize Video Trim Service with temp directory
  const videoTrimTempDir = path.join(cacheDir, 'video-trim');
  initVideoTrimService(videoTrimTempDir);

  protocol.registerFileProtocol('zona21thumb', (request: any, callback: any) => {
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

  protocol.registerFileProtocol('zona21file', (request: any, callback: any) => {
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
  
  registerIpcHandlers(); // Módulos IPC refatorados (collections com DB normalizado)
  setupIpcHandlers(); // Handlers legados (serão gradualmente migrados)

  // Window configuration handler for traffic lights detection
  ipcMain.handle('get-window-config', () => {
    if (!mainWindow) return null;

    const isFullScreen = mainWindow.isFullScreen();

    return {
      platform: process.platform,
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 12, y: 12 },
      hasTrafficLights: process.platform === 'darwin' && !isFullScreen,
      isFullScreen
    };
  });

  // Iniciar Instagram Scheduler
  instagramScheduler.start();
  logger.info('app', 'Instagram Scheduler started');

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

  ipcMain.handle('set-telemetry-consent', async (_event: any, enabled: boolean) => {
    writeTelemetryConsent(!!enabled);
    return { success: true };
  });

  ipcMain.handle('open-external', async (_event: any, rawUrl: string) => {
    try {
      const url = String(rawUrl || '').trim();
      if (!url) return { success: false, error: 'Invalid URL' };

      // SECURITY FIX: Validação aprimorada de URLs
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return { success: false, error: 'Invalid URL format' };
      }

      // Apenas https permitido
      if (parsedUrl.protocol !== 'https:') {
        return { success: false, error: 'Only HTTPS URLs are allowed' };
      }

      // Whitelist de domínios confiáveis para OAuth e serviços do app
      const trustedDomains = [
        'github.com',
        'instagram.com',
        'api.instagram.com',
        'graph.instagram.com',
        'facebook.com',
        'api.anthropic.com'
      ];

      const isTrusted = trustedDomains.some(domain =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );

      if (!isTrusted) {
        // Para domínios não confiáveis, mostrar confirmação ao usuário
        const { response } = await dialog.showMessageBox(mainWindow!, {
          type: 'warning',
          buttons: ['Cancelar', 'Abrir'],
          defaultId: 0,
          cancelId: 0,
          title: 'Abrir link externo?',
          message: `Deseja abrir o seguinte link no navegador?\n\n${parsedUrl.hostname}`,
          detail: 'Apenas abra links de fontes confiáveis.'
        });

        if (response !== 1) return { success: false, canceled: true };
      }

      await shell.openExternal(parsedUrl.toString());
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('get-update-settings', async () => {
    return { autoCheck: readUpdateAutoCheck(), feedUrl: UPDATE_FEED_URL, status: lastUpdateStatus };
  });

  ipcMain.handle('set-update-auto-check', async (_event: any, enabled: boolean) => {
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

  // Index directory - otimizado com processamento em etapas
  let indexingCancelled = false;
  let indexingPaused = false;
  
  ipcMain.handle('index-directory', async (_event: any, dirPath: string) => {
    try {
      indexingCancelled = false;
      indexingPaused = false;
      
      const volume = volumeManager.getVolumeForPath(dirPath);

      safeSend('index-progress', {
        total: 0,
        indexed: 0,
        currentFile: null,
        status: 'scanning',
        speed: 0
      });

      const files = await indexerService.scanDirectory(dirPath);
      
      if (indexingCancelled) {
        return { success: false, cancelled: true };
      }

      // Configuração otimizada para grandes volumes
      const BATCH_SIZE = 10; // Batches maiores para throughput
      const PROGRESS_THROTTLE = 500; // Throttle de progresso em ms
      const MIN_BATCH_DELAY = 50; // Delay mínimo entre batches
      const MAX_BATCH_DELAY = 200; // Delay máximo entre batches
      
      let indexed = 0;
      let lastProgressTime = Date.now();
      let lastIndexedCount = 0;
      const results: any[] = [];
      const startTime = Date.now();

      // Enviar contagem inicial imediatamente
      safeSend('index-progress', {
        total: files.length,
        indexed: 0,
        currentFile: null,
        status: 'indexing',
        speed: 0
      });
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        if (indexingCancelled) break;
        
        // Pausar se solicitado
        while (indexingPaused && !indexingCancelled) {
          safeSend('index-progress', {
            total: files.length,
            indexed,
            currentFile: null,
            status: 'paused',
            speed: 0
          });
          await new Promise(r => setTimeout(r, 500));
        }
        
        const batch = files.slice(i, i + BATCH_SIZE);
        
        // Processar batch em paralelo (até 3 simultâneos)
        const batchPromises = batch.map(async (file) => {
          if (indexingCancelled) return null;
          try {
            return await indexerService.indexFile(file, volume.uuid, volume.mountPoint!);
          } catch (error) {
            console.error(`Error indexing ${file}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        for (const asset of batchResults) {
          if (asset) results.push(asset);
          indexed++;
        }
        
        // Throttle de progresso - apenas enviar se passou tempo suficiente
        const now = Date.now();
        if (now - lastProgressTime >= PROGRESS_THROTTLE || i + BATCH_SIZE >= files.length) {
          const elapsed = (now - startTime) / 1000;
          const speed = elapsed > 0 ? Math.round((indexed - lastIndexedCount) / ((now - lastProgressTime) / 1000)) : 0;
          
          safeSend('index-progress', {
            total: files.length,
            indexed,
            currentFile: batch[batch.length - 1],
            status: 'indexing',
            speed: speed > 0 ? speed : undefined,
            eta: speed > 0 ? Math.round((files.length - indexed) / speed) : undefined
          });
          
          lastProgressTime = now;
          lastIndexedCount = indexed;
        }
        
        // Delay adaptativo baseado no progresso
        if (i + BATCH_SIZE < files.length) {
          const progress = indexed / files.length;
          const delay = Math.max(MIN_BATCH_DELAY, MAX_BATCH_DELAY * (1 - progress));
          await new Promise(r => setTimeout(r, delay));
        }
      }

      const totalTime = (Date.now() - startTime) / 1000;
      safeSend('index-progress', {
        total: files.length,
        indexed: results.length,
        currentFile: null,
        status: indexingCancelled ? 'cancelled' : 'completed',
        speed: Math.round(results.length / totalTime)
      });
      
      return { success: !indexingCancelled, count: results.length };
    } catch (error) {
      const appError = handleAndInfer('index-directory', error);

      safeSend('index-progress', {
        total: 0,
        indexed: 0,
        currentFile: null,
        status: 'error'
      });

      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Controles de indexação
  ipcMain.handle('index-pause', async () => {
    indexingPaused = true;
    return { success: true };
  });

  ipcMain.handle('index-resume', async () => {
    indexingPaused = false;
    return { success: true };
  });

  ipcMain.handle('index-cancel', async () => {
    indexingCancelled = true;
    indexingPaused = false;
    return { success: true };
  });

  ipcMain.handle('index-status', async () => {
    return { isRunning: !indexingCancelled, isPaused: indexingPaused };
  });

  // Get all assets
  ipcMain.handle('get-assets', async (_event: any, filters?: any) => {
    const db = dbService.getDatabase();

    // Skip collection lookup for virtual marking collections (they use markingStatus filter instead)
    const isVirtualCollection = filters?.collectionId?.startsWith('__marking_');

    if (filters?.collectionId && !isVirtualCollection) {
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
        where += ' AND (a.relative_path LIKE ? OR a.relative_path = ?)';
        params.push(prefix.length > 0 ? `${prefix}/%` : '%', prefix);
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
        query += ' AND (relative_path LIKE ? OR relative_path = ?)';
        params.push(prefix.length > 0 ? `${prefix}/%` : '%', prefix);
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
      // Marking status filter for virtual collections
      if (filters.markingStatus) {
        if (Array.isArray(filters.markingStatus)) {
          const placeholders = filters.markingStatus.map(() => '?').join(',');
          query += ` AND marking_status IN (${placeholders})`;
          params.push(...filters.markingStatus);
        } else {
          query += ' AND marking_status = ?';
          params.push(filters.markingStatus);
        }
      }

      query = applyTagsWhereClause(query, filters, params);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map((row: any) => mapAssetRow(row));
  });

  // Get assets page (for large libraries)
  ipcMain.handle('get-assets-page', async (_event: any, filters: any, offset: number, limit: number) => {
    const db = dbService.getDatabase();

    // Skip collection lookup for virtual marking collections (they use markingStatus filter instead)
    const isVirtualCollection = filters?.collectionId?.startsWith('__marking_');

    if (filters?.collectionId && !isVirtualCollection) {
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
        where += ' AND (a.relative_path LIKE ? OR a.relative_path = ?)';
        params.push(prefix.length > 0 ? `${prefix}/%` : '%', prefix);
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
        where += ' AND (a.relative_path LIKE ? OR a.relative_path = ?)';
        params.push(prefix.length > 0 ? `${prefix}/%` : '%', prefix);
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
      // Marking status filter for virtual collections
      if (filters.markingStatus) {
        if (Array.isArray(filters.markingStatus)) {
          const placeholders = filters.markingStatus.map(() => '?').join(',');
          where += ` AND a.marking_status IN (${placeholders})`;
          params.push(...filters.markingStatus);
        } else {
          where += ' AND a.marking_status = ?';
          params.push(filters.markingStatus);
        }
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

  // Get all unique tags from processed assets
  ipcMain.handle('get-all-tags', async () => {
    const db = dbService.getDatabase();
    const rows = db.prepare(`
      SELECT DISTINCT tags FROM assets
      WHERE status = 'online'
      AND tags IS NOT NULL
      AND tags != '[]'
      AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)
    `).all() as Array<{ tags: string }>;

    // Parse all tags and collect unique ones with counts
    const tagCounts = new Map<string, number>();
    for (const row of rows) {
      try {
        const tags = JSON.parse(row.tags || '[]');
        for (const tag of tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      } catch {
        // ignore invalid JSON
      }
    }

    // Sort by count descending, then alphabetically
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));

    return sortedTags;
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

  // MOVED TO: electron/main/ipc/collections.ts
  // ipcMain.handle('get-collections', ...)
  // ipcMain.handle('create-collection', ...)

  // MOVED TO: electron/main/ipc/collections.ts
  // ipcMain.handle('rename-collection', ...)
  // ipcMain.handle('delete-collection', ...)
  // ipcMain.handle('add-assets-to-collection', ...)
  // ipcMain.handle('remove-assets-from-collection', ...)

  // MOVED TO: electron/main/ipc/collections.ts
  // ipcMain.handle('toggle-favorites', ...)
  // ipcMain.handle('get-favorites-ids', ...)

  // MOVED TO: electron/main/ipc/volumes.ts
  // ipcMain.handle('get-folder-children', ...)

  // MOVED TO: electron/main/ipc/assets.ts
  // ipcMain.handle('get-assets-by-ids', ...)

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

  // MOVED TO: electron/main/ipc/assets.ts
  // ipcMain.handle('update-asset', ...)

  // MOVED TO: electron/main/ipc/volumes.ts
  // ipcMain.handle('get-volumes', ...)
  // ipcMain.handle('eject-volume', ...)
  // ipcMain.handle('hide-volume', ...)
  // ipcMain.handle('rename-volume', ...)

  // Search assets
  ipcMain.handle('search-assets', async (_event: any, searchTerm: string) => {
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

  // ==================== Quick Edit Handlers ====================

  // Quick Edit: Apply general operations (crop, rotate, flip, resize)
  ipcMain.handle('quick-edit-apply', async (_event: any, assetId: string, operations: any, outputPath?: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const filePath = await quickEditService.applyEdits(assetId, operations, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Quick Edit: Apply crop with aspect ratio preset
  ipcMain.handle('quick-edit-crop-preset', async (_event: any, assetId: string, presetName: string, outputPath?: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const filePath = await quickEditService.applyCropPreset(assetId, presetName, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Quick Edit: Rotate 90° clockwise
  ipcMain.handle('quick-edit-rotate-cw', async (_event: any, assetId: string, outputPath?: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const filePath = await quickEditService.rotateClockwise(assetId, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Quick Edit: Rotate 90° counter-clockwise
  ipcMain.handle('quick-edit-rotate-ccw', async (_event: any, assetId: string, outputPath?: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const filePath = await quickEditService.rotateCounterClockwise(assetId, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Quick Edit: Flip horizontal
  ipcMain.handle('quick-edit-flip-h', async (_event: any, assetId: string, outputPath?: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const filePath = await quickEditService.flipHorizontal(assetId, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Quick Edit: Flip vertical
  ipcMain.handle('quick-edit-flip-v', async (_event: any, assetId: string, outputPath?: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const filePath = await quickEditService.flipVertical(assetId, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Quick Edit: Resize to Instagram preset
  ipcMain.handle('quick-edit-resize-instagram', async (_event: any, assetId: string, presetName: string, outputPath?: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const filePath = await quickEditService.resizeToInstagram(assetId, presetName, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ==================== Batch Quick Edit Handlers ====================

  // Batch Quick Edit: Apply general operations to multiple assets
  ipcMain.handle('quick-edit-batch-apply', async (_event: IpcMainInvokeEvent, assetIds: string[], operations: any) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const results = await quickEditService.applyBatchEdits(assetIds, operations);
      return { success: true, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Batch Quick Edit: Apply crop preset to multiple assets
  ipcMain.handle('quick-edit-batch-crop-preset', async (_event: IpcMainInvokeEvent, assetIds: string[], presetName: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const results = await quickEditService.applyBatchCropPreset(assetIds, presetName);
      return { success: true, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Batch Quick Edit: Resize multiple assets to Instagram preset
  ipcMain.handle('quick-edit-batch-resize', async (_event: IpcMainInvokeEvent, assetIds: string[], presetName: string) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const results = await quickEditService.applyBatchResize(assetIds, presetName);
      return { success: true, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Batch Quick Edit: Rotate multiple assets clockwise
  ipcMain.handle('quick-edit-batch-rotate-cw', async (_event: IpcMainInvokeEvent, assetIds: string[]) => {
    try {
      const { getQuickEditService } = await import('./quick-edit');
      const quickEditService = getQuickEditService();
      const results = await quickEditService.batchRotateClockwise(assetIds);
      return { success: true, results };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ==================== End Quick Edit Handlers ====================

  // ==================== Video Trim Handlers ====================

  // Video Trim: Get metadata
  ipcMain.handle('video-trim-get-metadata', async (_event: any, assetId: string) => {
    try {
      const { getVideoTrimService } = await import('./video-trim');
      const videoTrimService = getVideoTrimService();
      const db = dbService.getDatabase();
      const asset = db.prepare(`
        SELECT a.*, v.mount_point
        FROM assets a
        LEFT JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.id = ?
      `).get(assetId) as any;

      if (!asset || !asset.mount_point) {
        return { success: false, error: 'Asset not found or volume not mounted' };
      }

      const filePath = path.join(asset.mount_point, asset.relative_path);
      const metadata = await videoTrimService.getMetadata(filePath);
      return { success: true, metadata };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Video Trim: Trim video (fast, copy codec)
  ipcMain.handle('video-trim-trim', async (_event: any, assetId: string, options: any, outputPath?: string) => {
    try {
      const { getVideoTrimService } = await import('./video-trim');
      const videoTrimService = getVideoTrimService();
      const filePath = await videoTrimService.trimVideo(assetId, options, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Video Trim: Trim video with re-encoding (slower but more accurate)
  ipcMain.handle('video-trim-trim-reencode', async (_event: any, assetId: string, options: any, outputPath?: string) => {
    try {
      const { getVideoTrimService } = await import('./video-trim');
      const videoTrimService = getVideoTrimService();
      const filePath = await videoTrimService.trimVideoReencode(assetId, options, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Video Trim: Extract audio from entire video
  ipcMain.handle('video-trim-extract-audio', async (_event: any, assetId: string, outputPath?: string) => {
    try {
      const { getVideoTrimService } = await import('./video-trim');
      const videoTrimService = getVideoTrimService();
      const filePath = await videoTrimService.extractAudio(assetId, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Video Trim: Extract audio from trimmed section
  ipcMain.handle('video-trim-extract-trimmed-audio', async (_event: any, assetId: string, options: any, outputPath?: string) => {
    try {
      const { getVideoTrimService } = await import('./video-trim');
      const videoTrimService = getVideoTrimService();
      const filePath = await videoTrimService.extractTrimmedAudio(assetId, options, outputPath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ==================== End Video Trim Handlers ====================

  // Get thumbnail as base64
  ipcMain.handle('get-thumbnail', async (_event: any, assetId: string) => {
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

  // MOVED TO: electron/main/ipc/export.ts
  // ipcMain.handle('export-copy-assets', ...)

  // ipcMain.handle('export-zip-assets', ...) - MOVED TO: electron/main/ipc/export.ts
  // ipcMain.handle('cancel-export-zip', ...) - MOVED TO: electron/main/ipc/export.ts

  // MOVED TO: electron/main/ipc/volumes.ts
  // ipcMain.handle('reveal-path', ...)

  ipcMain.handle('reveal-asset', async (_event: any, assetId: string) => {
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

  ipcMain.handle('plan-move-assets', async (_event: any, payload: any) => {
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

  ipcMain.handle('execute-move-assets', async (_event: any, payload: any) => {
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

  // MOVED TO: electron/main/ipc/assets.ts
  // ipcMain.handle('trash-assets', ...)

  // MOVED TO: electron/main/ipc/export.ts
  // ipcMain.handle('export-premiere', ...)
  // ipcMain.handle('export-lightroom', ...)

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

  ipcMain.handle('set-default-export-path', async (_event: any, exportPath: string | null) => {
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
