/**
 * InfoModal - Modal para exibir informações detalhadas do asset
 *
 * Features:
 * - Exibe informações de foto ou vídeo
 * - Dados técnicos e metadados
 * - Design consistente com o sistema
 */

import { Asset } from '../shared/types';
import Icon from './Icon';

interface InfoModalProps {
  asset: Asset;
  isVisible: boolean;
  onClose: () => void;
}

export default function InfoModal({ asset, isVisible, onClose }: InfoModalProps) {
  if (!isVisible) return null;

  const isVideo = asset.mediaType === 'video';
  const extension = asset.fileName?.includes('.')
    ? asset.fileName.split('.').pop()?.toUpperCase()
    : undefined;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mh-popover max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Informações</h2>
          <button
            onClick={onClose}
            className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
            type="button"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* File name */}
          <div className="text-white font-medium text-base">{asset.fileName}</div>

          {/* File details */}
          <div>
            <div className="text-sm text-gray-400 mb-3">Detalhes do arquivo</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Tipo</span>
                <span className="text-white">{extension || (isVideo ? 'VÍDEO' : 'FOTO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tamanho</span>
                <span className="text-white">{(asset.fileSize / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isVideo ? 'Resolução' : 'Dimensões'}</span>
                <span className="text-white">{asset.width} × {asset.height} px</span>
              </div>
              {isVideo && asset.duration && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Duração</span>
                  <span className="text-white">{Math.floor(asset.duration / 60)}:{String(Math.floor(asset.duration % 60)).padStart(2, '0')}</span>
                </div>
              )}
              {isVideo && asset.frameRate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Frame rate</span>
                  <span className="text-white">{Math.round(asset.frameRate)} fps</span>
                </div>
              )}
              {asset.createdAt && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Criado em</span>
                    <span className="text-white">{new Date(asset.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {asset.indexedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Indexado em</span>
                      <span className="text-white">{new Date(asset.indexedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Video specific */}
          {isVideo && (
            <div>
              <div className="text-sm text-gray-400 mb-3">Vídeo</div>
              <div className="space-y-2">
                {asset.codec && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Codec</span>
                    <span className="text-white">{asset.codec}</span>
                  </div>
                )}
                {(asset.audioChannels || asset.audioSampleRate) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Áudio</span>
                    <span className="text-white">{asset.audioChannels ? `${asset.audioChannels}ch` : ''} {asset.audioSampleRate ? `${Math.round(asset.audioSampleRate / 1000)}kHz` : ''}</span>
                  </div>
                )}
                {asset.cameraMake && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dispositivo</span>
                    <span className="text-white">{asset.cameraMake} {asset.cameraModel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo specific */}
          {!isVideo && (
            <div>
              <div className="text-sm text-gray-400 mb-3">Câmera</div>
              <div className="space-y-2">
                {asset.cameraMake && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dispositivo</span>
                    <span className="text-white">{asset.cameraMake} {asset.cameraModel}</span>
                  </div>
                )}
                {asset.lens && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lente</span>
                    <span className="text-white">{asset.lens}</span>
                  </div>
                )}
                {asset.iso && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">ISO</span>
                    <span className="text-white">ISO {asset.iso}</span>
                  </div>
                )}
                {asset.aperture && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Exposição</span>
                    <span className="text-white">{asset.shutterSpeed ? `${asset.shutterSpeed}s` : ''}</span>
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
