/**
 * InfoModal - Modal para exibir informações detalhadas do asset
 *
 * Features:
 * - Exibe informações de foto ou vídeo
 * - Dados técnicos e metadados
 * - Design consistente com o sistema
 */

import { useEffect } from 'react';
import { Asset } from '../shared/types';
import Icon from './Icon';

interface InfoModalProps {
  asset: Asset;
  isVisible: boolean;
  onClose: () => void;
}

export default function InfoModal({ asset, isVisible, onClose }: InfoModalProps) {
  // Handle ESC key
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const isVideo = asset.mediaType === 'video';
  const extension = asset.fileName?.includes('.')
    ? asset.fileName.split('.').pop()?.toUpperCase()
    : undefined;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="mh-popover max-w-lg w-full mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 id="info-modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">Informações</h2>
          <button
            onClick={onClose}
            className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
            type="button"
            aria-label="Fechar informações"
          >
            <Icon name="close" size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* File name */}
          <div className="text-[var(--color-text-primary)] font-medium text-base">{asset.fileName}</div>

          {/* File details */}
          <div>
            <div className="text-sm text-[var(--color-text-secondary)] mb-3">Detalhes do arquivo</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Tipo</span>
                <span className="text-[var(--color-text-primary)]">{extension || (isVideo ? 'VÍDEO' : 'FOTO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Tamanho</span>
                <span className="text-[var(--color-text-primary)]">{(asset.fileSize / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">{isVideo ? 'Resolução' : 'Dimensões'}</span>
                <span className="text-[var(--color-text-primary)]">{asset.width} × {asset.height} px</span>
              </div>
              {isVideo && asset.duration && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Duração</span>
                  <span className="text-[var(--color-text-primary)]">{Math.floor(asset.duration / 60)}:{String(Math.floor(asset.duration % 60)).padStart(2, '0')}</span>
                </div>
              )}
              {isVideo && asset.frameRate && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Frame rate</span>
                  <span className="text-[var(--color-text-primary)]">{Math.round(asset.frameRate)} fps</span>
                </div>
              )}
              {asset.createdAt && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Criado em</span>
                    <span className="text-[var(--color-text-primary)]">{new Date(asset.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {asset.indexedAt && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Indexado em</span>
                      <span className="text-[var(--color-text-primary)]">{new Date(asset.indexedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Video specific */}
          {isVideo && (
            <div>
              <div className="text-sm text-[var(--color-text-secondary)] mb-3">Vídeo</div>
              <div className="space-y-2">
                {asset.codec && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Codec</span>
                    <span className="text-[var(--color-text-primary)]">{asset.codec}</span>
                  </div>
                )}
                {(asset.audioChannels || asset.audioSampleRate) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Áudio</span>
                    <span className="text-[var(--color-text-primary)]">{asset.audioChannels ? `${asset.audioChannels}ch` : ''} {asset.audioSampleRate ? `${Math.round(asset.audioSampleRate / 1000)}kHz` : ''}</span>
                  </div>
                )}
                {asset.cameraMake && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Dispositivo</span>
                    <span className="text-[var(--color-text-primary)]">{asset.cameraMake} {asset.cameraModel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo specific */}
          {!isVideo && (
            <div>
              <div className="text-sm text-[var(--color-text-secondary)] mb-3">Câmera</div>
              <div className="space-y-2">
                {asset.cameraMake && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Dispositivo</span>
                    <span className="text-[var(--color-text-primary)]">{asset.cameraMake} {asset.cameraModel}</span>
                  </div>
                )}
                {asset.lens && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Lente</span>
                    <span className="text-[var(--color-text-primary)]">{asset.lens}</span>
                  </div>
                )}
                {asset.iso && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">ISO</span>
                    <span className="text-[var(--color-text-primary)]">ISO {asset.iso}</span>
                  </div>
                )}
                {asset.aperture && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Exposição</span>
                    <span className="text-[var(--color-text-primary)]">{asset.shutterSpeed ? `${asset.shutterSpeed}s` : ''}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
