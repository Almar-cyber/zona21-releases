import { useState, useEffect } from 'react';
import { Keyboard, FolderOpen, Star, Upload } from 'lucide-react';
import logoFullDark from '../assets/logotipo-resum-white.png';
import logoFullLight from '../assets/logotipo-resum.png';
import { APP_VERSION } from '../version';
import { useTheme } from '../contexts/ThemeContext';

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Zona21',
    description: 'Sua plataforma de ingestão e seleção de mídia profissional. Vamos começar?',
    icon: 'waving_hand'
  },
  {
    id: 'import',
    title: 'Importe suas mídias',
    description: 'Clique em "Adicionar Pasta" na barra lateral ou arraste uma pasta diretamente para a janela.',
    icon: 'folder_open'
  },
  {
    id: 'navigate',
    title: 'Navegue rapidamente',
    description: 'Use as setas do teclado para navegar entre as mídias. Clique duas vezes para abrir no visualizador.',
    icon: 'keyboard'
  },
  {
    id: 'decide',
    title: 'Classifique suas mídias',
    description: 'Use A para aprovar, F para favoritar e D para descartar. Shift + tecla avança automaticamente.',
    icon: 'star'
  },
  {
    id: 'export',
    title: 'Exporte para seu editor',
    description: 'Selecione as mídias e exporte diretamente para Premiere, Resolve ou Lightroom.',
    icon: 'upload'
  }
];

const ONBOARDING_KEY = `zona21-onboarding-${APP_VERSION}`;

// Fixed height for consistent modal size (accommodates largest content)
const MODAL_HEIGHT = 440;

type Props = {
  onComplete: () => void;
};

export default function OnboardingWizard({ onComplete }: Props) {
  const { resolvedTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsVisible(true);
    }
  }, []);

  // Handle ESC key to skip
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleComplete();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="mh-popover w-full max-w-md flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-auto"
        style={{ height: MODAL_HEIGHT }}
        role="dialog"
        aria-modal="true"
        aria-label="Assistente de boas-vindas"
      >
        {/* Header with progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-[var(--color-primary)] w-6'
                  : index < currentStep
                    ? 'bg-[var(--color-primary)]/50'
                    : 'bg-[rgba(var(--overlay-rgb),0.20)]'
              }`}
            />
          ))}
        </div>

        {/* Content area - flex-1 to fill available space */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {step.id === 'welcome' ? (
              <img src={resolvedTheme === 'light' ? logoFullLight : logoFullDark} alt="Zona21" className="h-10" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                {step.id === 'import' && <FolderOpen className="text-[var(--color-primary-light)] w-8 h-8" />}
                {step.id === 'navigate' && <Keyboard className="text-[var(--color-primary-light)] w-8 h-8" />}
                {step.id === 'decide' && <Star className="text-[var(--color-primary-light)] w-8 h-8" />}
                {step.id === 'export' && <Upload className="text-[var(--color-primary-light)] w-8 h-8" />}
              </div>
            )}
          </div>

          {/* Title and description */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">{step.title}</h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{step.description}</p>
          </div>

          {/* Keyboard shortcuts hint for marking */}
          {step.id === 'decide' && (
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 w-full">
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-status-approved-bg)] flex items-center justify-center text-lg font-bold text-[var(--color-status-approved)] mb-1">A</div>
                  <div className="text-[var(--color-text-muted)] text-[10px]">Aprovar</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-status-favorite-bg)] flex items-center justify-center text-lg font-bold text-[var(--color-status-favorite)] mb-1">F</div>
                  <div className="text-[var(--color-text-muted)] text-[10px]">Favoritar</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-status-rejected-bg)] flex items-center justify-center text-lg font-bold text-[var(--color-status-rejected)] mb-1">D</div>
                  <div className="text-[var(--color-text-muted)] text-[10px]">Descartar</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation hint */}
          {step.id === 'navigate' && (
            <div className="bg-[var(--color-overlay-light)] rounded-xl p-4 w-full">
              <div className="flex justify-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-[rgba(var(--overlay-rgb),0.10)] flex items-center justify-center text-lg">←</div>
                <div className="w-10 h-10 rounded-lg bg-[rgba(var(--overlay-rgb),0.10)] flex items-center justify-center text-lg">↑</div>
                <div className="w-10 h-10 rounded-lg bg-[rgba(var(--overlay-rgb),0.10)] flex items-center justify-center text-lg">↓</div>
                <div className="w-10 h-10 rounded-lg bg-[rgba(var(--overlay-rgb),0.10)] flex items-center justify-center text-lg">→</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer with actions - fixed at bottom */}
        <div className="flex gap-3 p-6 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 mh-btn mh-btn-gray px-4 py-2.5 text-sm"
          >
            Pular
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 mh-btn mh-btn-indigo px-4 py-2.5 text-sm"
          >
            {isLastStep ? 'Começar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}
