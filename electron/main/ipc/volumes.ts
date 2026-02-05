import { ipcMain, shell } from 'electron';
import { dbService } from '../database';
import { handleAndInfer } from '../error-handler';
import type { VolumeManager } from '../volume-manager';

let volumeManagerRef: VolumeManager | null = null;

export function setVolumeManager(vm: VolumeManager) {
  volumeManagerRef = vm;
}

export function setupVolumeHandlers() {
  // Get all volumes
  ipcMain.handle('get-volumes', async () => {
    try {
      const db = dbService.getDatabase();
      const rows = db.prepare(`
        SELECT uuid, label, mount_point, type, last_mounted_at, status, hidden 
        FROM volumes 
        WHERE hidden = 0 
        ORDER BY last_mounted_at DESC
      `).all() as any[];

      return rows.map((row) => ({
        uuid: row.uuid,
        label: row.label,
        mountPoint: row.mount_point,
        type: row.type,
        lastMountedAt: new Date(row.last_mounted_at),
        status: row.status
      }));
    } catch (error) {
      const appError = handleAndInfer('get-volumes', error);
      console.error('[get-volumes] failed:', appError);
      return [];
    }
  });

  // Eject volume
  ipcMain.handle('eject-volume', async (_event, uuid: string) => {
    try {
      const db = dbService.getDatabase();
      const row = db.prepare('SELECT mount_point FROM volumes WHERE uuid = ?').get(uuid) as any;

      if (row?.mount_point) {
        // SECURITY FIX: Usar execFile ao invés de exec para prevenir command injection
        const { execFile } = require('child_process');
        await new Promise<void>((resolve, reject) => {
          execFile('diskutil', ['eject', row.mount_point], (error: Error | null) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }

      // Update status in DB
      db.prepare('UPDATE volumes SET status = ? WHERE uuid = ?').run('disconnected', uuid);

      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('eject-volume', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Hide volume
  ipcMain.handle('hide-volume', async (_event, uuid: string) => {
    try {
      const db = dbService.getDatabase();
      db.prepare('UPDATE volumes SET hidden = 1 WHERE uuid = ?').run(uuid);
      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('hide-volume', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Rename volume
  ipcMain.handle('rename-volume', async (_event, uuid: string, label: string) => {
    try {
      const db = dbService.getDatabase();
      db.prepare('UPDATE volumes SET label = ? WHERE uuid = ?').run(label, uuid);
      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('rename-volume', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Get folder children
  ipcMain.handle('get-folder-children', async (_event, volumeUuid: string | null, parentPath: string | null) => {
    try {
      const db = dbService.getDatabase();
      
      let query: string;
      let params: any[];
      
      if (volumeUuid && parentPath) {
        // Get subfolders of a specific path
        const prefix = parentPath.endsWith('/') ? parentPath : parentPath + '/';
        query = `
          SELECT DISTINCT 
            substr(relative_path, 1, instr(substr(relative_path, length(?) + 1), '/') + length(?) - 1) as folder_path,
            COUNT(*) as asset_count
          FROM assets 
          WHERE volume_uuid = ? 
            AND status = 'online'
            AND relative_path LIKE ? 
            AND relative_path != ?
            AND instr(substr(relative_path, length(?) + 1), '/') > 0
          GROUP BY folder_path
          ORDER BY folder_path
        `;
        params = [prefix, prefix, volumeUuid, prefix + '%', parentPath, prefix];
      } else if (volumeUuid) {
        // Get root folders for a volume
        query = `
          SELECT DISTINCT 
            CASE 
              WHEN instr(relative_path, '/') > 0 
              THEN substr(relative_path, 1, instr(relative_path, '/') - 1)
              ELSE relative_path 
            END as folder_path,
            COUNT(*) as asset_count
          FROM assets 
          WHERE volume_uuid = ?
            AND status = 'online'
            AND instr(relative_path, '/') > 0
          GROUP BY folder_path
          ORDER BY folder_path
        `;
        params = [volumeUuid];
      } else {
        return [];
      }

      const rows = db.prepare(query).all(...params) as any[];
      
      return rows.map(row => ({
        name: row.folder_path.split('/').pop() || row.folder_path,
        path: row.folder_path,
        assetCount: row.asset_count
      }));
    } catch (error) {
      const appError = handleAndInfer('get-folder-children', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Reveal path in Finder
  ipcMain.handle('reveal-path', async (_event, p: string) => {
    try {
      shell.showItemInFolder(p);
      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('reveal-path', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });
}
