import { useState, useEffect } from 'react';
import MaterialIcon from './MaterialIcon';
import logoFull from '../assets/logotipo-resum-white.png';

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
    title: 'Marque suas favoritas',
    description: 'Use a tecla P para marcar/desmarcar as mídias que você quer selecionar.',
    icon: 'flag'
  },
  {
    id: 'export',
    title: 'Exporte para seu editor',
    description: 'Selecione as mídias e exporte diretamente para Premiere, Resolve ou Lightroom.',
    icon: 'upload'
  }
];

const APP_VERSION = '0.2.0';
const ONBOARDING_KEY = `zona21-onboarding-${APP_VERSION}`;

type Props = {
  onComplete: () => void;
};

export default function OnboardingWizard({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsVisible(true);
    }
  }, []);

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
      <div className="mh-popover w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-indigo-500 w-6'
                  : index < currentStep
                    ? 'bg-indigo-500/50'
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-center mb-4">
          {step.id === 'welcome' ? (
            <img src={logoFull} alt="Zona21" className="h-10" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <MaterialIcon name={step.icon} className="text-indigo-400 text-3xl" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">{step.title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Keyboard shortcuts hint */}
        {step.id === 'decide' && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl font-bold mb-2">P</div>
                <div className="text-gray-500 text-xs">Marcar/Desmarcar</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation hint */}
        {step.id === 'navigate' && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex justify-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">←</div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">↑</div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">↓</div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">→</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
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
