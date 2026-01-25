// Versão hardcoded - será atualizada manualmente em cada release
const APP_VERSION = '0.2.1';

export default function FooterVersion() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 px-4 py-1">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>Zona21 v{APP_VERSION}</div>
        <div>© 2026 Almar Cyber Solutions. Todos os direitos reservados. Feito com ❤️ por Almar.</div>
      </div>
    </div>
  );
}
