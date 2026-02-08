/**
 * Productivity Dashboard
 *
 * Shows user productivity stats with:
 * - Total photos organized, time saved
 * - Streak counter
 * - Milestones progress
 * - Weekly activity chart
 * - Badges/achievements
 */

import React from 'react';
import { useProductivityStats } from '../hooks/useProductivityStats';
import Icon from './Icon';

interface ProductivityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductivityDashboard({ isOpen, onClose }: ProductivityDashboardProps) {
  const { stats, milestones, formatTimeSaved } = useProductivityStats();

  if (!isOpen) return null;

  const achievedMilestones = milestones.filter(m => m.achieved);
  const unachievedMilestones = milestones.filter(m => !m.achieved);

  // Calculate progress to next milestone
  const getProgress = (milestone: any) => {
    let currentValue = 0;

    switch (milestone.type) {
      case 'photos':
        currentValue = stats.photosOrganized;
        break;
      case 'edits':
        currentValue = stats.quickEditsApplied;
        break;
      case 'streak':
        currentValue = stats.streakDays;
        break;
      case 'time':
        currentValue = stats.timeSavedTotal;
        break;
    }

    return Math.min((currentValue / milestone.threshold) * 100, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl mx-4 bg-[var(--color-surface-floating)]/95 backdrop-blur-xl rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Icon name="bar_chart" size={28} className="text-[var(--color-info)]" />
              Produtividade
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Suas estatísticas e conquistas</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-overlay-light)] rounded-lg transition-colors"
          >
            <Icon name="close" size={24} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Photos Organized */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <Icon name="camera" size={28} className="text-[var(--color-info)]" />
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Fotos</span>
              </div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.photosOrganized.toLocaleString()}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Organizadas</div>
            </div>

            {/* Time Saved */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <Icon name="schedule" size={28} className="text-[var(--color-info)]" />
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Tempo</span>
              </div>
              <div className="text-3xl font-bold text-[var(--color-info)]">{formatTimeSaved(stats.timeSavedTotal)}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Economizado</div>
            </div>

            {/* Streak */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <Icon name="flame" size={28} className="text-[var(--color-accent-orange)]" />
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Streak</span>
              </div>
              <div className="text-3xl font-bold text-[var(--color-accent-orange)]">{stats.streakDays}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{stats.streakDays === 1 ? 'Dia' : 'Dias'}</div>
            </div>

            {/* Edits Applied */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <Icon name="auto_awesome" size={28} className="text-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Edições</span>
              </div>
              <div className="text-3xl font-bold text-[var(--color-success)]">
                {stats.quickEditsApplied.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Aplicadas</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Photos Breakdown */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-5 border border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Icon name="image" size={20} className="text-[var(--color-info)]" />
                Fotos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)] flex items-center gap-1.5"><Icon name="check_circle" size={14} className="text-[var(--color-success)]" /> Aprovadas</span>
                  <span className="text-sm font-semibold text-[var(--color-success)]">{stats.photosApproved.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)] flex items-center gap-1.5"><Icon name="close" size={14} className="text-[var(--color-error)]" /> Rejeitadas</span>
                  <span className="text-sm font-semibold text-[var(--color-error)]">{stats.photosRejected.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)] flex items-center gap-1.5"><Icon name="movie" size={14} className="text-[var(--color-accent-purple)]" /> Vídeos Processados</span>
                  <span className="text-sm font-semibold text-[var(--color-accent-purple)]">{stats.videosProcessed.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-5 border border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Icon name="bolt" size={20} className="text-[var(--color-accent-pink)]" />
                Atividade
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)] flex items-center gap-1.5"><Icon name="calendar_month" size={14} className="text-[var(--color-info)]" /> Dias Usando</span>
                  <span className="text-sm font-semibold text-[var(--color-info)]">{stats.totalDaysUsed.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)] flex items-center gap-1.5"><Icon name="bolt" size={14} className="text-[var(--color-warning)]" /> Quick Edits</span>
                  <span className="text-sm font-semibold text-[var(--color-warning)]">{stats.quickEditsApplied.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Section */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Icon name="auto_awesome" size={20} className="text-[var(--color-warning)]" />
              Conquistas
            </h3>

            {/* Achieved Milestones */}
            {achievedMilestones.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                  Desbloqueadas ({achievedMilestones.length}/{milestones.length})
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {achievedMilestones.map(milestone => (
                    <div
                      key={milestone.id}
                      className="bg-gradient-to-br from-[rgba(var(--overlay-rgb),0.06)] to-[rgba(var(--overlay-rgb),0.02)] rounded-xl p-4 border-2 border-[var(--color-warning)]/30 text-center"
                    >
                      <div className="mb-2 flex justify-center"><Icon name={milestone.icon} size={40} className="text-[var(--color-warning)]" /></div>
                      <div className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">{milestone.title}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{milestone.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Milestones */}
            {unachievedMilestones.length > 0 && (
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-3">Próximas Conquistas</p>
                <div className="space-y-3">
                  {unachievedMilestones.slice(0, 3).map(milestone => {
                    const progress = getProgress(milestone);
                    return (
                      <div
                        key={milestone.id}
                        className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name={milestone.icon} size={32} className="opacity-50" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[var(--color-text-primary)]">{milestone.title}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">{milestone.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[var(--color-text-primary)]">{Math.round(progress)}%</div>
                          </div>
                        </div>
                        <div className="h-2 bg-[rgba(var(--overlay-rgb),0.10)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent-purple)] transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-overlay-light)]">
          <div className="text-center text-sm text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">Continue usando o Zona21 para desbloquear mais conquistas! <Icon name="rocket" size={16} /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
