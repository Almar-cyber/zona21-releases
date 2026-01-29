/**
 * KeyboardHintsBar Component
 *
 * Persistent bar showing contextual keyboard shortcuts
 * Inspired by CompareMode hints bar (lines 268-279)
 */

import { Kbd } from './Kbd';

interface KeyboardHintsBarProps {
  /**
   * Whether to show the hints bar
   */
  visible?: boolean;
  /**
   * Optional callback when user dismisses the bar
   */
  onDismiss?: () => void;
}

export default function KeyboardHintsBar({
  visible = true,
  onDismiss,
}: KeyboardHintsBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#0d0d1a]/95 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 text-[10px] text-gray-400">
          {/* Navigation */}
          <div className="flex items-center gap-1.5">
            <Kbd size="sm">←</Kbd>
            <Kbd size="sm">→</Kbd>
            <span>Navegar</span>
          </div>

          {/* Marking */}
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Kbd size="sm">A</Kbd>
            <span>Aprovar</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Kbd size="sm">P</Kbd>
            <span>Favorito</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Kbd size="sm">D</Kbd>
            <span>Descartar</span>
          </div>

          {/* Actions */}
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Kbd size="sm">Enter</Kbd>
            <span>Abrir</span>
          </div>

          {/* Help */}
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Kbd size="sm">?</Kbd>
            <span>Mais atalhos</span>
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <button
                type="button"
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-300 transition-colors ml-1"
                title="Ocultar dicas"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
