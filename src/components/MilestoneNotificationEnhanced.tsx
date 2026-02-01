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
    blue: 'bg-blue-500/20 border-blue-500/30',
    purple: 'bg-purple-500/20 border-purple-500/30',
    gold: 'bg-yellow-500/20 border-yellow-500/30',
    green: 'bg-green-500/20 border-green-500/30',
    pink: 'bg-pink-500/20 border-pink-500/30',
    orange: 'bg-orange-500/20 border-orange-500/30',
    cyan: 'bg-cyan-500/20 border-cyan-500/30',
  }[milestone.color] || 'bg-indigo-500/20 border-indigo-500/30';

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
            <div className="text-7xl mb-4 animate-bounce-slow">{milestone.icon}</div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-2">{milestone.title}</h2>

            {/* Description */}
            <p className="text-lg text-gray-300 mb-6">{milestone.description}</p>

            {/* Stats badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border ${colorClasses} text-white font-semibold mb-6`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
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
