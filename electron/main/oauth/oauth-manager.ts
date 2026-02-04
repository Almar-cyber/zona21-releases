import { shell, BrowserWindow } from 'electron';
import { v4 as uuid } from 'uuid';
import { createServer, Server } from 'http';
import { dbService } from '../database';
import { logger } from '../logger';
import { maskSensitiveData } from '../security-utils';
import { configLoader } from '../config-loader';

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
  private oauthServer: Server | null = null;
  /**
   * Inicia o fluxo OAuth abrindo o browser com a URL de autorização do Instagram
   */
  async startInstagramOAuth(): Promise<void> {
    logger.info('oauth-manager', 'Starting Instagram OAuth flow');

    // Obter credenciais do Instagram
    const credentials = configLoader.getInstagramCredentials();

    // Verificar se está configurado
    if (!configLoader.isInstagramConfigured()) {
      const configPath = configLoader.getConfigPath();
      const errorMsg = `Instagram não está configurado. Crie o arquivo ${configPath} com suas credenciais.`;
      logger.error('oauth-manager', errorMsg);
      throw new Error(errorMsg);
    }

    if (!credentials) {
      const configPath = configLoader.getConfigPath();
      const errorMsg = `Instagram não está configurado. Crie o arquivo ${configPath} com suas credenciais.`;
      logger.error('oauth-manager', errorMsg);
      throw new Error(errorMsg);
    }

    // Se está usando localhost, iniciar servidor HTTP temporário
    if (credentials.redirectUri.includes('localhost')) {
      await this.startOAuthCallbackServer();
    }

    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', credentials.appId);
    authUrl.searchParams.set('redirect_uri', credentials.redirectUri);
    authUrl.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish');
    authUrl.searchParams.set('response_type', 'code');

    logger.info('oauth-manager', 'Opening Instagram auth URL', { url: authUrl.toString() });

    // Abre browser externo para autorização
    await shell.openExternal(authUrl.toString());
  }

  /**
   * Inicia servidor HTTP temporário para capturar callback OAuth
   */
  private async startOAuthCallbackServer(): Promise<void> {
    if (this.oauthServer) {
      logger.info('oauth-manager', 'OAuth callback server already running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.oauthServer = createServer(async (req, res) => {
        logger.info('oauth-manager', 'Received OAuth callback', { url: req.url });

        try {
          const url = new URL(req.url!, 'http://localhost:3000');

          if (url.pathname === '/oauth/callback') {
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');

            if (error) {
              logger.error('oauth-manager', 'OAuth error received', { error });
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <html>
                  <head><title>Erro de Autenticação</title></head>
                  <body style="font-family: system-ui; text-align: center; padding: 50px;">
                    <h1>❌ Erro na Autenticação</h1>
                    <p>${error}</p>
                    <p>Você pode fechar esta janela e tentar novamente no Zona21.</p>
                  </body>
                </html>
              `);
              this.stopOAuthCallbackServer();
              return;
            }

            if (code) {
              logger.info('oauth-manager', 'OAuth code received, processing...');

              // Processar OAuth callback
              try {
                const token = await this.handleOAuthCallback(code);
                logger.info('oauth-manager', 'OAuth token obtained successfully');

                // Notificar renderer process
                const windows = BrowserWindow.getAllWindows();
                windows.forEach((win) => {
                  win.webContents.send('oauth-success', { provider: 'instagram', token });
                });

                // Responder com sucesso
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                  <html>
                    <head><title>Autenticação Concluída</title></head>
                    <body style="font-family: system-ui; text-align: center; padding: 50px;">
                      <h1>✅ Conectado com Sucesso!</h1>
                      <p>Sua conta Instagram foi conectada ao Zona21.</p>
                      <p>Você pode fechar esta janela e voltar ao app.</p>
                      <script>setTimeout(() => window.close(), 3000);</script>
                    </body>
                  </html>
                `);

                // Fechar servidor após 5 segundos
                setTimeout(() => this.stopOAuthCallbackServer(), 5000);
              } catch (err) {
                logger.error('oauth-manager', 'Failed to handle OAuth callback', err);

                // Notificar erro
                const windows = BrowserWindow.getAllWindows();
                windows.forEach((win) => {
                  win.webContents.send('oauth-error', {
                    provider: 'instagram',
                    error: err instanceof Error ? err.message : 'Unknown error',
                  });
                });

                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                  <html>
                    <head><title>Erro no Processamento</title></head>
                    <body style="font-family: system-ui; text-align: center; padding: 50px;">
                      <h1>❌ Erro ao Processar</h1>
                      <p>${err instanceof Error ? err.message : 'Erro desconhecido'}</p>
                      <p>Você pode fechar esta janela e tentar novamente no Zona21.</p>
                    </body>
                  </html>
                `);

                setTimeout(() => this.stopOAuthCallbackServer(), 5000);
              }
            }
          } else {
            res.writeHead(404);
            res.end('Not Found');
          }
        } catch (error) {
          logger.error('oauth-manager', 'Error processing callback', error);
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });

      this.oauthServer.listen(3000, '127.0.0.1', () => {
        logger.info('oauth-manager', 'OAuth callback server started on http://localhost:3000');
        resolve();
      });

      this.oauthServer.on('error', (error) => {
        logger.error('oauth-manager', 'OAuth callback server error', error);
        reject(error);
      });
    });
  }

  /**
   * Para o servidor OAuth callback
   */
  private stopOAuthCallbackServer(): void {
    if (this.oauthServer) {
      this.oauthServer.close(() => {
        logger.info('oauth-manager', 'OAuth callback server stopped');
      });
      this.oauthServer = null;
    }
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
        scopes: 'instagram_business_basic,instagram_business_content_publish',
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

      // Mensagens user-friendly
      let userMessage = 'OAuth callback failed: ';
      if (error instanceof Error) {
        if (error.message.includes('OAuthException') || error.message.includes('permissions')) {
          userMessage += 'Permissões negadas. Certifique-se de que sua conta Instagram é Business/Creator e está conectada ao Facebook.';
        } else if (error.message.includes('invalid_scope')) {
          userMessage += 'Escopo inválido. Verifique se o app está configurado corretamente no Meta for Developers.';
        } else if (error.message.includes('access_denied')) {
          userMessage += 'Acesso negado. Você precisa autorizar todas as permissões solicitadas.';
        } else {
          userMessage += error.message;
        }
      } else {
        userMessage += 'Erro desconhecido. Tente novamente.';
      }

      throw new Error(userMessage);
    }
  }

  /**
   * Troca o authorization code por short-lived access token
   */
  private async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    user_id: string;
  }> {
    const credentials = configLoader.getInstagramCredentials();

    if (!credentials) {
      const configPath = configLoader.getConfigPath();
      throw new Error(`Instagram não está configurado. Crie o arquivo ${configPath} com suas credenciais.`);
    }

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: credentials.appId,
        client_secret: credentials.appSecret,
        grant_type: 'authorization_code',
        redirect_uri: credentials.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('oauth-manager', 'Failed to exchange code for token', { status: response.status, error: errorText });
      throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      access_token: string;
      user_id: string;
    };
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
    const credentials = configLoader.getInstagramCredentials();

    if (!credentials) {
      const configPath = configLoader.getConfigPath();
      throw new Error(`Instagram não está configurado. Crie o arquivo ${configPath} com suas credenciais.`);
    }

    const url = new URL('https://graph.instagram.com/access_token');
    url.searchParams.set('grant_type', 'ig_exchange_token');
    url.searchParams.set('client_secret', credentials.appSecret);
    url.searchParams.set('access_token', shortLivedToken);

    const response = await fetch(url.toString(), { method: 'GET' });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('oauth-manager', 'Failed to exchange for long-lived token', { status: response.status, error: errorText });
      throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };
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

    const data = await response.json() as {
      id: string;
      username: string;
      account_type?: string;
      media_count?: number;
      profile_picture_url?: string;
    };

    // Validar tipo de conta para Platform API
    if (data.account_type && data.account_type === 'PERSONAL') {
      logger.error('oauth-manager', 'Personal account detected', { accountType: data.account_type });
      throw new Error(
        'Conta pessoal detectada. O Instagram Platform API requer uma conta Business ou Creator. ' +
        'Vá em Configurações > Conta > Mudar tipo de conta no app do Instagram.'
      );
    }

    logger.info('oauth-manager', 'Account type validated', { accountType: data.account_type });

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

      const data = await response.json() as {
        access_token: string;
        token_type: string;
        expires_in: number;
      };

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
