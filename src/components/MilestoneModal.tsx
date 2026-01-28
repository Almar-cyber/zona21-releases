/**
 * MilestoneModal Component
 *
 * Modal de celebração quando usuário alcança milestones importantes
 */

import { useEffect, useState } from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';
import { useMilestones } from '../hooks/useOnboarding';
import { Milestone } from '../services/onboarding-service';

export default function MilestoneModal() {
  const { newMilestones, dismissMilestone } = useMilestones();
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (newMilestones.length > 0 && !currentMilestone) {
      setCurrentMilestone(newMilestones[0]);
      setIsAnimating(true);
    }
  }, [newMilestones, currentMilestone]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      if (currentMilestone) {
        dismissMilestone(currentMilestone.id);
        setCurrentMilestone(null);
      }
    }, 200);
  };

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
      >
        {/* Confetti Effect (only for celebrations) */}
        {isCelebration && <ConfettiEffect />}

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Badge/Icon */}
          <div className="flex justify-center mb-6">
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
          <h2 className="text-2xl font-bold text-white mb-3">
            {currentMilestone.title}
          </h2>

          {/* Description */}
          {currentMilestone.description && (
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
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

// Helper: Confetti Effect
function ConfettiEffect() {
  const colors = ['#fbbf24', '#f87171', '#34d399', '#60a5fa', '#a78bfa'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 opacity-0 animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`
          }}
        />
      ))}
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
    >
      <div className="mh-popover p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#4F46E5]/20 flex items-center justify-center">
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
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
