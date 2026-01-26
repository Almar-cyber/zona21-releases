import MaterialIcon from './MaterialIcon.tsx';

interface EmptyStateUnifiedProps {
  type: 'volume' | 'folder' | 'files' | 'duplicates' | 'search';
  title?: string;
  description?: string;
  icon?: string;
  ctaText?: string;
  onAction?: () => void;
  showTips?: boolean;
  tipText?: string;
}

export default function EmptyStateUnified({ 
  type, 
  title, 
  description, 
  icon,
  ctaText,
  onAction,
  showTips = true,
  tipText
}: EmptyStateUnifiedProps) {
  const getDefaultContent = () => {
    switch (type) {
      case 'volume':
        return {
          icon: 'storage',
          title: title || 'Nenhum volume selecionado',
          description: description || 'Selecione um volume ou dispositivo para começar a visualizar e organizar suas mídias.',
          ctaText: ctaText || 'Adicionar Mídias'
        };
      case 'folder':
        return {
          icon: 'folder_open',
          title: title || 'Nenhuma pasta selecionada',
          description: description || 'Escolha uma pasta específica dentro do volume para navegar pelos seus arquivos.',
          ctaText: ctaText || 'Selecionar Pasta'
        };
      case 'files':
        return {
          icon: 'folder',
          title: title || 'Nenhum arquivo encontrado',
          description: description || 'Esta pasta está vazia. Adicione arquivos ou selecione outra pasta para visualizar suas mídias.',
          ctaText: ctaText || 'Selecionar Pasta'
        };
      case 'duplicates':
        return {
          icon: 'check_circle',
          title: title || 'Nenhum duplicado encontrado',
          description: description || 'Ótimo! Não há arquivos duplicados na sua biblioteca. Todos os arquivos são únicos.',
          ctaText: ctaText
        };
      case 'search':
        return {
          icon: 'search',
          title: title || 'Nenhum resultado encontrado',
          description: description || 'Tente usar termos diferentes ou verifique a ortografia.',
          ctaText: ctaText
        };
      default:
        return {
          icon: icon || 'folder',
          title: title || 'Nada encontrado',
          description: description || 'Não há itens para exibir.',
          ctaText: ctaText
        };
    }
  };

  const content = getDefaultContent();
  const isEmoji = icon && (icon === '📁' || icon === '📂' || icon === '✅');

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="max-w-md w-full mx-4 text-center p-8 bg-[#0d0d1a]/80 rounded-2xl border border-white/10 backdrop-blur-sm">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-[#1a1a2e]/80 flex items-center justify-center mb-6">
          {isEmoji ? (
            <span className="text-4xl">{icon}</span>
          ) : (
            <MaterialIcon name={content.icon} className="text-3xl text-gray-400" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2">
          {content.title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          {content.description}
        </p>

        {/* CTA Button */}
        {content.ctaText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mh-btn mh-btn-indigo px-6 py-3 text-base rounded-full inline-flex items-center gap-2 mx-auto font-medium"
          >
            <MaterialIcon name={type === 'volume' ? 'create_new_folder' : 'folder'} className="text-xl" />
            {content.ctaText}
          </button>
        )}

        {/* Tips */}
        {showTips && (
          <div className="mt-6 p-3 bg-white/5 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <MaterialIcon name="lightbulb" className="text-sm mt-0.5 text-gray-400" />
              <div className="text-left">
                <p className="font-medium text-gray-400 mb-0.5">Dica</p>
                <p>
                  {tipText || (
                    type === 'files' 
                      ? 'Você pode arrastar e soltar pastas diretamente na janela para indexá-las rapidamente.'
                      : 'Use a barra lateral para navegar entre volumes e pastas.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
