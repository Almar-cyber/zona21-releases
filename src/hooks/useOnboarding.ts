/**
 * useOnboarding Hook
 *
 * Hook React para integração com o onboarding service
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  onboardingService,
  OnboardingState,
  Milestone
} from '../services/onboarding-service';

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(onboardingService.getState());

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = onboardingService.subscribe(setState);
    return () => { unsubscribe(); };
  }, []);

  const trackEvent = useCallback((event: string, metadata?: Record<string, any>) => {
    onboardingService.trackEvent(event, metadata);
  }, []);

  const shouldShowTooltip = useCallback((tooltipId: string, showOnce?: boolean) => {
    return onboardingService.shouldShowTooltip(tooltipId, {
      id: tooltipId,
      showOnce: showOnce || false
    });
  }, []);

  const markTooltipSeen = useCallback((tooltipId: string) => {
    onboardingService.markTooltipSeen(tooltipId);
  }, []);

  const updateChecklistItem = useCallback((itemId: string, completed: boolean) => {
    onboardingService.updateChecklistItem(itemId, completed);
  }, []);

  const checklistProgress = onboardingService.getChecklistProgress();

  const insights = onboardingService.getInsights();

  return {
    state,
    trackEvent,
    shouldShowTooltip,
    markTooltipSeen,
    updateChecklistItem,
    checklistProgress,
    insights,
    stats: state.stats,
    achievedMilestones: state.achievedMilestones
  };
}

// Hook específico para checklist
export function useChecklist() {
  const { state, updateChecklistItem } = useOnboarding();

  const items = useMemo(() => [
    {
      id: 'import-folder',
      label: 'Importar primeira pasta',
      completed: state.checklistProgress['import-folder'] || false
    },
    {
      id: 'mark-5-photos',
      label: 'Marcar 5 fotos',
      completed: state.checklistProgress['mark-5-photos'] || false
    },
    {
      id: 'use-keyboard',
      label: 'Usar atalhos de teclado',
      completed: state.checklistProgress['use-keyboard'] || false
    },
    {
      id: 'export-project',
      label: 'Exportar para editor',
      completed: state.checklistProgress['export-project'] || false
    }
  ], [state.checklistProgress]);

  // Calcular progress baseado nos items (sincronizado com state)
  const progress = useMemo(() => {
    const completed = items.filter(item => item.completed).length;
    return { completed, total: items.length };
  }, [items]);

  const isComplete = progress.completed === progress.total;

  return {
    items,
    progress,
    isComplete,
    updateItem: updateChecklistItem
  };
}

// Hook para milestones
export function useMilestones() {
  const [newMilestones, setNewMilestones] = useState<Milestone[]>([]);
  const { state } = useOnboarding();

  useEffect(() => {
    // Verificar novos milestones periodicamente
    const checkInterval = setInterval(() => {
      const achieved = onboardingService.checkMilestones();
      if (achieved.length > 0) {
        setNewMilestones(prev => [...prev, ...achieved]);
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, []);

  const dismissMilestone = useCallback((milestoneId: string) => {
    setNewMilestones(prev => prev.filter(m => m.id !== milestoneId));
  }, []);

  return {
    newMilestones,
    dismissMilestone,
    achievedMilestones: state.achievedMilestones
  };
}
