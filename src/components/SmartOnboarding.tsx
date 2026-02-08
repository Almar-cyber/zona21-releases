/**
 * Smart Onboarding
 *
 * Interactive tutorial for first-time users with:
 * - Step-by-step walkthrough
 * - Contextual tooltips
 * - Quick wins guided flow
 * - Progress tracking
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;
  targetElement?: string; // CSS selector for highlight
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Zona21!',
    description: 'Vamos fazer um tour rápido para você começar a organizar suas fotos como um profissional.',
    icon: 'hand',
    position: 'center',
  },
  {
    id: 'select',
    title: 'Selecione Fotos',
    description: 'Cmd+Click para selecionar múltiplas fotos. Shift+Click para selecionar um range.',
    icon: 'mouse_pointer',
    action: 'Selecione 2 fotos para continuar',
    position: 'center',
  },
  {
    id: 'quick-edit',
    title: 'Quick Edit',
    description: 'Edite fotos rapidamente sem sair do app. Pressione "E" para abrir o Quick Edit!',
    icon: 'auto_awesome',
    targetElement: '[data-onboarding="quick-edit"]',
    position: 'right',
  },
  {
    id: 'complete',
    title: 'Pronto para Começar!',
    description: 'Você agora conhece as principais features. Pressione "?" a qualquer momento para ver atalhos de teclado.',
    icon: 'party',
    position: 'center',
  },
];

interface SmartOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function SmartOnboarding({ isOpen, onComplete, onSkip }: SmartOnboardingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  useEffect(() => {
    if (!isOpen || !currentStep.targetElement) {
      setHighlightRect(null);
      return;
    }

    // Find and highlight target element
    const element = document.querySelector(currentStep.targetElement);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
    }
  }, [isOpen, currentStepIndex, currentStep.targetElement]);

  // Handle ESC key and arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!highlightRect || currentStep.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;

    switch (currentStep.position) {
      case 'bottom':
        return {
          top: `${highlightRect.bottom + padding}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'top':
        return {
          top: `${highlightRect.top - padding}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'right':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          left: `${highlightRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'left':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          left: `${highlightRect.left - padding}px`,
          transform: 'translate(-100%, -50%)',
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[400]">
      {/* Overlay with spotlight */}
      <div className="absolute inset-0 bg-black/80" onClick={handleSkip}>
        {highlightRect && (
          <>
            {/* Spotlight cutout effect */}
            <div
              className="absolute border-4 border-[var(--color-primary)] rounded-lg pointer-events-none transition-all duration-300"
              style={{
                top: `${highlightRect.top - 4}px`,
                left: `${highlightRect.left - 4}px`,
                width: `${highlightRect.width + 8}px`,
                height: `${highlightRect.height + 8}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
              }}
            />
            {/* Pulsing animation */}
            <div
              className="absolute border-2 border-[var(--color-primary)]/50 rounded-lg pointer-events-none animate-ping"
              style={{
                top: `${highlightRect.top - 8}px`,
                left: `${highlightRect.left - 8}px`,
                width: `${highlightRect.width + 16}px`,
                height: `${highlightRect.height + 16}px`,
              }}
            />
          </>
        )}
      </div>

      {/* Tooltip */}
      <div
        className="absolute max-w-md"
        style={getTooltipPosition()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[var(--color-surface-floating)]/[0.98] backdrop-blur-xl rounded-2xl border-2 border-[var(--color-primary)]/50 shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-[var(--color-overlay-light)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="mb-4 flex justify-center"><Icon name={currentStep.icon} size={48} className="text-[var(--color-primary)]" /></div>

            {/* Title */}
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 text-center">{currentStep.title}</h3>

            {/* Description */}
            <p className="text-[var(--color-text-secondary)] text-center mb-4">{currentStep.description}</p>

            {/* Action hint */}
            {currentStep.action && (
              <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-[var(--color-primary)] text-center">{currentStep.action}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Pular Tutorial
              </button>

              <div className="flex items-center gap-2">
                {currentStepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-4 py-2 rounded-lg bg-[var(--color-overlay-light)] hover:bg-[var(--color-overlay-medium)] text-[var(--color-text-primary)] font-medium transition-colors"
                  >
                    Voltar
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium transition-all"
                >
                  {currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'Começar!' : 'Próximo'}
                </button>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStepIndex
                      ? 'w-8 bg-[var(--color-primary)]'
                      : index < currentStepIndex
                      ? 'w-4 bg-[var(--color-primary)]/50'
                      : 'w-4 bg-[rgba(var(--overlay-rgb),0.10)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
