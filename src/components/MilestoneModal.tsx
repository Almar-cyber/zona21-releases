/**
 * MilestoneModal Component
 *
 * Modal de celebração quando usuário alcança milestones importantes
 */

import { useEffect, useState } from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';
import { useMilestones } from '../hooks/useOnboarding';
import { Milestone } from '../services/onboarding-service';
import { useCelebration } from '../hooks/useCelebration';

export default function MilestoneModal() {
  const { newMilestones, dismissMilestone } = useMilestones();
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { celebrate } = useCelebration();

  useEffect(() => {
    if (newMilestones.length > 0 && !currentMilestone) {
      const milestone = newMilestones[0];
      setCurrentMilestone(milestone);
      setIsAnimating(true);

      // Trigger celebration with canvas-confetti
      if (milestone.celebration) {
        // Use epic preset for major milestones
        celebrate('milestone', 'epic');
      }
    }
  }, [newMilestones, currentMilestone, celebrate]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      if (currentMilestone) {
        dismissMilestone(currentMilestone.id);
        setCurrentMilestone(null);
      }
    }, 200);
  };

  // Handle ESC key
  useEffect(() => {
    if (!currentMilestone) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentMilestone]);

  if (!currentMilestone) return null;

  const isCelebration = currentMilestone.celebration;

  return (
    <div
      className={`
        fixed inset-0 z-[300] flex items-center justify-center
        bg-black/80 backdrop-blur-sm p-4
        ${isAnimating ? 'animate-in fade-in duration-200' : 'animate-out fade-out duration-200'}
      `}
    >
      <div
        className={`
          mh-popover w-full max-w-md relative
          ${isAnimating ? 'animate-in zoom-in-95 slide-in-from-bottom-4 duration-300' : 'animate-out zoom-out-95 duration-200'}
        `}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="milestone-title"
        aria-describedby={currentMilestone.description ? 'milestone-desc' : undefined}
      >
        {/* Confetti Effect handled by useCelebration hook */}

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10"
          aria-label="Fechar celebração"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Badge/Icon */}
          <div className="flex justify-center mb-6" aria-hidden="true">
            <div
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                ${isCelebration
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50'
                  : 'bg-gradient-to-br from-[#4F46E5]/20 to-[#818CF8]/20 border-2 border-[#4F46E5]/50'
                }
              `}
            >
              {isCelebration ? (
                <Trophy className="w-10 h-10 text-yellow-400" />
              ) : (
                <Sparkles className="w-10 h-10 text-[#818CF8]" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2 id="milestone-title" className="text-2xl font-bold text-white mb-3">
            {currentMilestone.title}
          </h2>

          {/* Description */}
          {currentMilestone.description && (
            <p id="milestone-desc" className="text-gray-400 text-sm mb-6 leading-relaxed">
              {currentMilestone.description}
            </p>
          )}

          {/* Stats (if celebration) */}
          {isCelebration && currentMilestone.stats && (
            <div className="mb-6 space-y-3">
              {currentMilestone.stats.photosMarked && (
                <StatItem
                  label="Fotos Marcadas"
                  value={currentMilestone.stats.photosMarked.toLocaleString()}
                />
              )}
              {currentMilestone.stats.keyboardUsageRate !== undefined && (
                <StatItem
                  label="Uso de Teclado"
                  value={`${currentMilestone.stats.keyboardUsageRate}%`}
                  comparison={
                    currentMilestone.stats.keyboardUsageRate > 70
                      ? 'Excelente!'
                      : currentMilestone.stats.keyboardUsageRate > 50
                        ? 'Muito bom!'
                        : 'Continue praticando'
                  }
                />
              )}
              {currentMilestone.stats.timeActive && (
                <StatItem
                  label="Tempo Economizado"
                  value={`~${currentMilestone.stats.timeActive}`}
                  comparison="vs. marcação manual"
                />
              )}
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            onClick={handleDismiss}
            className="mh-btn mh-btn-indigo px-8 py-3 text-base font-medium"
          >
            {isCelebration ? 'Continuar Arrasando! 🎉' : 'Entendi!'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: Stat Item
function StatItem({
  label,
  value,
  comparison
}: {
  label: string;
  value: string;
  comparison?: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className="text-white text-2xl font-bold">{value}</div>
      {comparison && (
        <div className="text-gray-400 text-xs mt-1">{comparison}</div>
      )}
    </div>
  );
}

// Optional: Inline Milestone Notification (less intrusive)
export function MilestoneNotification() {
  const { newMilestones, dismissMilestone } = useMilestones();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (newMilestones.length > 0) {
      setVisible(true);
    }
  }, [newMilestones]);

  if (!visible || newMilestones.length === 0) return null;

  const milestone = newMilestones[0];

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] max-w-sm animate-in slide-in-from-bottom-5 duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="mh-popover p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#4F46E5]/20 flex items-center justify-center" aria-hidden="true">
          {milestone.celebration ? (
            <Trophy className="w-5 h-5 text-yellow-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-[#818CF8]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white mb-1">
            {milestone.title}
          </h4>
          {milestone.description && (
            <p className="text-xs text-gray-400 leading-relaxed">
              {milestone.description}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={() => {
            dismissMilestone(milestone.id);
            setVisible(false);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-white transition"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
