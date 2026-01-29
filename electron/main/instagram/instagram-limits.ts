import { dbService } from '../database';
import { logger } from '../logger';

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
}

class InstagramLimits {
  private readonly FREE_TIER_POSTS_PER_MONTH = 5;

  /**
   * Verifica se o usuário pode agendar um novo post
   */
  async canSchedulePost(): Promise<LimitCheckResult> {
    logger.info('instagram-limits', 'Checking if user can schedule post');

    // 1. Verificar se é usuário Pro
    const isPro = await this.isProUser();
    if (isPro) {
      logger.info('instagram-limits', 'User is Pro, unlimited posts');
      return { allowed: true };
    }

    // 2. Free tier: verificar limite mensal
    const { count, limit } = await this.getMonthlyPostCount();

    logger.info('instagram-limits', 'Free tier check', { count, limit, remaining: limit - count });

    if (count >= limit) {
      return {
        allowed: false,
        reason: `Você atingiu o limite de ${limit} posts/mês do plano Free. Faça upgrade para Pro para posts ilimitados!`,
        remaining: 0,
        limit,
      };
    }

    return {
      allowed: true,
      remaining: limit - count,
      limit,
    };
  }

  /**
   * Obtém a contagem de posts do mês atual
   */
  private async getMonthlyPostCount(): Promise<{ count: number; limit: number }> {
    const db = dbService.getDatabase();

    // Primeiro dia do mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const firstDayTimestamp = firstDayOfMonth.getTime();

    // Contar posts criados este mês (pending, publishing, published)
    const result = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM scheduled_posts
      WHERE created_at >= ?
        AND status IN ('pending', 'publishing', 'published')
    `
      )
      .get(firstDayTimestamp) as any;

    return {
      count: result?.count || 0,
      limit: this.FREE_TIER_POSTS_PER_MONTH,
    };
  }

  /**
   * Verifica se o usuário é Pro
   * TODO: Integrar com sistema de subscription real quando implementado
   */
  private async isProUser(): Promise<boolean> {
    try {
      const db = dbService.getDatabase();

      // Verificar se existe tabela de subscriptions
      const tableExists = db
        .prepare(
          `
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='subscriptions'
      `
        )
        .get();

      if (!tableExists) {
        logger.debug('instagram-limits', 'Subscriptions table does not exist, user is free tier');
        return false;
      }

      // Verificar subscription ativa
      const subscription = db
        .prepare(
          `
        SELECT * FROM subscriptions
        WHERE status = 'active'
          AND (expires_at IS NULL OR expires_at > ?)
        LIMIT 1
      `
        )
        .get(Date.now()) as any;

      if (subscription) {
        logger.info('instagram-limits', 'User has active subscription', {
          plan: subscription.plan,
          expiresAt: subscription.expires_at ? new Date(subscription.expires_at).toISOString() : 'never',
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('instagram-limits', 'Error checking Pro status', error);
      // Em caso de erro, assumir free tier por segurança
      return false;
    }
  }

  /**
   * Obtém informações de uso do usuário
   */
  async getUsageInfo(): Promise<{
    isPro: boolean;
    monthlyCount: number;
    monthlyLimit: number;
    remaining: number;
  }> {
    const isPro = await this.isProUser();
    const { count, limit } = await this.getMonthlyPostCount();

    return {
      isPro,
      monthlyCount: count,
      monthlyLimit: limit,
      remaining: Math.max(0, limit - count),
    };
  }

  /**
   * Obtém o limite mensal baseado no plano do usuário
   */
  async getMonthlyLimit(): Promise<number> {
    const isPro = await this.isProUser();
    return isPro ? Infinity : this.FREE_TIER_POSTS_PER_MONTH;
  }

  /**
   * Verifica se deve mostrar o upgrade prompt
   */
  async shouldShowUpgradePrompt(): Promise<boolean> {
    const isPro = await this.isProUser();
    if (isPro) return false;

    const { count, limit } = await this.getMonthlyPostCount();

    // Mostrar prompt quando atingir o limite ou quando estiver perto (80%)
    return count >= limit * 0.8;
  }
}

// Singleton instance
export const instagramLimits = new InstagramLimits();
