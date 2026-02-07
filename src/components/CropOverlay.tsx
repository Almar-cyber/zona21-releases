/**
 * CropOverlay - Lightroom-style crop tool overlay
 *
 * Features:
 * - Visual crop box with draggable handles
 * - Dimmed area outside crop region
 * - Grid overlay (rule of thirds, golden ratio)
 * - Rotation slider
 * - Aspect ratio presets
 * - Flip controls
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from './Icon';
import { Tooltip } from './Tooltip';

interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
  scale: number;
  translateX: number;
  translateY: number;
  onApply: (crop: CropResult) => void;
  onCancel: () => void;
}

export interface CropResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

type AspectRatio = {
  label: string;
  value: number | null; // null = free
};

const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Livre', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '4:5', value: 4 / 5 },
  { label: '2:3', value: 2 / 3 },
];

type GridType = 'none' | 'thirds' | 'golden' | 'diagonal' | 'center';

export default function CropOverlay({
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight,
  scale,
  translateX,
  translateY,
  onApply,
  onCancel,
}: CropOverlayProps) {
  // Crop box state (in image coordinates)
  const [cropBox, setCropBox] = useState({
    x: 0,
    y: 0,
    width: imageWidth,
    height: imageHeight,
  });

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [gridType, setGridType] = useState<GridType>('thirds');
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    box: typeof cropBox;
  } | null>(null);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Initialize crop box
  useEffect(() => {
    setCropBox({ x: 0, y: 0, width: imageWidth, height: imageHeight });
  }, [imageWidth, imageHeight]);

  // Convert image coords to screen coords
  const imageToScreen = useCallback((x: number, y: number) => ({
    x: translateX + x * scale,
    y: translateY + y * scale,
  }), [translateX, translateY, scale]);

  // Convert screen coords to image coords
  const screenToImage = useCallback((sx: number, sy: number) => ({
    x: (sx - translateX) / scale,
    y: (sy - translateY) / scale,
  }), [translateX, translateY, scale]);

  // Get crop box in screen coordinates
  const getScreenBox = useCallback(() => {
    const topLeft = imageToScreen(cropBox.x, cropBox.y);
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: cropBox.width * scale,
      height: cropBox.height * scale,
    };
  }, [cropBox, imageToScreen, scale]);

  // Constrain crop box to image bounds and aspect ratio
  const constrainBox = useCallback((box: typeof cropBox, handle?: string) => {
    let { x, y, width, height } = box;

    // Minimum size
    const minSize = 50;
    width = Math.max(minSize, width);
    height = Math.max(minSize, height);

    // Apply aspect ratio
    if (aspectRatio !== null) {
      if (handle?.includes('e') || handle?.includes('w')) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }
    }

    // Constrain to image bounds
    x = Math.max(0, Math.min(x, imageWidth - width));
    y = Math.max(0, Math.min(y, imageHeight - height));
    width = Math.min(width, imageWidth - x);
    height = Math.min(height, imageHeight - y);

    return { x, y, width, height };
  }, [aspectRatio, imageWidth, imageHeight]);

  // Handle mouse down on resize handles
  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...cropBox },
    };
  };

  // Handle mouse move
  useEffect(() => {
    if (!isDragging || !dragStartRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = dragStartRef.current!;
      const dx = (e.clientX - start.mouseX) / scale;
      const dy = (e.clientY - start.mouseY) / scale;

      let newBox = { ...start.box };

      switch (dragType) {
        case 'move':
          newBox.x = start.box.x + dx;
          newBox.y = start.box.y + dy;
          break;
        case 'nw':
          newBox.x = start.box.x + dx;
          newBox.y = start.box.y + dy;
          newBox.width = start.box.width - dx;
          newBox.height = start.box.height - dy;
          break;
        case 'ne':
          newBox.y = start.box.y + dy;
          newBox.width = start.box.width + dx;
          newBox.height = start.box.height - dy;
          break;
        case 'sw':
          newBox.x = start.box.x + dx;
          newBox.width = start.box.width - dx;
          newBox.height = start.box.height + dy;
          break;
        case 'se':
          newBox.width = start.box.width + dx;
          newBox.height = start.box.height + dy;
          break;
        case 'n':
          newBox.y = start.box.y + dy;
          newBox.height = start.box.height - dy;
          break;
        case 's':
          newBox.height = start.box.height + dy;
          break;
        case 'w':
          newBox.x = start.box.x + dx;
          newBox.width = start.box.width - dx;
          break;
        case 'e':
          newBox.width = start.box.width + dx;
          break;
      }

      setCropBox(constrainBox(newBox, dragType || undefined));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragType, scale, constrainBox]);

  // Apply aspect ratio
  const applyAspectRatio = (ratio: number | null) => {
    setAspectRatio(ratio);
    if (ratio !== null) {
      const currentAspect = cropBox.width / cropBox.height;
      let newWidth = cropBox.width;
      let newHeight = cropBox.height;

      if (currentAspect > ratio) {
        newWidth = cropBox.height * ratio;
      } else {
        newHeight = cropBox.width / ratio;
      }

      setCropBox(constrainBox({
        x: cropBox.x + (cropBox.width - newWidth) / 2,
        y: cropBox.y + (cropBox.height - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      }));
    }
  };

  // Swap aspect ratio (rotate 90°)
  const swapAspectRatio = () => {
    if (aspectRatio !== null) {
      const newRatio = 1 / aspectRatio;
      setAspectRatio(newRatio);

      const centerX = cropBox.x + cropBox.width / 2;
      const centerY = cropBox.y + cropBox.height / 2;
      const newWidth = cropBox.height;
      const newHeight = cropBox.width;

      setCropBox(constrainBox({
        x: centerX - newWidth / 2,
        y: centerY - newHeight / 2,
        width: newWidth,
        height: newHeight,
      }));
    }
  };

  // Reset crop
  const resetCrop = () => {
    setCropBox({ x: 0, y: 0, width: imageWidth, height: imageHeight });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio(null);
  };

  // Handle apply
  const handleApply = () => {
    onApply({
      x: Math.round(cropBox.x),
      y: Math.round(cropBox.y),
      width: Math.round(cropBox.width),
      height: Math.round(cropBox.height),
      rotation,
      flipH,
      flipV,
    });
  };

  // Cycle grid
  const cycleGrid = () => {
    const grids: GridType[] = ['none', 'thirds', 'golden', 'diagonal', 'center'];
    const idx = grids.indexOf(gridType);
    setGridType(grids[(idx + 1) % grids.length]);
  };

  const screenBox = getScreenBox();

  // Get image bounds in screen coordinates
  const imageBounds = {
    x: translateX,
    y: translateY,
    width: imageWidth * scale,
    height: imageHeight * scale,
  };

  // Render grid overlay
  const renderGrid = () => {
    if (gridType === 'none') return null;

    const lines: JSX.Element[] = [];

    if (gridType === 'thirds') {
      // Rule of thirds
      for (let i = 1; i <= 2; i++) {
        lines.push(
          <line
            key={`h${i}`}
            x1={screenBox.x}
            y1={screenBox.y + (screenBox.height * i) / 3}
            x2={screenBox.x + screenBox.width}
            y2={screenBox.y + (screenBox.height * i) / 3}
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1}
          />,
          <line
            key={`v${i}`}
            x1={screenBox.x + (screenBox.width * i) / 3}
            y1={screenBox.y}
            x2={screenBox.x + (screenBox.width * i) / 3}
            y2={screenBox.y + screenBox.height}
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        );
      }
    } else if (gridType === 'golden') {
      // Golden ratio (~0.618)
      const phi = 0.618;
      lines.push(
        <line key="h1" x1={screenBox.x} y1={screenBox.y + screenBox.height * phi} x2={screenBox.x + screenBox.width} y2={screenBox.y + screenBox.height * phi} stroke="currentColor" strokeOpacity={0.5} strokeWidth={1} />,
        <line key="h2" x1={screenBox.x} y1={screenBox.y + screenBox.height * (1 - phi)} x2={screenBox.x + screenBox.width} y2={screenBox.y + screenBox.height * (1 - phi)} stroke="currentColor" strokeOpacity={0.5} strokeWidth={1} />,
        <line key="v1" x1={screenBox.x + screenBox.width * phi} y1={screenBox.y} x2={screenBox.x + screenBox.width * phi} y2={screenBox.y + screenBox.height} stroke="currentColor" strokeOpacity={0.5} strokeWidth={1} />,
        <line key="v2" x1={screenBox.x + screenBox.width * (1 - phi)} y1={screenBox.y} x2={screenBox.x + screenBox.width * (1 - phi)} y2={screenBox.y + screenBox.height} stroke="currentColor" strokeOpacity={0.5} strokeWidth={1} />
      );
    } else if (gridType === 'diagonal') {
      lines.push(
        <line key="d1" x1={screenBox.x} y1={screenBox.y} x2={screenBox.x + screenBox.width} y2={screenBox.y + screenBox.height} stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} />,
        <line key="d2" x1={screenBox.x + screenBox.width} y1={screenBox.y} x2={screenBox.x} y2={screenBox.y + screenBox.height} stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} />
      );
    } else if (gridType === 'center') {
      lines.push(
        <line key="h" x1={screenBox.x} y1={screenBox.y + screenBox.height / 2} x2={screenBox.x + screenBox.width} y2={screenBox.y + screenBox.height / 2} stroke="currentColor" strokeOpacity={0.5} strokeWidth={1} />,
        <line key="v" x1={screenBox.x + screenBox.width / 2} y1={screenBox.y} x2={screenBox.x + screenBox.width / 2} y2={screenBox.y + screenBox.height} stroke="currentColor" strokeOpacity={0.5} strokeWidth={1} />
      );
    }

    return lines;
  };

  // Handle size
  const handleSize = 10;

  return (
    <div
      className={`absolute inset-0 z-30 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* SVG Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none text-[var(--color-text-primary)]">
        {/* Dimmed area outside crop - only within image bounds */}
        <defs>
          <clipPath id="imageClip">
            <rect
              x={imageBounds.x}
              y={imageBounds.y}
              width={imageBounds.width}
              height={imageBounds.height}
            />
          </clipPath>
          <mask id="cropMask">
            <rect
              x={imageBounds.x}
              y={imageBounds.y}
              width={imageBounds.width}
              height={imageBounds.height}
              fill="white"
            />
            <rect
              x={screenBox.x}
              y={screenBox.y}
              width={screenBox.width}
              height={screenBox.height}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x={imageBounds.x}
          y={imageBounds.y}
          width={imageBounds.width}
          height={imageBounds.height}
          fill="black"
          fillOpacity={0.6}
          mask="url(#cropMask)"
        />

        {/* Image bounds outline */}
        <rect
          x={imageBounds.x}
          y={imageBounds.y}
          width={imageBounds.width}
          height={imageBounds.height}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.3}
          strokeWidth={1}
        />

        {/* Grid lines */}
        {renderGrid()}

        {/* Crop box border */}
        <rect
          x={screenBox.x}
          y={screenBox.y}
          width={screenBox.width}
          height={screenBox.height}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        />

        {/* Corner accents */}
        {['nw', 'ne', 'sw', 'se'].map(corner => {
          const isLeft = corner.includes('w');
          const isTop = corner.includes('n');
          const x = isLeft ? screenBox.x : screenBox.x + screenBox.width;
          const y = isTop ? screenBox.y : screenBox.y + screenBox.height;
          const len = 20;

          return (
            <g key={corner}>
              <line
                x1={x}
                y1={y}
                x2={x + (isLeft ? len : -len)}
                y2={y}
                stroke="currentColor"
                strokeWidth={3}
              />
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={y + (isTop ? len : -len)}
                stroke="currentColor"
                strokeWidth={3}
              />
            </g>
          );
        })}
      </svg>

      {/* Drag handles (invisible but interactive) */}
      {/* Move handle (center) */}
      <div
        className="absolute cursor-move"
        style={{
          left: screenBox.x,
          top: screenBox.y,
          width: screenBox.width,
          height: screenBox.height,
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      />

      {/* Corner handles */}
      {[
        { pos: 'nw', cursor: 'nw-resize', x: screenBox.x - handleSize / 2, y: screenBox.y - handleSize / 2 },
        { pos: 'ne', cursor: 'ne-resize', x: screenBox.x + screenBox.width - handleSize / 2, y: screenBox.y - handleSize / 2 },
        { pos: 'sw', cursor: 'sw-resize', x: screenBox.x - handleSize / 2, y: screenBox.y + screenBox.height - handleSize / 2 },
        { pos: 'se', cursor: 'se-resize', x: screenBox.x + screenBox.width - handleSize / 2, y: screenBox.y + screenBox.height - handleSize / 2 },
      ].map(({ pos, cursor, x, y }) => (
        <div
          key={pos}
          className="absolute bg-[var(--color-text-primary)] rounded-sm shadow-md"
          style={{
            left: x,
            top: y,
            width: handleSize,
            height: handleSize,
            cursor,
          }}
          onMouseDown={(e) => handleMouseDown(e, pos)}
        />
      ))}

      {/* Edge handles */}
      {[
        { pos: 'n', cursor: 'n-resize', x: screenBox.x + screenBox.width / 2 - handleSize / 2, y: screenBox.y - handleSize / 2 },
        { pos: 's', cursor: 's-resize', x: screenBox.x + screenBox.width / 2 - handleSize / 2, y: screenBox.y + screenBox.height - handleSize / 2 },
        { pos: 'w', cursor: 'w-resize', x: screenBox.x - handleSize / 2, y: screenBox.y + screenBox.height / 2 - handleSize / 2 },
        { pos: 'e', cursor: 'e-resize', x: screenBox.x + screenBox.width - handleSize / 2, y: screenBox.y + screenBox.height / 2 - handleSize / 2 },
      ].map(({ pos, cursor, x, y }) => (
        <div
          key={pos}
          className="absolute bg-[var(--color-text-primary)] rounded-sm shadow-md"
          style={{
            left: x,
            top: y,
            width: handleSize,
            height: handleSize,
            cursor,
          }}
          onMouseDown={(e) => handleMouseDown(e, pos)}
        />
      ))}

      {/* Bottom toolbar */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl"
        style={{
          background: 'var(--color-sidebar-bg)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Aspect ratio selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--color-text-muted)] mr-1">Proporção</span>
          <select
            value={aspectRatio === null ? 'free' : aspectRatio.toString()}
            onChange={(e) => applyAspectRatio(e.target.value === 'free' ? null : parseFloat(e.target.value))}
            className="px-2 py-1 rounded text-xs bg-[var(--color-overlay-light)] text-[var(--color-text-primary)] border-none outline-none cursor-pointer"
          >
            {ASPECT_RATIOS.map(ar => (
              <option key={ar.label} value={ar.value === null ? 'free' : ar.value}>
                {ar.label}
              </option>
            ))}
          </select>
          <Tooltip content="Trocar orientação (X)" position="top">
            <button
              onClick={swapAspectRatio}
              disabled={aspectRatio === null}
              className="p-1.5 rounded hover:bg-[var(--color-overlay-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
            >
              <Icon name="swap_horiz" size={16} />
            </button>
          </Tooltip>
        </div>

        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Grid toggle */}
        <Tooltip content={`Grade: ${gridType} (O)`} position="top">
          <button
            onClick={cycleGrid}
            className="p-1.5 rounded hover:bg-[var(--color-overlay-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <Icon name="grid_view" size={16} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Rotation buttons */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--color-text-muted)] mr-1">Rotação</span>
          <Tooltip content="Girar -90°" position="top">
            <button
              onClick={() => setRotation((r) => (r - 90) % 360)}
              className="p-1.5 rounded hover:bg-[var(--color-overlay-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Icon name="rotate_left" size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Girar +90°" position="top">
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 rounded hover:bg-[var(--color-overlay-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <Icon name="rotate_right" size={16} />
            </button>
          </Tooltip>
          <span className="text-[10px] text-[var(--color-text-primary)] w-8 text-center tabular-nums">
            {(() => {
              let r = rotation % 360;
              if (r < 0) r += 360;
              return r === 0 ? '0°' : `${r}°`;
            })()}
          </span>
        </div>

        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Flip buttons */}
        <Tooltip content="Espelhar horizontal" position="top">
          <button
            onClick={() => setFlipH(!flipH)}
            className={`p-1.5 rounded transition-all ${flipH ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-overlay-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            <Icon name="flip" size={16} />
          </button>
        </Tooltip>
        <Tooltip content="Espelhar vertical" position="top">
          <button
            onClick={() => setFlipV(!flipV)}
            className={`p-1.5 rounded transition-all ${flipV ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-overlay-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            <Icon name="flip" size={16} className="rotate-90" />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Reset */}
        <Tooltip content="Resetar" position="top">
          <button
            onClick={resetCrop}
            className="p-1.5 rounded hover:bg-[var(--color-overlay-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <Icon name="refresh" size={16} />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Action buttons */}
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-light)]"
        >
          Cancelar
        </button>
        <button
          onClick={handleApply}
          className="mh-btn mh-btn-indigo px-3 py-1.5 text-xs"
        >
          Aplicar
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="absolute top-4 right-4 text-[10px] text-[var(--color-text-muted)] space-y-1">
        <div>O - Alternar grade</div>
        <div>X - Trocar orientação</div>
        <div>Enter - Aplicar</div>
        <div>Esc - Cancelar</div>
      </div>
    </div>
  );
}
