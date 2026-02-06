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
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Produtividade
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Suas estatísticas e conquistas</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-overlay-light)] rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Photos Organized */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📸</span>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Fotos</span>
              </div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]">{stats.photosOrganized.toLocaleString()}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Organizadas</div>
            </div>

            {/* Time Saved */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⏱️</span>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Tempo</span>
              </div>
              <div className="text-3xl font-bold text-cyan-400">{formatTimeSaved(stats.timeSavedTotal)}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Economizado</div>
            </div>

            {/* Streak */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🔥</span>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Streak</span>
              </div>
              <div className="text-3xl font-bold text-orange-400">{stats.streakDays}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{stats.streakDays === 1 ? 'Dia' : 'Dias'}</div>
            </div>

            {/* Edits Applied */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">✨</span>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Edições</span>
              </div>
              <div className="text-3xl font-bold text-green-400">
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
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fotos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)]">✅ Aprovadas</span>
                  <span className="text-sm font-semibold text-green-400">{stats.photosApproved.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)]">❌ Rejeitadas</span>
                  <span className="text-sm font-semibold text-red-400">{stats.photosRejected.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)]">🎬 Vídeos Processados</span>
                  <span className="text-sm font-semibold text-purple-400">{stats.videosProcessed.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-5 border border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Atividade
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)]">📅 Dias Usando</span>
                  <span className="text-sm font-semibold text-cyan-400">{stats.totalDaysUsed.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-primary)]">⚡ Quick Edits</span>
                  <span className="text-sm font-semibold text-yellow-400">{stats.quickEditsApplied.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Section */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
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
                      className="bg-gradient-to-br from-[rgba(var(--overlay-rgb),0.06)] to-[rgba(var(--overlay-rgb),0.02)] rounded-xl p-4 border-2 border-yellow-500/30 text-center"
                    >
                      <div className="text-4xl mb-2">{milestone.icon}</div>
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
                          <span className="text-3xl opacity-50">{milestone.icon}</span>
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
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
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
            Continue usando o Zona21 para desbloquear mais conquistas! 🚀
          </div>
        </div>
      </div>
    </div>
  );
}
