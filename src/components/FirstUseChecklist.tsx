/**
 * FirstUseChecklist Component
 *
 * Checklist gamificada de primeiros passos para novos usuários.
 * Aparece na sidebar e desaparece automaticamente após completar todos os itens.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Sparkles, HelpCircle, X } from 'lucide-react';
import { useChecklist } from '../hooks/useOnboarding';
import { onboardingService } from '../services/onboarding-service';
import SmartTooltip from './SmartTooltip';

interface FirstUseChecklistProps {
  className?: string;
}

export default function FirstUseChecklist({ className = '' }: FirstUseChecklistProps) {
  const { items, progress, isComplete } = useChecklist();
  const [isExpanded, setIsExpanded] = useState(false); // Colapsado por padrão

  // Não mostrar se já completou tudo
  if (isComplete) {
    return null;
  }

  const currentIndex = items.findIndex(item => !item.completed);

  return (
    <div className={`bg-[#0d0d1a]/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4F46E5]" />
          <span className="text-sm font-semibold text-white">Primeiros Passos</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400">
            {progress.completed}/{progress.total}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-4 pb-3">
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#818CF8] transition-all duration-500 ease-out"
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Items List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item, index) => {
            const isActive = index === currentIndex;
            const isCompleted = item.completed;

            return (
              <div
                key={item.id}
                className={`
                  flex items-start gap-2 p-2 rounded-lg transition
                  ${isActive && !isCompleted ? 'bg-[#4F46E5]/10 border border-[#4F46E5]/30' : ''}
                  ${isCompleted ? 'opacity-60' : ''}
                `}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : isActive ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#4F46E5] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-gray-600" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      isCompleted
                        ? 'text-gray-500 line-through'
                        : isActive
                          ? 'text-white font-medium'
                          : 'text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Help Tooltip */}
                  {isActive && !isCompleted && getItemHelpTooltip(item.id)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-white/10 bg-white/5 space-y-2">
          {progress.completed > 0 && progress.completed < progress.total && (
            <p className="text-[10px] text-gray-500 text-center">
              Continue assim! Você está a {progress.total - progress.completed} passo{progress.total - progress.completed > 1 ? 's' : ''} de dominar o Zona21
            </p>
          )}

          {/* Botão "Sou experiente" */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja pular todo o onboarding? Você pode reativá-lo nas Preferências.')) {
                onboardingService.skipAll();
              }
            }}
            className="w-full text-[10px] text-gray-500 hover:text-gray-300 transition flex items-center justify-center gap-1"
          >
            <X className="w-3 h-3" />
            Sou experiente, pular tutorial
          </button>
        </div>
      )}
    </div>
  );
}

// Helper tooltips para cada item
function getItemHelpTooltip(itemId: string): React.ReactNode {
  const tooltips: Record<string, { title: string; description: string }> = {
    'import-folder': {
      title: 'Como importar',
      description: 'Clique em "Adicionar Pasta" na barra lateral ou arraste uma pasta diretamente para a janela.'
    },
    'mark-5-photos': {
      title: 'Como marcar',
      description: 'Navegue com as setas do teclado e pressione A (aprovar), F (favoritar) ou D (rejeitar).'
    },
    'use-keyboard': {
      title: 'Atalhos úteis',
      description: 'Use ←→ para navegar, A/F/D para marcar, Shift+tecla para marcar e avançar.'
    },
    'try-smart-culling': {
      title: 'Smart Culling',
      description: 'Clique no ícone ✨ na toolbar quando tiver fotos em sequência para encontrar as melhores automaticamente.'
    },
    'smart-rename': {
      title: 'Smart Rename',
      description: 'Selecione fotos e use "Smart Rename" para renomeá-las com base em data e tags detectadas pela IA.'
    },
    'export-project': {
      title: 'Exportar',
      description: 'Selecione as fotos aprovadas e escolha o formato de exportação (Premiere, Lightroom, ZIP).'
    }
  };

  const tooltip = tooltips[itemId];
  if (!tooltip) return null;

  return (
    <SmartTooltip
      id={`checklist-help-${itemId}`}
      content={
        <div className="space-y-1">
          <div className="font-semibold text-xs">{tooltip.title}</div>
          <p className="text-gray-300 text-xs leading-relaxed">{tooltip.description}</p>
        </div>
      }
      position="right"
      delay={0}
    >
      <button
        type="button"
        className="flex-shrink-0 text-gray-500 hover:text-[#4F46E5] transition"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    </SmartTooltip>
  );
}

// Variant: Compact version for mobile
export function FirstUseChecklistCompact({ className = '' }: FirstUseChecklistProps) {
  const { progress, isComplete } = useChecklist();
  const [isOpen, setIsOpen] = useState(false);

  if (isComplete) return null;

  return (
    <>
      {/* Floating Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-20 right-4 z-50
          flex items-center gap-2 px-4 py-2
          bg-gradient-to-r from-[#4F46E5] to-[#818CF8]
          text-white text-xs font-medium
          rounded-full shadow-lg
          hover:scale-105 active:scale-95
          transition-transform
          ${className}
        `}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>
          {progress.completed}/{progress.total} Completos
        </span>
      </button>

      {/* Full Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-[#0d0d1a] border border-white/20 rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <FirstUseChecklist className="border-0" />
            <div className="p-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full mh-btn mh-btn-gray py-2"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
