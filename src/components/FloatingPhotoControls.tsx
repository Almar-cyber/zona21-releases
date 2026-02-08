/**
 * FloatingPhotoControls - Painel flutuante para viewer de fotos
 *
 * Segue o Design System Zona21:
 * - Usa tokens de cor (--color-sidebar-bg, --color-overlay-*, etc)
 * - Glassmorphism com backdrop-blur
 * - Transições consistentes
 */

import { useState, useRef, useEffect } from 'react';
import { Asset } from '../shared/types';
import Icon from './Icon';
import InfoModal from './InfoModal';
import { Tooltip } from './Tooltip';

interface FloatingPhotoControlsProps {
  asset: Asset;
  onRotate?: () => void;
  onCrop?: () => void;
  onDownload?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSetFit?: () => void;
}

export default function FloatingPhotoControls({
  asset,
  onZoomIn,
  onZoomOut,
  onRotate,
  onCrop,
  onDownload,
  onSetFit,
}: FloatingPhotoControlsProps) {
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const pw = panelRef.current?.offsetWidth ?? 80;
      const ph = panelRef.current?.offsetHeight ?? 300;
      const newX = dragStartRef.current.px + (e.clientX - dragStartRef.current.x);
      const newY = dragStartRef.current.py + (e.clientY - dragStartRef.current.y);
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - pw, newX)),
        y: Math.max(0, Math.min(window.innerHeight - ph, newY))
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
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y };
  };

  // Control button usando design tokens
  const ControlButton = ({
    onClick,
    icon,
    label,
    isActive = false,
  }: {
    onClick: () => void;
    icon: string;
    label: string;
    isActive?: boolean;
  }) => (
    <Tooltip content={label} position="right">
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`
          group/btn flex flex-col items-center gap-1 p-2 rounded-lg transition-all
          ${isActive
            ? 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-light)]'
          }
        `}
        style={{ transition: 'var(--transition-fast)' }}
        type="button"
        aria-label={label}
      >
        <Icon name={icon} size={20} />
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    </Tooltip>
  );

  const Separator = () => (
    <div className="w-8 h-px my-1" style={{ background: 'var(--color-border)' }} />
  );

  return (
    <>
      <div
        ref={panelRef}
        className={`
          fixed z-50 select-none transition-all
          ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
        `}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transitionDuration: 'var(--transition-slow)',
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="relative overflow-visible backdrop-blur-xl"
          style={{
            background: 'var(--color-sidebar-bg)',
            boxShadow: '0 0 0 1px var(--color-border), var(--shadow-lg)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          {/* Drag Handle */}
          <div className={`flex justify-center py-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
            <div className="flex gap-0.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center px-2 pb-3 gap-0.5">
            <ControlButton onClick={() => onZoomIn?.()} icon="zoom_in" label="Zoom +" />
            <ControlButton onClick={() => onZoomOut?.()} icon="zoom_out" label="Zoom -" />
            <ControlButton onClick={() => onSetFit?.()} icon="fullscreen_exit" label="Ajustar" />

            <Separator />

            <ControlButton onClick={() => onRotate?.()} icon="rotate_right" label="Girar" />
            <ControlButton onClick={() => onCrop?.()} icon="crop" label="Recortar" />

            <Separator />

            <ControlButton onClick={() => onDownload?.()} icon="download" label="Baixar" />
            <ControlButton onClick={() => setIsInfoVisible(true)} icon="info" label="Info" isActive={isInfoVisible} />
          </div>
        </div>
      </div>

      <InfoModal asset={asset} isVisible={isInfoVisible} onClose={() => setIsInfoVisible(false)} />
    </>
  );
}
