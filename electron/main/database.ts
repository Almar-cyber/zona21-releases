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

      -- Junction table for collections (normalized)
      CREATE TABLE IF NOT EXISTS collection_assets (
        collection_id TEXT NOT NULL,
        asset_id TEXT NOT NULL,
        added_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (collection_id, asset_id),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_collection_assets_collection ON collection_assets(collection_id);
      CREATE INDEX IF NOT EXISTS idx_collection_assets_asset ON collection_assets(asset_id);

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

    // Normalizar volumes existentes: garantir hidden=0 quando nulo
    try {
      this.db.exec('UPDATE volumes SET hidden = 0 WHERE hidden IS NULL;');
    } catch {
      // ignore
    }

    // Migrate collections from JSON asset_ids to junction table
    this.migrateCollectionsToJunctionTable();

    // Add marking_status column for new marking system
    this.addMarkingStatusColumn();

    // Add AI columns
    this.addAIColumns();
  }

  private addAIColumns() {
    try {
      this.db.exec("ALTER TABLE assets ADD COLUMN ai_embedding BLOB;");
      console.log('[DB Migration] Added ai_embedding column');
    } catch {
      // ignore
    }

    try {
      this.db.exec("ALTER TABLE assets ADD COLUMN ai_processed_at INTEGER;");
      console.log('[DB Migration] Added ai_processed_at column');
    } catch {
      // ignore
    }

    // Tabela para faces detectadas
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS faces (
          id TEXT PRIMARY KEY,
          asset_id TEXT NOT NULL,
          bbox_x REAL NOT NULL,
          bbox_y REAL NOT NULL,
          bbox_width REAL NOT NULL,
          bbox_height REAL NOT NULL,
          confidence REAL NOT NULL,
          embedding BLOB,
          person_id TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_faces_asset ON faces(asset_id);
        CREATE INDEX IF NOT EXISTS idx_faces_person ON faces(person_id);
      `);
      console.log('[DB Migration] Created faces table');
    } catch {
      // ignore
    }

    // Tabela para pessoas (clusters de faces)
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS people (
          id TEXT PRIMARY KEY,
          name TEXT,
          representative_face_id TEXT,
          face_count INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      console.log('[DB Migration] Created people table');
    } catch {
      // ignore
    }
  }

  private addMarkingStatusColumn() {
    try {
      // Add marking_status column: 'unmarked' | 'approved' | 'favorite' | 'rejected'
      this.db.exec("ALTER TABLE assets ADD COLUMN marking_status TEXT DEFAULT 'unmarked';");
      console.log('[DB Migration] Added marking_status column');

      // Migrate existing flagged assets to 'approved'
      const migrateResult = this.db.prepare("UPDATE assets SET marking_status = 'approved' WHERE flagged = 1 AND marking_status = 'unmarked'").run();
      if (migrateResult.changes > 0) {
        console.log(`[DB Migration] Migrated ${migrateResult.changes} flagged assets to approved status`);
      }

      // Migrate existing rejected assets
      const rejectResult = this.db.prepare("UPDATE assets SET marking_status = 'rejected' WHERE rejected = 1 AND marking_status IN ('unmarked', 'approved')").run();
      if (rejectResult.changes > 0) {
        console.log(`[DB Migration] Migrated ${rejectResult.changes} rejected assets`);
      }
    } catch {
      // Column already exists, ignore
    }

    // Create index for marking_status
    try {
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_assets_marking_status ON assets(marking_status);');
    } catch {
      // ignore
    }
  }

  private migrateCollectionsToJunctionTable() {
    try {
      // Check if migration is needed (junction table exists but may be empty)
      const countRow = this.db.prepare('SELECT COUNT(*) as count FROM collection_assets').get() as any;
      if (countRow.count > 0) {
        // Already migrated
        return;
      }

      // Get all collections with asset_ids
      const collections = this.db.prepare("SELECT id, asset_ids FROM collections WHERE asset_ids IS NOT NULL AND asset_ids != ''").all() as any[];
      
      if (collections.length === 0) {
        return;
      }

      console.log(`[DB Migration] Migrating ${collections.length} collections to junction table...`);

      const insertStmt = this.db.prepare('INSERT OR IGNORE INTO collection_assets (collection_id, asset_id) VALUES (?, ?)');
      
      const migrate = this.db.transaction(() => {
        let totalAssets = 0;
        for (const coll of collections) {
          try {
            const assetIds = JSON.parse(coll.asset_ids || '[]');
            for (const assetId of assetIds) {
              insertStmt.run(coll.id, assetId);
              totalAssets++;
            }
          } catch {
            // Skip malformed JSON
          }
        }
        console.log(`[DB Migration] Migrated ${totalAssets} asset references to junction table.`);
      });

      migrate();
    } catch (err) {
      console.error('[DB Migration] Error migrating collections:', err);
    }
  }

  getDatabase() {
    if (!this.db || !this.db.open) {
      this.reinitialize();
    }
    return this.db;
  }

  private reinitialize() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  close() {
    if (this.db && this.db.open) {
      this.db.close();
    }
  }
}

export const dbService = new DatabaseService();
