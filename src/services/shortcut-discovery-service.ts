/**
 * Shortcut Discovery Service
 *
 * Tracks user interaction patterns (mouse vs keyboard) and provides
 * contextual suggestions to help users discover keyboard shortcuts.
 */

import { onboardingService } from './onboarding-service';

export type ShortcutSuggestion = {
  id: string;
  message: string;
  shortcut: string;
  action?: () => void;
};

class ShortcutDiscoveryService {
  private mouseClickCount: number = 0;
  private keyboardUseCount: number = 0;
  private consecutiveMouseActions: number = 0;
  private lastSuggestionTime: number = 0;
  private lastKeyboardUseAt: number = 0;
  private dismissedSuggestions: Set<string> = new Set();
  private suggestionCallbacks: Array<(suggestion: ShortcutSuggestion) => void> = [];

  // Cooldown between suggestions (5 minutes)
  private readonly SUGGESTION_COOLDOWN = 5 * 60 * 1000;

  // Threshold for consecutive mouse actions before suggesting
  private readonly MOUSE_ACTION_THRESHOLD = 10;

  constructor() {
    this.loadDismissedSuggestions();
  }

  /**
   * Track mouse interaction
   */
  trackMouseAction(context?: string): void {
    this.mouseClickCount++;
    this.consecutiveMouseActions++;

    // Reset consecutive count if user recently used keyboard
    if (this.lastKeyboardUseAt && Date.now() - this.lastKeyboardUseAt < 10000) {
      this.consecutiveMouseActions = 0;
    }

    // Check if we should suggest keyboard shortcuts
    if (this.consecutiveMouseActions >= this.MOUSE_ACTION_THRESHOLD) {
      this.checkForSuggestion(context);
      this.consecutiveMouseActions = 0; // Reset after suggestion
    }
  }

  /**
   * Track keyboard shortcut use
   */
  trackKeyboardAction(shortcut: string): void {
    this.keyboardUseCount++;
    this.consecutiveMouseActions = 0; // Reset mouse counter
    this.lastKeyboardUseAt = Date.now();

    // Track in onboarding service
    onboardingService.trackEvent('keyboard-shortcut-used', { shortcut });
  }

  /**
   * Check if we should show a suggestion
   */
  private checkForSuggestion(context?: string): void {
    const now = Date.now();

    // Cooldown check
    if (now - this.lastSuggestionTime < this.SUGGESTION_COOLDOWN) {
      return;
    }

    const suggestion = this.getSuggestedShortcut(context);
    if (suggestion && !this.dismissedSuggestions.has(suggestion.id)) {
      this.lastSuggestionTime = now;
      this.notifySuggestion(suggestion);
    }
  }

  /**
   * Get suggested shortcut based on context and usage patterns
   */
  getSuggestedShortcut(context?: string): ShortcutSuggestion | null {
    // Context reserved for future context-aware suggestions
    void context;

    const state = onboardingService.getState();
    const totalUsage = state.stats.keyboardUsageCount + state.stats.mouseUsageCount;
    const keyboardUsageRate = totalUsage > 0 ? (state.stats.keyboardUsageCount / totalUsage) * 100 : 0;

    // Only suggest if keyboard usage is low
    if (keyboardUsageRate > 50) {
      return null;
    }

    // Context-specific suggestions
    const suggestions: ShortcutSuggestion[] = [
      {
        id: 'nav-arrows',
        message: 'Dica: Use as setas ← → para navegar mais rápido entre fotos',
        shortcut: '← →',
      },
      {
        id: 'mark-favorite',
        message: 'Dica: Pressione F para marcar fotos como favoritas rapidamente',
        shortcut: 'F',
      },
      {
        id: 'approve-reject',
        message: 'Dica: Use A para aprovar e D para descartar fotos sem usar o mouse',
        shortcut: 'A / D',
      },
      {
        id: 'open-viewer',
        message: 'Dica: Pressione Enter para abrir detalhes da foto selecionada',
        shortcut: 'Enter',
      },
      {
        id: 'compare-mode',
        message: 'Dica: Pressione ⌘C (Ctrl+C) para comparar fotos selecionadas',
        shortcut: '⌘C',
      },
      {
        id: 'shortcuts-help',
        message: 'Dica: Pressione ? para ver todos os atalhos de teclado disponíveis',
        shortcut: '?',
      },
    ];

    // Filter out dismissed suggestions
    const availableSuggestions = suggestions.filter(
      (s) => !this.dismissedSuggestions.has(s.id)
    );

    if (availableSuggestions.length === 0) {
      return null;
    }

    // Return random suggestion from available ones
    const randomIndex = Math.floor(Math.random() * availableSuggestions.length);
    return availableSuggestions[randomIndex];
  }

  /**
   * Dismiss a suggestion permanently
   */
  dismissSuggestion(suggestionId: string): void {
    this.dismissedSuggestions.add(suggestionId);
    this.saveDismissedSuggestions();
  }

  /**
   * Register callback for suggestions
   */
  onSuggestion(callback: (suggestion: ShortcutSuggestion) => void): () => void {
    this.suggestionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.suggestionCallbacks.indexOf(callback);
      if (index > -1) {
        this.suggestionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of a new suggestion
   */
  private notifySuggestion(suggestion: ShortcutSuggestion): void {
    this.suggestionCallbacks.forEach((callback) => {
      try {
        callback(suggestion);
      } catch (error) {
        console.error('[ShortcutDiscoveryService] Callback error:', error);
      }
    });
  }

  /**
   * Get current usage statistics
   */
  getStats() {
    const total = this.mouseClickCount + this.keyboardUseCount;
    const keyboardRate = total > 0 ? Math.round((this.keyboardUseCount / total) * 100) : 0;

    return {
      mouseClickCount: this.mouseClickCount,
      keyboardUseCount: this.keyboardUseCount,
      keyboardUsageRate: keyboardRate,
      consecutiveMouseActions: this.consecutiveMouseActions,
    };
  }

  /**
   * Reset all statistics (for testing)
   */
  reset(): void {
    this.mouseClickCount = 0;
    this.keyboardUseCount = 0;
    this.consecutiveMouseActions = 0;
    this.lastSuggestionTime = 0;
  }

  /**
   * Load dismissed suggestions from localStorage
   */
  private loadDismissedSuggestions(): void {
    try {
      const saved = localStorage.getItem('zona21-dismissed-shortcut-suggestions');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.dismissedSuggestions = new Set(parsed);
      }
    } catch (error) {
      console.error('[ShortcutDiscoveryService] Load error:', error);
    }
  }

  /**
   * Save dismissed suggestions to localStorage
   */
  private saveDismissedSuggestions(): void {
    try {
      const array = Array.from(this.dismissedSuggestions);
      localStorage.setItem('zona21-dismissed-shortcut-suggestions', JSON.stringify(array));
    } catch (error) {
      console.error('[ShortcutDiscoveryService] Save error:', error);
    }
  }
}

// Export singleton instance
export const shortcutDiscoveryService = new ShortcutDiscoveryService();
