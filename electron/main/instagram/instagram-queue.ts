import { v4 as uuid } from 'uuid';
import { dbService } from '../database';
import { logger } from '../logger';
import { instagramPublisher } from './instagram-publisher';
import { notificationManager } from '../notifications';
import { BrowserWindow } from 'electron';

export interface ScheduledPost {
  id: string;
  assetId: string;
  scheduledAt: number;
  caption: string;
  hashtags: string | null;
  locationName: string | null;
  locationId: string | null;
  aspectRatio: '1:1' | '4:5' | '16:9' | null;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled';
  remoteId: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

class InstagramQueue {
  private queue: ScheduledPost[] = [];
  private processing: Set<string> = new Set();
  private readonly CONCURRENCY = 2; // Max 2 posts simultâneos
  private isRunning: boolean = false;

  /**
   * Carrega posts pendentes do banco e inicia processamento
   */
  async loadQueue(): Promise<void> {
    logger.info('instagram-queue', 'Loading queue from database');

    const db = dbService.getDatabase();
    const now = Date.now();

    // Carregar posts que estão prontos para publicar
    const rows = db
      .prepare(
        `
      SELECT * FROM scheduled_posts
      WHERE status = 'pending' AND scheduled_at <= ?
      ORDER BY scheduled_at ASC
    `
      )
      .all(now) as any[];

    this.queue = rows.map(this.mapRowToPost);

    logger.info('instagram-queue', 'Queue loaded', {
      count: this.queue.length,
      processing: this.processing.size,
    });

    // Iniciar processamento
    if (this.queue.length > 0 && !this.isRunning) {
      this.processQueue();
    }
  }

  /**
   * Adiciona um novo post à fila
   */
  async addToQueue(post: Omit<ScheduledPost, 'id' | 'status' | 'remoteId' | 'errorMessage' | 'createdAt' | 'updatedAt'>): Promise<ScheduledPost> {
    logger.info('instagram-queue', 'Adding post to queue', {
      assetId: post.assetId,
      scheduledAt: new Date(post.scheduledAt).toISOString(),
    });

    const db = dbService.getDatabase();
    const now = Date.now();

    const newPost: ScheduledPost = {
      ...post,
      id: uuid(),
      status: 'pending',
      remoteId: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    // Salvar no banco
    db.prepare(
      `
      INSERT INTO scheduled_posts
      (id, asset_id, scheduled_at, caption, hashtags, location_name, location_id, aspect_ratio, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      newPost.id,
      newPost.assetId,
      newPost.scheduledAt,
      newPost.caption,
      newPost.hashtags,
      newPost.locationName,
      newPost.locationId,
      newPost.aspectRatio,
      newPost.status,
      newPost.createdAt,
      newPost.updatedAt
    );

    // Se já passou do horário agendado, adicionar à fila para processar
    if (newPost.scheduledAt <= Date.now()) {
      this.queue.push(newPost);
      if (!this.isRunning) {
        this.processQueue();
      }
    }

    // Notificar UI
    this.broadcastUpdate();

    return newPost;
  }

  /**
   * Cancela um post agendado
   */
  async cancelPost(postId: string): Promise<boolean> {
    logger.info('instagram-queue', 'Cancelling post', { postId });

    // Remover da fila se estiver presente
    const index = this.queue.findIndex((p) => p.id === postId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    // Atualizar no banco
    const db = dbService.getDatabase();
    const result = db
      .prepare(
        `
      UPDATE scheduled_posts
      SET status = 'cancelled', updated_at = ?
      WHERE id = ? AND status = 'pending'
    `
      )
      .run(Date.now(), postId);

    this.broadcastUpdate();

    return result.changes > 0;
  }

  /**
   * Edita um post agendado
   */
  async editPost(
    postId: string,
    updates: Partial<Pick<ScheduledPost, 'caption' | 'hashtags' | 'scheduledAt' | 'aspectRatio' | 'locationName' | 'locationId'>>
  ): Promise<boolean> {
    logger.info('instagram-queue', 'Editing post', { postId, updates });

    const db = dbService.getDatabase();
    const now = Date.now();

    // Construir query dinamicamente baseado nos campos fornecidos
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.caption !== undefined) {
      fields.push('caption = ?');
      values.push(updates.caption);
    }
    if (updates.hashtags !== undefined) {
      fields.push('hashtags = ?');
      values.push(updates.hashtags);
    }
    if (updates.scheduledAt !== undefined) {
      fields.push('scheduled_at = ?');
      values.push(updates.scheduledAt);
    }
    if (updates.aspectRatio !== undefined) {
      fields.push('aspect_ratio = ?');
      values.push(updates.aspectRatio);
    }
    if (updates.locationName !== undefined) {
      fields.push('location_name = ?');
      values.push(updates.locationName);
    }
    if (updates.locationId !== undefined) {
      fields.push('location_id = ?');
      values.push(updates.locationId);
    }

    if (fields.length === 0) {
      logger.warn('instagram-queue', 'No fields to update');
      return false;
    }

    fields.push('updated_at = ?');
    values.push(now);

    values.push(postId);

    const result = db
      .prepare(
        `
      UPDATE scheduled_posts
      SET ${fields.join(', ')}
      WHERE id = ? AND status = 'pending'
    `
      )
      .run(...values);

    // Atualizar na fila se estiver presente
    const queueIndex = this.queue.findIndex((p) => p.id === postId);
    if (queueIndex !== -1) {
      Object.assign(this.queue[queueIndex], updates);
    }

    this.broadcastUpdate();

    return result.changes > 0;
  }

  /**
   * Obtém todos os posts agendados
   */
  getAllScheduledPosts(): ScheduledPost[] {
    const db = dbService.getDatabase();
    const rows = db
      .prepare(
        `
      SELECT * FROM scheduled_posts
      WHERE status IN ('pending', 'publishing', 'published', 'failed')
      ORDER BY scheduled_at ASC
    `
      )
      .all() as any[];

    return rows.map(this.mapRowToPost);
  }

  /**
   * Processa a fila de publicação
   */
  private async processQueue(): Promise<void> {
    if (this.isRunning) {
      logger.debug('instagram-queue', 'Queue already processing');
      return;
    }

    this.isRunning = true;
    logger.info('instagram-queue', 'Starting queue processing');

    while (this.queue.length > 0 || this.processing.size > 0) {
      // Processar até atingir concurrency limit
      while (this.queue.length > 0 && this.processing.size < this.CONCURRENCY) {
        const post = this.queue.shift();
        if (post) {
          this.processPost(post);
        }
      }

      // Aguardar um pouco antes de checar novamente
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.isRunning = false;
    logger.info('instagram-queue', 'Queue processing finished');
  }

  /**
   * Processa um post individual
   */
  private async processPost(post: ScheduledPost): Promise<void> {
    this.processing.add(post.id);
    const db = dbService.getDatabase();

    try {
      logger.info('instagram-queue', 'Processing post', {
        postId: post.id,
        assetId: post.assetId,
      });

      // Atualizar status para 'publishing'
      db.prepare(
        `
        UPDATE scheduled_posts
        SET status = 'publishing', updated_at = ?
        WHERE id = ?
      `
      ).run(Date.now(), post.id);

      this.broadcastUpdate();

      // Publicar no Instagram
      const result = await instagramPublisher.publishPost({
        assetId: post.assetId,
        caption: post.caption,
        hashtags: post.hashtags || undefined,
        aspectRatio: post.aspectRatio || undefined,
        locationId: post.locationId || undefined,
      });

      if (result.success && result.remoteId) {
        // Sucesso!
        logger.info('instagram-queue', 'Post published successfully', {
          postId: post.id,
          remoteId: result.remoteId,
        });

        const now = Date.now();

        // Atualizar post
        db.prepare(
          `
          UPDATE scheduled_posts
          SET status = 'published', remote_id = ?, updated_at = ?
          WHERE id = ?
        `
        ).run(result.remoteId, now, post.id);

        // Salvar no histórico
        db.prepare(
          `
          INSERT INTO publish_history
          (id, scheduled_post_id, published_at, remote_id, permalink, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        ).run(uuid(), post.id, now, result.remoteId, result.permalink || null, now);

        // Notificar sucesso
        notificationManager.success(
          'Post publicado!',
          `"${post.caption.slice(0, 50)}..." foi publicado no Instagram`
        );
      } else {
        // Falha
        logger.error('instagram-queue', 'Failed to publish post', {
          postId: post.id,
          error: result.error,
        });

        db.prepare(
          `
          UPDATE scheduled_posts
          SET status = 'failed', error_message = ?, updated_at = ?
          WHERE id = ?
        `
        ).run(result.error || 'Unknown error', Date.now(), post.id);

        // Notificar erro
        notificationManager.error('Falha ao publicar', result.error || 'Erro desconhecido');
      }
    } catch (error) {
      logger.error('instagram-queue', 'Processing error', {
        postId: post.id,
        error,
      });

      db.prepare(
        `
        UPDATE scheduled_posts
        SET status = 'failed', error_message = ?, updated_at = ?
        WHERE id = ?
      `
      ).run(error instanceof Error ? error.message : 'Unknown error', Date.now(), post.id);

      notificationManager.error('Erro ao processar post', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      this.processing.delete(post.id);
      this.broadcastUpdate();
    }
  }

  /**
   * Envia atualização para o renderer process
   */
  private broadcastUpdate(): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      win.webContents.send('instagram-posts-updated');
    });
  }

  /**
   * Mapeia row do DB para objeto ScheduledPost
   */
  private mapRowToPost(row: any): ScheduledPost {
    return {
      id: row.id,
      assetId: row.asset_id,
      scheduledAt: row.scheduled_at,
      caption: row.caption,
      hashtags: row.hashtags,
      locationName: row.location_name,
      locationId: row.location_id,
      aspectRatio: row.aspect_ratio,
      status: row.status,
      remoteId: row.remote_id,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Singleton instance
export const instagramQueue = new InstagramQueue();
