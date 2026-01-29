import { shell } from 'electron';
import { v4 as uuid } from 'uuid';
import { dbService } from '../database';
import { logger } from '../logger';
import { maskSensitiveData } from '../security-utils';

// Instagram App credentials (devem ser configuradas via env ou settings)
// TODO: Mover para arquivo de configuração seguro
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || 'YOUR_INSTAGRAM_APP_ID';
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || 'YOUR_INSTAGRAM_APP_SECRET';
const INSTAGRAM_REDIRECT_URI = 'zona21://oauth/callback';

export interface OAuthToken {
  id: string;
  provider: string;
  userId: string | null;
  username: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  scopes: string | null;
  profilePictureUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

class OAuthManager {
  /**
   * Inicia o fluxo OAuth abrindo o browser com a URL de autorização do Instagram
   */
  async startInstagramOAuth(): Promise<void> {
    logger.info('oauth-manager', 'Starting Instagram OAuth flow');

    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID);
    authUrl.searchParams.set('redirect_uri', INSTAGRAM_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'instagram_basic,instagram_content_publish');
    authUrl.searchParams.set('response_type', 'code');

    logger.info('oauth-manager', 'Opening Instagram auth URL', { url: authUrl.toString() });

    // Abre browser externo para autorização
    await shell.openExternal(authUrl.toString());
  }

  /**
   * Processa o callback OAuth e troca o code por access token
   */
  async handleOAuthCallback(code: string): Promise<OAuthToken> {
    // SECURITY FIX: Não logar códigos OAuth, mesmo parcialmente
    logger.info('oauth-manager', 'Handling OAuth callback', { codeLength: code.length });

    try {
      // 1. Exchange code for short-lived access token
      const shortLivedTokenData = await this.exchangeCodeForToken(code);
      logger.info('oauth-manager', 'Got short-lived token', { userId: shortLivedTokenData.user_id });

      // 2. Exchange short-lived token for long-lived token (60 dias)
      const longLivedTokenData = await this.exchangeForLongLivedToken(shortLivedTokenData.access_token);
      logger.info('oauth-manager', 'Got long-lived token', { expiresIn: longLivedTokenData.expires_in });

      // 3. Fetch user info
      const userInfo = await this.fetchUserInfo(longLivedTokenData.access_token);
      logger.info('oauth-manager', 'Got user info', { username: userInfo.username });

      // 4. Salvar token no DB
      const token: OAuthToken = {
        id: uuid(),
        provider: 'instagram',
        userId: shortLivedTokenData.user_id,
        username: userInfo.username,
        accessToken: longLivedTokenData.access_token,
        refreshToken: null,
        expiresAt: Date.now() + (longLivedTokenData.expires_in * 1000),
        scopes: 'instagram_basic,instagram_content_publish',
        profilePictureUrl: userInfo.profile_picture_url || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const db = dbService.getDatabase();
      db.prepare(`
        INSERT OR REPLACE INTO oauth_tokens
        (id, provider, user_id, username, access_token, refresh_token, expires_at, scopes, profile_picture_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        token.id,
        token.provider,
        token.userId,
        token.username,
        token.accessToken,
        token.refreshToken,
        token.expiresAt,
        token.scopes,
        token.profilePictureUrl,
        token.createdAt,
        token.updatedAt
      );

      logger.info('oauth-manager', 'Token saved successfully', { provider: token.provider, username: token.username });

      return token;
    } catch (error) {
      logger.error('oauth-manager', 'Failed to handle OAuth callback', error);
      throw new Error(`OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Troca o authorization code por short-lived access token
   */
  private async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    user_id: string;
  }> {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('oauth-manager', 'Failed to exchange code for token', { status: response.status, error: errorText });
      throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Troca short-lived token por long-lived token (60 dias)
   */
  private async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const url = new URL('https://graph.instagram.com/access_token');
    url.searchParams.set('grant_type', 'ig_exchange_token');
    url.searchParams.set('client_secret', INSTAGRAM_APP_SECRET);
    url.searchParams.set('access_token', shortLivedToken);

    const response = await fetch(url.toString(), { method: 'GET' });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('oauth-manager', 'Failed to exchange for long-lived token', { status: response.status, error: errorText });
      throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Busca informações do usuário Instagram
   */
  private async fetchUserInfo(accessToken: string): Promise<{
    id: string;
    username: string;
    account_type?: string;
    media_count?: number;
    profile_picture_url?: string;
  }> {
    const url = new URL('https://graph.instagram.com/me');
    url.searchParams.set('fields', 'id,username,account_type,media_count');
    url.searchParams.set('access_token', accessToken);

    const response = await fetch(url.toString(), { method: 'GET' });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('oauth-manager', 'Failed to fetch user info', { status: response.status, error: errorText });
      throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Busca token OAuth salvo no DB
   */
  async getToken(provider: string): Promise<OAuthToken | null> {
    const db = dbService.getDatabase();
    const row = db.prepare('SELECT * FROM oauth_tokens WHERE provider = ?').get(provider) as any;

    if (!row) {
      logger.info('oauth-manager', 'No token found', { provider });
      return null;
    }

    // Check expiration
    if (row.expires_at && row.expires_at < Date.now()) {
      logger.warn('oauth-manager', 'Token expired', { provider, expiresAt: new Date(row.expires_at) });
      // TODO: Implementar refresh token (Instagram long-lived tokens podem ser refreshed)
      return null;
    }

    return {
      id: row.id,
      provider: row.provider,
      userId: row.user_id,
      username: row.username,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
      scopes: row.scopes,
      profilePictureUrl: row.profile_picture_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Revoga token OAuth e remove do DB
   */
  async revokeToken(provider: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = dbService.getDatabase();
      db.prepare('DELETE FROM oauth_tokens WHERE provider = ?').run(provider);
      logger.info('oauth-manager', 'Token revoked', { provider });
      return { success: true };
    } catch (error) {
      logger.error('oauth-manager', 'Failed to revoke token', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Refresh long-lived token (deve ser chamado antes de expirar)
   * Instagram long-lived tokens podem ser refreshed para ganhar mais 60 dias
   */
  async refreshInstagramToken(): Promise<OAuthToken | null> {
    try {
      const currentToken = await this.getToken('instagram');
      if (!currentToken) {
        logger.warn('oauth-manager', 'No token to refresh');
        return null;
      }

      const url = new URL('https://graph.instagram.com/refresh_access_token');
      url.searchParams.set('grant_type', 'ig_refresh_token');
      url.searchParams.set('access_token', currentToken.accessToken);

      const response = await fetch(url.toString(), { method: 'GET' });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('oauth-manager', 'Failed to refresh token', { status: response.status, error: errorText });
        return null;
      }

      const data = await response.json();

      // Update token no DB
      const db = dbService.getDatabase();
      db.prepare(`
        UPDATE oauth_tokens
        SET access_token = ?, expires_at = ?, updated_at = ?
        WHERE provider = 'instagram'
      `).run(
        data.access_token,
        Date.now() + (data.expires_in * 1000),
        Date.now()
      );

      logger.info('oauth-manager', 'Token refreshed successfully');

      return await this.getToken('instagram');
    } catch (error) {
      logger.error('oauth-manager', 'Failed to refresh token', error);
      return null;
    }
  }
}

// Singleton instance
export const oauthManager = new OAuthManager();
