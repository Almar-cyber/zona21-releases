/**
 * Sound Effects Hook
 *
 * Provides sound effects for UI interactions using Web Audio API.
 * Generates synthetic sounds (no external files needed).
 *
 * Features:
 * - Milestone celebrations (chimes, fanfare)
 * - Success/error sounds
 * - Button clicks
 * - Notifications
 */

import { useCallback, useRef, useEffect } from 'react';

interface SoundEffectsOptions {
  enabled?: boolean;
  volume?: number; // 0-1
}

export function useSoundEffects(options: SoundEffectsOptions = {}) {
  const { enabled = true, volume = 0.3 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);

  // Update enabled ref when prop changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Initialize AudioContext
  useEffect(() => {
    if (typeof window !== 'undefined' && enabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [enabled]);

  // Play a tone with given frequency and duration
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabledRef.current || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Error playing tone:', error);
    }
  }, [volume]);

  // Success sound (ascending chime)
  const playSuccess = useCallback(() => {
    if (!enabledRef.current) return;

    playTone(523.25, 0.1); // C5
    setTimeout(() => playTone(659.25, 0.1), 100); // E5
    setTimeout(() => playTone(783.99, 0.15), 200); // G5
  }, [playTone]);

  // Error sound (descending buzz)
  const playError = useCallback(() => {
    if (!enabledRef.current) return;

    playTone(293.66, 0.1, 'square'); // D4
    setTimeout(() => playTone(220.00, 0.15, 'square'), 100); // A3
  }, [playTone]);

  // Milestone celebration (fanfare)
  const playMilestone = useCallback(() => {
    if (!enabledRef.current) return;

    // Triumphant chord progression
    playTone(261.63, 0.15); // C4
    playTone(329.63, 0.15); // E4
    playTone(392.00, 0.15); // G4

    setTimeout(() => {
      playTone(523.25, 0.15); // C5
      playTone(659.25, 0.15); // E5
      playTone(783.99, 0.15); // G5
    }, 150);

    setTimeout(() => {
      playTone(1046.50, 0.3); // C6
    }, 300);
  }, [playTone]);

  // Notification sound (gentle ping)
  const playNotification = useCallback(() => {
    if (!enabledRef.current) return;

    playTone(800, 0.08);
    setTimeout(() => playTone(1000, 0.08), 80);
  }, [playTone]);

  // Button click (subtle tick)
  const playClick = useCallback(() => {
    if (!enabledRef.current) return;

    playTone(1200, 0.03, 'square');
  }, [playTone]);

  // Completion sound (satisfying ding)
  const playComplete = useCallback(() => {
    if (!enabledRef.current) return;

    playTone(1046.50, 0.1); // C6
    setTimeout(() => playTone(1318.51, 0.15), 100); // E6
  }, [playTone]);

  // Undo sound (rewind)
  const playUndo = useCallback(() => {
    if (!enabledRef.current) return;

    playTone(800, 0.05);
    setTimeout(() => playTone(600, 0.05), 50);
    setTimeout(() => playTone(400, 0.05), 100);
  }, [playTone]);

  return {
    playSuccess,
    playError,
    playMilestone,
    playNotification,
    playClick,
    playComplete,
    playUndo,
    playTone,
  };
}
