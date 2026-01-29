import { dbService } from '../database';
import { logger } from '../logger';
import { instagramQueue } from './instagram-queue';

class InstagramScheduler {
  private interval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 30000; // 30 segundos
  private isChecking: boolean = false;

  /**
   * Inicia o scheduler
   */
  start(): void {
    if (this.interval) {
      logger.warn('instagram-scheduler', 'Scheduler already running');
      return;
    }

    logger.info('instagram-scheduler', 'Starting Instagram scheduler', {
      intervalMs: this.CHECK_INTERVAL_MS,
    });

    // Check imediatamente ao iniciar
    this.checkScheduledPosts();

    // Check a cada 30 segundos
    this.interval = setInterval(() => {
      this.checkScheduledPosts();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Para o scheduler
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('instagram-scheduler', 'Scheduler stopped');
    }
  }

  /**
   * Verifica posts que estão prontos para publicar
   */
  private async checkScheduledPosts(): Promise<void> {
    // Evitar múltiplas checagens simultâneas
    if (this.isChecking) {
      logger.debug('instagram-scheduler', 'Check already in progress, skipping');
      return;
    }

    this.isChecking = true;

    try {
      const now = Date.now();
      const db = dbService.getDatabase();

      // Buscar posts pendentes que já passaram do horário agendado
      const rows = db
        .prepare(
          `
        SELECT COUNT(*) as count
        FROM scheduled_posts
        WHERE status = 'pending' AND scheduled_at <= ?
      `
        )
        .get(now) as any;

      const count = rows?.count || 0;

      if (count > 0) {
        logger.info('instagram-scheduler', `Found ${count} post(s) ready to publish`, {
          now: new Date(now).toISOString(),
        });

        // Carregar fila - o queue manager cuida do resto
        await instagramQueue.loadQueue();
      } else {
        logger.debug('instagram-scheduler', 'No posts ready to publish');
      }
    } catch (error) {
      logger.error('instagram-scheduler', 'Error checking scheduled posts', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Força uma verificação imediata (útil para testes)
   */
  async forceCheck(): Promise<void> {
    logger.info('instagram-scheduler', 'Force checking scheduled posts');
    await this.checkScheduledPosts();
  }
}

// Singleton instance
export const instagramScheduler = new InstagramScheduler();
