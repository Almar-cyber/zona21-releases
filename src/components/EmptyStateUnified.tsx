import Icon from './Icon.tsx';
import { Kbd } from './Kbd';

interface EmptyStateUnifiedProps {
  type: 'volume' | 'folder' | 'files' | 'duplicates' | 'search' | 'collection' | 'flagged' | 'library-empty' | 'no-approved' | 'no-favorites' | 'no-rejected';
  title?: string;
  description?: string;
  icon?: string;
  ctaText?: string;
  secondaryCtaText?: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  showTips?: boolean;
  tipText?: string;
  stats?: string;
  benefits?: string[];
}

export default function EmptyStateUnified({
  type,
  title,
  description,
  icon,
  ctaText,
  secondaryCtaText,
  onAction,
  onSecondaryAction,
  showTips = true,
  tipText,
  stats,
  benefits
}: EmptyStateUnifiedProps) {
  const getDefaultContent = () => {
    switch (type) {
      case 'volume':
        return {
          icon: 'storage',
          title: title || 'Nenhum volume selecionado',
          description: description || 'Selecione um volume ou dispositivo para começar a visualizar e organizar suas mídias.',
          ctaText: ctaText || 'Adicionar Pasta'
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
      case 'collection':
        return {
          icon: 'layers',
          title: title || 'Coleção vazia',
          description: description || 'Arraste mídias para esta coleção ou selecione arquivos e use "Mover para coleção" no menu de ações.',
          ctaText: ctaText,
          showTips: true
        };
      case 'flagged':
        return {
          icon: 'flag',
          title: title || 'Nenhuma mídia marcada',
          description: description || 'Marque mídias clicando no ícone de bandeira ou pressionando "F" para encontrá-las aqui rapidamente.',
          ctaText: ctaText,
          showTips: true
        };
      case 'library-empty':
        return {
          icon: 'folder_open',
          title: title || 'Sua biblioteca está esperando',
          description: description || 'Arraste uma pasta de fotos aqui ou clique em "Adicionar Pasta" na barra lateral para começar.',
          ctaText: ctaText || 'Adicionar Pasta',
          secondaryCtaText: secondaryCtaText,
          showTips: true,
          tipText: tipText || 'Comece com uma pasta pequena (20-50 fotos) para aprender o workflow'
        };
      case 'no-approved':
        return {
          icon: 'check_circle',
          title: title || 'Nenhuma foto aprovada ainda',
          description: description || 'Navegue pela biblioteca e pressione A para aprovar as melhores fotos.',
          ctaText: ctaText,
          showTips: true,
          stats: stats || 'Fotógrafos profissionais marcam em média 300 fotos/hora usando atalhos'
        };
      case 'no-favorites':
        return {
          icon: 'star',
          title: title || 'Nenhuma foto favorita ainda',
          description: description || 'Pressione F para marcar suas fotos favoritas enquanto navega pela biblioteca.',
          ctaText: ctaText,
          showTips: true
        };
      case 'no-rejected':
        return {
          icon: 'delete',
          title: title || 'Nenhuma foto rejeitada',
          description: description || 'Pressione D para rejeitar fotos que não deseja manter.',
          ctaText: ctaText,
          showTips: true
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

  return (
    <div className="w-full h-full flex items-center justify-center z-10">
      <div
        className="max-w-md w-full mx-4 text-center p-8 bg-[var(--color-surface-floating)]/80 rounded-2xl border border-[var(--color-border)] backdrop-blur-sm"
        role="region"
        aria-labelledby="empty-state-title"
      >
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-[var(--color-overlay-medium)] flex items-center justify-center mb-6" aria-hidden="true">
          <Icon name={icon || content.icon} size={32} className="text-[var(--color-text-secondary)]" />
        </div>

        {/* Title */}
        <h3 id="empty-state-title" className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          {content.title}
        </h3>

        {/* Description */}
        <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">
          {content.description}
        </p>

        {/* Keyboard Shortcuts Hint (para empty states de marcação) */}
        {(type === 'no-approved' || type === 'no-favorites' || type === 'no-rejected') && (
          <div className="flex justify-center gap-3 mb-6" role="group" aria-label="Atalhos de teclado disponíveis">
            {type === 'no-approved' && (
              <div className="text-center">
                <Kbd className="w-10 h-10 text-lg font-bold bg-[var(--color-status-approved-bg)] text-[var(--color-status-approved)] border-green-500/30" aria-label="Tecla A para aprovar">A</Kbd>
                <div className="text-[var(--color-text-muted)] text-[10px] mt-1" aria-hidden="true">Aprovar</div>
              </div>
            )}
            {type === 'no-favorites' && (
              <div className="text-center">
                <Kbd className="w-10 h-10 text-lg font-bold bg-[var(--color-status-favorite-bg)] text-[var(--color-status-favorite)] border-yellow-500/30" aria-label="Tecla F para favoritar">F</Kbd>
                <div className="text-[var(--color-text-muted)] text-[10px] mt-1" aria-hidden="true">Favoritar</div>
              </div>
            )}
            {type === 'no-rejected' && (
              <div className="text-center">
                <Kbd className="w-10 h-10 text-lg font-bold bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)] border-red-500/30" aria-label="Tecla D para rejeitar">D</Kbd>
                <div className="text-[var(--color-text-muted)] text-[10px] mt-1" aria-hidden="true">Rejeitar</div>
              </div>
            )}
          </div>
        )}

        {/* Stats/Social Proof */}
        {stats && (
          <div className="mb-6 text-xs text-[var(--color-text-muted)] italic">
            {stats}
          </div>
        )}

        {/* Benefits List (AI) */}
        {benefits && benefits.length > 0 && (
          <div className="mb-6 text-left max-w-sm mx-auto space-y-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-status-approved)] flex-shrink-0 mt-0.5">✓</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA Buttons */}
        {(content.ctaText || content.secondaryCtaText) && (
          <div className="flex flex-col items-center gap-3">
            {content.ctaText && onAction && (
              <button
                type="button"
                onClick={onAction}
                className={`${
                  type === 'library-empty'
                    ? 'px-8 py-4 text-lg font-semibold'
                    : 'px-6 py-3 text-base font-medium'
                } mh-btn mh-btn-indigo inline-flex items-center gap-3 transition-all`}
              >
                <Icon name={type === 'volume' || type === 'library-empty' ? 'create_new_folder' : 'folder'} size={type === 'library-empty' ? 24 : 20} />
                {content.ctaText}
              </button>
            )}

            {/* Hint de atalho para library-empty */}
            {type === 'library-empty' && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Icon name="keyboard_command_key" size={16} />
                <span>Ou pressione Cmd+O</span>
              </div>
            )}

            {content.secondaryCtaText && onSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="mh-btn mh-btn-gray px-6 py-3 text-base inline-flex items-center gap-2 font-medium"
              >
                {content.secondaryCtaText}
              </button>
            )}
          </div>
        )}

        {/* Tips */}
        {showTips && (
          <div className="mt-6 p-3 bg-[var(--color-overlay-light)] rounded-lg border border-[var(--color-border)]">
            <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
              <Icon name="lightbulb" size={14} className="mt-0.5 text-[var(--color-text-secondary)]" />
              <div className="text-left">
                <p className="font-medium text-[var(--color-text-secondary)] mb-0.5">Dica</p>
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
