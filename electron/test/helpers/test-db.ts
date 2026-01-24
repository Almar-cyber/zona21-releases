import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export class TestDatabase {
  private tempDir: string | null = null;
  public db: Database.Database | null = null;

  async create(): Promise<Database.Database> {
    this.tempDir = mkdtempSync(join(tmpdir(), 'zona21-test-'));
    const dbPath = join(this.tempDir, 'test.db');
    this.db = new Database(dbPath);
    return this.db;
  }

  async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    if (this.tempDir) {
      rmSync(this.tempDir, { recursive: true, force: true });
      this.tempDir = null;
    }
  }
}

export function createTestDb(): TestDatabase {
  return new TestDatabase();
}
