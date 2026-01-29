import { ipcMain } from 'electron';
import { oauthManager } from '../oauth/oauth-manager';
import { logger } from '../logger';
import { handleAndInfer } from '../error-handler';
import { globalRateLimiter } from '../security-utils';

export function setupInstagramOAuthHandlers() {
  // Start Instagram OAuth flow
  ipcMain.handle('instagram-start-oauth', async () => {
    try {
      // SECURITY FIX: Rate limiting para prevenir abuse do OAuth flow
      if (!globalRateLimiter.canProceed('instagram-oauth', 3, 60000)) {
        logger.warn('instagram-start-oauth', 'Rate limit exceeded');
        return { success: false, error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' };
      }

      await oauthManager.startInstagramOAuth();
      return { success: true };
    } catch (error) {
      const appError = handleAndInfer('instagram-start-oauth', error);
      return { success: false, error: appError.userMessage };
    }
  });

  // Handle OAuth callback (será chamado pelo deep link)
  ipcMain.handle('instagram-oauth-callback', async (_event, code: string) => {
    try {
      const token = await oauthManager.handleOAuthCallback(code);
      return { success: true, token };
    } catch (error) {
      const appError = handleAndInfer('instagram-oauth-callback', error);
      return { success: false, error: appError.userMessage };
    }
  });

  // Get OAuth token
  ipcMain.handle('instagram-get-token', async (_event, provider: string) => {
    try {
      const token = await oauthManager.getToken(provider);
      return token;
    } catch (error) {
      const appError = handleAndInfer('instagram-get-token', error);
      logger.error('instagram-get-token', 'Failed to get token', error);
      return null;
    }
  });

  // Revoke OAuth token
  ipcMain.handle('instagram-revoke-token', async (_event, provider: string) => {
    try {
      const result = await oauthManager.revokeToken(provider);
      return result;
    } catch (error) {
      const appError = handleAndInfer('instagram-revoke-token', error);
      return { success: false, error: appError.userMessage };
    }
  });

  // Refresh Instagram token
  ipcMain.handle('instagram-refresh-token', async () => {
    try {
      // SECURITY FIX: Rate limiting para prevenir abuse
      if (!globalRateLimiter.canProceed('instagram-refresh', 5, 60000)) {
        logger.warn('instagram-refresh-token', 'Rate limit exceeded');
        return { success: false, error: 'Muitas tentativas. Aguarde um minuto.' };
      }

      const token = await oauthManager.refreshInstagramToken();
      if (token) {
        return { success: true, token };
      }
      return { success: false, error: 'Failed to refresh token' };
    } catch (error) {
      const appError = handleAndInfer('instagram-refresh-token', error);
      return { success: false, error: appError.userMessage };
    }
  });

  logger.info('ipc-instagram-oauth', 'Instagram OAuth handlers registered');
}
