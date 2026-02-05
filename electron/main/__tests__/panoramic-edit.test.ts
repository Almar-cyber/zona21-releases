/**
 * Unit tests for PanoramicEditService
 *
 * Note: Full integration tests require actual 360° video/photo files.
 * These tests focus on helper methods and validation logic.
 * For integration testing, see manual testing procedures in ROADMAP.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PanoramicEditService } from '../panoramic-edit';
import path from 'path';
import os from 'os';
import fs from 'fs';

describe('PanoramicEditService', () => {
  let service: PanoramicEditService;
  let tempDir: string;

  beforeEach(() => {
    // Create temp directory for tests
    tempDir = path.join(os.tmpdir(), `panoramic-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    service = new PanoramicEditService(tempDir);
  });

  afterEach(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('getOutputDimensions', () => {
    it('should return correct dimensions for 16:9 aspect ratio', () => {
      const dimensions = (service as any).getOutputDimensions('16:9');
      expect(dimensions).toEqual({ width: 1920, height: 1080 });
    });

    it('should return correct dimensions for 9:16 aspect ratio (vertical)', () => {
      const dimensions = (service as any).getOutputDimensions('9:16');
      expect(dimensions).toEqual({ width: 1080, height: 1920 });
    });

    it('should return correct dimensions for 1:1 aspect ratio (square)', () => {
      const dimensions = (service as any).getOutputDimensions('1:1');
      expect(dimensions).toEqual({ width: 1080, height: 1080 });
    });

    it('should return correct dimensions for 4:3 aspect ratio', () => {
      const dimensions = (service as any).getOutputDimensions('4:3');
      expect(dimensions).toEqual({ width: 1600, height: 1200 });
    });

    it('should default to 16:9 for unknown aspect ratio', () => {
      const dimensions = (service as any).getOutputDimensions('unknown' as any);
      expect(dimensions).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('validateReframeOptions', () => {
    it('should accept valid reframe options', () => {
      const options = {
        outputProjection: 'flat' as const,
        outputAspectRatio: '16:9' as const,
        fov: 90,
        yaw: 0,
        pitch: 0,
        roll: 0
      };
      expect(() => (service as any).validateReframeOptions(options)).not.toThrow();
    });

    it('should throw for invalid FOV (too low)', () => {
      const options = {
        outputProjection: 'flat' as const,
        outputAspectRatio: '16:9' as const,
        fov: 30, // Below minimum of 60
        yaw: 0,
        pitch: 0,
        roll: 0
      };
      expect(() => (service as any).validateReframeOptions(options)).toThrow('FOV must be between 60 and 120');
    });

    it('should throw for invalid FOV (too high)', () => {
      const options = {
        outputProjection: 'flat' as const,
        outputAspectRatio: '16:9' as const,
        fov: 150, // Above maximum of 120
        yaw: 0,
        pitch: 0,
        roll: 0
      };
      expect(() => (service as any).validateReframeOptions(options)).toThrow('FOV must be between 60 and 120');
    });

    it('should throw for invalid yaw', () => {
      const options = {
        outputProjection: 'flat' as const,
        outputAspectRatio: '16:9' as const,
        fov: 90,
        yaw: 200, // Out of -180 to 180 range
        pitch: 0,
        roll: 0
      };
      expect(() => (service as any).validateReframeOptions(options)).toThrow('Yaw must be between -180 and 180');
    });

    it('should throw for invalid pitch', () => {
      const options = {
        outputProjection: 'flat' as const,
        outputAspectRatio: '16:9' as const,
        fov: 90,
        yaw: 0,
        pitch: 100, // Out of -90 to 90 range
        roll: 0
      };
      expect(() => (service as any).validateReframeOptions(options)).toThrow('Pitch must be between -90 and 90');
    });
  });

  describe('parseFrameRate', () => {
    it('should parse fractional frame rate (e.g., "30000/1001")', () => {
      const frameRate = (service as any).parseFrameRate('30000/1001');
      expect(frameRate).toBeCloseTo(29.97, 2);
    });

    it('should parse integer fractional format (e.g., "30/1")', () => {
      const frameRate = (service as any).parseFrameRate('30/1');
      expect(frameRate).toBe(30);
    });

    it('should return 0 for non-fractional format', () => {
      // parseFrameRate only handles "num/den" format, not plain integers
      const frameRate = (service as any).parseFrameRate('30');
      expect(frameRate).toBe(0);
    });

    it('should return 0 for invalid frame rate', () => {
      const frameRate = (service as any).parseFrameRate('invalid');
      expect(frameRate).toBe(0);
    });
  });

  describe('parseTimemark', () => {
    it('should parse timemark in HH:MM:SS.mmm format', () => {
      const seconds = (service as any).parseTimemark('00:01:30.500');
      expect(seconds).toBe(90.5);
    });

    it('should parse timemark with hours', () => {
      const seconds = (service as any).parseTimemark('01:30:15.250');
      expect(seconds).toBe(5415.25); // 1h 30m 15.25s
    });

    it('should handle zero time', () => {
      const seconds = (service as any).parseTimemark('00:00:00.000');
      expect(seconds).toBe(0);
    });

    it('should return 0 for invalid format (MM:SS)', () => {
      // parseTimemark requires HH:MM:SS format (3 parts), not MM:SS (2 parts)
      const seconds = (service as any).parseTimemark('01:30.250');
      expect(seconds).toBe(0);
    });

    it('should return 0 for invalid timemark', () => {
      const seconds = (service as any).parseTimemark('invalid');
      expect(seconds).toBe(0);
    });
  });

  describe('Integration test placeholders', () => {
    it.skip('should reframe 360 video to flat 16:9', async () => {
      // Requires actual .insv or equirectangular video file
      // Test with: npm test -- --run panoramic-edit.test.ts --grep "should reframe"
      // Supply test asset via environment variable or fixture directory
    });

    it.skip('should stabilize 360 video using vidstab', async () => {
      // Requires actual video file with camera shake
      // Verify output video is smoother than input
    });

    it.skip('should extract 360 metadata from .insv file', async () => {
      // Requires actual .insv file with metadata
      // Should detect equirectangular projection, resolution, etc.
    });

    it.skip('should reframe 360 photo to flat JPEG', async () => {
      // Requires actual .insp file
      // Should output flat JPEG with specified orientation
    });

    it.skip('should link LRV to master MP4 file', async () => {
      // Requires GoPro file pair (GX010001.LRV + GX010001.MP4)
      // Should return master asset information
    });

    it.skip('should handle invalid asset ID gracefully', async () => {
      // Test error handling for non-existent asset
    });

    it.skip('should handle non-360 video gracefully', async () => {
      // Test error handling when trying to reframe regular video
    });
  });
});

describe('PanoramicEditService - Error Handling', () => {
  let service: PanoramicEditService;
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `panoramic-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    service = new PanoramicEditService(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should throw error for non-existent asset', async () => {
    await expect(
      service.reframe360ToFlat('non-existent-asset-id', {
        outputProjection: 'flat',
        outputAspectRatio: '16:9',
        fov: 90,
        yaw: 0,
        pitch: 0,
        roll: 0
      })
    ).rejects.toThrow();
  });

  it('should throw error for invalid roll', () => {
    const options = {
      outputProjection: 'flat' as const,
      outputAspectRatio: '16:9' as const,
      fov: 90,
      yaw: 0,
      pitch: 0,
      roll: 200 // Out of -180 to 180 range
    };

    expect(() => (service as any).validateReframeOptions(options)).toThrow('Roll must be between -180 and 180');
  });
});
