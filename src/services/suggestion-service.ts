/**
 * Suggestion Service
 *
 * Analyzes user's photo library and provides smart, contextual suggestions
 * for actions like comparing similar photos, scheduling Instagram posts,
 * and reviewing rejected photos.
 */

export interface Suggestion {
  id: string;
  type: 'compare' | 'schedule' | 'review';
  title: string;
  message: string;
  actionLabel: string;
  action: () => void;
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
}

export interface SuggestionStats {
  instagramReady: number;
  rejectedCount: number;
  similarClusters: number;
}

class SuggestionService {
  private dismissedSuggestions: Set<string> = new Set();
  private lastRefreshTime: number = 0;
  private cachedStats: SuggestionStats | null = null;

  // Cache duration: 5 minutes
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  // Thresholds for suggestions
  private readonly INSTAGRAM_THRESHOLD = 5;
  private readonly REJECTED_THRESHOLD = 50;
  private readonly SIMILAR_CLUSTERS_THRESHOLD = 3;

  constructor() {
    this.loadDismissedSuggestions();
  }

  /**
   * Fetch suggestion statistics from backend
   */
  async fetchStats(): Promise<SuggestionStats> {
    try {
      const result = await window.electron.ipcRenderer.invoke('get-smart-suggestions');

      this.cachedStats = {
        instagramReady: result.instagramReady || 0,
        rejectedCount: result.rejectedCount || 0,
        similarClusters: result.similarClusters || 0,
      };

      this.lastRefreshTime = Date.now();
      return this.cachedStats;
    } catch (error) {
      console.error('[SuggestionService] Fetch stats error:', error);
      return {
        instagramReady: 0,
        rejectedCount: 0,
        similarClusters: 0,
      };
    }
  }

  /**
   * Get cached stats or fetch if stale
   */
  async getStats(forceRefresh = false): Promise<SuggestionStats> {
    const now = Date.now();
    const cacheIsStale = now - this.lastRefreshTime > this.CACHE_DURATION;

    if (forceRefresh || !this.cachedStats || cacheIsStale) {
      return await this.fetchStats();
    }

    return this.cachedStats;
  }

  /**
   * Analyze library and generate suggestions
   */
  async analyzeSuggestions(
    callbacks: {
      onCompare?: () => void;
      onSchedule?: () => void;
      onReview?: () => void;
    } = {}
  ): Promise<Suggestion[]> {
    const stats = await this.getStats();
    const suggestions: Suggestion[] = [];

    // Suggestion 1: Similar photos
    if (
      stats.similarClusters >= this.SIMILAR_CLUSTERS_THRESHOLD &&
      !this.dismissedSuggestions.has('similar-photos')
    ) {
      suggestions.push({
        id: 'similar-photos',
        type: 'compare',
        title: `${stats.similarClusters} grupos de fotos similares`,
        message: `Você tem ${stats.similarClusters} grupos de fotos que parecem similares. Quer comparar e escolher as melhores?`,
        actionLabel: 'Revisar',
        action: callbacks.onCompare || (() => {}),
        priority: stats.similarClusters > 10 ? 'high' : 'medium',
        dismissible: true,
      });
    }

    // Suggestion 2: Instagram-ready photos
    if (
      stats.instagramReady >= this.INSTAGRAM_THRESHOLD &&
      !this.dismissedSuggestions.has('instagram-ready')
    ) {
      suggestions.push({
        id: 'instagram-ready',
        type: 'schedule',
        title: `${stats.instagramReady} fotos prontas para Instagram`,
        message: `Você tem ${stats.instagramReady} fotos aprovadas no formato ideal para Instagram. Quer agendar publicações?`,
        actionLabel: 'Agendar',
        action: callbacks.onSchedule || (() => {}),
        priority: stats.instagramReady > 20 ? 'high' : 'medium',
        dismissible: true,
      });
    }

    // Suggestion 3: Rejected photos review
    if (
      stats.rejectedCount >= this.REJECTED_THRESHOLD &&
      !this.dismissedSuggestions.has('review-rejected')
    ) {
      suggestions.push({
        id: 'review-rejected',
        type: 'review',
        title: `${stats.rejectedCount} fotos rejeitadas`,
        message: `Você tem ${stats.rejectedCount} fotos marcadas como rejeitadas. Quer revisar antes de limpar?`,
        actionLabel: 'Revisar',
        action: callbacks.onReview || (() => {}),
        priority: stats.rejectedCount > 200 ? 'high' : 'low',
        dismissible: true,
      });
    }

    // Sort by priority
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Dismiss a suggestion
   */
  dismissSuggestion(suggestionId: string, duration: 'session' | 'permanent' = 'session'): void {
    this.dismissedSuggestions.add(suggestionId);

    if (duration === 'permanent') {
      this.saveDismissedSuggestions();
    }
  }

  /**
   * Clear all dismissed suggestions (for session)
   */
  clearDismissed(): void {
    this.dismissedSuggestions.clear();
  }

  /**
   * Check if suggestion is dismissed
   */
  isDismissed(suggestionId: string): boolean {
    return this.dismissedSuggestions.has(suggestionId);
  }

  /**
   * Invalidate cache to force refresh on next request
   */
  invalidateCache(): void {
    this.cachedStats = null;
    this.lastRefreshTime = 0;
  }

  /**
   * Load dismissed suggestions from localStorage
   */
  private loadDismissedSuggestions(): void {
    try {
      const saved = localStorage.getItem('zona21-dismissed-suggestions');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.dismissedSuggestions = new Set(parsed);
      }
    } catch (error) {
      console.error('[SuggestionService] Load error:', error);
    }
  }

  /**
   * Save dismissed suggestions to localStorage
   */
  private saveDismissedSuggestions(): void {
    try {
      const array = Array.from(this.dismissedSuggestions);
      localStorage.setItem('zona21-dismissed-suggestions', JSON.stringify(array));
    } catch (error) {
      console.error('[SuggestionService] Save error:', error);
    }
  }
}

// Export singleton instance
export const suggestionService = new SuggestionService();
