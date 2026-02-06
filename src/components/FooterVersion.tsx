import { APP_VERSION } from '../version';

export default function FooterVersion() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-surface-floating)]/80 backdrop-blur-sm border-t border-[var(--color-border)] px-4 py-1">
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div>Zona21 v{APP_VERSION}</div>
        <div>© 2026 Almar. Todos os direitos reservados.</div>
      </div>
    </div>
  );
}
