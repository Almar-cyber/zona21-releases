/**
 * Enhanced Milestone Notification
 *
 * Shows celebration when user achieves a milestone with:
 * - Confetti animation
 * - Milestone icon + title
 * - Progress to next milestone
 * - Share button (optional)
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Milestone } from '../hooks/useProductivityStats';
import Icon from './Icon';

interface MilestoneNotificationProps {
  milestone: Milestone | null;
  onClose: () => void;
}

export function MilestoneNotificationEnhanced({ milestone, onClose }: MilestoneNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (milestone) {
      setIsVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  if (!milestone) return null;

  const colorClasses = {
    blue: 'bg-[var(--color-info)]/20 border-[var(--color-info)]/30',
    purple: 'bg-[var(--color-accent-purple)]/20 border-[var(--color-accent-purple)]/30',
    gold: 'bg-[var(--color-warning)]/20 border-[var(--color-warning)]/30',
    green: 'bg-[var(--color-success)]/20 border-[var(--color-success)]/30',
    pink: 'bg-[var(--color-accent-pink)]/20 border-[var(--color-accent-pink)]/30',
    orange: 'bg-[var(--color-accent-orange)]/20 border-[var(--color-accent-orange)]/30',
    cyan: 'bg-[var(--color-info)]/20 border-[var(--color-info)]/30',
  }[milestone.color] || 'bg-[var(--color-primary)]/20 border-[var(--color-primary)]/30';

  return createPortal(
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Confetti effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Notification card */}
      <div
        className={`relative transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mh-popover max-w-md mx-4 overflow-hidden">
          {/* Content */}
          <div className="p-8 text-center">
            {/* Icon */}
            <div className="mb-4 animate-bounce-slow flex justify-center"><Icon name={milestone.icon} size={72} /></div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">{milestone.title}</h2>

            {/* Description */}
            <p className="text-lg text-[var(--color-text-secondary)] mb-6">{milestone.description}</p>

            {/* Stats badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border ${colorClasses} text-white font-semibold mb-6`}>
              <Icon name="check" size={20} />
              Milestone Desbloqueado!
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleClose}
                className="mh-btn mh-btn-indigo px-8 py-3 text-base font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes confetti {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }

          .animate-confetti {
            animation: confetti linear forwards;
          }

          @keyframes bounce-slow {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          .animate-bounce-slow {
            animation: bounce-slow 2s ease-in-out infinite;
          }
        `
      }} />
    </div>,
    document.body
  );
}
