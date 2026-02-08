import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import crypto from 'crypto';
import { dbService } from '../database';
import { handleAndInfer } from '../error-handler';
import { sanitizeFileName, buildSafePath } from '../security-utils';
import type { ExportCopyPayload, ExportZipPayload } from '../../../src/shared/types';

let mainWindowRef: BrowserWindow | null = null;

export function setMainWindow(win: BrowserWindow | null) {
  mainWindowRef = win;
}

// Helper para enviar mensagens de forma segura
function safeSend(channel: string, ...args: any[]) {
  try {
    if (mainWindowRef && !mainWindowRef.isDestroyed() && mainWindowRef.webContents && !mainWindowRef.webContents.isDestroyed()) {
      mainWindowRef.webContents.send(channel, ...args);
    }
  } catch {
    // Silenciosamente ignora erros
  }
}

// Active export jobs
const exportZipJobs = new Map<string, { archive: archiver.Archiver; output: fs.WriteStream }>();

export function setupExportHandlers() {
  // Export copy assets
  ipcMain.handle('export-copy-assets', async (_event: any, payload: ExportCopyPayload) => {
    try {
      const { assetIds, destDir, preserveFolders = false, conflictDecision = 'rename' } = payload;

      if (!assetIds || assetIds.length === 0) {
        return { success: false, error: 'Nenhum arquivo selecionado' };
      }

      // Get destination directory
      let targetDir = destDir;
      if (!targetDir) {
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory', 'createDirectory'],
          title: 'Selecione o destino da cópia'
        });

        if (result.canceled || !result.filePaths[0]) {
          return { success: false, canceled: true };
        }
        targetDir = result.filePaths[0];
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const assets = db.prepare(`
        SELECT a.*, v.mount_point 
        FROM assets a 
        JOIN volumes v ON a.volume_uuid = v.uuid 
        WHERE a.id IN (${placeholders})
      `).all(...assetIds) as any[];

      let copied = 0;
      let failed = 0;
      let skipped = 0;
      let skippedMissing = 0;
      let skippedOffline = 0;
      const results: any[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const sourcePath = path.join(asset.mount_point || '', asset.relative_path);

        // Determine destination path based on preserveFolders option
        let destPath: string;
        let displayName: string;

        if (preserveFolders && asset.relative_path) {
          // Preserve folder structure - sanitize each path component
          const pathComponents = asset.relative_path.split(path.sep).map(sanitizeFileName);
          const safePath = pathComponents.join(path.sep);
          destPath = buildSafePath(targetDir, safePath);
          displayName = safePath;

          // Create parent directories if needed
          const destDir = path.dirname(destPath);
          await fs.promises.mkdir(destDir, { recursive: true });
        } else {
          // Flat structure - just use filename
          const safeFileName = sanitizeFileName(asset.file_name);
          destPath = buildSafePath(targetDir, safeFileName);
          displayName = safeFileName;
        }

        // Send progress
        safeSend('export-copy-progress', {
          current: i + 1,
          total: assets.length,
          currentFile: displayName
        });

        try {
          if (!fs.existsSync(sourcePath)) {
            skippedMissing++;
            results.push({ assetId: asset.id, success: false, error: 'Arquivo não encontrado' });
            continue;
          }

          // Handle conflicts based on conflictDecision
          let finalDest = destPath;

          if (fs.existsSync(destPath)) {
            if (conflictDecision === 'skip') {
              // Skip this file
              skipped++;
              results.push({ assetId: asset.id, sourcePath, destPath, success: true, skipped: true });
              continue;
            } else if (conflictDecision === 'rename') {
              // Auto-rename to ensure unique filename
              let counter = 1;
              const ext = path.extname(destPath);
              const base = destPath.slice(0, -ext.length);
              while (fs.existsSync(finalDest)) {
                finalDest = `${base}_${counter}${ext}`;
                counter++;
              }
            }
            // If 'overwrite', just use destPath (will overwrite)
          }

          await fs.promises.copyFile(sourcePath, finalDest);
          copied++;
          results.push({ assetId: asset.id, sourcePath, destPath: finalDest, success: true });
        } catch (err) {
          failed++;
          results.push({ assetId: asset.id, sourcePath, success: false, error: String(err) });
        }
      }

      // Final progress
      safeSend('export-copy-progress', {
        current: assets.length,
        total: assets.length,
        done: true
      });

      return {
        success: true,
        destinationDir: targetDir,
        copied,
        failed,
        skipped,
        skippedMissing,
        skippedOffline,
        results
      };
    } catch (error) {
      const appError = handleAndInfer('export-copy-assets', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Export collection as named folder
  ipcMain.handle('export-collection-folder', async (_event: any, collectionId: string) => {
    try {
      const db = dbService.getDatabase();

      // Get collection info
      const collection = db.prepare('SELECT id, name FROM collections WHERE id = ?').get(collectionId) as any;
      if (!collection) {
        return { success: false, error: 'Coleção não encontrada' };
      }

      // Get asset IDs from junction table
      const junctionRows = db.prepare('SELECT asset_id FROM collection_assets WHERE collection_id = ?').all(collectionId) as any[];
      const assetIds = junctionRows.map((r: any) => r.asset_id);

      if (assetIds.length === 0) {
        return { success: false, error: 'Coleção vazia' };
      }

      // Show directory picker
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: `Exportar "${collection.name}" — selecione o destino`
      });

      if (result.canceled || !result.filePaths[0]) {
        return { success: false, canceled: true };
      }

      // Create subfolder named after collection
      const safeFolderName = sanitizeFileName(collection.name);
      const targetDir = path.join(result.filePaths[0], safeFolderName);
      await fs.promises.mkdir(targetDir, { recursive: true });

      // Get asset file info
      const placeholders = assetIds.map(() => '?').join(',');
      const assets = db.prepare(`
        SELECT a.*, v.mount_point
        FROM assets a
        JOIN volumes v ON a.volume_uuid = v.uuid
        WHERE a.id IN (${placeholders})
      `).all(...assetIds) as any[];

      let copied = 0;
      let failed = 0;
      let skippedMissing = 0;
      const results: any[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const sourcePath = path.join(asset.mount_point || '', asset.relative_path);
        const safeFileName = sanitizeFileName(asset.file_name);
        const destPath = buildSafePath(targetDir, safeFileName);

        safeSend('export-copy-progress', {
          current: i + 1,
          total: assets.length,
          currentFile: safeFileName
        });

        try {
          if (!fs.existsSync(sourcePath)) {
            skippedMissing++;
            results.push({ assetId: asset.id, success: false, error: 'Arquivo não encontrado' });
            continue;
          }

          let finalDest = destPath;
          let counter = 1;
          while (fs.existsSync(finalDest)) {
            const ext = path.extname(safeFileName);
            const base = path.basename(safeFileName, ext);
            finalDest = buildSafePath(targetDir, `${base}_${counter}${ext}`);
            counter++;
          }

          await fs.promises.copyFile(sourcePath, finalDest);
          copied++;
          results.push({ assetId: asset.id, sourcePath, destPath: finalDest, success: true });
        } catch (err) {
          failed++;
          results.push({ assetId: asset.id, sourcePath, success: false, error: String(err) });
        }
      }

      safeSend('export-copy-progress', {
        current: assets.length,
        total: assets.length,
        done: true
      });

      return {
        success: true,
        destinationDir: targetDir,
        collectionName: collection.name,
        copied,
        failed,
        skippedMissing,
        results
      };
    } catch (error) {
      const appError = handleAndInfer('export-collection-folder', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Export ZIP
  ipcMain.handle('export-zip-assets', async (_event: any, payload: ExportZipPayload) => {
    try {
      const { assetIds, destPath } = payload;
      const jobId = payload.jobId || crypto.randomUUID();

      if (!assetIds || assetIds.length === 0) {
        return { success: false, error: 'Nenhum arquivo selecionado' };
      }

      // Get destination
      let targetPath = destPath;
      if (!targetPath) {
        const result = await dialog.showSaveDialog({
          title: 'Salvar ZIP como',
          defaultPath: `export_${new Date().toISOString().slice(0, 10)}.zip`,
          filters: [{ name: 'ZIP', extensions: ['zip'] }]
        });
        
        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true };
        }
        targetPath = result.filePath;
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const assets = db.prepare(`
        SELECT a.*, v.mount_point 
        FROM assets a 
        JOIN volumes v ON a.volume_uuid = v.uuid 
        WHERE a.id IN (${placeholders})
      `).all(...assetIds) as any[];

      // Create output stream
      const output = fs.createWriteStream(targetPath);
      const archive = archiver('zip', { zlib: { level: 5 } });

      exportZipJobs.set(jobId, { archive, output });

      archive.pipe(output);

      let added = 0;
      let failed = 0;
      let skippedMissing = 0;

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const sourcePath = path.join(asset.mount_point || '', asset.relative_path);

        // SECURITY FIX: Sanitizar nome de arquivo para prevenir path traversal no ZIP
        const safeFileName = sanitizeFileName(asset.file_name);

        // Send progress
        safeSend('export-zip-progress', {
          jobId,
          percent: Math.round(((i + 1) / assets.length) * 100),
          currentFile: safeFileName
        });

        try {
          if (!fs.existsSync(sourcePath)) {
            skippedMissing++;
            continue;
          }

          archive.file(sourcePath, { name: safeFileName });
          added++;
        } catch (err) {
          failed++;
        }
      }

      await archive.finalize();
      exportZipJobs.delete(jobId);

      // Final progress
      safeSend('export-zip-progress', {
        jobId,
        percent: 100,
        done: true,
        outputPath: targetPath
      });

      return {
        success: true,
        jobId,
        path: targetPath,
        added,
        failed,
        skippedMissing
      };
    } catch (error) {
      const appError = handleAndInfer('export-zip-assets', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Cancel ZIP export
  ipcMain.handle('cancel-export-zip', async (_event: any, jobId: string) => {
    try {
      const job = exportZipJobs.get(jobId);
      if (job) {
        job.archive.abort();
        job.output.close();
        exportZipJobs.delete(jobId);
      }
      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('cancel-export-zip', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Export to Premiere XML
  ipcMain.handle('export-premiere', async (_event: any, assetIds: string[]) => {
    try {
      if (!assetIds || assetIds.length === 0) {
        return { success: false, error: 'Nenhum arquivo selecionado' };
      }

      const result = await dialog.showSaveDialog({
        title: 'Salvar XML do Premiere',
        defaultPath: `premiere_${new Date().toISOString().slice(0, 10)}.xml`,
        filters: [{ name: 'XML', extensions: ['xml'] }]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const assets = db.prepare(`
        SELECT a.*, v.mount_point 
        FROM assets a 
        JOIN volumes v ON a.volume_uuid = v.uuid 
        WHERE a.id IN (${placeholders})
      `).all(...assetIds) as any[];

      // Generate simple Premiere XML
      const xml = generatePremiereXML(assets);
      await fs.promises.writeFile(result.filePath, xml, 'utf-8');

      return { success: true, path: result.filePath };
    } catch (error) {
      const appError = handleAndInfer('export-premiere', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });

  // Export to Lightroom XMP
  ipcMain.handle('export-lightroom', async (_event: any, assetIds: string[]) => {
    try {
      if (!assetIds || assetIds.length === 0) {
        return { success: false, error: 'Nenhum arquivo selecionado' };
      }

      const db = dbService.getDatabase();
      const placeholders = assetIds.map(() => '?').join(',');
      const assets = db.prepare(`
        SELECT a.*, v.mount_point 
        FROM assets a 
        JOIN volumes v ON a.volume_uuid = v.uuid 
        WHERE a.id IN (${placeholders})
      `).all(...assetIds) as any[];

      let count = 0;
      for (const asset of assets) {
        const sourcePath = path.join(asset.mount_point || '', asset.relative_path);
        const xmpPath = sourcePath.replace(/\.[^.]+$/, '.xmp');
        
        try {
          const xmp = generateLightroomXMP(asset);
          await fs.promises.writeFile(xmpPath, xmp, 'utf-8');
          count++;
        } catch (err) {
          // Continue with other files
        }
      }

      return { success: true, count };
    } catch (error) {
      const appError = handleAndInfer('export-lightroom', error);
      return { success: false, error: appError.userMessage, code: appError.code };
    }
  });
}

function generatePremiereXML(assets: any[]): string {
  const clips = assets.map(a => {
    const filePath = path.join(a.mount_point || '', a.relative_path);
    return `    <clip>
      <name>${escapeXml(a.file_name)}</name>
      <pathurl>file://localhost${escapeXml(filePath)}</pathurl>
      <duration>${a.duration || 0}</duration>
    </clip>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="4">
  <sequence>
    <name>Zona21 Export</name>
    <media>
      <video>
${clips}
      </video>
    </media>
  </sequence>
</xmeml>`;
}

function generateLightroomXMP(asset: any): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"
      xmp:Rating="${asset.rating || 0}"
      xmp:Label="${asset.color_label || ''}"
      xmpMM:DocumentID="${asset.id}">
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export { exportZipJobs };
