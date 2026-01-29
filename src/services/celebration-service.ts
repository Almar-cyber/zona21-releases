// TODO: Uncomment when canvas-confetti is installed
// import confetti from 'canvas-confetti';
import { onboardingService } from './onboarding-service';

export type ConfettiPreset = 'default' | 'epic' | 'subtle';
export type SoundEvent = 'milestone' | 'batch-complete' | 'compare-decision';

class CelebrationService {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = false;

  constructor() {
    // Load sound preference from localStorage
    const savedPref = localStorage.getItem('zona21-sound-enabled');
    this.soundEnabled = savedPref === 'true';
  }

  /**
   * Play confetti animation with specified preset
   */
  playConfetti(preset: ConfettiPreset = 'default'): void {
    const configs = {
      subtle: {
        particleCount: 10,
        spread: 30,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      },
      default: {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#A78BFA'],
      },
      epic: {
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        startVelocity: 45,
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#A78BFA', '#F97316'],
      },
    };

    const config = configs[preset];

    // TODO: Replace with actual canvas-confetti when installed
    // confetti(config);
    console.log('[CelebrationService] Confetti triggered:', preset, config);

    // Track celebration event
    onboardingService.trackEvent('celebration-shown', { preset });
  }

  /**
   * Play epic confetti with multiple bursts
   */
  playEpicConfetti(): void {
    this.playConfetti('epic');

    // Additional bursts for epic celebration
    setTimeout(() => this.playConfetti('default'), 200);
    setTimeout(() => this.playConfetti('default'), 400);
  }

  /**
   * Play sound effect for specific event
   */
  playSound(event: SoundEvent): void {
    if (!this.soundEnabled) {
      return;
    }

    try {
      // Lazy-load AudioContext
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Create oscillator for sound synthesis
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Sound configurations
      const sounds = {
        milestone: {
          frequency: 800,
          endFrequency: 1200,
          duration: 0.3,
          type: 'sine' as OscillatorType,
        },
        'batch-complete': {
          frequency: 600,
          endFrequency: 1000,
          duration: 0.2,
          type: 'triangle' as OscillatorType,
        },
        'compare-decision': {
          frequency: 700,
          endFrequency: 900,
          duration: 0.15,
          type: 'sine' as OscillatorType,
        },
      };

      const sound = sounds[event];

      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(sound.endFrequency, now + sound.duration);

      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + sound.duration);

      oscillator.start(now);
      oscillator.stop(now + sound.duration);

      // Track sound event
      onboardingService.trackEvent('celebration-sound-played', { event });
    } catch (error) {
      console.error('[CelebrationService] Sound playback error:', error);
    }
  }

  /**
   * Enable/disable sound effects
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('zona21-sound-enabled', String(enabled));
  }

  /**
   * Get sound enabled state
   */
  getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Determine if celebration should be shown based on context
   */
  shouldCelebrate(context: 'batch-complete' | 'compare-decision' | 'milestone'): boolean {
    const state = onboardingService.getState();

    // Respect user's onboarding intensity preference
    if (state.settings.intensity === 'off') {
      return false;
    }

    // Show fewer celebrations for minimal mode
    if (state.settings.intensity === 'minimal' && context !== 'milestone') {
      return false;
    }

    return true;
  }

  /**
   * Full celebration with confetti and sound
   */
  celebrate(
    type: 'milestone' | 'batch' | 'compare',
    preset: ConfettiPreset = 'default',
  ): void {
    const contextMap = {
      milestone: 'milestone' as const,
      batch: 'batch-complete' as const,
      compare: 'compare-decision' as const,
    };

    const context = contextMap[type];

    if (!this.shouldCelebrate(context)) {
      return;
    }

    // Play confetti
    if (preset === 'epic') {
      this.playEpicConfetti();
    } else {
      this.playConfetti(preset);
    }

    // Play sound
    this.playSound(context);
  }
}

// Export singleton instance
export const celebrationService = new CelebrationService();
