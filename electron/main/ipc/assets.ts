import { ipcMain } from 'electron';
import { dbService } from '../database';
import { handleAndInfer } from '../error-handler';
import { validateAssetIds } from '../security-utils';
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

export function setupAssetHandlers() {
  // Get assets by IDs
  ipcMain.handle('get-assets-by-ids', async (_event: any, assetIds: string[]) => {
    try {
      if (!assetIds || assetIds.length === 0) return [];

      // SECURITY FIX: Validar asset IDs para prevenir SQL injection e DoS
      const validIds = validateAssetIds(assetIds, 1000);

      const db = dbService.getDatabase();
      const placeholders = validIds.map(() => '?').join(',');
      const stmt = db.prepare(`SELECT * FROM assets WHERE id IN (${placeholders})`);
      const rows = stmt.all(...validIds) as any[];
      return rows.map(mapAssetRow);
    } catch (error) {
      const appError = handleAndInfer('get-assets-by-ids', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Update asset
  ipcMain.handle('update-asset', async (_event: any, assetId: string, updates: AssetUpdate) => {
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
      if (updates.markingStatus !== undefined) {
        setClauses.push('marking_status = ?');
        values.push(updates.markingStatus);
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
  ipcMain.handle('trash-assets', async (_event: any, assetIds: string[]) => {
    try {
      if (!assetIds || assetIds.length === 0) return { success: true };

      // SECURITY FIX: Validar asset IDs
      const validIds = validateAssetIds(assetIds, 1000);

      const db = dbService.getDatabase();
      const placeholders = validIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM assets WHERE id IN (${placeholders})`).run(...validIds);
      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('trash-assets', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Get marking counts (for sidebar collections)
  ipcMain.handle('get-marking-counts', async () => {
    try {
      const db = dbService.getDatabase();
      // Only count online assets from non-hidden volumes
      const result = db.prepare(`
        SELECT
          COUNT(CASE WHEN marking_status = 'favorite' THEN 1 END) as favorites,
          COUNT(CASE WHEN marking_status IN ('approved', 'favorite') THEN 1 END) as approved,
          COUNT(CASE WHEN marking_status = 'rejected' THEN 1 END) as rejected
        FROM assets
        WHERE status = 'online'
          AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)
      `).get() as { favorites: number; approved: number; rejected: number };
      return {
        favorites: result?.favorites ?? 0,
        approved: result?.approved ?? 0,
        rejected: result?.rejected ?? 0
      };
    } catch (error) {
      const appError = handleAndInfer('get-marking-counts', error);
      return { favorites: 0, approved: 0, rejected: 0, error: appError.userMessage };
    }
  });

  // Get smart suggestions statistics
  ipcMain.handle('get-smart-suggestions', async () => {
    try {
      const db = dbService.getDatabase();

      // Instagram-ready photos (1080x1080 or 1080x1920, approved/favorite)
      const instagramReady = db.prepare(`
        SELECT COUNT(*) as count
        FROM assets
        WHERE marking_status IN ('approved', 'favorite')
          AND media_type = 'photo'
          AND status = 'online'
          AND ((width = 1080 AND height = 1080) OR (width = 1080 AND height = 1920))
          AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)
      `).get() as { count: number } | undefined;

      // Rejected photos count
      const rejected = db.prepare(`
        SELECT COUNT(*) as count
        FROM assets
        WHERE marking_status = 'rejected'
          AND status = 'online'
          AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)
      `).get() as { count: number } | undefined;

      // Similar photos clusters (using file hash similarity)
      // Count groups of 2+ photos with same partial hash
      const similarClusters = db.prepare(`
        SELECT COUNT(*) as count
        FROM (
          SELECT partial_hash
          FROM assets
          WHERE media_type = 'photo'
            AND status = 'online'
            AND partial_hash IS NOT NULL
            AND volume_uuid IN (SELECT uuid FROM volumes WHERE hidden = 0)
          GROUP BY partial_hash
          HAVING COUNT(*) >= 2
        )
      `).get() as { count: number } | undefined;

      return {
        instagramReady: instagramReady?.count ?? 0,
        rejectedCount: rejected?.count ?? 0,
        similarClusters: similarClusters?.count ?? 0,
      };
    } catch (error) {
      const appError = handleAndInfer('get-smart-suggestions', error);
      return {
        instagramReady: 0,
        rejectedCount: 0,
        similarClusters: 0,
        error: appError.userMessage
      };
    }
  });

  // Bulk update marking status
  ipcMain.handle('bulk-update-marking', async (_event: any, assetIds: string[], markingStatus: string) => {
    try {
      if (!assetIds || assetIds.length === 0) return { success: true, count: 0 };

      // SECURITY FIX: Validar asset IDs
      const validIds = validateAssetIds(assetIds, 1000);

      // Validar marking status
      const validStatuses = ['unmarked', 'approved', 'favorite', 'rejected'];
      if (!validStatuses.includes(markingStatus)) {
        throw new Error('Invalid marking status');
      }

      const db = dbService.getDatabase();
      const placeholders = validIds.map(() => '?').join(',');
      const result = db.prepare(`UPDATE assets SET marking_status = ? WHERE id IN (${placeholders})`).run(markingStatus, ...validIds);
      return { success: true, count: result.changes };
    } catch (error) {
      const appError = handleAndInfer('bulk-update-marking', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });
}

export { mapAssetRow };
