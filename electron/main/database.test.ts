import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { createTestDb } from '../test/helpers/test-db';
import path from 'path';
import os from 'os';
import fs from 'fs';

describe('Database Schema and Operations', () => {
  let testDb: ReturnType<typeof createTestDb>;
  let db: Database.Database;

  beforeEach(async () => {
    testDb = createTestDb();
    db = await testDb.create();

    // Initialize schema manually (similar to DatabaseService.initSchema)
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

      CREATE TABLE IF NOT EXISTS markers (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        timecode REAL NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ingest_jobs (
        id TEXT PRIMARY KEY,
        source_volume TEXT NOT NULL,
        dest_path TEXT NOT NULL,
        files TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at INTEGER,
        completed_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_assets_volume ON assets(volume_uuid);
      CREATE INDEX IF NOT EXISTS idx_assets_path ON assets(relative_path);
      CREATE INDEX IF NOT EXISTS idx_assets_rating ON assets(rating);
      CREATE INDEX IF NOT EXISTS idx_assets_created ON assets(created_at);
      CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(file_name);
      CREATE INDEX IF NOT EXISTS idx_assets_media_type ON assets(media_type);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_markers_asset ON markers(asset_id);

      CREATE UNIQUE INDEX IF NOT EXISTS uniq_assets_volume_path ON assets(volume_uuid, relative_path);
    `);

    db.pragma('journal_mode = WAL');
  });

  afterEach(async () => {
    if (db) {
      db.close();
    }
    await testDb.cleanup();
  });

  describe('Schema Creation', () => {
    it('should create volumes table with correct schema', () => {
      const tableInfo = db.prepare("PRAGMA table_info(volumes)").all() as any[];
      const columnNames = tableInfo.map(col => col.name);

      expect(columnNames).toContain('uuid');
      expect(columnNames).toContain('label');
      expect(columnNames).toContain('mount_point');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('last_mounted_at');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('hidden');
    });

    it('should create assets table with correct schema', () => {
      const tableInfo = db.prepare("PRAGMA table_info(assets)").all() as any[];
      const columnNames = tableInfo.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('volume_uuid');
      expect(columnNames).toContain('relative_path');
      expect(columnNames).toContain('file_name');
      expect(columnNames).toContain('partial_hash');
      expect(columnNames).toContain('media_type');
    });

    it('should create collections table', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='collections'").all();
      expect(tables).toHaveLength(1);
    });

    it('should create markers table with foreign key', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='markers'").all();
      expect(tables).toHaveLength(1);
    });

    it('should create ingest_jobs table', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ingest_jobs'").all();
      expect(tables).toHaveLength(1);
    });

    it('should create performance indexes', () => {
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as any[];
      const indexNames = indexes.map(idx => idx.name);

      expect(indexNames).toContain('idx_assets_volume');
      expect(indexNames).toContain('idx_assets_path');
      expect(indexNames).toContain('idx_assets_rating');
      expect(indexNames).toContain('idx_assets_created');
      expect(indexNames).toContain('idx_assets_name');
      expect(indexNames).toContain('idx_assets_media_type');
    });

    it('should create unique index on volume_uuid and relative_path', () => {
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='uniq_assets_volume_path'").all();
      expect(indexes).toHaveLength(1);
    });

    it('should set WAL journal mode', () => {
      const journalMode = db.pragma('journal_mode', { simple: true });
      expect(journalMode).toBe('wal');
    });
  });

  describe('Database Operations', () => {
    it('should insert volume without errors', () => {
      const stmt = db.prepare(`
        INSERT INTO volumes (uuid, label, mount_point, type, last_mounted_at, status, hidden)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      expect(() => {
        stmt.run('test-uuid', 'Test Volume', '/mnt/test', 'local', Date.now(), 'mounted', 0);
      }).not.toThrow();
    });

    it('should insert asset without errors', () => {
      // First insert a volume
      db.prepare(`
        INSERT INTO volumes (uuid, label, mount_point, type, last_mounted_at, status, hidden)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('vol-uuid', 'Volume', '/mnt/vol', 'local', Date.now(), 'mounted', 0);

      // Then insert an asset
      const stmt = db.prepare(`
        INSERT INTO assets (
          id, volume_uuid, relative_path, file_name, file_size,
          partial_hash, media_type, width, height, created_at,
          indexed_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      expect(() => {
        stmt.run(
          'asset-1', 'vol-uuid', '/test/file.mp4', 'file.mp4', 1024,
          'hash123', 'video', 1920, 1080, Date.now(),
          Date.now(), 'ready'
        );
      }).not.toThrow();
    });

    it('should enforce unique constraint on volume_uuid and relative_path', () => {
      // Insert volume
      db.prepare(`
        INSERT INTO volumes (uuid, label, mount_point, type, last_mounted_at, status, hidden)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('vol-uuid', 'Volume', '/mnt/vol', 'local', Date.now(), 'mounted', 0);

      // Insert first asset
      const stmt = db.prepare(`
        INSERT INTO assets (
          id, volume_uuid, relative_path, file_name, file_size,
          partial_hash, media_type, width, height, created_at,
          indexed_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        'asset-1', 'vol-uuid', '/test/file.mp4', 'file.mp4', 1024,
        'hash123', 'video', 1920, 1080, Date.now(),
        Date.now(), 'ready'
      );

      // Try to insert duplicate with same volume_uuid and relative_path
      expect(() => {
        stmt.run(
          'asset-2', 'vol-uuid', '/test/file.mp4', 'file.mp4', 1024,
          'hash456', 'video', 1920, 1080, Date.now(),
          Date.now(), 'ready'
        );
      }).toThrow();
    });

    it('should cascade delete markers when asset is deleted', () => {
      // Insert volume and asset
      db.prepare(`
        INSERT INTO volumes (uuid, label, mount_point, type, last_mounted_at, status, hidden)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('vol-uuid', 'Volume', '/mnt/vol', 'local', Date.now(), 'mounted', 0);

      db.prepare(`
        INSERT INTO assets (
          id, volume_uuid, relative_path, file_name, file_size,
          partial_hash, media_type, width, height, created_at,
          indexed_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'asset-1', 'vol-uuid', '/test/file.mp4', 'file.mp4', 1024,
        'hash123', 'video', 1920, 1080, Date.now(),
        Date.now(), 'ready'
      );

      // Insert marker
      db.prepare(`
        INSERT INTO markers (id, asset_id, timecode, name, color)
        VALUES (?, ?, ?, ?, ?)
      `).run('marker-1', 'asset-1', 10.5, 'Test Marker', 'red');

      // Verify marker exists
      let markers = db.prepare('SELECT * FROM markers WHERE asset_id = ?').all('asset-1');
      expect(markers).toHaveLength(1);

      // Delete asset
      db.prepare('DELETE FROM assets WHERE id = ?').run('asset-1');

      // Verify marker was cascade deleted
      markers = db.prepare('SELECT * FROM markers WHERE asset_id = ?').all('asset-1');
      expect(markers).toHaveLength(0);
    });
  });
});
