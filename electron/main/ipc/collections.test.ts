import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCollectionAssetIds,
  addAssetsToCollectionNormalized,
  removeAssetsFromCollectionNormalized,
  FAVORITES_COLLECTION_ID,
  DEFAULT_PROJECT_ID,
  ensureFavoritesCollection
} from './collections';

// Mock database
const createMockDb = () => {
  const data = {
    collections: new Map<string, any>(),
    collectionAssets: new Map<string, Set<string>>(),
  };

  return {
    data,
    prepare: vi.fn((sql: string) => {
      // Parse SQL to determine operation
      if (sql.includes('SELECT id FROM collections')) {
        return {
          get: vi.fn((id: string, projectId: string) => {
            const key = `${id}:${projectId}`;
            return data.collections.has(key) ? { id } : undefined;
          })
        };
      }

      if (sql.includes('INSERT INTO collections')) {
        return {
          run: vi.fn((id: string, projectId: string, name: string, type: string, assetIds: string) => {
            data.collections.set(`${id}:${projectId}`, { id, name, type, asset_ids: assetIds });
          })
        };
      }

      if (sql.includes('SELECT asset_id FROM collection_assets')) {
        return {
          all: vi.fn((collectionId: string) => {
            const assets = data.collectionAssets.get(collectionId) || new Set();
            return Array.from(assets).map(id => ({ asset_id: id }));
          })
        };
      }

      if (sql.includes('SELECT asset_ids FROM collections')) {
        return {
          get: vi.fn((collectionId: string) => {
            for (const [key, value] of data.collections.entries()) {
              if (key.startsWith(collectionId)) {
                return { asset_ids: value.asset_ids };
              }
            }
            return undefined;
          })
        };
      }

      if (sql.includes('INSERT OR IGNORE INTO collection_assets')) {
        return {
          run: vi.fn((collectionId: string, assetId: string) => {
            if (!data.collectionAssets.has(collectionId)) {
              data.collectionAssets.set(collectionId, new Set());
            }
            const set = data.collectionAssets.get(collectionId)!;
            const existed = set.has(assetId);
            set.add(assetId);
            return { changes: existed ? 0 : 1 };
          })
        };
      }

      if (sql.includes('DELETE FROM collection_assets')) {
        return {
          run: vi.fn((collectionId: string, assetId: string) => {
            const set = data.collectionAssets.get(collectionId);
            if (set?.has(assetId)) {
              set.delete(assetId);
              return { changes: 1 };
            }
            return { changes: 0 };
          })
        };
      }

      return { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
    }),
    transaction: vi.fn((fn: Function) => fn),
  };
};

describe('Collections IPC Handlers', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe('ensureFavoritesCollection', () => {
    it('creates favorites collection if it does not exist', () => {
      ensureFavoritesCollection(mockDb);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM collections')
      );
    });

    it('does not create duplicates if favorites already exists', () => {
      // Pre-populate favorites
      mockDb.data.collections.set(`${FAVORITES_COLLECTION_ID}:${DEFAULT_PROJECT_ID}`, {
        id: FAVORITES_COLLECTION_ID,
        name: 'Favoritos',
        type: 'manual',
        asset_ids: '[]'
      });

      ensureFavoritesCollection(mockDb);

      // Should only call SELECT, not INSERT
      const insertCalls = mockDb.prepare.mock.calls.filter(
        call => call[0].includes('INSERT INTO collections')
      );
      expect(insertCalls).toHaveLength(0);
    });
  });

  describe('getCollectionAssetIds', () => {
    it('returns asset IDs from junction table', () => {
      // Setup: Add assets to collection via junction table
      mockDb.data.collectionAssets.set('coll_1', new Set(['asset_1', 'asset_2', 'asset_3']));

      const result = getCollectionAssetIds(mockDb, 'coll_1');

      expect(result).toHaveLength(3);
      expect(result).toContain('asset_1');
      expect(result).toContain('asset_2');
      expect(result).toContain('asset_3');
    });

    it('falls back to JSON column when junction table is empty', () => {
      // Setup: Add collection with JSON asset_ids
      mockDb.data.collections.set('coll_2:default', {
        id: 'coll_2',
        asset_ids: '["asset_a", "asset_b"]'
      });

      const result = getCollectionAssetIds(mockDb, 'coll_2');

      expect(result).toHaveLength(2);
      expect(result).toContain('asset_a');
      expect(result).toContain('asset_b');
    });

    it('returns empty array for non-existent collection', () => {
      const result = getCollectionAssetIds(mockDb, 'non_existent');

      expect(result).toEqual([]);
    });

    it('handles invalid JSON gracefully', () => {
      mockDb.data.collections.set('coll_bad:default', {
        id: 'coll_bad',
        asset_ids: 'invalid json'
      });

      const result = getCollectionAssetIds(mockDb, 'coll_bad');

      expect(result).toEqual([]);
    });
  });

  describe('addAssetsToCollectionNormalized', () => {
    it('adds assets to collection', () => {
      const added = addAssetsToCollectionNormalized(mockDb, 'coll_1', ['asset_1', 'asset_2']);

      expect(added).toBe(2);
      expect(mockDb.data.collectionAssets.get('coll_1')?.has('asset_1')).toBe(true);
      expect(mockDb.data.collectionAssets.get('coll_1')?.has('asset_2')).toBe(true);
    });

    it('does not count duplicates as added', () => {
      // Pre-populate
      mockDb.data.collectionAssets.set('coll_1', new Set(['asset_1']));

      const added = addAssetsToCollectionNormalized(mockDb, 'coll_1', ['asset_1', 'asset_2']);

      // Only asset_2 is new
      expect(added).toBe(1);
    });

    it('handles empty array', () => {
      const added = addAssetsToCollectionNormalized(mockDb, 'coll_1', []);

      expect(added).toBe(0);
    });
  });

  describe('removeAssetsFromCollectionNormalized', () => {
    it('removes assets from collection', () => {
      // Pre-populate
      mockDb.data.collectionAssets.set('coll_1', new Set(['asset_1', 'asset_2', 'asset_3']));

      const removed = removeAssetsFromCollectionNormalized(mockDb, 'coll_1', ['asset_1', 'asset_2']);

      expect(removed).toBe(2);
      expect(mockDb.data.collectionAssets.get('coll_1')?.has('asset_1')).toBe(false);
      expect(mockDb.data.collectionAssets.get('coll_1')?.has('asset_2')).toBe(false);
      expect(mockDb.data.collectionAssets.get('coll_1')?.has('asset_3')).toBe(true);
    });

    it('does not count non-existent assets as removed', () => {
      mockDb.data.collectionAssets.set('coll_1', new Set(['asset_1']));

      const removed = removeAssetsFromCollectionNormalized(mockDb, 'coll_1', ['asset_1', 'asset_999']);

      expect(removed).toBe(1);
    });

    it('handles empty array', () => {
      const removed = removeAssetsFromCollectionNormalized(mockDb, 'coll_1', []);

      expect(removed).toBe(0);
    });
  });
});

describe('Collection Constants', () => {
  it('has correct favorites collection ID', () => {
    expect(FAVORITES_COLLECTION_ID).toBe('__favorites__');
  });

  it('has correct default project ID', () => {
    expect(DEFAULT_PROJECT_ID).toBe('default');
  });
});
