import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexerService } from './indexer';
import { createTestFileSystem } from '../test/helpers/fixtures';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('./database', () => ({
  dbService: {
    getDatabase: vi.fn(() => ({
      prepare: vi.fn(() => ({
        run: vi.fn(),
        get: vi.fn()
      }))
    }))
  }
}));

vi.mock('fluent-ffmpeg', () => ({
  default: vi.fn()
}));

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('exiftool-vendored', () => ({
  exiftool: {
    read: vi.fn().mockResolvedValue({}),
    end: vi.fn()
  }
}));

vi.mock('./binary-paths', () => ({
  getFfmpegPath: vi.fn(() => '/usr/bin/ffmpeg'),
  getFfprobePath: vi.fn(() => '/usr/bin/ffprobe'),
  logBinaryPaths: vi.fn()
}));

describe('IndexerService', () => {
  let indexer: IndexerService;
  let testFs: ReturnType<typeof createTestFileSystem>;
  let cacheDir: string;

  beforeEach(() => {
    testFs = createTestFileSystem();
    const baseDir = testFs.create();
    cacheDir = path.join(baseDir, 'cache');
    indexer = new IndexerService(cacheDir);
  });

  afterEach(() => {
    testFs.cleanup();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create cache directory if it does not exist', () => {
      expect(fs.existsSync(cacheDir)).toBe(true);
    });

    it('should not throw if cache directory already exists', () => {
      expect(() => {
        new IndexerService(cacheDir);
      }).not.toThrow();
    });
  });

  describe('scanDirectory', () => {
    it('should find video files in directory', async () => {
      const testDir = testFs.getPath();
      testFs.createFile('video1.mp4', 'video content');
      testFs.createFile('video2.mov', 'video content');
      testFs.createFile('readme.txt', 'text content'); // Should be ignored

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(2);
      expect(files.some(f => f.endsWith('video1.mp4'))).toBe(true);
      expect(files.some(f => f.endsWith('video2.mov'))).toBe(true);
      expect(files.some(f => f.endsWith('readme.txt'))).toBe(false);
    });

    it('should find photo files in directory', async () => {
      const testDir = testFs.getPath();
      testFs.createFile('photo1.jpg', 'image content');
      testFs.createFile('photo2.png', 'image content');
      testFs.createFile('raw.cr2', 'raw image');

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(3);
      expect(files.some(f => f.endsWith('photo1.jpg'))).toBe(true);
      expect(files.some(f => f.endsWith('photo2.png'))).toBe(true);
      expect(files.some(f => f.endsWith('raw.cr2'))).toBe(true);
    });

    it('should scan nested directories recursively', async () => {
      const testDir = testFs.getPath();
      testFs.createDirectory('subfolder');
      testFs.createDirectory('subfolder/nested');
      testFs.createFile('video.mp4', 'video');
      testFs.createFile('subfolder/photo.jpg', 'photo');
      testFs.createFile('subfolder/nested/movie.mov', 'movie');

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(3);
    });

    it('should ignore hidden files starting with dot', async () => {
      const testDir = testFs.getPath();
      testFs.createFile('.hidden.mp4', 'hidden video');
      testFs.createFile('visible.mp4', 'visible video');

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('visible.mp4');
      expect(files.some(f => f.includes('.hidden'))).toBe(false);
    });

    it('should ignore macOS metadata files starting with ._', async () => {
      const testDir = testFs.getPath();
      testFs.createFile('._metadata.mp4', 'metadata');
      testFs.createFile('normal.mp4', 'video');

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('normal.mp4');
    });

    it('should return empty array for empty directory', async () => {
      const testDir = testFs.getPath();

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(0);
    });

    it('should handle directory with only non-media files', async () => {
      const testDir = testFs.getPath();
      testFs.createFile('document.pdf', 'pdf content');
      testFs.createFile('text.txt', 'text content');
      testFs.createFile('script.js', 'javascript code');

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(0);
    });

    it('should handle case-insensitive file extensions', async () => {
      const testDir = testFs.getPath();
      testFs.createFile('video.MP4', 'video');
      testFs.createFile('photo.JPG', 'photo');
      testFs.createFile('movie.MoV', 'movie');

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(3);
    });
  });

  describe('Media Type Detection', () => {
    it('should recognize all video extensions', async () => {
      const testDir = testFs.getPath();
      const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.mxf', '.m4v', '.mpg', '.mpeg'];

      videoExts.forEach((ext, i) => {
        testFs.createFile(`video${i}${ext}`, 'video');
      });

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(videoExts.length);
    });

    it('should recognize all photo extensions', async () => {
      const testDir = testFs.getPath();
      const photoExts = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.cr2', '.cr3', '.arw', '.nef', '.dng', '.heic', '.heif'];

      photoExts.forEach((ext, i) => {
        testFs.createFile(`photo${i}${ext}`, 'photo');
      });

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(photoExts.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent directory gracefully', async () => {
      const nonExistentDir = path.join(testFs.getPath(), 'does-not-exist');

      await expect(indexer.scanDirectory(nonExistentDir)).rejects.toThrow();
    });

    it('should handle permission errors gracefully', async () => {
      const testDir = testFs.getPath();
      const restrictedDir = path.join(testDir, 'restricted');

      testFs.createDirectory('restricted');

      // Mock readdir to simulate permission error
      const originalReaddir = fs.promises.readdir;
      vi.spyOn(fs.promises, 'readdir').mockImplementation((dirPath: any) => {
        if (dirPath === restrictedDir) {
          return Promise.reject(new Error('EACCES: permission denied'));
        }
        return originalReaddir(dirPath, { withFileTypes: true } as any);
      });

      await expect(indexer.scanDirectory(restrictedDir)).rejects.toThrow();

      vi.restoreAllMocks();
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle directory with many files', async () => {
      const testDir = testFs.getPath();

      // Create 100 files
      for (let i = 0; i < 100; i++) {
        const ext = i % 2 === 0 ? '.mp4' : '.jpg';
        testFs.createFile(`file${i}${ext}`, `content ${i}`);
      }

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(100);
    });

    it('should handle deeply nested directory structure', async () => {
      const testDir = testFs.getPath();

      // Create deeply nested structure
      let currentPath = 'level1';
      testFs.createDirectory(currentPath);

      for (let i = 2; i <= 10; i++) {
        currentPath = `${currentPath}/level${i}`;
        testFs.createDirectory(currentPath);
      }

      testFs.createFile(`${currentPath}/deep.mp4`, 'deep video');

      const files = await indexer.scanDirectory(testDir);

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('deep.mp4');
    });
  });
});
