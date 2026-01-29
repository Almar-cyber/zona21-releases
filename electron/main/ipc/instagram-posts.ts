import { ipcMain } from 'electron';
import { instagramQueue, ScheduledPost } from '../instagram/instagram-queue';
import { instagramLimits } from '../instagram/instagram-limits';
import { logger } from '../logger';
import { handleAndInfer } from '../error-handler';

export function setupInstagramPostsHandlers() {
  // Schedule a new post
  ipcMain.handle('instagram-schedule-post', async (_event, options: Omit<ScheduledPost, 'id' | 'status' | 'remoteId' | 'errorMessage' | 'createdAt' | 'updatedAt'>) => {
    try {
      logger.info('ipc-instagram-posts', 'Schedule post request', {
        assetId: options.assetId,
        scheduledAt: new Date(options.scheduledAt).toISOString(),
      });

      // 1. Verificar limite
      const limitCheck = await instagramLimits.canSchedulePost();
      if (!limitCheck.allowed) {
        logger.warn('ipc-instagram-posts', 'Schedule blocked by limit', {
          reason: limitCheck.reason,
        });
        return {
          success: false,
          error: limitCheck.reason,
          limitReached: true,
          remaining: limitCheck.remaining,
          limit: limitCheck.limit,
        };
      }

      // 2. Adicionar à fila
      const post = await instagramQueue.addToQueue(options);

      logger.info('ipc-instagram-posts', 'Post scheduled successfully', {
        postId: post.id,
        remaining: limitCheck.remaining,
      });

      return {
        success: true,
        post,
        remaining: limitCheck.remaining,
        limit: limitCheck.limit,
      };
    } catch (error) {
      const appError = handleAndInfer('instagram-schedule-post', error);
      logger.error('ipc-instagram-posts', 'Failed to schedule post', error);
      return {
        success: false,
        error: appError.userMessage,
      };
    }
  });

  // Get all scheduled posts
  ipcMain.handle('instagram-get-scheduled-posts', async () => {
    try {
      const posts = instagramQueue.getAllScheduledPosts();
      logger.info('ipc-instagram-posts', 'Retrieved scheduled posts', { count: posts.length });
      return { success: true, posts };
    } catch (error) {
      const appError = handleAndInfer('instagram-get-scheduled-posts', error);
      logger.error('ipc-instagram-posts', 'Failed to get scheduled posts', error);
      return { success: false, error: appError.userMessage };
    }
  });

  // Edit a scheduled post
  ipcMain.handle('instagram-edit-post', async (_event, postId: string, updates: Partial<Pick<ScheduledPost, 'caption' | 'hashtags' | 'scheduledAt' | 'aspectRatio' | 'locationName' | 'locationId'>>) => {
    try {
      logger.info('ipc-instagram-posts', 'Edit post request', { postId, updates });

      const success = await instagramQueue.editPost(postId, updates);

      if (success) {
        logger.info('ipc-instagram-posts', 'Post edited successfully', { postId });
        return { success: true };
      } else {
        logger.warn('ipc-instagram-posts', 'Post not found or not editable', { postId });
        return { success: false, error: 'Post não encontrado ou não pode ser editado' };
      }
    } catch (error) {
      const appError = handleAndInfer('instagram-edit-post', error);
      logger.error('ipc-instagram-posts', 'Failed to edit post', error);
      return { success: false, error: appError.userMessage };
    }
  });

  // Cancel a scheduled post
  ipcMain.handle('instagram-cancel-post', async (_event, postId: string) => {
    try {
      logger.info('ipc-instagram-posts', 'Cancel post request', { postId });

      const success = await instagramQueue.cancelPost(postId);

      if (success) {
        logger.info('ipc-instagram-posts', 'Post cancelled successfully', { postId });
        return { success: true };
      } else {
        logger.warn('ipc-instagram-posts', 'Post not found or already processed', { postId });
        return { success: false, error: 'Post não encontrado ou já foi processado' };
      }
    } catch (error) {
      const appError = handleAndInfer('instagram-cancel-post', error);
      logger.error('ipc-instagram-posts', 'Failed to cancel post', error);
      return { success: false, error: appError.userMessage };
    }
  });

  // Get usage info (for showing limits in UI)
  ipcMain.handle('instagram-get-usage-info', async () => {
    try {
      const usageInfo = await instagramLimits.getUsageInfo();
      logger.info('ipc-instagram-posts', 'Retrieved usage info', usageInfo);
      return { success: true, ...usageInfo };
    } catch (error) {
      const appError = handleAndInfer('instagram-get-usage-info', error);
      logger.error('ipc-instagram-posts', 'Failed to get usage info', error);
      return { success: false, error: appError.userMessage };
    }
  });

  // Check if should show upgrade prompt
  ipcMain.handle('instagram-should-show-upgrade', async () => {
    try {
      const shouldShow = await instagramLimits.shouldShowUpgradePrompt();
      return { success: true, shouldShow };
    } catch (error) {
      const appError = handleAndInfer('instagram-should-show-upgrade', error);
      logger.error('ipc-instagram-posts', 'Failed to check upgrade prompt', error);
      return { success: false, error: appError.userMessage };
    }
  });

  // Check if can schedule (for pre-validation in UI)
  ipcMain.handle('instagram-can-schedule', async () => {
    try {
      const limitCheck = await instagramLimits.canSchedulePost();
      return {
        success: true,
        allowed: limitCheck.allowed,
        reason: limitCheck.reason,
        remaining: limitCheck.remaining,
        limit: limitCheck.limit,
      };
    } catch (error) {
      const appError = handleAndInfer('instagram-can-schedule', error);
      logger.error('ipc-instagram-posts', 'Failed to check can schedule', error);
      return { success: false, error: appError.userMessage };
    }
  });

  logger.info('ipc-instagram-posts', 'Instagram posts handlers registered');
}
