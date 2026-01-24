import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export interface TestFileFixture {
  path: string;
  name: string;
  size: number;
  content: string;
}

export class TestFileSystem {
  private tempDir: string | null = null;

  create(): string {
    this.tempDir = mkdtempSync(join(tmpdir(), 'zona21-fs-test-'));
    return this.tempDir;
  }

  createFile(relativePath: string, content: string = 'test content'): TestFileFixture {
    if (!this.tempDir) {
      throw new Error('TestFileSystem not initialized. Call create() first.');
    }

    const fullPath = join(this.tempDir, relativePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

    if (dir !== this.tempDir) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(fullPath, content, 'utf-8');

    return {
      path: fullPath,
      name: relativePath.split('/').pop() || relativePath,
      size: Buffer.byteLength(content, 'utf-8'),
      content
    };
  }

  createDirectory(relativePath: string): string {
    if (!this.tempDir) {
      throw new Error('TestFileSystem not initialized. Call create() first.');
    }

    const fullPath = join(this.tempDir, relativePath);
    mkdirSync(fullPath, { recursive: true });
    return fullPath;
  }

  getPath(): string {
    if (!this.tempDir) {
      throw new Error('TestFileSystem not initialized. Call create() first.');
    }
    return this.tempDir;
  }

  cleanup(): void {
    if (this.tempDir) {
      const { rmSync } = require('fs');
      rmSync(this.tempDir, { recursive: true, force: true });
      this.tempDir = null;
    }
  }
}

export function createTestFileSystem(): TestFileSystem {
  return new TestFileSystem();
}
