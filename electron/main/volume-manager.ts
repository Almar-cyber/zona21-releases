import { execFileSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Volume } from '../../src/shared/types';
import { dbService } from './database';

type VolumeUpdate = Partial<Volume> & { hidden?: number };

export class VolumeManager {
  private resolveDarwinDeviceNode(mountPoint: string): string | null {
    try {
      const out = execFileSync('diskutil', ['info', mountPoint], { encoding: 'utf8' });
      const m = out.match(/\bDevice Node:\s*(\S+)/i);
      return m?.[1] ? String(m[1]).trim() : null;
    } catch {
      return null;
    }
  }

  getVolumeForPath(filePath: string): Volume {
    const systemMountPoint = this.getMountPoint(filePath);
    
    // Para pastas do sistema (mountPoint é "/"), usar a pasta selecionada como mountPoint virtual
    // Isso garante que o relativePath seja calculado a partir da pasta selecionada
    const isSystemFolder = systemMountPoint === '/';
    const mountPoint = isSystemFolder ? filePath : systemMountPoint;
    
    // UUID baseado no mountPoint efetivo (pasta selecionada para sistema, ou volume para externos)
    const uuid = this.getVolumeUUID(mountPoint);
    
    // Label é o nome da pasta/volume
    const label = path.basename(mountPoint) || mountPoint;

    let volume = this.getVolumeByUUID(uuid);
    
    if (!volume) {
      volume = {
        uuid,
        label,
        mountPoint,
        type: this.getVolumeType(mountPoint),
        lastMountedAt: new Date(),
        status: 'connected'
      };
      this.saveVolume(volume);
    } else {
      // Atualizar mountPoint e label se necessário
      const shouldUpdateLabel = !volume.label || volume.label === '/' || volume.label === '';
      const shouldUpdateMountPoint = isSystemFolder && volume.mountPoint === '/';
      
      this.updateVolume(uuid, { 
        ...(shouldUpdateMountPoint ? { mountPoint } : {}),
        status: 'connected', 
        lastMountedAt: new Date(), 
        hidden: 0,
        ...(shouldUpdateLabel ? { label } : {})
      });
      
      if (shouldUpdateMountPoint) {
        volume.mountPoint = mountPoint;
      }
      volume.status = 'connected';
      if (shouldUpdateLabel) {
        volume.label = label;
      }
    }

    // If the user ejected and reconnected the same drive, assets might have been marked offline.
    // Restore them back to online once the volume is connected again.
    try {
      const db = dbService.getDatabase();
      db.prepare("UPDATE assets SET status = 'online' WHERE volume_uuid = ? AND status = 'offline'").run(uuid);
    } catch {
      // ignore
    }

    return volume;
  }

  renameVolume(uuid: string, label: string): { success: boolean; error?: string } {
    try {
      const volume = this.getVolumeByUUID(uuid);
      if (!volume) return { success: false, error: 'Volume not found' };
      const next = String(label || '').trim();
      if (!next) return { success: false, error: 'Invalid label' };
      this.updateVolume(uuid, { label: next });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  ejectVolume(uuid: string): { success: boolean; error?: string } {
    try {
      const volume = this.getVolumeByUUID(uuid);
      if (!volume) return { success: false, error: 'Volume não encontrado' };
      if (volume.status !== 'connected') return { success: false, error: 'Volume não está conectado' };
      if (!volume.mountPoint) return { success: false, error: 'Volume não está montado' };
      if (volume.type !== 'external') return { success: false, error: 'Apenas discos externos podem ser ejetados' };

      if (process.platform === 'darwin') {
        const mountPoint = volume.mountPoint;
        const deviceNode = this.resolveDarwinDeviceNode(mountPoint);
        try {
          if (deviceNode) {
            execFileSync('diskutil', ['eject', deviceNode], { stdio: 'pipe' });
          } else {
            execFileSync('diskutil', ['eject', mountPoint], { stdio: 'pipe' });
          }
        } catch (error) {
          const rawMsg = (error as any)?.stderr ? String((error as any).stderr) : (error as Error).message;
          // Traduzir mensagens de erro comuns para português amigável
          let friendlyMsg = 'Não foi possível ejetar o disco';
          if (rawMsg.includes('could not be unmounted') || rawMsg.includes('failed')) {
            friendlyMsg = 'Disco em uso. Feche todos os arquivos e aplicativos que estão usando este disco e tente novamente.';
          } else if (rawMsg.includes('not found')) {
            friendlyMsg = 'Disco não encontrado. Ele pode já ter sido removido.';
          }
          return { success: false, error: friendlyMsg };
        }
      } else if (process.platform === 'win32') {
        return { success: false, error: 'Ejetar disco ainda não é suportado no Windows' };
      } else {
        return { success: false, error: 'Ejetar disco não é suportado nesta plataforma' };
      }

      this.updateVolume(uuid, { mountPoint: null, status: 'disconnected' });

      // Mark assets as offline so they stop showing up in the UI when drive is ejected.
      try {
        const db = dbService.getDatabase();
        db.prepare("UPDATE assets SET status = 'offline' WHERE volume_uuid = ? AND status != 'missing'").run(uuid);
      } catch {
        // ignore
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao ejetar disco. Tente novamente.' };
    }
  }

  hideVolume(uuid: string): { success: boolean; error?: string } {
    try {
      const volume = this.getVolumeByUUID(uuid);
      if (!volume) return { success: false, error: 'Volume not found' };
      this.updateVolume(uuid, { hidden: 1 });
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  getAllVolumes(): Volume[] {
    const db = dbService.getDatabase();
    const stmt = db.prepare('SELECT * FROM volumes WHERE hidden = 0 ORDER BY last_mounted_at DESC');
    const rows = stmt.all() as any[];

    // If a drive was removed without using the in-app eject action, its DB status may remain "connected".
    // Detect this case and update status based on mount point existence.
    for (const row of rows) {
      const mountPoint = row.mount_point as string | null | undefined;
      const status = row.status as 'connected' | 'disconnected' | undefined;
      if (status === 'connected' && mountPoint && !fs.existsSync(mountPoint)) {
        try {
          db.prepare('UPDATE volumes SET mount_point = NULL, status = ? WHERE uuid = ?').run('disconnected', row.uuid);
          row.mount_point = null;
          row.status = 'disconnected';

          // Keep assets consistent with volume status.
          try {
            db.prepare("UPDATE assets SET status = 'offline' WHERE volume_uuid = ? AND status != 'missing'").run(row.uuid);
          } catch {
            // ignore
          }
        } catch {
          row.mount_point = null;
          row.status = 'disconnected';
        }
      }
    }

    return rows.map((row) => ({
      uuid: row.uuid,
      label: row.label,
      mountPoint: row.mount_point,
      type: row.type as 'local' | 'external' | 'network',
      lastMountedAt: new Date(row.last_mounted_at),
      status: row.status as 'connected' | 'disconnected'
    }));
  }

  private getMountPoint(filePath: string): string {
    if (process.platform === 'darwin') {
      const parts = filePath.split('/');
      if (parts[1] === 'Volumes') {
        return `/${parts[1]}/${parts[2]}`;
      }
      return '/';
    } else if (process.platform === 'win32') {
      return filePath.substring(0, 3); // C:\
    }
    return '/';
  }

  private getVolumeUUID(mountPoint: string): string {
    try {
      if (process.platform === 'darwin') {
        // Para pastas internas (ex.: ~/Documents/...), não tente rodar diskutil
        if (!mountPoint.startsWith('/Volumes/')) {
          return this.generateFallbackUUID(mountPoint);
        }
        const output = execSync(`diskutil info "${mountPoint}" | grep "Volume UUID"`).toString();
        const match = output.match(/Volume UUID:\s+([A-F0-9-]+)/);
        return match ? match[1] : this.generateFallbackUUID(mountPoint);
      } else if (process.platform === 'win32') {
        const output = execSync(`vol ${mountPoint}`).toString();
        const match = output.match(/Serial Number is ([A-F0-9-]+)/);
        return match ? match[1] : this.generateFallbackUUID(mountPoint);
      }
    } catch (error) {
      console.error('Error getting volume UUID:', error);
    }
    return this.generateFallbackUUID(mountPoint);
  }

  private generateFallbackUUID(mountPoint: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(mountPoint).digest('hex').substring(0, 36);
  }

  private getVolumeType(mountPoint: string): 'local' | 'external' | 'network' {
    if (mountPoint.includes('Volumes') || mountPoint.match(/^[D-Z]:\\/)) {
      return 'external';
    }
    if (mountPoint.startsWith('//') || mountPoint.startsWith('smb://')) {
      return 'network';
    }
    return 'local';
  }

  private getVolumeByUUID(uuid: string): Volume | null {
    const db = dbService.getDatabase();
    const stmt = db.prepare('SELECT * FROM volumes WHERE uuid = ?');
    const row = stmt.get(uuid) as any;
    
    if (!row) return null;
    
    return {
      uuid: row.uuid,
      label: row.label,
      mountPoint: row.mount_point,
      type: row.type,
      lastMountedAt: new Date(row.last_mounted_at),
      status: row.status
    };
  }

  private saveVolume(volume: Volume) {
    const db = dbService.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO volumes (uuid, label, mount_point, type, last_mounted_at, status, hidden)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    
    stmt.run(
      volume.uuid,
      volume.label,
      volume.mountPoint,
      volume.type,
      volume.lastMountedAt.getTime(),
      volume.status
    );
  }

  private updateVolume(uuid: string, updates: VolumeUpdate) {
    const db = dbService.getDatabase();
    const fields = [];
    const values = [];

    if (updates.label !== undefined) {
      fields.push('label = ?');
      values.push(updates.label);
    }

    if (updates.mountPoint !== undefined) {
      fields.push('mount_point = ?');
      values.push(updates.mountPoint);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.lastMountedAt !== undefined) {
      fields.push('last_mounted_at = ?');
      values.push(updates.lastMountedAt.getTime());
    }

    if (updates.hidden !== undefined) {
      fields.push('hidden = ?');
      values.push(updates.hidden ? 1 : 0);
    }

    if (fields.length === 0) return;

    values.push(uuid);
    const query = `UPDATE volumes SET ${fields.join(', ')} WHERE uuid = ?`;
    
    const stmt = db.prepare(query);
    stmt.run(...values);
  }
}
