/**
 * FloatingPhotoControls - Floating draggable panel for photo viewer
 *
 * Features:
 * - Draggable panel
 * - Photo controls (zoom, edit, info, etc)
 * - Vertical layout with icons
 */

import { useState, useRef, useEffect } from 'react';
import { Asset } from '../shared/types';
import Icon from './Icon';
import { Tooltip } from './Tooltip';
import InfoModal from './InfoModal';

interface FloatingPhotoControlsProps {
  asset: Asset;
  onClose?: () => void;
  onToggleQuickEdit?: () => void;
  isQuickEditVisible?: boolean;
  onRotate?: () => void;
  onCrop?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  // Zoom controls
  scale?: number;
  viewMode?: 'fit' | '100';
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSetFit?: () => void;
  onSet100?: () => void;
}

export default function FloatingPhotoControls({
  asset,
  onZoomIn,
  onZoomOut,
  onToggleQuickEdit,
  isQuickEditVisible,
  onRotate,
  onCrop,
  onDownload,
  onDelete
}: FloatingPhotoControlsProps) {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.px + dx,
        y: dragStartRef.current.py + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // Don't drag when clicking buttons
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y
    };
  };

  return (
    <>
      <div
        ref={panelRef}
        className="fixed z-50 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl rounded-[32px] border border-white/5"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          width: '100px',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center py-3">
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="w-1 h-1 rounded-full bg-gray-600" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col px-4 pb-4 gap-3">
          <Tooltip content="Informações" position="right">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInfoVisible(true);
                }}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                type="button"
                aria-label="Ver informações do arquivo"
              >
                <Icon name="info" size={20} className="text-gray-300" />
              </button>
              <span className="text-[10px] text-gray-400">Info</span>
            </div>
          </Tooltip>

          <Tooltip content="Diminuir zoom" position="right">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onZoomOut?.();
                }}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                type="button"
                aria-label="Diminuir zoom"
              >
                <Icon name="zoom_out" size={20} className="text-gray-300" />
              </button>
              <span className="text-[10px] text-gray-400">Zoom -</span>
            </div>
          </Tooltip>

          <Tooltip content="Aumentar zoom" position="right">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onZoomIn?.();
                }}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                type="button"
                aria-label="Aumentar zoom"
              >
                <Icon name="zoom_in" size={20} className="text-gray-300" />
              </button>
              <span className="text-[10px] text-gray-400">Zoom +</span>
            </div>
          </Tooltip>

          <Tooltip content="Girar" position="right">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRotate?.();
                }}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                type="button"
                aria-label="Girar imagem"
              >
                <Icon name="rotate_right" size={20} className="text-gray-300" />
              </button>
              <span className="text-[10px] text-gray-400">Girar</span>
            </div>
          </Tooltip>

          <Tooltip content="Recortar" position="right">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCrop?.();
                }}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                type="button"
                aria-label="Recortar imagem"
              >
                <Icon name="crop" size={20} className="text-gray-300" />
              </button>
              <span className="text-[10px] text-gray-400">Recortar</span>
            </div>
          </Tooltip>

          <Tooltip content="Ajustes (E)" position="right">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleQuickEdit?.();
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isQuickEditVisible ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/5 hover:bg-white/10'
                }`}
                type="button"
                aria-label="Abrir painel de ajustes"
                aria-pressed={isQuickEditVisible}
              >
                <Icon name="tune" size={20} className="text-gray-300" />
              </button>
              <span className="text-[10px] text-gray-400">Ajustes</span>
            </div>
          </Tooltip>

          <Tooltip content="Baixar" position="right">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload?.();
                }}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                type="button"
                aria-label="Baixar arquivo"
              >
                <Icon name="download" size={20} className="text-gray-300" />
              </button>
              <span className="text-[10px] text-gray-400">Baixar</span>
            </div>
          </Tooltip>

          <Tooltip content="Excluir" position="right">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="w-12 h-12 rounded-full bg-red-600/20 hover:bg-red-600/30 flex items-center justify-center transition-colors"
                type="button"
                aria-label="Excluir arquivo"
              >
                <Icon name="delete" size={20} className="text-red-400" />
              </button>
              <span className="text-[10px] text-red-400">Excluir</span>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Info Modal */}
      <InfoModal
        asset={asset}
        isVisible={isInfoVisible}
        onClose={() => setIsInfoVisible(false)}
      />
    </>
  );
}
