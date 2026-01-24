import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

const DB_DIR = app.getPath('userData');
const DB_PATH = path.join(DB_DIR, 'zona21.db');
const LEGACY_DB_PATH = path.join(DB_DIR, 'mediahub.db');

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    // Ensure directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Migrate legacy DB filename (dev/beta installs) so we don't lose local data.
    if (!fs.existsSync(DB_PATH) && fs.existsSync(LEGACY_DB_PATH)) {
      try {
        fs.copyFileSync(LEGACY_DB_PATH, DB_PATH);
      } catch {
        // ignore
      }
    }

    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS volumes (
        uuid TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        mount_point TEXT,
        type TEXT NOT NULL,
        last_mounted_at INTEGER NOT NULL,
        status TEXT NOT NULL
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
        
        -- Video metadata
        codec TEXT,
        container TEXT,
        frame_rate REAL,
        duration REAL,
        timecode_start TEXT,
        audio_channels INTEGER,
        audio_sample_rate INTEGER,
        
        -- Photo metadata
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
        
        -- Decision metadata
        rating INTEGER DEFAULT 0,
        color_label TEXT,
        flagged INTEGER DEFAULT 0,
        rejected INTEGER DEFAULT 0,
        tags TEXT,
        notes TEXT,
        
        -- Cache paths
        thumbnail_paths TEXT,
        waveform_path TEXT,
        proxy_path TEXT,
        full_res_preview_path TEXT,
        
        -- State
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

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_assets_volume ON assets(volume_uuid);
      CREATE INDEX IF NOT EXISTS idx_assets_path ON assets(relative_path);
      CREATE INDEX IF NOT EXISTS idx_assets_rating ON assets(rating);
      CREATE INDEX IF NOT EXISTS idx_assets_created ON assets(created_at);
      CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(file_name);
      CREATE INDEX IF NOT EXISTS idx_assets_media_type ON assets(media_type);
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_markers_asset ON markers(asset_id);

      -- Full-text search
      CREATE VIRTUAL TABLE IF NOT EXISTS assets_fts USING fts5(
        file_name,
        tags,
        notes,
        content=assets,
        content_rowid=rowid
      );
    `);

    // De-duplicate legacy rows before applying uniqueness constraint.
    try {
      this.db.exec(`
        WITH ranked AS (
          SELECT
            rowid,
            ROW_NUMBER() OVER (
              PARTITION BY volume_uuid, relative_path
              ORDER BY indexed_at DESC, rowid DESC
            ) AS rn
          FROM assets
        )
        DELETE FROM assets
        WHERE rowid IN (SELECT rowid FROM ranked WHERE rn > 1);
      `);
    } catch {
      // ignore
    }

    // Prevent duplicates when indexing the same folder multiple times.
    try {
      this.db.exec('CREATE UNIQUE INDEX IF NOT EXISTS uniq_assets_volume_path ON assets(volume_uuid, relative_path);');
    } catch {
      // ignore
    }

    try {
      this.db.exec('ALTER TABLE volumes ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0;');
    } catch {
      // ignore if already exists
    }
  }

  getDatabase() {
    return this.db;
  }

  close() {
    this.db.close();
  }
}

export const dbService = new DatabaseService();
