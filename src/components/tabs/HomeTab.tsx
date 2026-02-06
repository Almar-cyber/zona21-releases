/**
 * HomeTab Component
 *
 * Tab principal do app - Gallery view
 *
 * Renderiza:
 * - Library (grid de assets)
 * - Empty states
 * - SelectionTray (floating)
 * - LastOperationPanel (floating)
 *
 * Nota: Este componente será integrado posteriormente.
 * Por enquanto, é apenas uma estrutura placeholder que será
 * preenchida com o conteúdo do App.tsx durante a integração.
 */

export default function HomeTab() {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Placeholder - será preenchido durante integração com App.tsx */}
      <div className="flex-1 flex items-center justify-center bg-black/20">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Home Tab
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Library grid será renderizado aqui
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            (Durante integração com App.tsx)
          </p>
        </div>
      </div>
    </div>
  );
}
