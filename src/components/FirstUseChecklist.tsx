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
    <div className={`bg-[var(--color-surface-floating)]/60 backdrop-blur-sm border border-[var(--color-border)] rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-overlay-light)] transition"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Primeiros Passos</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-[var(--color-text-secondary)]">
            {progress.completed}/{progress.total}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-4 pb-3">
        <div className="w-full h-1.5 bg-[rgba(var(--overlay-rgb),0.10)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all duration-500 ease-out"
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
                  ${isActive && !isCompleted ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30' : ''}
                  ${isCompleted ? 'opacity-60' : ''}
                `}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-status-approved)]" />
                  ) : isActive ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[var(--color-primary)] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-[var(--color-text-muted)]" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      isCompleted
                        ? 'text-[var(--color-text-muted)] line-through'
                        : isActive
                          ? 'text-[var(--color-text-primary)] font-medium'
                          : 'text-[var(--color-text-secondary)]'
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
        <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-overlay-light)] space-y-2">
          {progress.completed > 0 && progress.completed < progress.total && (
            <p className="text-[10px] text-[var(--color-text-muted)] text-center">
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
            className="w-full text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition flex items-center justify-center gap-1"
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
          <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">{tooltip.description}</p>
        </div>
      }
      position="right"
      delay={0}
    >
      <button
        type="button"
        className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition"
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
          bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]
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
            className="bg-[var(--color-surface-floating)] border border-[var(--color-border-hover)] rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <FirstUseChecklist className="border-0" />
            <div className="p-4 border-t border-[var(--color-border)]">
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
