import { createServer, Server } from 'http';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { oauthManager } from '../oauth/oauth-manager';
import { dbService } from '../database';
import { logger } from '../logger';

interface PublishOptions {
  assetId: string;
  caption: string;
  hashtags?: string;
  aspectRatio?: '1:1' | '4:5' | '16:9';
  locationName?: string;
  locationId?: string;
}

interface PublishResult {
  success: boolean;
  remoteId?: string;
  permalink?: string;
  error?: string;
}

interface InstagramMediaResponse {
  id: string;
}

interface InstagramPublishResponse {
  id: string;
}

class InstagramPublisher {
  private tempServer: Server | null = null;
  private tempServerPort: number = 0;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;

  /**
   * Publica um asset no Instagram
   */
  async publishPost(options: PublishOptions): Promise<PublishResult> {
    logger.info('instagram-publisher', 'Starting publish process', {
      assetId: options.assetId,
      captionLength: options.caption.length,
    });

    try {
      // 1. Obter token OAuth
      const token = await oauthManager.getToken('instagram');
      if (!token || !token.userId) {
        logger.error('instagram-publisher', 'No valid Instagram token found');
        return { success: false, error: 'Não autenticado no Instagram' };
      }

      // 2. Obter caminho do asset no DB
      const db = dbService.getDatabase();
      const asset = db
        .prepare('SELECT * FROM assets WHERE id = ?')
        .get(options.assetId) as any;

      if (!asset) {
        logger.error('instagram-publisher', 'Asset not found', { assetId: options.assetId });
        return { success: false, error: 'Asset não encontrado' };
      }

      // 3. Determinar tipo de mídia
      const isVideo = asset.media_type === 'video';
      const mediaType = isVideo ? 'VIDEO' : 'IMAGE';

      logger.info('instagram-publisher', 'Asset info', {
        path: asset.file_path,
        type: mediaType,
        size: asset.file_size,
      });

      // 4. Criar servidor temporário para servir o arquivo
      const mediaUrl = await this.createTempMediaServer(asset.file_path);
      logger.info('instagram-publisher', 'Temp media URL created', { mediaUrl });

      // 5. Preparar caption completo
      const fullCaption = options.hashtags
        ? `${options.caption}\n\n${options.hashtags}`
        : options.caption;

      // 6. Criar container no Instagram
      const containerId = await this.createMediaContainer({
        userId: token.userId,
        accessToken: token.accessToken,
        mediaUrl,
        mediaType,
        caption: fullCaption,
        locationId: options.locationId,
      });

      logger.info('instagram-publisher', 'Media container created', { containerId });

      // 7. Aguardar processamento (Instagram precisa baixar a mídia)
      await this.waitForContainerReady(token.userId, token.accessToken, containerId);

      // 8. Publicar container
      const mediaId = await this.publishContainer({
        userId: token.userId,
        accessToken: token.accessToken,
        containerId,
      });

      logger.info('instagram-publisher', 'Post published successfully', { mediaId });

      // 9. Obter permalink (opcional)
      const permalink = await this.getMediaPermalink(mediaId, token.accessToken);

      // 10. Limpar servidor temporário
      await this.stopTempMediaServer();

      return {
        success: true,
        remoteId: mediaId,
        permalink,
      };
    } catch (error) {
      logger.error('instagram-publisher', 'Failed to publish post', error);

      // Limpar servidor temporário em caso de erro
      await this.stopTempMediaServer();

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao publicar',
      };
    }
  }

  /**
   * Cria servidor HTTP temporário para servir o arquivo local
   * Instagram exige que a mídia esteja disponível via URL pública
   */
  private async createTempMediaServer(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.tempServer = createServer(async (req, res) => {
        try {
          const fileBuffer = await readFile(filePath);
          const ext = filePath.split('.').pop()?.toLowerCase();

          // Determinar Content-Type
          let contentType = 'application/octet-stream';
          if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
          else if (ext === 'png') contentType = 'image/png';
          else if (ext === 'mp4') contentType = 'video/mp4';
          else if (ext === 'mov') contentType = 'video/quicktime';

          res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': fileBuffer.length,
            'Access-Control-Allow-Origin': '*',
          });
          res.end(fileBuffer);
        } catch (error) {
          logger.error('instagram-publisher', 'Error serving temp file', error);
          res.writeHead(500);
          res.end('Error serving file');
        }
      });

      this.tempServer.listen(0, '127.0.0.1', () => {
        const address = this.tempServer!.address();
        if (address && typeof address === 'object') {
          this.tempServerPort = address.port;
          const url = `http://127.0.0.1:${this.tempServerPort}/media`;
          logger.info('instagram-publisher', 'Temp server started', { url, port: this.tempServerPort });
          resolve(url);
        } else {
          reject(new Error('Failed to get server address'));
        }
      });

      this.tempServer.on('error', (error) => {
        logger.error('instagram-publisher', 'Temp server error', error);
        reject(error);
      });
    });
  }

  /**
   * Para o servidor temporário
   */
  private async stopTempMediaServer(): Promise<void> {
    if (this.tempServer) {
      return new Promise((resolve) => {
        this.tempServer!.close(() => {
          logger.info('instagram-publisher', 'Temp server stopped', { port: this.tempServerPort });
          this.tempServer = null;
          this.tempServerPort = 0;
          resolve();
        });
      });
    }
  }

  /**
   * Cria um container de mídia no Instagram
   */
  private async createMediaContainer(params: {
    userId: string;
    accessToken: string;
    mediaUrl: string;
    mediaType: 'IMAGE' | 'VIDEO';
    caption: string;
    locationId?: string;
  }): Promise<string> {
    const url = new URL(`https://graph.instagram.com/v18.0/${params.userId}/media`);

    const body: Record<string, string> = {
      access_token: params.accessToken,
      caption: params.caption,
    };

    if (params.mediaType === 'IMAGE') {
      body.image_url = params.mediaUrl;
    } else {
      body.media_type = 'VIDEO';
      body.video_url = params.mediaUrl;
    }

    if (params.locationId) {
      body.location_id = params.locationId;
    }

    const response = await this.fetchWithRetry(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('instagram-publisher', 'Failed to create media container', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as InstagramMediaResponse;
    return data.id;
  }

  /**
   * Aguarda o container estar pronto para publicação
   * Instagram precisa processar/baixar a mídia primeiro
   */
  private async waitForContainerReady(
    userId: string,
    accessToken: string,
    containerId: string,
    maxAttempts: number = 30
  ): Promise<void> {
    logger.info('instagram-publisher', 'Waiting for container to be ready', { containerId });

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const url = new URL(`https://graph.instagram.com/v18.0/${containerId}`);
      url.searchParams.set('fields', 'status_code');
      url.searchParams.set('access_token', accessToken);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to check container status: ${response.status}`);
      }

      const data = (await response.json()) as { status_code?: string };

      if (data.status_code === 'FINISHED') {
        logger.info('instagram-publisher', 'Container ready', { containerId });
        return;
      }

      if (data.status_code === 'ERROR') {
        throw new Error('Instagram failed to process media');
      }

      // Aguardar 2 segundos antes de tentar novamente
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout waiting for Instagram to process media');
  }

  /**
   * Publica o container (torna o post visível)
   */
  private async publishContainer(params: {
    userId: string;
    accessToken: string;
    containerId: string;
  }): Promise<string> {
    const url = new URL(`https://graph.instagram.com/v18.0/${params.userId}/media_publish`);

    const response = await this.fetchWithRetry(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: params.containerId,
        access_token: params.accessToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('instagram-publisher', 'Failed to publish container', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as InstagramPublishResponse;
    return data.id;
  }

  /**
   * Obtém o permalink do post publicado
   */
  private async getMediaPermalink(mediaId: string, accessToken: string): Promise<string | undefined> {
    try {
      const url = new URL(`https://graph.instagram.com/v18.0/${mediaId}`);
      url.searchParams.set('fields', 'permalink');
      url.searchParams.set('access_token', accessToken);

      const response = await fetch(url.toString());
      if (!response.ok) return undefined;

      const data = (await response.json()) as { permalink?: string };
      return data.permalink;
    } catch (error) {
      logger.warn('instagram-publisher', 'Failed to get permalink', error);
      return undefined;
    }
  }

  /**
   * Fetch com retry automático e exponential backoff
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 0
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);

      // Retry em rate limit ou server errors
      if ((response.status === 429 || response.status >= 500) && attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn('instagram-publisher', `Retrying request (attempt ${attempt + 1})`, {
          status: response.status,
          delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      if (attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn('instagram-publisher', `Retrying after network error (attempt ${attempt + 1})`, {
          error,
          delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      throw error;
    }
  }
}

// Singleton instance
export const instagramPublisher = new InstagramPublisher();
