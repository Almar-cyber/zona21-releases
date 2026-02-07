import { useState, useEffect } from 'react';
import Icon from './Icon.tsx';

interface UpdateBannerProps {
  isVisible: boolean;
  downloadProgress?: { percent: number; transferred: number; total: number };
  isDownloaded?: boolean;
}

export default function UpdateBanner({ isVisible, downloadProgress, isDownloaded }: UpdateBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

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

  const handleUpdateClick = async () => {
    if (isDownloaded) {
      // Update já foi baixado, instalar agora
      setIsInstalling(true);
      try {
        await window.electronAPI.installUpdate();
      } catch (error) {
        console.error('Error installing update:', error);
        setIsInstalling(false);
      }
    } else {
      // Iniciar download
      setIsDownloading(true);
      try {
        await window.electronAPI.downloadUpdate();
      } catch (error) {
        console.error('Error downloading update:', error);
        setIsDownloading(false);
      }
    }
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="relative w-full shrink-0 z-[150] bg-gradient-to-r from-[#4F46E5]/95 to-[#6366F1]/95 backdrop-blur-sm border-b border-[var(--color-border-hover)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Icon name={isInstalling ? "rocket_launch" : isDownloading ? "downloading" : isDownloaded ? "download_done" : "system_update"} size={20} className="text-white animate-pulse" />
              <span className="text-white font-medium text-sm">
                {isInstalling ? "Instalando..." : isDownloading ? "Baixando atualização..." : isDownloaded ? "Atualização pronta!" : "Atualização disponível!"}
              </span>
            </div>
            <span className="text-[var(--color-text-secondary)] text-xs sm:text-sm hidden sm:inline truncate max-w-[200px] lg:max-w-none">
              {isDownloading && downloadProgress
                ? `${Math.round(downloadProgress.percent)}% (${Math.round(downloadProgress.transferred / 1024 / 1024)}MB de ${Math.round(downloadProgress.total / 1024 / 1024)}MB)`
                : isDownloaded
                  ? "Clique para reiniciar e atualizar"
                  : "Nova versão com melhorias e correções"
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {!isDownloading && !isInstalling && (
              <button
                type="button"
                onClick={handleUpdateClick}
                className="bg-[var(--color-overlay-medium)] hover:bg-[var(--color-overlay-strong)] text-[var(--color-text-primary)] px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Icon name={isDownloaded ? "restart_alt" : "download"} size={16} />
                <span>{isDownloaded ? "Reiniciar e atualizar" : "Atualizar agora"}</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-md transition-colors"
              aria-label="Fechar notificação"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
        
        {/* Barra de progresso */}
        {isDownloading && downloadProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-overlay-medium)]">
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
