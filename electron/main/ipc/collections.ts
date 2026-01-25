import { ipcMain } from 'electron';
import { dbService } from '../database';

const DEFAULT_PROJECT_ID = 'default';
const FAVORITES_COLLECTION_ID = '__favorites__';

function ensureFavoritesCollection(db: any) {
  const row = db.prepare('SELECT id FROM collections WHERE id = ? AND project_id = ?').get(FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID);
  if (!row) {
    db.prepare('INSERT INTO collections (id, project_id, name, type, asset_ids) VALUES (?, ?, ?, ?, ?)').run(
      FAVORITES_COLLECTION_ID,
      DEFAULT_PROJECT_ID,
      'Favoritos',
      'manual',
      '[]'
    );
  }
}

export function getCollectionAssetIds(db: any, collectionId: string): string[] {
  // Try junction table first (new normalized approach)
  const junctionRows = db.prepare('SELECT asset_id FROM collection_assets WHERE collection_id = ?').all(collectionId) as any[];
  if (junctionRows.length > 0) {
    return junctionRows.map((r: any) => r.asset_id);
  }
  
  // Fallback to JSON column (legacy)
  const row = db.prepare('SELECT asset_ids FROM collections WHERE id = ?').get(collectionId) as any;
  if (row?.asset_ids) {
    try {
      return JSON.parse(row.asset_ids);
    } catch {
      return [];
    }
  }
  return [];
}

export function addAssetsToCollectionNormalized(db: any, collectionId: string, assetIds: string[]): number {
  const insertStmt = db.prepare('INSERT OR IGNORE INTO collection_assets (collection_id, asset_id) VALUES (?, ?)');
  
  const addAssets = db.transaction(() => {
    let added = 0;
    for (const assetId of assetIds) {
      const result = insertStmt.run(collectionId, assetId);
      if (result.changes > 0) added++;
    }
    return added;
  });
  
  return addAssets();
}

export function removeAssetsFromCollectionNormalized(db: any, collectionId: string, assetIds: string[]): number {
  const deleteStmt = db.prepare('DELETE FROM collection_assets WHERE collection_id = ? AND asset_id = ?');
  
  const removeAssets = db.transaction(() => {
    let removed = 0;
    for (const assetId of assetIds) {
      const result = deleteStmt.run(collectionId, assetId);
      if (result.changes > 0) removed++;
    }
    return removed;
  });
  
  return removeAssets();
}

export function setupCollectionHandlers() {
  ipcMain.handle('get-collections', async () => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);

    const rows = db.prepare('SELECT * FROM collections WHERE project_id = ?').all(DEFAULT_PROJECT_ID) as any[];
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      smartFilter: row.smart_filter,
      assetCount: getCollectionAssetIds(db, row.id).length
    }));
  });

  ipcMain.handle('create-collection', async (_event, name: string) => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);

    const trimmed = String(name || '').trim();
    if (!trimmed) return { success: false, error: 'Nome inválido' };

    const id = `coll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare('INSERT INTO collections (id, project_id, name, type, asset_ids) VALUES (?, ?, ?, ?, ?)').run(id, DEFAULT_PROJECT_ID, trimmed, 'manual', '[]');
    return { success: true, id, name: trimmed };
  });

  ipcMain.handle('rename-collection', async (_event, collectionId: string, name: string) => {
    try {
      const db = dbService.getDatabase();
      ensureFavoritesCollection(db);

      if (collectionId === FAVORITES_COLLECTION_ID) {
        return { success: false, error: 'Não é possível renomear a coleção de favoritos.' };
      }

      const trimmed = String(name || '').trim();
      if (!trimmed) return { success: false, error: 'Nome inválido' };

      db.prepare('UPDATE collections SET name = ? WHERE id = ? AND project_id = ?').run(trimmed, collectionId, DEFAULT_PROJECT_ID);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao renomear coleção' };
    }
  });

  ipcMain.handle('delete-collection', async (_event, collectionId: string) => {
    try {
      const db = dbService.getDatabase();
      ensureFavoritesCollection(db);

      if (collectionId === FAVORITES_COLLECTION_ID) {
        return { success: false, error: 'Não é possível excluir a coleção de favoritos.' };
      }

      // Delete from junction table first
      db.prepare('DELETE FROM collection_assets WHERE collection_id = ?').run(collectionId);
      // Then delete collection
      db.prepare('DELETE FROM collections WHERE id = ? AND project_id = ?').run(collectionId, DEFAULT_PROJECT_ID);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao excluir coleção' };
    }
  });

  ipcMain.handle('add-assets-to-collection', async (_event, collectionId: string, assetIds: string[]) => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);

    if (!assetIds || assetIds.length === 0) return { success: true, count: 0 };

    // Use normalized approach
    const added = addAssetsToCollectionNormalized(db, collectionId, assetIds);
    
    // Also update legacy JSON for backward compatibility
    const existing = getCollectionAssetIds(db, collectionId);
    const merged = Array.from(new Set([...existing, ...assetIds]));
    db.prepare('UPDATE collections SET asset_ids = ? WHERE id = ?').run(JSON.stringify(merged), collectionId);

    return { success: true, count: merged.length };
  });

  ipcMain.handle('remove-assets-from-collection', async (_event, collectionId: string, assetIds: string[]) => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);

    if (!assetIds || assetIds.length === 0) return { success: true, count: 0, removed: 0 };

    // Use normalized approach
    const removed = removeAssetsFromCollectionNormalized(db, collectionId, assetIds);
    
    // Also update legacy JSON for backward compatibility
    const existing = getCollectionAssetIds(db, collectionId);
    const next = existing.filter((id: string) => !assetIds.includes(id));
    db.prepare('UPDATE collections SET asset_ids = ? WHERE id = ?').run(JSON.stringify(next), collectionId);

    return { success: true, count: next.length, removed };
  });

  ipcMain.handle('toggle-favorites', async (_event, assetIds: string[]) => {
    try {
      const db = dbService.getDatabase();
      ensureFavoritesCollection(db);

      if (!assetIds || assetIds.length === 0) {
        return { success: true, action: 'none', ids: [] };
      }

      const existing = getCollectionAssetIds(db, FAVORITES_COLLECTION_ID);
      const allInFavorites = assetIds.every(id => existing.includes(id));

      if (allInFavorites) {
        // Remove from favorites
        removeAssetsFromCollectionNormalized(db, FAVORITES_COLLECTION_ID, assetIds);
        const next = existing.filter(id => !assetIds.includes(id));
        db.prepare('UPDATE collections SET asset_ids = ? WHERE id = ? AND project_id = ?').run(JSON.stringify(next), FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID);
        return { success: true, action: 'removed', ids: assetIds };
      } else {
        // Add to favorites
        addAssetsToCollectionNormalized(db, FAVORITES_COLLECTION_ID, assetIds);
        const merged = Array.from(new Set([...existing, ...assetIds]));
        db.prepare('UPDATE collections SET asset_ids = ? WHERE id = ? AND project_id = ?').run(JSON.stringify(merged), FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID);
        return { success: true, action: 'added', ids: assetIds };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao alternar favoritos' };
    }
  });

  ipcMain.handle('get-favorites-ids', async () => {
    const db = dbService.getDatabase();
    ensureFavoritesCollection(db);
    return getCollectionAssetIds(db, FAVORITES_COLLECTION_ID);
  });
}

export { FAVORITES_COLLECTION_ID, DEFAULT_PROJECT_ID, ensureFavoritesCollection };
