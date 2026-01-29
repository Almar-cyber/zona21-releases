/**
 * Enhanced Milestone Notification
 *
 * Shows celebration when user achieves a milestone with:
 * - Confetti animation
 * - Milestone icon + title
 * - Progress to next milestone
 * - Share button (optional)
 */

import React, { useState, useEffect } from 'react';
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
    blue: 'from-blue-600 to-cyan-600',
    purple: 'from-purple-600 to-pink-600',
    gold: 'from-yellow-500 to-orange-500',
    green: 'from-green-600 to-emerald-600',
    pink: 'from-pink-600 to-rose-600',
    orange: 'from-orange-500 to-red-500',
    cyan: 'from-cyan-500 to-blue-500',
  }[milestone.color] || 'from-blue-600 to-purple-600';

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
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden max-w-md mx-4">
          {/* Gradient header */}
          <div className={`h-2 bg-gradient-to-r ${colorClasses}`} />

          {/* Content */}
          <div className="p-8 text-center">
            {/* Icon */}
            <div className="text-7xl mb-4 animate-bounce-slow">{milestone.icon}</div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-2">{milestone.title}</h2>

            {/* Description */}
            <p className="text-lg text-gray-300 mb-6">{milestone.description}</p>

            {/* Stats badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${colorClasses} text-white font-semibold mb-6`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Milestone Desbloqueado!
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors"
              >
                Continuar
              </button>
              <button
                onClick={() => {
                  // TODO: Implement share functionality
                  console.log('Share milestone:', milestone);
                }}
                className={`px-6 py-2.5 rounded-lg bg-gradient-to-r ${colorClasses} text-white font-medium transition-all hover:scale-105`}
              >
                Compartilhar 🎉
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
