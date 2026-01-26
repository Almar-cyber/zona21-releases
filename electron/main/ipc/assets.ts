import { ipcMain } from 'electron';
import { dbService } from '../database';
import { handleAndInfer } from '../error-handler';
import type { AssetsPageFilter, AssetUpdate } from '../../../src/shared/types';

// Helper para mapear row do DB para Asset
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

export function setupAssetHandlers() {
  // Get assets by IDs
  ipcMain.handle('get-assets-by-ids', async (_event, assetIds: string[]) => {
    try {
      if (!assetIds || assetIds.length === 0) return [];
      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const stmt = db.prepare(`SELECT * FROM assets WHERE id IN (${placeholders})`);
      const rows = stmt.all(...assetIds) as any[];
      return rows.map(mapAssetRow);
    } catch (error) {
      const appError = handleAndInfer('get-assets-by-ids', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Update asset
  ipcMain.handle('update-asset', async (_event, assetId: string, updates: AssetUpdate) => {
    try {
      const db = dbService.getDatabase();
      const setClauses: string[] = [];
      const values: any[] = [];

      if (updates.rating !== undefined) {
        setClauses.push('rating = ?');
        values.push(updates.rating);
      }
      if (updates.flagged !== undefined) {
        setClauses.push('flagged = ?');
        values.push(updates.flagged ? 1 : 0);
      }
      if (updates.rejected !== undefined) {
        setClauses.push('rejected = ?');
        values.push(updates.rejected ? 1 : 0);
      }
      if (updates.colorLabel !== undefined) {
        setClauses.push('color_label = ?');
        values.push(updates.colorLabel);
      }
      if (updates.notes !== undefined) {
        setClauses.push('notes = ?');
        values.push(updates.notes);
      }
      if (updates.tags !== undefined) {
        setClauses.push('tags = ?');
        values.push(updates.tags);
      }

      if (setClauses.length === 0) {
        return { success: true };
      }

      values.push(assetId);
      const sql = `UPDATE assets SET ${setClauses.join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...values);

      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('update-asset', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Trash assets
  ipcMain.handle('trash-assets', async (_event, assetIds: string[]) => {
    try {
      if (!assetIds || assetIds.length === 0) return { success: true };
      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM assets WHERE id IN (${placeholders})`).run(...assetIds);
      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('trash-assets', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });
}

export { mapAssetRow };
