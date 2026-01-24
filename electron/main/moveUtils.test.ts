import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ensureUniquePath, normalizePathPrefix } from './moveUtils';

describe('moveUtils', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'zona21-move-test-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('normalizePathPrefix', () => {
    it('trims leading/trailing slashes', () => {
      expect(normalizePathPrefix('')).toBe('');
      expect(normalizePathPrefix('/')).toBe('');
      expect(normalizePathPrefix('///')).toBe('');
      expect(normalizePathPrefix('/a/b/')).toBe('a/b');
      expect(normalizePathPrefix('a/b')).toBe('a/b');
      expect(normalizePathPrefix('///a/b///')).toBe('a/b');
    });

    it('handles single directory names', () => {
      expect(normalizePathPrefix('folder')).toBe('folder');
      expect(normalizePathPrefix('/folder')).toBe('folder');
      expect(normalizePathPrefix('folder/')).toBe('folder');
    });

    it('handles nested paths', () => {
      expect(normalizePathPrefix('/a/b/c/d')).toBe('a/b/c/d');
      expect(normalizePathPrefix('a/b/c/d/')).toBe('a/b/c/d');
    });

    it('handles paths with spaces', () => {
      expect(normalizePathPrefix('/my folder/sub folder/')).toBe('my folder/sub folder');
    });

    it('handles paths with special characters', () => {
      expect(normalizePathPrefix('/folder-name_123/')).toBe('folder-name_123');
    });

    it('preserves internal slashes', () => {
      expect(normalizePathPrefix('/a/b/c/')).toBe('a/b/c');
    });
  });

  describe('ensureUniquePath', () => {
    describe('Basic Functionality', () => {
      it('returns original name when unused', async () => {
        const candidate = await ensureUniquePath(tempDir, 'file.txt');
        expect(candidate).toBe(path.join(tempDir, 'file.txt'));
      });

      it('appends (1) when file exists', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'file.txt'), 'content');
        const candidate = await ensureUniquePath(tempDir, 'file.txt');
        expect(candidate).toBe(path.join(tempDir, 'file (1).txt'));
      });

      it('appends (2) when file and file (1) exist', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'file.txt'), 'x');
        await fs.promises.writeFile(path.join(tempDir, 'file (1).txt'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'file.txt');
        expect(candidate).toBe(path.join(tempDir, 'file (2).txt'));
      });

      it('handles multiple sequential duplicates', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'file.txt'), 'x');
        await fs.promises.writeFile(path.join(tempDir, 'file (1).txt'), 'x');
        await fs.promises.writeFile(path.join(tempDir, 'file (2).txt'), 'x');
        await fs.promises.writeFile(path.join(tempDir, 'file (3).txt'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'file.txt');
        expect(candidate).toBe(path.join(tempDir, 'file (4).txt'));
      });
    });

    describe('File Extensions', () => {
      it('preserves file extension', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'image.jpg'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'image.jpg');
        expect(candidate).toBe(path.join(tempDir, 'image (1).jpg'));
      });

      it('handles files with no extension', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'image'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'image');
        expect(candidate).toBe(path.join(tempDir, 'image (1)'));
      });

      it('handles multiple dots in filename', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'archive.tar.gz'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'archive.tar.gz');
        expect(candidate).toBe(path.join(tempDir, 'archive.tar (1).gz'));
      });

      it('handles dot files (hidden files)', async () => {
        await fs.promises.writeFile(path.join(tempDir, '.gitignore'), 'x');
        const candidate = await ensureUniquePath(tempDir, '.gitignore');
        expect(candidate).toBe(path.join(tempDir, '.gitignore (1)'));
      });
    });

    describe('Edge Cases', () => {
      it('handles files with spaces in name', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'my file.txt'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'my file.txt');
        expect(candidate).toBe(path.join(tempDir, 'my file (1).txt'));
      });

      it('handles files with special characters', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'file-name_123.txt'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'file-name_123.txt');
        expect(candidate).toBe(path.join(tempDir, 'file-name_123 (1).txt'));
      });

      it('handles very long filenames', async () => {
        const longName = 'a'.repeat(200) + '.txt';
        await fs.promises.writeFile(path.join(tempDir, longName), 'x');
        const candidate = await ensureUniquePath(tempDir, longName);
        expect(candidate).toContain('(1).txt');
      });

      it('handles files with parentheses in original name', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'file (test).txt'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'file (test).txt');
        expect(candidate).toBe(path.join(tempDir, 'file (test) (1).txt'));
      });

      it('handles Unicode characters in filename', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'arquivo-português.txt'), 'x');
        const candidate = await ensureUniquePath(tempDir, 'arquivo-português.txt');
        expect(candidate).toBe(path.join(tempDir, 'arquivo-português (1).txt'));
      });
    });

    describe('Directory Handling', () => {
      it('works with nested directory paths', async () => {
        const subDir = path.join(tempDir, 'subfolder');
        await fs.promises.mkdir(subDir);
        await fs.promises.writeFile(path.join(subDir, 'file.txt'), 'x');
        const candidate = await ensureUniquePath(subDir, 'file.txt');
        expect(candidate).toBe(path.join(subDir, 'file (1).txt'));
      });

      it('returns original path when directory is empty', async () => {
        const subDir = path.join(tempDir, 'empty');
        await fs.promises.mkdir(subDir);
        const candidate = await ensureUniquePath(subDir, 'file.txt');
        expect(candidate).toBe(path.join(subDir, 'file.txt'));
      });
    });

    describe('Performance', () => {
      it('handles gaps in numbering sequence', async () => {
        await fs.promises.writeFile(path.join(tempDir, 'file.txt'), 'x');
        await fs.promises.writeFile(path.join(tempDir, 'file (1).txt'), 'x');
        // Skip (2)
        await fs.promises.writeFile(path.join(tempDir, 'file (3).txt'), 'x');

        const candidate = await ensureUniquePath(tempDir, 'file.txt');
        // Should find the first available number (2)
        expect(candidate).toBe(path.join(tempDir, 'file (2).txt'));
      });
    });
  });
});
