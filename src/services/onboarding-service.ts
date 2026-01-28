/**
 * Onboarding Service
 *
 * Gerencia o estado de onboarding progressivo, tracking de tooltips,
 * milestones alcançados e estatísticas de uso.
 */

import { APP_VERSION } from '../version';

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingState {
  version: string;
  completedSteps: string[];
  seenTooltips: string[];
  dismissedTips: string[];
  achievedMilestones: string[];
  checklistProgress: Record<string, boolean>;
  stats: {
    photosMarked: number;
    photosApproved: number;
    photosFavorited: number;
    photosRejected: number;
    keyboardUsageCount: number;
    mouseUsageCount: number;
    aiFeatureUsageCount: Record<string, number>;
    sessionCount: number;
    totalTimeActive: number; // em segundos
    lastActiveAt: number; // timestamp
    firstUseAt: number; // timestamp
  };
}

export interface Milestone {
  id: string;
  trigger: {
    event: string;
    count?: number;
    threshold?: number;
    condition?: string;
  };
  title: string;
  description?: string;
  celebration?: boolean;
  stats?: Record<string, any>;
}

export interface TooltipConfig {
  id: string;
  showOnce: boolean;
  condition?: () => boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = `zona21-onboarding-state-${APP_VERSION}`;
const SESSION_START_KEY = 'zona21-session-start';

// Milestones padrão
export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'first-import',
    trigger: { event: 'folder-added', count: 1 },
    title: 'Primeira pasta importada!',
    description: 'Você está pronto para começar a marcar suas fotos',
    celebration: false
  },
  {
    id: 'first-10-marks',
    trigger: { event: 'asset-marked', count: 10 },
    title: 'Você está pegando o ritmo! 🎯',
    description: 'Experimente Shift+A para marcar e avançar automaticamente',
    celebration: false
  },
  {
    id: 'first-50-marks',
    trigger: { event: 'asset-marked', count: 50 },
    title: 'Curador Iniciante desbloqueado! 🌟',
    celebration: true
  },
  {
    id: 'first-100-marks',
    trigger: { event: 'asset-marked', count: 100 },
    title: 'Curador Intermediário desbloqueado! 🏆',
    celebration: true
  },
  {
    id: 'first-500-marks',
    trigger: { event: 'asset-marked', count: 500 },
    title: 'Curador Avançado desbloqueado! 💪',
    celebration: true
  },
  {
    id: 'first-1000-marks',
    trigger: { event: 'asset-marked', count: 1000 },
    title: 'Curador Expert desbloqueado! 🎉',
    celebration: true
  },
  {
    id: 'first-smart-culling',
    trigger: { event: 'smart-culling-used', count: 1 },
    title: 'Assistido por IA! ✨',
    description: 'Você descobriu o poder do Smart Culling',
    celebration: false
  },
  {
    id: 'keyboard-ninja',
    trigger: { event: 'keyboard-usage', threshold: 90 }, // 90% keyboard usage
    title: 'Keyboard Ninja! ⌨️',
    description: 'Você dominou os atalhos de teclado',
    celebration: true
  }
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

class OnboardingService {
  private state: OnboardingState;
  private listeners: Set<(state: OnboardingState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
    this.initSession();
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  private loadState(): OnboardingState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrar estado antigo se necessário
        return this.migrateState(parsed);
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }

    // Estado inicial
    return {
      version: APP_VERSION,
      completedSteps: [],
      seenTooltips: [],
      dismissedTips: [],
      achievedMilestones: [],
      checklistProgress: {},
      stats: {
        photosMarked: 0,
        photosApproved: 0,
        photosFavorited: 0,
        photosRejected: 0,
        keyboardUsageCount: 0,
        mouseUsageCount: 0,
        aiFeatureUsageCount: {},
        sessionCount: 0,
        totalTimeActive: 0,
        lastActiveAt: Date.now(),
        firstUseAt: Date.now()
      }
    };
  }

  private migrateState(oldState: any): OnboardingState {
    // Garantir que todos os campos existam
    return {
      version: APP_VERSION,
      completedSteps: oldState.completedSteps || [],
      seenTooltips: oldState.seenTooltips || [],
      dismissedTips: oldState.dismissedTips || [],
      achievedMilestones: oldState.achievedMilestones || [],
      checklistProgress: oldState.checklistProgress || {},
      stats: {
        photosMarked: oldState.stats?.photosMarked || 0,
        photosApproved: oldState.stats?.photosApproved || 0,
        photosFavorited: oldState.stats?.photosFavorited || 0,
        photosRejected: oldState.stats?.photosRejected || 0,
        keyboardUsageCount: oldState.stats?.keyboardUsageCount || 0,
        mouseUsageCount: oldState.stats?.mouseUsageCount || 0,
        aiFeatureUsageCount: oldState.stats?.aiFeatureUsageCount || {},
        sessionCount: oldState.stats?.sessionCount || 0,
        totalTimeActive: oldState.stats?.totalTimeActive || 0,
        lastActiveAt: oldState.stats?.lastActiveAt || Date.now(),
        firstUseAt: oldState.stats?.firstUseAt || Date.now()
      }
    };
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }

  getState(): OnboardingState {
    return { ...this.state };
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  private initSession() {
    // Incrementar contador de sessões
    this.state.stats.sessionCount += 1;
    this.state.stats.lastActiveAt = Date.now();

    // Marcar início da sessão
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());

    // Salvar tempo ativo ao fechar
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    this.saveState();
  }

  private endSession() {
    const startTime = parseInt(sessionStorage.getItem(SESSION_START_KEY) || '0', 10);
    if (startTime > 0) {
      const sessionDuration = Math.floor((Date.now() - startTime) / 1000);
      this.state.stats.totalTimeActive += sessionDuration;
      this.saveState();
    }
  }

  // ==========================================================================
  // TOOLTIPS
  // ==========================================================================

  shouldShowTooltip(tooltipId: string, config?: TooltipConfig): boolean {
    // Se já foi visto e é "show once", não mostrar
    if (config?.showOnce && this.state.seenTooltips.includes(tooltipId)) {
      return false;
    }

    // Verificar condição customizada
    if (config?.condition && !config.condition()) {
      return false;
    }

    return true;
  }

  markTooltipSeen(tooltipId: string) {
    if (!this.state.seenTooltips.includes(tooltipId)) {
      this.state.seenTooltips.push(tooltipId);
      this.saveState();
    }
  }

  resetTooltip(tooltipId: string) {
    this.state.seenTooltips = this.state.seenTooltips.filter(id => id !== tooltipId);
    this.saveState();
  }

  // ==========================================================================
  // TRACKING
  // ==========================================================================

  trackEvent(event: string, metadata?: Record<string, any>) {
    // Atualizar estatísticas baseado no evento
    switch (event) {
      case 'asset-marked':
        this.state.stats.photosMarked += 1;
        break;
      case 'asset-approved':
        this.state.stats.photosApproved += 1;
        this.state.stats.photosMarked += 1;
        break;
      case 'asset-favorited':
        this.state.stats.photosFavorited += 1;
        this.state.stats.photosMarked += 1;
        break;
      case 'asset-rejected':
        this.state.stats.photosRejected += 1;
        this.state.stats.photosMarked += 1;
        break;
      case 'keyboard-shortcut-used':
        this.state.stats.keyboardUsageCount += 1;
        break;
      case 'mouse-click-used':
        this.state.stats.mouseUsageCount += 1;
        break;
      case 'smart-culling-used':
      case 'find-similar-used':
      case 'smart-rename-used':
        const featureName = event.replace('-used', '');
        this.state.stats.aiFeatureUsageCount[featureName] =
          (this.state.stats.aiFeatureUsageCount[featureName] || 0) + 1;
        break;
    }

    this.saveState();

    // Verificar milestones alcançados
    this.checkMilestones(event, metadata);
  }

  // ==========================================================================
  // MILESTONES
  // ==========================================================================

  checkMilestones(event?: string, metadata?: Record<string, any>): Milestone[] {
    const newMilestones: Milestone[] = [];

    for (const milestone of DEFAULT_MILESTONES) {
      // Se já foi alcançado, pular
      if (this.state.achievedMilestones.includes(milestone.id)) {
        continue;
      }

      // Verificar se o evento corresponde
      if (event && milestone.trigger.event !== event) {
        continue;
      }

      let achieved = false;

      // Verificar tipo de trigger
      if (milestone.trigger.count !== undefined) {
        const count = this.getEventCount(milestone.trigger.event);
        achieved = count >= milestone.trigger.count;
      } else if (milestone.trigger.threshold !== undefined) {
        const percentage = this.getMetricPercentage(milestone.trigger.event);
        achieved = percentage >= milestone.trigger.threshold;
      }

      if (achieved) {
        this.state.achievedMilestones.push(milestone.id);
        newMilestones.push({
          ...milestone,
          stats: this.getRelevantStats(milestone.id)
        });
      }
    }

    if (newMilestones.length > 0) {
      this.saveState();
    }

    return newMilestones;
  }

  private getEventCount(event: string): number {
    switch (event) {
      case 'asset-marked':
        return this.state.stats.photosMarked;
      case 'folder-added':
        return this.state.checklistProgress['import-folder'] ? 1 : 0;
      case 'smart-culling-used':
        return this.state.stats.aiFeatureUsageCount['smart-culling'] || 0;
      default:
        return 0;
    }
  }

  private getMetricPercentage(metric: string): number {
    switch (metric) {
      case 'keyboard-usage':
        const total = this.state.stats.keyboardUsageCount + this.state.stats.mouseUsageCount;
        return total > 0 ? (this.state.stats.keyboardUsageCount / total) * 100 : 0;
      default:
        return 0;
    }
  }

  private getRelevantStats(milestoneId: string): Record<string, any> {
    const total = this.state.stats.keyboardUsageCount + this.state.stats.mouseUsageCount;
    const keyboardPercentage = total > 0
      ? Math.round((this.state.stats.keyboardUsageCount / total) * 100)
      : 0;

    return {
      photosMarked: this.state.stats.photosMarked,
      photosApproved: this.state.stats.photosApproved,
      photosFavorited: this.state.stats.photosFavorited,
      keyboardUsageRate: keyboardPercentage,
      sessionCount: this.state.stats.sessionCount,
      timeActive: this.formatTime(this.state.stats.totalTimeActive)
    };
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  // ==========================================================================
  // CHECKLIST
  // ==========================================================================

  updateChecklistItem(itemId: string, completed: boolean) {
    this.state.checklistProgress[itemId] = completed;
    this.saveState();
  }

  isChecklistItemCompleted(itemId: string): boolean {
    return this.state.checklistProgress[itemId] || false;
  }

  getChecklistProgress(): { completed: number; total: number } {
    const items = [
      'import-folder',
      'mark-5-photos',
      'use-keyboard',
      'try-smart-culling',
      'find-similar',
      'smart-rename',
      'export-project'
    ];

    const completed = items.filter(id => this.state.checklistProgress[id]).length;
    return { completed, total: items.length };
  }

  // ==========================================================================
  // PRO TIPS
  // ==========================================================================

  dismissTip(tipId: string) {
    if (!this.state.dismissedTips.includes(tipId)) {
      this.state.dismissedTips.push(tipId);
      this.saveState();
    }
  }

  isTipDismissed(tipId: string): boolean {
    return this.state.dismissedTips.includes(tipId);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.saveState();
  }

  // Observer pattern para reagir a mudanças
  subscribe(callback: (state: OnboardingState) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.state));
  }

  // Calcular insights interessantes
  getInsights(): string[] {
    const insights: string[] = [];
    const { stats } = this.state;

    // Taxa de aprovação
    if (stats.photosMarked > 20) {
      const approvalRate = Math.round((stats.photosApproved / stats.photosMarked) * 100);
      if (approvalRate < 20) {
        insights.push(`Você aprova ${approvalRate}% das fotos - curadoria muito seletiva! 🎯`);
      } else if (approvalRate > 70) {
        insights.push(`Você aprova ${approvalRate}% das fotos - muitas boas capturas! 📸`);
      }
    }

    // Uso de keyboard
    const total = stats.keyboardUsageCount + stats.mouseUsageCount;
    if (total > 30) {
      const keyboardRate = Math.round((stats.keyboardUsageCount / total) * 100);
      if (keyboardRate > 80) {
        insights.push(`${keyboardRate}% de uso de teclado - você é um power user! ⌨️`);
      } else if (keyboardRate < 30) {
        insights.push(`Tente usar mais atalhos de teclado para acelerar seu workflow 💡`);
      }
    }

    // Features de IA
    const aiUsage = Object.values(stats.aiFeatureUsageCount).reduce((a, b) => a + b, 0);
    if (aiUsage === 0 && stats.photosMarked > 50) {
      insights.push(`Experimente Smart Culling para economizar tempo! ✨`);
    }

    return insights;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const onboardingService = new OnboardingService();

// Para debugging
if (typeof window !== 'undefined') {
  (window as any).__onboardingService = onboardingService;
}
