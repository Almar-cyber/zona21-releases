/**
 * FloatingPhotoControls - Floating draggable panel for photo viewer
 *
 * Features:
 * - Draggable panel
 * - Photo controls (zoom, edit, etc)
 * - Metadata display
 * - Collapsible sections
 */

import { useState, useRef, useEffect } from 'react';
import { Asset } from '../shared/types';
import Icon from './Icon';
import { Tooltip } from './Tooltip';

interface FloatingPhotoControlsProps {
  asset: Asset;
  onClose?: () => void;
  onToggleQuickEdit?: () => void;
  isQuickEditVisible?: boolean;
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
  onClose,
  onToggleQuickEdit,
  isQuickEditVisible,
  scale = 1,
  viewMode = 'fit',
  onZoomIn,
  onZoomOut,
  onSetFit,
  onSet100
}: FloatingPhotoControlsProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    <div
      ref={panelRef}
      className="fixed z-50 mh-popover shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isCollapsed ? '48px' : '320px',
        maxHeight: '80vh',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Header - Draggable */}
      <div
        className="flex items-center justify-between p-3 border-b border-white/10 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Icon name="photo" size={18} className="text-purple-400" />
            <span className="text-sm font-semibold text-white">Controles</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Tooltip content={isCollapsed ? "Expandir" : "Minimizar"} position="bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
              className="mh-btn mh-btn-gray h-7 w-7 flex items-center justify-center"
              type="button"
            >
              <Icon name={isCollapsed ? "unfold_more" : "unfold_less"} size={16} />
            </button>
          </Tooltip>
          {onClose && (
            <Tooltip content="Fechar" position="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="mh-btn mh-btn-gray h-7 w-7 flex items-center justify-center"
                type="button"
              >
                <Icon name="close" size={16} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {/* Zoom Controls */}
          <div className="p-3 border-b border-white/10">
            <div className="text-xs text-gray-400 mb-2">Zoom</div>
            <div className="flex items-center gap-2">
              <Tooltip content="Diminuir zoom (-)" position="top">
                <button
                  type="button"
                  onClick={onZoomOut}
                  className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
                >
                  <Icon name="remove" size={16} />
                </button>
              </Tooltip>
              <span className="text-sm font-medium text-gray-300 tabular-nums flex-1 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Tooltip content="Ajustar à tela (0)" position="top">
                <button
                  type="button"
                  onClick={onSetFit}
                  className={`mh-btn h-8 px-3 text-xs ${viewMode === 'fit' ? 'mh-btn-indigo' : 'mh-btn-gray'}`}
                >
                  Fit
                </button>
              </Tooltip>
              <Tooltip content="Tamanho real (1)" position="top">
                <button
                  type="button"
                  onClick={onSet100}
                  className={`mh-btn h-8 px-3 text-xs ${viewMode === '100' ? 'mh-btn-indigo' : 'mh-btn-gray'}`}
                >
                  100%
                </button>
              </Tooltip>
              <Tooltip content="Aumentar zoom (+)" position="top">
                <button
                  type="button"
                  onClick={onZoomIn}
                  className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
                >
                  <Icon name="add" size={16} />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* File Info */}
          <div className="p-3 border-b border-white/10">
            <div className="text-xs text-gray-400 mb-1">Arquivo</div>
            <div className="text-sm text-white break-all">{asset.fileName}</div>
          </div>

          {/* Photo Metadata */}
          <div className="p-3 border-b border-white/10">
            <div className="text-xs text-gray-400 mb-2">Metadados</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Câmera:</span>
                <span className="text-gray-200 truncate ml-2">{asset.cameraMake} {asset.cameraModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lente:</span>
                <span className="text-gray-200">{asset.lens || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ISO:</span>
                <span className="text-gray-200">{asset.iso || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Abertura:</span>
                <span className="text-gray-200">f/{asset.aperture || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Focal:</span>
                <span className="text-gray-200">{asset.focalLength}mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Resolução:</span>
                <span className="text-gray-200">{asset.width} × {asset.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tamanho:</span>
                <span className="text-gray-200">{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3">
            <div className="text-xs text-gray-400 mb-2">Ações</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={onToggleQuickEdit}
                className={`mh-btn h-10 flex items-center justify-center gap-2 transition-colors ${
                  isQuickEditVisible ? 'bg-blue-600 hover:bg-blue-700' : 'mh-btn-gray'
                }`}
                type="button"
              >
                <Icon name="edit" size={18} />
                <span className="text-sm">Editar (E)</span>
              </button>
              <button
                className="mh-btn mh-btn-gray h-10 flex items-center justify-center gap-2"
                type="button"
              >
                <Icon name="crop" size={18} />
                <span className="text-sm">Recortar</span>
              </button>
              <button
                className="mh-btn mh-btn-gray h-10 flex items-center justify-center gap-2"
                type="button"
              >
                <Icon name="rotate_right" size={18} />
                <span className="text-sm">Girar</span>
              </button>
              <button
                className="mh-btn mh-btn-gray h-10 flex items-center justify-center gap-2"
                type="button"
              >
                <Icon name="send" size={18} />
                <span className="text-sm">Enviar</span>
              </button>
              <button
                className="mh-btn mh-btn-danger h-10 flex items-center justify-center gap-2"
                type="button"
              >
                <Icon name="delete" size={18} />
                <span className="text-sm">Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
