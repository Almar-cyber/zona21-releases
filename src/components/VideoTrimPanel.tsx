/**
 * Video Trim Panel Component
 *
 * Provides basic video trimming with timeline UI:
 * - Interactive timeline with drag handles
 * - Preview selection (start/end times)
 * - Trim video (export selection)
 * - Extract audio (MP3)
 */

import { useState, useEffect, useRef } from 'react';
import { Asset } from '../shared/types';
import { useVideoTrim, VideoMetadata } from '../hooks/useVideoTrim';
import Icon from './Icon';
import { Tooltip } from './Tooltip';

interface VideoTrimPanelProps {
  asset: Asset;
  isVisible: boolean;
  onClose: () => void;
  onTrimComplete?: (trimmedFilePath: string) => void;
}

export default function VideoTrimPanel({
  asset,
  isVisible,
  onClose,
  onTrimComplete
}: VideoTrimPanelProps) {
  const {
    isProcessing,
    progress,
    getMetadata,
    trimVideo,
    extractAudio,
    extractTrimmedAudio,
    formatTime,
    formatTimeDetailed
  } = useVideoTrim();

  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);

  // Load metadata when panel opens
  useEffect(() => {
    if (!isVisible || asset.mediaType !== 'video') return;

    const loadMetadata = async () => {
      const meta = await getMetadata(asset.id);
      if (meta) {
        setMetadata(meta);
        setStartTime(0);
        setEndTime(meta.duration);
      }
    };

    loadMetadata();
  }, [asset.id, asset.mediaType, isVisible, getMetadata]);

  // Handle mouse move for dragging handles
  useEffect(() => {
    if (!isDraggingStart && !isDraggingEnd) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current || !metadata) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const time = percent * metadata.duration;

      if (isDraggingStart) {
        setStartTime(Math.max(0, Math.min(time, endTime - 0.1)));
      } else if (isDraggingEnd) {
        setEndTime(Math.max(startTime + 0.1, Math.min(time, metadata.duration)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, metadata, startTime, endTime]);

  if (!isVisible || asset.mediaType !== 'video') return null;

  const duration = metadata?.duration || 0;
  const selectionDuration = endTime - startTime;
  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 100;
  const selectionPercent = endPercent - startPercent;

  const handleTrim = async () => {
    if (!metadata || selectionDuration <= 0) return;

    const result = await trimVideo(asset.id, { startTime, endTime });
    if (result) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: {
            type: 'success',
            message: `Vídeo trimado: ${formatTime(selectionDuration)}`
          }
        })
      );
      if (onTrimComplete) onTrimComplete(result);
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao trimar vídeo' }
        })
      );
    }
  };

  const handleExtractAudio = async () => {
    const result = await extractAudio(asset.id);
    if (result) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: 'Áudio extraído com sucesso!' }
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao extrair áudio' }
        })
      );
    }
  };

  const handleExtractTrimmedAudio = async () => {
    if (!metadata || selectionDuration <= 0) return;

    const result = await extractTrimmedAudio(asset.id, { startTime, endTime });
    if (result) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: {
            type: 'success',
            message: `Áudio extraído: ${formatTime(selectionDuration)}`
          }
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao extrair áudio' }
        })
      );
    }
  };

  const handleReset = () => {
    if (metadata) {
      setStartTime(0);
      setEndTime(metadata.duration);
    }
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700 overflow-y-auto z-40">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="movie" size={18} className="text-red-400" />
          <h3 className="text-sm font-semibold text-gray-200">Video Trim</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label="Fechar Video Trim"
        >
          <Icon name="close" size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Video Info */}
        {metadata && (
          <div className="bg-black/20 rounded-lg p-3 space-y-2">
            <div className="text-xs text-gray-400">Informações do Vídeo</div>
            <div className="text-sm text-gray-200">
              <div>Duração: {formatTime(metadata.duration)}</div>
              <div>Resolução: {metadata.width}×{metadata.height}</div>
              <div>FPS: {metadata.frameRate.toFixed(2)}</div>
              <div>Codec: {metadata.codec}</div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="timeline" size={12} />
            Timeline
          </h4>

          <div className="space-y-3">
            {/* Timeline bar */}
            <div
              ref={timelineRef}
              className="relative h-12 bg-gray-800 rounded-lg cursor-pointer"
              style={{ userSelect: 'none' }}
            >
              {/* Trimmed out sections (darker) */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-gray-900/80"
                style={{ width: `${startPercent}%` }}
              />
              <div
                className="absolute top-0 bottom-0 right-0 bg-gray-900/80"
                style={{ width: `${100 - endPercent}%` }}
              />

              {/* Selected section (highlighted) */}
              <div
                className="absolute top-0 bottom-0 bg-blue-500/30 border-y-2 border-blue-500"
                style={{
                  left: `${startPercent}%`,
                  width: `${selectionPercent}%`
                }}
              />

              {/* Start handle */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-400 transition-colors"
                style={{ left: `${startPercent}%` }}
                onMouseDown={() => setIsDraggingStart(true)}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full" />
              </div>

              {/* End handle */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-400 transition-colors"
                style={{ left: `${endPercent}%`, transform: 'translateX(-100%)' }}
                onMouseDown={() => setIsDraggingEnd(true)}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full" />
              </div>
            </div>

            {/* Time labels */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>0:00</span>
              <span>{metadata ? formatTime(metadata.duration) : '0:00'}</span>
            </div>
          </div>
        </div>

        {/* Selection Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-blue-400 uppercase">Seleção</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-gray-400">Início</div>
              <div className="text-white font-medium">{formatTimeDetailed(startTime)}</div>
            </div>
            <div>
              <div className="text-gray-400">Fim</div>
              <div className="text-white font-medium">{formatTimeDetailed(endTime)}</div>
            </div>
            <div>
              <div className="text-gray-400">Duração</div>
              <div className="text-white font-medium">{formatTimeDetailed(selectionDuration)}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors"
          >
            Resetar Seleção
          </button>
        </div>

        {/* Progress */}
        {progress && (
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-2">
              Processando... {progress.percent}%
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
            Ações
          </h4>

          <div className="space-y-2">
            <Tooltip content="Exportar apenas a seleção" position="right">
              <button
                type="button"
                onClick={handleTrim}
                disabled={isProcessing || selectionDuration <= 0}
                className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="content_cut" size={16} />
                {isProcessing ? 'Processando...' : 'Trimar Vídeo'}
              </button>
            </Tooltip>

            <Tooltip content="Extrair áudio da seleção (MP3)" position="right">
              <button
                type="button"
                onClick={handleExtractTrimmedAudio}
                disabled={isProcessing || selectionDuration <= 0}
                className="w-full px-3 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="audiotrack" size={16} />
                Extrair Áudio (Seleção)
              </button>
            </Tooltip>

            <Tooltip content="Extrair áudio completo (MP3)" position="right">
              <button
                type="button"
                onClick={handleExtractAudio}
                disabled={isProcessing}
                className="w-full px-3 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="audiotrack" size={16} />
                Extrair Áudio (Completo)
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Info Section */}
        <div className="text-xs text-gray-600 text-center py-4 border-t border-gray-800">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Icon name="info" size={12} />
            <span>Processamento rápido</span>
          </div>
          <div className="text-[10px]">
            Trim usa copy codec (sem re-encoding).
            <br />
            Original sempre preservado.
          </div>
        </div>
      </div>
    </div>
  );
}
