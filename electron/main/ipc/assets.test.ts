import { describe, it, expect } from 'vitest';
import { mapAssetRow } from './assets';

describe('Assets IPC Handlers', () => {
  describe('mapAssetRow', () => {
    it('maps snake_case database columns to camelCase', () => {
      const dbRow = {
        id: 'asset_123',
        file_name: 'photo.jpg',
        file_size: 1024000,
        relative_path: '/photos/2024/photo.jpg',
        volume_uuid: 'vol_abc',
        partial_hash: 'abc123',
        media_type: 'photo',
        created_at: '2024-01-15T10:30:00Z',
        indexed_at: '2024-01-16T08:00:00Z',
        width: 4000,
        height: 3000,
        rating: 4,
        color_label: 'green',
        flagged: 1,
        rejected: 0,
        marking_status: 'approved',
        notes: 'Test notes',
        tags: '["landscape", "nature"]',
        thumbnail_paths: '["/thumbs/photo_sm.jpg", "/thumbs/photo_md.jpg"]',
        status: 'online'
      };

      const result = mapAssetRow(dbRow);

      expect(result.id).toBe('asset_123');
      expect(result.fileName).toBe('photo.jpg');
      expect(result.fileSize).toBe(1024000);
      expect(result.relativePath).toBe('/photos/2024/photo.jpg');
      expect(result.volumeUuid).toBe('vol_abc');
      expect(result.partialHash).toBe('abc123');
      expect(result.mediaType).toBe('photo');
      expect(result.width).toBe(4000);
      expect(result.height).toBe(3000);
      expect(result.rating).toBe(4);
      expect(result.colorLabel).toBe('green');
      expect(result.flagged).toBe(true);
      expect(result.rejected).toBe(false);
      expect(result.markingStatus).toBe('approved');
      expect(result.notes).toBe('Test notes');
      expect(result.status).toBe('online');
    });

    it('parses tags JSON array', () => {
      const dbRow = {
        id: 'asset_1',
        tags: '["tag1", "tag2", "tag3"]',
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(dbRow);

      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('handles empty tags', () => {
      const dbRow = {
        id: 'asset_1',
        tags: '[]',
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(dbRow);

      expect(result.tags).toEqual([]);
    });

    it('handles null/undefined tags gracefully', () => {
      const dbRow = {
        id: 'asset_1',
        tags: null,
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(dbRow);

      expect(result.tags).toEqual([]);
    });

    it('handles invalid tags JSON gracefully', () => {
      const dbRow = {
        id: 'asset_1',
        tags: 'not valid json',
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(dbRow);

      expect(result.tags).toEqual([]);
    });

    it('parses thumbnail_paths JSON array', () => {
      const dbRow = {
        id: 'asset_1',
        thumbnail_paths: '["/path/sm.jpg", "/path/md.jpg"]',
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(dbRow);

      expect(result.thumbnailPaths).toEqual(['/path/sm.jpg', '/path/md.jpg']);
    });

    it('handles camelCase thumbnailPaths fallback', () => {
      const dbRow = {
        id: 'asset_1',
        thumbnailPaths: '["/path/thumb.jpg"]',
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(dbRow);

      expect(result.thumbnailPaths).toEqual(['/path/thumb.jpg']);
    });

    it('converts flagged integer to boolean', () => {
      const flaggedRow = {
        id: 'asset_1',
        flagged: 1,
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const unflaggedRow = {
        id: 'asset_2',
        flagged: 0,
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      expect(mapAssetRow(flaggedRow).flagged).toBe(true);
      expect(mapAssetRow(unflaggedRow).flagged).toBe(false);
    });

    it('converts rejected integer to boolean', () => {
      const rejectedRow = {
        id: 'asset_1',
        rejected: 1,
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const notRejectedRow = {
        id: 'asset_2',
        rejected: 0,
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      expect(mapAssetRow(rejectedRow).rejected).toBe(true);
      expect(mapAssetRow(notRejectedRow).rejected).toBe(false);
    });

    it('handles boolean flagged values', () => {
      const row = {
        id: 'asset_1',
        flagged: true,
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      expect(mapAssetRow(row).flagged).toBe(true);
    });

    it('converts dates to Date objects', () => {
      const dbRow = {
        id: 'asset_1',
        created_at: '2024-06-15T14:30:00Z',
        indexed_at: '2024-06-16T09:00:00Z'
      };

      const result = mapAssetRow(dbRow);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.indexedAt).toBeInstanceOf(Date);
    });

    it('provides default values for missing fields', () => {
      const minimalRow = {
        id: 'asset_1',
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(minimalRow);

      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.rating).toBe(0);
      expect(result.colorLabel).toBeNull();
      expect(result.notes).toBe('');
      expect(result.markingStatus).toBe('unmarked');
    });

    it('maps video-specific fields', () => {
      const videoRow = {
        id: 'video_1',
        media_type: 'video',
        codec: 'h264',
        container: 'mp4',
        frame_rate: 29.97,
        duration: 120.5,
        timecode_start: '00:00:00:00',
        audio_channels: 2,
        audio_sample_rate: 48000,
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(videoRow);

      expect(result.mediaType).toBe('video');
      expect(result.codec).toBe('h264');
      expect(result.container).toBe('mp4');
      expect(result.frameRate).toBe(29.97);
      expect(result.duration).toBe(120.5);
      expect(result.timecodeStart).toBe('00:00:00:00');
      expect(result.audioChannels).toBe(2);
      expect(result.audioSampleRate).toBe(48000);
    });

    it('maps photo EXIF metadata', () => {
      const photoRow = {
        id: 'photo_1',
        media_type: 'photo',
        camera_make: 'Canon',
        camera_model: 'EOS R5',
        lens: 'RF 24-70mm F2.8L IS USM',
        focal_length: 50,
        aperture: 2.8,
        shutter_speed: '1/250',
        iso: 400,
        gps_latitude: 40.7128,
        gps_longitude: -74.006,
        orientation: 1,
        color_space: 'sRGB',
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(photoRow);

      expect(result.cameraMake).toBe('Canon');
      expect(result.cameraModel).toBe('EOS R5');
      expect(result.lens).toBe('RF 24-70mm F2.8L IS USM');
      expect(result.focalLength).toBe(50);
      expect(result.aperture).toBe(2.8);
      expect(result.shutterSpeed).toBe('1/250');
      expect(result.iso).toBe(400);
      expect(result.gpsLatitude).toBe(40.7128);
      expect(result.gpsLongitude).toBe(-74.006);
      expect(result.orientation).toBe(1);
      expect(result.colorSpace).toBe('sRGB');
    });

    it('maps proxy and preview paths', () => {
      const row = {
        id: 'asset_1',
        waveform_path: '/cache/waveform.png',
        proxy_path: '/cache/proxy.mp4',
        full_res_preview_path: '/cache/preview.jpg',
        created_at: '2024-01-01',
        indexed_at: '2024-01-01'
      };

      const result = mapAssetRow(row);

      expect(result.waveformPath).toBe('/cache/waveform.png');
      expect(result.proxyPath).toBe('/cache/proxy.mp4');
      expect(result.fullResPreviewPath).toBe('/cache/preview.jpg');
    });
  });
});
