import { useCallback, useState, useEffect } from 'react';
import { celebrationService, ConfettiPreset } from '../services/celebration-service';

/**
 * React hook for celebration management
 */
export function useCelebration() {
  const [soundEnabled, setSoundEnabledState] = useState(celebrationService.getSoundEnabled());

  // Sync state with service on mount
  useEffect(() => {
    setSoundEnabledState(celebrationService.getSoundEnabled());
  }, []);

  /**
   * Trigger full celebration (confetti + sound)
   */
  const celebrate = useCallback((
    type: 'milestone' | 'batch' | 'compare',
    preset: ConfettiPreset = 'default',
  ) => {
    celebrationService.celebrate(type, preset);
  }, []);

  /**
   * Play confetti only
   */
  const playConfetti = useCallback((preset: ConfettiPreset = 'default') => {
    celebrationService.playConfetti(preset);
  }, []);

  /**
   * Play sound only
   */
  const playSound = useCallback((event: 'milestone' | 'batch-complete' | 'compare-decision') => {
    celebrationService.playSound(event);
  }, []);

  /**
   * Toggle sound effects
   */
  const setSoundEnabled = useCallback((enabled: boolean) => {
    celebrationService.setSoundEnabled(enabled);
    setSoundEnabledState(enabled);
  }, []);

  return {
    celebrate,
    playConfetti,
    playSound,
    soundEnabled,
    setSoundEnabled,
  };
}
