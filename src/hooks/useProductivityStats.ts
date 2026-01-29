/**
 * Hook for Productivity Stats & Milestones
 *
 * Tracks user productivity metrics and milestones for growth/delight features:
 * - Photos organized (culled, approved, rejected)
 * - Time saved (batch operations, quick edits)
 * - Posts scheduled (Instagram)
 * - Usage streak (consecutive days)
 * - Milestones achieved (100, 500, 1000 photos, etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ProductivityStats {
  // Photos
  photosOrganized: number;
  photosApproved: number;
  photosRejected: number;
  photosCulled: number;

  // Edits
  quickEditsApplied: number;
  batchEditsApplied: number;
  videosProcessed: number;

  // Social
  instagramPostsScheduled: number;
  instagramPostsPublished: number;

  // Time saved (in seconds)
  timeSavedTotal: number;
  timeSavedBatch: number;
  timeSavedQuickEdit: number;
  timeSavedVideoTrim: number;

  // Engagement
  lastUsedDate: string | null; // ISO date
  streakDays: number;
  totalDaysUsed: number;
  firstUsedDate: string | null;
}

export interface Milestone {
  id: string;
  type: 'photos' | 'edits' | 'social' | 'streak' | 'time';
  title: string;
  description: string;
  threshold: number;
  achieved: boolean;
  achievedAt: string | null;
  icon: string;
  color: string;
}

const MILESTONES: Omit<Milestone, 'achieved' | 'achievedAt'>[] = [
  // Photos milestones
  { id: 'photos_100', type: 'photos', title: 'Primeira Centena!', description: 'Organizou 100 fotos', threshold: 100, icon: '📸', color: 'blue' },
  { id: 'photos_500', type: 'photos', title: 'Meio Milhar!', description: 'Organizou 500 fotos', threshold: 500, icon: '🎯', color: 'purple' },
  { id: 'photos_1000', type: 'photos', title: 'Mil Fotos!', description: 'Organizou 1.000 fotos', threshold: 1000, icon: '🏆', color: 'gold' },
  { id: 'photos_5000', type: 'photos', title: 'Mestre Organizador!', description: 'Organizou 5.000 fotos', threshold: 5000, icon: '👑', color: 'gold' },

  // Edits milestones
  { id: 'edits_50', type: 'edits', title: 'Editor Rápido', description: 'Aplicou 50 edições', threshold: 50, icon: '✨', color: 'green' },
  { id: 'edits_200', type: 'edits', title: 'Mestre da Edição', description: 'Aplicou 200 edições', threshold: 200, icon: '🎨', color: 'green' },

  // Social milestones
  { id: 'social_10', type: 'social', title: 'Social Star', description: 'Agendou 10 posts no Instagram', threshold: 10, icon: '📱', color: 'pink' },
  { id: 'social_50', type: 'social', title: 'Influenciador', description: 'Agendou 50 posts no Instagram', threshold: 50, icon: '🌟', color: 'pink' },

  // Streak milestones
  { id: 'streak_3', type: 'streak', title: 'Consistente!', description: '3 dias seguidos', threshold: 3, icon: '🔥', color: 'orange' },
  { id: 'streak_7', type: 'streak', title: 'Semana Completa!', description: '7 dias seguidos', threshold: 7, icon: '🔥', color: 'orange' },
  { id: 'streak_30', type: 'streak', title: 'Mês Inteiro!', description: '30 dias seguidos', threshold: 30, icon: '🔥', color: 'orange' },

  // Time saved milestones
  { id: 'time_1h', type: 'time', title: 'Tempo é Ouro!', description: 'Economizou 1 hora', threshold: 3600, icon: '⏱️', color: 'cyan' },
  { id: 'time_10h', type: 'time', title: 'Produtividade++', description: 'Economizou 10 horas', threshold: 36000, icon: '⚡', color: 'cyan' },
];

export function useProductivityStats() {
  const [stats, setStats] = useState<ProductivityStats>({
    photosOrganized: 0,
    photosApproved: 0,
    photosRejected: 0,
    photosCulled: 0,
    quickEditsApplied: 0,
    batchEditsApplied: 0,
    videosProcessed: 0,
    instagramPostsScheduled: 0,
    instagramPostsPublished: 0,
    timeSavedTotal: 0,
    timeSavedBatch: 0,
    timeSavedQuickEdit: 0,
    timeSavedVideoTrim: 0,
    lastUsedDate: null,
    streakDays: 0,
    totalDaysUsed: 0,
    firstUsedDate: null,
  });

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestones, setNewMilestones] = useState<Milestone[]>([]);

  // Debounce timer for localStorage writes
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save to localStorage
  const debouncedSave = useCallback((statsToSave: ProductivityStats) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem('zona21_productivity_stats', JSON.stringify(statsToSave));
      saveTimerRef.current = null;
    }, 1000); // 1 second debounce
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        // Force immediate save on unmount
        localStorage.setItem('zona21_productivity_stats', JSON.stringify(stats));
      }
    };
  }, [stats]);

  // Load stats from localStorage
  useEffect(() => {
    const loadStats = () => {
      try {
        const saved = localStorage.getItem('zona21_productivity_stats');
        if (saved) {
          const parsed = JSON.parse(saved);
          setStats(parsed);
          updateStreak(parsed);
        } else {
          // First time user
          const initialStats = {
            ...stats,
            firstUsedDate: new Date().toISOString(),
            lastUsedDate: new Date().toISOString(),
            totalDaysUsed: 1,
            streakDays: 1,
          };
          setStats(initialStats);
          localStorage.setItem('zona21_productivity_stats', JSON.stringify(initialStats));
        }
      } catch (error) {
        console.error('Failed to load productivity stats:', error);
      }
    };

    loadStats();
  }, []);

  // Update streak based on last used date
  const updateStreak = (currentStats: ProductivityStats) => {
    if (!currentStats.lastUsedDate) return currentStats;

    const now = new Date();
    const lastUsed = new Date(currentStats.lastUsedDate);
    const daysDiff = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));

    let updated = { ...currentStats };

    if (daysDiff === 0) {
      // Same day, no change
      return updated;
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      updated.streakDays += 1;
      updated.totalDaysUsed += 1;
    } else {
      // Streak broken, reset to 1
      updated.streakDays = 1;
      updated.totalDaysUsed += 1;
    }

    updated.lastUsedDate = now.toISOString();
    setStats(updated);
    localStorage.setItem('zona21_productivity_stats', JSON.stringify(updated));

    return updated;
  };

  // Check for milestone achievements
  useEffect(() => {
    const achievedMilestones: Milestone[] = MILESTONES.map(m => {
      let currentValue = 0;

      switch (m.type) {
        case 'photos':
          currentValue = stats.photosOrganized;
          break;
        case 'edits':
          currentValue = stats.quickEditsApplied + stats.batchEditsApplied;
          break;
        case 'social':
          currentValue = stats.instagramPostsScheduled;
          break;
        case 'streak':
          currentValue = stats.streakDays;
          break;
        case 'time':
          currentValue = stats.timeSavedTotal;
          break;
      }

      const achieved = currentValue >= m.threshold;
      const previous = milestones.find(prev => prev.id === m.id);
      const achievedAt = achieved && !previous?.achieved ? new Date().toISOString() : previous?.achievedAt || null;

      return {
        ...m,
        achieved,
        achievedAt,
      };
    });

    // Find newly achieved milestones
    const newlyAchieved = achievedMilestones.filter(m => {
      const prev = milestones.find(p => p.id === m.id);
      return m.achieved && (!prev || !prev.achieved);
    });

    if (newlyAchieved.length > 0) {
      setNewMilestones(prev => [...prev, ...newlyAchieved]);
    }

    setMilestones(achievedMilestones);
  }, [stats]);

  // Increment stats
  const incrementPhotosOrganized = useCallback((count: number = 1) => {
    setStats(prev => {
      const updated = {
        ...prev,
        photosOrganized: prev.photosOrganized + count,
      };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const incrementApproved = useCallback((count: number = 1) => {
    setStats(prev => {
      const updated = {
        ...prev,
        photosApproved: prev.photosApproved + count,
        photosOrganized: prev.photosOrganized + count,
      };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const incrementRejected = useCallback((count: number = 1) => {
    setStats(prev => {
      const updated = {
        ...prev,
        photosRejected: prev.photosRejected + count,
        photosOrganized: prev.photosOrganized + count,
      };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const incrementQuickEdits = useCallback((count: number = 1) => {
    setStats(prev => {
      const updated = {
        ...prev,
        quickEditsApplied: prev.quickEditsApplied + count,
      };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const incrementBatchEdits = useCallback((count: number = 1) => {
    setStats(prev => {
      const updated = {
        ...prev,
        batchEditsApplied: prev.batchEditsApplied + count,
      };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const incrementVideosProcessed = useCallback((count: number = 1) => {
    setStats(prev => {
      const updated = {
        ...prev,
        videosProcessed: prev.videosProcessed + count,
      };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const incrementInstagramScheduled = useCallback((count: number = 1) => {
    setStats(prev => {
      const updated = {
        ...prev,
        instagramPostsScheduled: prev.instagramPostsScheduled + count,
      };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const addTimeSaved = useCallback((seconds: number, category: 'batch' | 'quickEdit' | 'videoTrim') => {
    setStats(prev => {
      const updated = {
        ...prev,
        timeSavedTotal: prev.timeSavedTotal + seconds,
        [`timeSaved${category.charAt(0).toUpperCase() + category.slice(1)}`]:
          prev[`timeSaved${category.charAt(0).toUpperCase() + category.slice(1)}` as keyof ProductivityStats] as number + seconds,
      };
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  // Clear new milestones notification
  const clearNewMilestones = useCallback(() => {
    setNewMilestones([]);
  }, []);

  // Format time saved
  const formatTimeSaved = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${mins}min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
  }, []);

  return {
    stats,
    milestones,
    newMilestones,
    incrementPhotosOrganized,
    incrementApproved,
    incrementRejected,
    incrementQuickEdits,
    incrementBatchEdits,
    incrementVideosProcessed,
    incrementInstagramScheduled,
    addTimeSaved,
    clearNewMilestones,
    formatTimeSaved,
  };
}
