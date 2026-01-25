import MaterialIcon from './MaterialIcon.tsx';

interface EmptyStateProps {
  type: 'volume' | 'folder';
  onAction?: () => void;
}

export default function EmptyState({ type, onAction }: EmptyStateProps) {
  const isVolume = type === 'volume';

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
          <MaterialIcon 
            name={isVolume ? "storage" : "folder_open"} 
            className="text-4xl text-gray-400" 
          />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-200 mb-2">
          {isVolume ? "Nenhum volume selecionado" : "Nenhuma pasta selecionada"}
        </h3>

        {/* Description */}
        <p className="text-gray-400 mb-8 leading-relaxed">
          {isVolume 
            ? "Selecione um volume ou dispositivo para começar a visualizar e organizar suas mídias."
            : "Escolha uma pasta específica dentro do volume para navegar pelos seus arquivos."
          }
        </p>

        {/* CTA Button */}
        <button
          type="button"
          onClick={onAction}
          className="mh-btn mh-btn-indigo px-6 py-3 text-base inline-flex items-center gap-2 mx-auto"
        >
          <MaterialIcon name={isVolume ? "add" : "folder"} className="text-xl" />
          {isVolume ? "Adicionar Arquivos" : "Selecionar Pasta"}
        </button>

        {/* Tips */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <MaterialIcon name="lightbulb" className="text-lg mt-0.5" />
            <div className="text-left">
              <p className="font-medium text-gray-400 mb-1">Dica</p>
              <p>
                {isVolume 
                  ? "Você também pode arrastar e soltar arquivos diretamente na janela para importá-los."
                  : "Use o sidebar para navegar rapidamente entre pastas e volumes."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
