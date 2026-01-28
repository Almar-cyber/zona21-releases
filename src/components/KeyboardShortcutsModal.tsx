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
      { keys: ['P'], description: 'Marcar/Desmarcar como favorito' },
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
      { keys: ['?'], description: 'Mostrar atalhos de teclado' },
      { keys: ['⌘/Ctrl', ','], description: 'Abrir Preferências' },
      { keys: ['⌘/Ctrl', 'R'], description: 'Recarregar' },
    ]
  }
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="mh-popover w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-gray-400" />
            <h2 className="text-base font-semibold text-white">Atalhos de Teclado</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {shortcuts.map((section) => (
            <div key={section.category} className="mb-5 last:mb-0">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {section.category}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5"
                  >
                    <span className="text-sm text-gray-300">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, kidx) => (
                        <span key={kidx}>
                          <kbd className="px-2 py-1 text-xs font-medium bg-white/10 border border-white/10 rounded text-gray-300">
                            {key}
                          </kbd>
                          {kidx < item.keys.length - 1 && (
                            <span className="text-gray-500 mx-0.5">+</span>
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

        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Pressione <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/10 rounded">?</kbd> a qualquer momento para ver esta lista
          </p>
        </div>
      </div>
    </div>
  );
}
