import { useCallback, useState, useEffect } from 'react';
import { celebrationService, ConfettiPreset } from '../services/celebration-service';

/**
 * React hook for celebration management
 */
export function useCelebration() {
  const [soundEnabled, setSoundEnabledState] = useState(celebrationService.getSoundEnabled());
  const [hapticEnabled, setHapticEnabledState] = useState(celebrationService.getHapticEnabled());

  // Sync state with service on mount
  useEffect(() => {
    setSoundEnabledState(celebrationService.getSoundEnabled());
    setHapticEnabledState(celebrationService.getHapticEnabled());
  }, []);

  /**
   * Trigger full celebration (confetti + sound + haptic)
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
   * Play haptic feedback only
   */
  const playHaptic = useCallback((event: 'milestone' | 'batch-complete' | 'compare-decision') => {
    celebrationService.playHaptic(event);
  }, []);

  /**
   * Toggle sound effects
   */
  const setSoundEnabled = useCallback((enabled: boolean) => {
    celebrationService.setSoundEnabled(enabled);
    setSoundEnabledState(enabled);
  }, []);

  /**
   * Toggle haptic feedback
   */
  const setHapticEnabled = useCallback((enabled: boolean) => {
    celebrationService.setHapticEnabled(enabled);
    setHapticEnabledState(enabled);
  }, []);

  return {
    celebrate,
    playConfetti,
    playSound,
    playHaptic,
    soundEnabled,
    setSoundEnabled,
    hapticEnabled,
    setHapticEnabled,
  };
}
