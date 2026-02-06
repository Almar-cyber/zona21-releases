import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Navegação',
    items: [
      { keys: ['←', '→', '↑', '↓'], description: 'Navegar entre arquivos' },
      { keys: ['Enter'], description: 'Abrir detalhes' },
      { keys: ['Delete'], description: 'Limpar seleção' },
      { keys: ['Esc'], description: 'Fechar painel / Limpar seleção' },
    ]
  },
  {
    category: 'Marcação',
    items: [
      { keys: ['A'], description: 'Aprovar' },
      { keys: ['F'], description: 'Marcar/Desmarcar como favorito' },
      { keys: ['D'], description: 'Rejeitar/Descartar' },
      { keys: ['Shift', 'A/D/F'], description: 'Marcar e avançar automaticamente' },
    ]
  },
  {
    category: 'Seleção',
    items: [
      { keys: ['Shift', 'Click'], description: 'Selecionar intervalo' },
      { keys: ['⌘/Ctrl', 'Click'], description: 'Adicionar à seleção' },
      { keys: ['⌘/Ctrl', 'A'], description: 'Selecionar tudo' },
    ]
  },
  {
    category: 'Zoom (no Viewer)',
    items: [
      { keys: ['Scroll'], description: 'Zoom in/out' },
      { keys: ['0'], description: 'Ajustar à tela (Fit)' },
      { keys: ['1'], description: 'Tamanho real (100%)' },
      { keys: ['+'], description: 'Aumentar zoom' },
      { keys: ['-'], description: 'Diminuir zoom' },
    ]
  },
  {
    category: 'Geral',
    items: [
      { keys: ['⌘/Ctrl', 'K'], description: 'Abrir Command Palette' },
      { keys: ['?'], description: 'Mostrar atalhos de teclado' },
      { keys: ['⌘/Ctrl', ','], description: 'Abrir Preferências' },
      { keys: ['⌘/Ctrl', 'R'], description: 'Recarregar' },
    ]
  }
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--color-overlay-strong)] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mh-popover w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
            <h2 id="shortcuts-title" className="text-base font-semibold text-[var(--color-text-primary)]">Atalhos de Teclado</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
            aria-label="Fechar atalhos de teclado"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {shortcuts.map((section) => (
            <div key={section.category} className="mb-5 last:mb-0">
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                {section.category}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[var(--color-overlay-light)]"
                  >
                    <span className="text-sm text-[var(--color-text-secondary)]">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, kidx) => (
                        <span key={kidx}>
                          <kbd className="px-2 py-1 text-xs font-medium bg-[rgba(var(--overlay-rgb),0.10)] border border-[var(--color-border)] rounded text-[var(--color-text-secondary)]">
                            {key}
                          </kbd>
                          {kidx < item.keys.length - 1 && (
                            <span className="text-[var(--color-text-muted)] mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            Pressione <kbd className="px-1.5 py-0.5 text-[10px] bg-[rgba(var(--overlay-rgb),0.10)] border border-[var(--color-border)] rounded">?</kbd> a qualquer momento para ver esta lista
          </p>
        </div>
      </div>
    </div>
  );
}
