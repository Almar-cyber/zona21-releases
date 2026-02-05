/**
 * Stress Test - Performance validation with 10k+ assets
 *
 * Tests database operations, query performance, and memory usage
 * with large datasets to ensure the app meets performance targets.
 *
 * ROADMAP Target: 1000 arquivos/min indexação, ~450MB com 10k assets
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { randomUUID } from 'crypto';

// Test constants
const ASSET_COUNT = 10000;
const BATCH_SIZE = 500;
const QUERY_TIMEOUT_MS = 1000; // Target: queries should complete in <1s

// Generate synthetic asset data
function generateAsset(index: number, volumeUuid: string) {
  const mediaTypes = ['photo', 'video'];
  const markingStatuses = ['unmarked', 'approved', 'favorite', 'rejected'];
  const colorLabels = [null, 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  const cameraMakes = ['Canon', 'Sony', 'Nikon', 'Fujifilm', 'Panasonic'];
  const cameraModels = ['EOS R5', 'A7 IV', 'Z8', 'X-T5', 'GH6'];

  const isVideo = index % 5 === 0; // 20% videos
  const randomDate = Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000;

  return {
    id: randomUUID(),
    volume_uuid: volumeUuid,
    relative_path: `/folder${Math.floor(index / 100)}/subfolder${Math.floor(index / 10) % 10}/file_${index}.${isVideo ? 'mp4' : 'jpg'}`,
    file_name: `file_${index}.${isVideo ? 'mp4' : 'jpg'}`,
    file_size: Math.floor(Math.random() * 50000000) + 100000,
    partial_hash: `hash_${Math.floor(index / 3)}`, // Some duplicates
    media_type: isVideo ? 'video' : 'photo',
    width: isVideo ? 3840 : 6000,
    height: isVideo ? 2160 : 4000,
    created_at: randomDate,
    codec: isVideo ? 'h264' : null,
    container: isVideo ? 'mp4' : null,
    frame_rate: isVideo ? 29.97 : null,
    duration: isVideo ? Math.random() * 300 : null,
    timecode_start: null,
    audio_channels: isVideo ? 2 : null,
    audio_sample_rate: isVideo ? 48000 : null,
    camera_make: cameraMakes[index % cameraMakes.length],
    camera_model: cameraModels[index % cameraModels.length],
    lens: '24-70mm f/2.8',
    focal_length: 35 + Math.random() * 70,
    aperture: 2.8 + Math.random() * 8,
    shutter_speed: '1/250',
    iso: 100 * Math.pow(2, Math.floor(Math.random() * 6)),
    gps_latitude: -23 + Math.random() * 10,
    gps_longitude: -46 + Math.random() * 10,
    orientation: 1,
    color_space: 'sRGB',
    rating: Math.floor(Math.random() * 6),
    color_label: colorLabels[index % colorLabels.length],
    flagged: Math.random() > 0.8 ? 1 : 0,
    rejected: Math.random() > 0.95 ? 1 : 0,
    marking_status: markingStatuses[index % markingStatuses.length],
    tags: JSON.stringify(['tag1', 'tag2', `tag${index % 20}`]),
    notes: index % 10 === 0 ? `Note for asset ${index}` : '',
    thumbnail_paths: JSON.stringify([`/cache/thumb_${index}_256.jpg`, `/cache/thumb_${index}_512.jpg`]),
    waveform_path: isVideo ? `/cache/waveform_${index}.png` : null,
    proxy_path: isVideo ? `/cache/proxy_${index}.mp4` : null,
    full_res_preview_path: `/cache/preview_${index}.jpg`,
    indexed_at: Date.now(),
    status: 'online'
  };
}

// Generate collection data
function generateCollections(db: Database.Database, assetIds: string[]) {
  const collections = [
    { id: 'col_selects', name: 'Selects', type: 'manual' },
    { id: 'col_portfolio', name: 'Portfolio', type: 'manual' },
    { id: 'col_favorites', name: 'Favorites', type: 'smart' },
    { id: 'col_recent', name: 'Recent Imports', type: 'smart' },
    { id: 'col_videos', name: 'All Videos', type: 'smart' }
  ];

  const insertCollection = db.prepare(`
    INSERT OR REPLACE INTO collections (id, project_id, name, type, smart_filter, asset_ids)
    VALUES (?, 'default', ?, ?, NULL, '[]')
  `);

  const insertCollectionAsset = db.prepare(`
    INSERT OR IGNORE INTO collection_assets (collection_id, asset_id)
    VALUES (?, ?)
  `);

  for (const coll of collections) {
    insertCollection.run(coll.id, coll.name, coll.type);
  }

  // Add assets to collections (distribute ~2000 assets per collection)
  const assetsPerCollection = Math.floor(assetIds.length / collections.length);
  for (let i = 0; i < collections.length; i++) {
    const startIdx = i * assetsPerCollection;
    const endIdx = Math.min(startIdx + assetsPerCollection, assetIds.length);
    for (let j = startIdx; j < endIdx; j++) {
      insertCollectionAsset.run(collections[i].id, assetIds[j]);
    }
  }
}

describe('Stress Test - 10k Assets', () => {
  let db: Database.Database;
  let dbPath: string;
  let volumeUuid: string;
  let assetIds: string[] = [];

  beforeAll(async () => {
    // Create temporary database
    dbPath = path.join(os.tmpdir(), `zona21_stress_test_${Date.now()}.db`);
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Initialize schema (simplified version)
    db.exec(`
      CREATE TABLE IF NOT EXISTS volumes (
        uuid TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        mount_point TEXT,
        type TEXT NOT NULL,
        last_mounted_at INTEGER NOT NULL,
        status TEXT NOT NULL,
        hidden INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        volume_uuid TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        partial_hash TEXT NOT NULL,
        media_type TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        codec TEXT,
        container TEXT,
        frame_rate REAL,
        duration REAL,
        timecode_start TEXT,
        audio_channels INTEGER,
        audio_sample_rate INTEGER,
        camera_make TEXT,
        camera_model TEXT,
        lens TEXT,
        focal_length REAL,
        aperture REAL,
        shutter_speed TEXT,
        iso INTEGER,
        gps_latitude REAL,
        gps_longitude REAL,
        orientation INTEGER,
        color_space TEXT,
        rating INTEGER DEFAULT 0,
        color_label TEXT,
        flagged INTEGER DEFAULT 0,
        rejected INTEGER DEFAULT 0,
        marking_status TEXT DEFAULT 'unmarked',
        tags TEXT,
        notes TEXT,
        thumbnail_paths TEXT,
        waveform_path TEXT,
        proxy_path TEXT,
        full_res_preview_path TEXT,
        indexed_at INTEGER NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (volume_uuid) REFERENCES volumes(uuid)
      );

      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        smart_filter TEXT,
        asset_ids TEXT
      );

      CREATE TABLE IF NOT EXISTS collection_assets (
        collection_id TEXT NOT NULL,
        asset_id TEXT NOT NULL,
        added_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (collection_id, asset_id),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      );

      -- Performance indexes
      CREATE INDEX IF NOT EXISTS idx_assets_volume ON assets(volume_uuid);
      CREATE INDEX IF NOT EXISTS idx_assets_path ON assets(relative_path);
      CREATE INDEX IF NOT EXISTS idx_assets_rating ON assets(rating);
      CREATE INDEX IF NOT EXISTS idx_assets_created ON assets(created_at);
      CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(file_name);
      CREATE INDEX IF NOT EXISTS idx_assets_media_type ON assets(media_type);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_assets_marking_status ON assets(marking_status);
      CREATE INDEX IF NOT EXISTS idx_assets_volume_status_created ON assets(volume_uuid, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_assets_status_marking ON assets(status, marking_status);
      CREATE INDEX IF NOT EXISTS idx_collection_assets_collection ON collection_assets(collection_id);
      CREATE INDEX IF NOT EXISTS idx_collection_assets_asset ON collection_assets(asset_id);
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_assets_volume_path ON assets(volume_uuid, relative_path);
    `);

    // Create test volume
    volumeUuid = randomUUID();
    db.prepare(`
      INSERT INTO volumes (uuid, label, mount_point, type, last_mounted_at, status, hidden)
      VALUES (?, 'Test Volume', '/Volumes/Test', 'external', ?, 'online', 0)
    `).run(volumeUuid, Date.now());

    // Insert assets in batches
    console.log(`[Stress Test] Generating ${ASSET_COUNT} assets...`);
    const startTime = Date.now();

    const insertStmt = db.prepare(`
      INSERT INTO assets (
        id, volume_uuid, relative_path, file_name, file_size, partial_hash, media_type,
        width, height, created_at,
        codec, container, frame_rate, duration, timecode_start, audio_channels, audio_sample_rate,
        camera_make, camera_model, lens, focal_length, aperture, shutter_speed, iso,
        gps_latitude, gps_longitude, orientation, color_space,
        rating, color_label, flagged, rejected, marking_status, tags, notes,
        thumbnail_paths, waveform_path, proxy_path, full_res_preview_path,
        indexed_at, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `);

    const insertBatch = db.transaction((assets: any[]) => {
      for (const asset of assets) {
        insertStmt.run(
          asset.id, asset.volume_uuid, asset.relative_path, asset.file_name, asset.file_size, asset.partial_hash, asset.media_type,
          asset.width, asset.height, asset.created_at,
          asset.codec, asset.container, asset.frame_rate, asset.duration, asset.timecode_start, asset.audio_channels, asset.audio_sample_rate,
          asset.camera_make, asset.camera_model, asset.lens, asset.focal_length, asset.aperture, asset.shutter_speed, asset.iso,
          asset.gps_latitude, asset.gps_longitude, asset.orientation, asset.color_space,
          asset.rating, asset.color_label, asset.flagged, asset.rejected, asset.marking_status, asset.tags, asset.notes,
          asset.thumbnail_paths, asset.waveform_path, asset.proxy_path, asset.full_res_preview_path,
          asset.indexed_at, asset.status
        );
        assetIds.push(asset.id);
      }
    });

    // Generate and insert in batches
    for (let i = 0; i < ASSET_COUNT; i += BATCH_SIZE) {
      const batch = [];
      for (let j = 0; j < BATCH_SIZE && i + j < ASSET_COUNT; j++) {
        batch.push(generateAsset(i + j, volumeUuid));
      }
      insertBatch(batch);
    }

    const insertTime = Date.now() - startTime;
    const assetsPerSecond = (ASSET_COUNT / insertTime) * 1000;
    console.log(`[Stress Test] Inserted ${ASSET_COUNT} assets in ${insertTime}ms (${Math.round(assetsPerSecond)} assets/sec)`);

    // Generate collections
    generateCollections(db, assetIds);
    console.log('[Stress Test] Created test collections');
  });

  afterAll(() => {
    db.close();
    try {
      fs.unlinkSync(dbPath);
      fs.unlinkSync(dbPath + '-wal');
      fs.unlinkSync(dbPath + '-shm');
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Insert Performance', () => {
    it('should insert 1000 assets in under 1 second (60k/min rate)', () => {
      const startTime = Date.now();
      const insertStmt = db.prepare(`
        INSERT INTO assets (
          id, volume_uuid, relative_path, file_name, file_size, partial_hash, media_type,
          width, height, created_at, indexed_at, status, marking_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertBatch = db.transaction((count: number) => {
        for (let i = 0; i < count; i++) {
          const idx = ASSET_COUNT + i;
          insertStmt.run(
            randomUUID(),
            volumeUuid,
            `/perf_test/file_${idx}.jpg`,
            `perf_file_${idx}.jpg`,
            1000000,
            `perf_hash_${idx}`,
            'photo',
            4000,
            3000,
            Date.now(),
            Date.now(),
            'online',
            'unmarked'
          );
        }
      });

      insertBatch(1000);
      const duration = Date.now() - startTime;

      console.log(`[Stress Test] 1000 inserts completed in ${duration}ms`);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Query Performance', () => {
    it('should count all assets in under 100ms', () => {
      const start = Date.now();
      const result = db.prepare('SELECT COUNT(*) as count FROM assets').get() as { count: number };
      const duration = Date.now() - start;

      console.log(`[Stress Test] COUNT(*) = ${result.count} in ${duration}ms`);
      expect(result.count).toBeGreaterThanOrEqual(ASSET_COUNT);
      expect(duration).toBeLessThan(100);
    });

    it('should query assets page (100 items) with filters in under 500ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT * FROM assets
        WHERE status = 'online'
          AND volume_uuid = ?
        ORDER BY created_at DESC
        LIMIT 100 OFFSET 0
      `).all(volumeUuid);
      const duration = Date.now() - start;

      console.log(`[Stress Test] Page query (100 items) in ${duration}ms`);
      expect(result.length).toBe(100);
      expect(duration).toBeLessThan(500);
    });

    it('should query with rating filter in under 500ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT * FROM assets
        WHERE status = 'online'
          AND rating >= 3
        ORDER BY created_at DESC
        LIMIT 100
      `).all();
      const duration = Date.now() - start;

      console.log(`[Stress Test] Rating filter query in ${duration}ms (${result.length} results)`);
      expect(duration).toBeLessThan(500);
    });

    it('should query with marking status filter in under 500ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT * FROM assets
        WHERE status = 'online'
          AND marking_status IN ('approved', 'favorite')
        ORDER BY created_at DESC
        LIMIT 100
      `).all();
      const duration = Date.now() - start;

      console.log(`[Stress Test] Marking status filter query in ${duration}ms (${result.length} results)`);
      expect(duration).toBeLessThan(500);
    });

    it('should query with media type filter in under 500ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT * FROM assets
        WHERE status = 'online'
          AND media_type = 'video'
        ORDER BY created_at DESC
        LIMIT 100
      `).all();
      const duration = Date.now() - start;

      console.log(`[Stress Test] Media type filter query in ${duration}ms (${result.length} results)`);
      expect(duration).toBeLessThan(500);
    });

    it('should query collection assets via junction table in under 500ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT a.* FROM assets a
        JOIN collection_assets ca ON a.id = ca.asset_id
        WHERE ca.collection_id = ?
          AND a.status = 'online'
        ORDER BY a.created_at DESC
        LIMIT 100
      `).all('col_selects');
      const duration = Date.now() - start;

      console.log(`[Stress Test] Collection query (junction table) in ${duration}ms (${result.length} results)`);
      expect(duration).toBeLessThan(500);
    });

    it('should get marking counts in under 300ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT
          COUNT(CASE WHEN marking_status = 'favorite' THEN 1 END) as favorites,
          COUNT(CASE WHEN marking_status IN ('approved', 'favorite') THEN 1 END) as approved,
          COUNT(CASE WHEN marking_status = 'rejected' THEN 1 END) as rejected
        FROM assets
        WHERE status = 'online'
      `).get() as { favorites: number; approved: number; rejected: number };
      const duration = Date.now() - start;

      console.log(`[Stress Test] Marking counts in ${duration}ms: favorites=${result.favorites}, approved=${result.approved}, rejected=${result.rejected}`);
      expect(duration).toBeLessThan(300);
    });

    it('should find duplicate hashes in under 500ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT COUNT(*) as count
        FROM (
          SELECT partial_hash
          FROM assets
          WHERE media_type = 'photo'
            AND status = 'online'
            AND partial_hash IS NOT NULL
          GROUP BY partial_hash
          HAVING COUNT(*) >= 2
        )
      `).get() as { count: number };
      const duration = Date.now() - start;

      console.log(`[Stress Test] Duplicate detection in ${duration}ms (${result.count} clusters)`);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk update 1000 assets in under 500ms', () => {
      // Get 1000 random asset IDs
      const idsToUpdate = assetIds.slice(0, 1000);
      const placeholders = idsToUpdate.map(() => '?').join(',');

      const start = Date.now();
      db.prepare(`UPDATE assets SET rating = 5 WHERE id IN (${placeholders})`).run(...idsToUpdate);
      const duration = Date.now() - start;

      console.log(`[Stress Test] Bulk update 1000 assets in ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('should bulk update marking status for 1000 assets in under 500ms', () => {
      const idsToUpdate = assetIds.slice(1000, 2000);
      const placeholders = idsToUpdate.map(() => '?').join(',');

      const start = Date.now();
      db.prepare(`UPDATE assets SET marking_status = 'approved' WHERE id IN (${placeholders})`).run(...idsToUpdate);
      const duration = Date.now() - start;

      console.log(`[Stress Test] Bulk marking update 1000 assets in ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('should delete 500 assets in under 300ms', () => {
      const idsToDelete = assetIds.slice(9500, 10000);
      const placeholders = idsToDelete.map(() => '?').join(',');

      const start = Date.now();
      const result = db.prepare(`DELETE FROM assets WHERE id IN (${placeholders})`).run(...idsToDelete);
      const duration = Date.now() - start;

      console.log(`[Stress Test] Delete 500 assets in ${duration}ms (${result.changes} deleted)`);
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Complex Queries', () => {
    it('should handle combined filters in under 800ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT * FROM assets
        WHERE status = 'online'
          AND volume_uuid = ?
          AND media_type = 'photo'
          AND rating >= 3
          AND marking_status IN ('approved', 'favorite')
        ORDER BY created_at DESC
        LIMIT 100
      `).all(volumeUuid);
      const duration = Date.now() - start;

      console.log(`[Stress Test] Combined filters query in ${duration}ms (${result.length} results)`);
      expect(duration).toBeLessThan(800);
    });

    it('should handle date range filter in under 500ms', () => {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const start = Date.now();
      const result = db.prepare(`
        SELECT * FROM assets
        WHERE status = 'online'
          AND created_at >= ?
        ORDER BY created_at DESC
        LIMIT 100
      `).all(thirtyDaysAgo);
      const duration = Date.now() - start;

      console.log(`[Stress Test] Date range query in ${duration}ms (${result.length} results)`);
      expect(duration).toBeLessThan(500);
    });

    it('should aggregate by camera model in under 500ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT camera_model, COUNT(*) as count
        FROM assets
        WHERE status = 'online'
          AND camera_model IS NOT NULL
        GROUP BY camera_model
        ORDER BY count DESC
      `).all();
      const duration = Date.now() - start;

      console.log(`[Stress Test] Camera aggregation in ${duration}ms (${result.length} models)`);
      expect(duration).toBeLessThan(500);
    });

    it('should get collection statistics in under 500ms', () => {
      const start = Date.now();
      const result = db.prepare(`
        SELECT c.id, c.name, COUNT(ca.asset_id) as asset_count
        FROM collections c
        LEFT JOIN collection_assets ca ON c.id = ca.collection_id
        GROUP BY c.id
      `).all();
      const duration = Date.now() - start;

      console.log(`[Stress Test] Collection stats in ${duration}ms (${result.length} collections)`);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Pagination Performance', () => {
    it('should handle deep pagination (page 100) in under 800ms', () => {
      const offset = 100 * 100; // Page 100 with 100 items per page
      const start = Date.now();
      const result = db.prepare(`
        SELECT * FROM assets
        WHERE status = 'online'
        ORDER BY created_at DESC
        LIMIT 100 OFFSET ?
      `).all(offset);
      const duration = Date.now() - start;

      console.log(`[Stress Test] Deep pagination (offset ${offset}) in ${duration}ms`);
      // Note: Deep pagination is inherently slower, allow more time
      expect(duration).toBeLessThan(800);
    });

    it('should handle cursor-based pagination efficiently', () => {
      // Get a reference point
      const refRow = db.prepare(`
        SELECT created_at FROM assets
        WHERE status = 'online'
        ORDER BY created_at DESC
        LIMIT 1 OFFSET 5000
      `).get() as { created_at: number };

      const start = Date.now();
      const result = db.prepare(`
        SELECT * FROM assets
        WHERE status = 'online'
          AND created_at < ?
        ORDER BY created_at DESC
        LIMIT 100
      `).all(refRow.created_at);
      const duration = Date.now() - start;

      console.log(`[Stress Test] Cursor pagination in ${duration}ms`);
      expect(result.length).toBe(100);
      expect(duration).toBeLessThan(300); // Cursor should be faster
    });
  });
});
