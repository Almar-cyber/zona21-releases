import { useState, useEffect } from 'react';
import Icon from './Icon.tsx';

interface UpdateBannerProps {
  onUpdateClick: () => void;
  isVisible: boolean;
  downloadProgress?: { percent: number; transferred: number; total: number };
}

export default function UpdateBanner({ onUpdateClick, isVisible, downloadProgress }: UpdateBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Resetar dismissed quando o banner aparece novamente
  useEffect(() => {
    if (isVisible) {
      setIsDismissed(false);
    }
  }, [isVisible]);

  // Detectar quando download começou
  useEffect(() => {
    if (downloadProgress) {
      setIsDownloading(true);
    }
  }, [downloadProgress]);

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[150] bg-gradient-to-r from-[#4F46E5]/95 to-[#6366F1]/95 backdrop-blur-sm border-b border-white/20">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Icon name={isDownloading ? "downloading" : "system_update"} size={20} className="text-white animate-pulse" />
              <span className="text-white font-medium text-sm">
                {isDownloading ? "Baixando atualização..." : "Atualização disponível!"}
              </span>
            </div>
            <span className="text-white/80 text-sm hidden sm:inline">
              {isDownloading && downloadProgress 
                ? `${Math.round(downloadProgress.percent)}% (${Math.round(downloadProgress.transferred / 1024 / 1024)}MB de ${Math.round(downloadProgress.total / 1024 / 1024)}MB)`
                : "Nova versão com melhorias e correções"
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {!isDownloading && (
              <button
                type="button"
                onClick={onUpdateClick}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Icon name="download" size={16} />
                <span>Atualizar agora</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-white/60 hover:text-white p-1 rounded-full transition-colors"
              aria-label="Fechar notificação"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
        
        {/* Barra de progresso */}
        {isDownloading && downloadProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${downloadProgress.percent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
