/**
 * Suggestion Service
 *
 * Analyzes user's photo library and provides smart, contextual suggestions
 * for actions like comparing similar photos and reviewing rejected photos.
 */

export interface Suggestion {
  id: string;
  type: 'review';
  title: string;
  message: string;
  actionLabel: string;
  action: () => void;
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
}

export interface SuggestionStats {
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
  private readonly REJECTED_THRESHOLD = 100;
  private readonly SIMILAR_CLUSTERS_THRESHOLD = 5;

  constructor() {
    this.loadDismissedSuggestions();
  }

  /**
   * Fetch suggestion statistics from backend
   */
  async fetchStats(): Promise<SuggestionStats> {
    try {
      // Guard: Check if Electron API is available
      if (!window.electronAPI) {
        console.warn('[SuggestionService] Electron API not available (dev mode without Electron)');
        return {
          rejectedCount: 0,
          similarClusters: 0,
        };
      }

      const result = await window.electronAPI.getSmartSuggestions();

      this.cachedStats = {
        rejectedCount: result.rejectedCount || 0,
        similarClusters: result.similarClusters || 0,
      };

      this.lastRefreshTime = Date.now();
      return this.cachedStats;
    } catch (error) {
      console.error('[SuggestionService] Fetch stats error:', error);
      return {
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
      onReview?: () => void;
    } = {}
  ): Promise<Suggestion[]> {
    const stats = await this.getStats();
    const suggestions: Suggestion[] = [];

    // Suggestion: Rejected photos review
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
