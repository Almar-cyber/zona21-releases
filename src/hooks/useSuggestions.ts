/**
 * useSuggestions Hook
 *
 * React hook for managing smart suggestions in the UI
 */

import { useState, useCallback, useEffect } from 'react';
import { suggestionService, Suggestion, SuggestionStats } from '../services/suggestion-service';

export interface UseSuggestionsReturn {
  suggestions: Suggestion[];
  stats: SuggestionStats | null;
  isLoading: boolean;
  refreshSuggestions: () => Promise<void>;
  dismissSuggestion: (id: string, permanent?: boolean) => void;
  clearAll: () => void;
}

export function useSuggestions(callbacks?: {
  onSchedule?: () => void;
  onReview?: () => void;
}): UseSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<SuggestionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Refresh suggestions from backend
   */
  const refreshSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const fetchedStats = await suggestionService.getStats(true);
      setStats(fetchedStats);

      // Analyze and generate suggestions
      const newSuggestions = await suggestionService.analyzeSuggestions(callbacks);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('[useSuggestions] Refresh error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [callbacks]);

  /**
   * Dismiss a suggestion
   */
  const dismissSuggestion = useCallback((id: string, permanent = false) => {
    // Remove from UI immediately
    setSuggestions((prev) => prev.filter((s) => s.id !== id));

    // Mark as dismissed in service
    suggestionService.dismissSuggestion(id, permanent ? 'permanent' : 'session');
  }, []);

  /**
   * Clear all suggestions
   */
  const clearAll = useCallback(() => {
    setSuggestions([]);
    suggestionService.clearDismissed();
  }, []);

  // Initial load on mount
  useEffect(() => {
    refreshSuggestions();
  }, []); // Empty deps - only run once on mount

  return {
    suggestions,
    stats,
    isLoading,
    refreshSuggestions,
    dismissSuggestion,
    clearAll,
  };
}
