/**
 * IPC Handlers for Panoramic/360 Editing Operations
 *
 * Handles communication between renderer and main process for:
 * - 360 video reframing
 * - Video stabilization
 * - 360 photo reframing
 * - LRV proxy workflow
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { getPanoramicEditService } from '../panoramic-edit';
import { handleAndInfer } from '../error-handler';
import type { ReframeOptions, StabilizeOptions, PhotoReframeOptions } from '../panoramic-edit';

export function setupPanoramicHandlers() {
  /**
   * Reframe 360 video to flat projection
   */
  ipcMain.handle(
    'panoramic-reframe-video',
    async (_event: IpcMainInvokeEvent, assetId: string, options: ReframeOptions) => {
      try {
        const service = getPanoramicEditService();
        const filePath = await service.reframe360ToFlat(assetId, options);
        return { success: true, outputPath: filePath };
      } catch (error) {
        const appError = handleAndInfer('panoramic-reframe-video', error);
        return { success: false, error: appError.userMessage };
      }
    }
  );

  /**
   * Get 360 video metadata
   */
  ipcMain.handle(
    'panoramic-get-metadata',
    async (_event: IpcMainInvokeEvent, assetId: string) => {
      try {
        const service = getPanoramicEditService();
        const metadata = await service.extract360Metadata(assetId);
        return { success: true, metadata };
      } catch (error) {
        const appError = handleAndInfer('panoramic-get-metadata', error);
        return { success: false, error: appError.userMessage };
      }
    }
  );

  /**
   * Stabilize 360 video
   */
  ipcMain.handle(
    'panoramic-stabilize',
    async (_event: IpcMainInvokeEvent, assetId: string, options: StabilizeOptions) => {
      try {
        const service = getPanoramicEditService();
        const filePath = await service.stabilize360Video(assetId, options);
        return { success: true, outputPath: filePath };
      } catch (error) {
        const appError = handleAndInfer('panoramic-stabilize', error);
        return { success: false, error: appError.userMessage };
      }
    }
  );

  /**
   * Reframe 360 photo to flat
   */
  ipcMain.handle(
    'panoramic-reframe-photo',
    async (_event: IpcMainInvokeEvent, assetId: string, options: PhotoReframeOptions) => {
      try {
        const service = getPanoramicEditService();
        const filePath = await service.reframe360Photo(assetId, options);
        return { success: true, outputPath: filePath };
      } catch (error) {
        const appError = handleAndInfer('panoramic-reframe-photo', error);
        return { success: false, error: appError.userMessage };
      }
    }
  );

  /**
   * Adjust 360 photo orientation
   */
  ipcMain.handle(
    'panoramic-adjust-photo-orientation',
    async (_event: IpcMainInvokeEvent, assetId: string, yaw: number, pitch: number, roll: number) => {
      try {
        const service = getPanoramicEditService();
        const filePath = await service.adjust360PhotoOrientation(assetId, yaw, pitch, roll);
        return { success: true, outputPath: filePath };
      } catch (error) {
        const appError = handleAndInfer('panoramic-adjust-photo-orientation', error);
        return { success: false, error: appError.userMessage };
      }
    }
  );

  /**
   * Link LRV proxy to master file
   */
  ipcMain.handle(
    'panoramic-link-lrv',
    async (_event: IpcMainInvokeEvent, lrvAssetId: string) => {
      try {
        const service = getPanoramicEditService();
        const masterAsset = await service.linkLRVToMaster(lrvAssetId);
        return { success: true, masterAssetId: masterAsset };
      } catch (error) {
        const appError = handleAndInfer('panoramic-link-lrv', error);
        return { success: false, error: appError.userMessage };
      }
    }
  );

  /**
   * Apply LRV edits to master file
   */
  ipcMain.handle(
    'panoramic-apply-lrv-edits',
    async (_event: IpcMainInvokeEvent, lrvAssetId: string, masterAssetId: string, operations: unknown[]) => {
      try {
        const service = getPanoramicEditService();
        const filePath = await service.applyLRVEditsToMaster(lrvAssetId, masterAssetId, operations);
        return { success: true, outputPath: filePath };
      } catch (error) {
        const appError = handleAndInfer('panoramic-apply-lrv-edits', error);
        return { success: false, error: appError.userMessage };
      }
    }
  );

  console.log('[IPC] Panoramic handlers registered');
}
