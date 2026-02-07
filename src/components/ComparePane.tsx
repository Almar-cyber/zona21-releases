import { useState, useRef, useEffect, type MouseEvent } from 'react';
import { Asset, MarkingStatus } from '../shared/types';
import Icon from './Icon';
import { ZoomPanState } from '../hooks/useZoomSync';

interface ComparePaneProps {
  asset: Asset;
  isActive: boolean;
  zoomPanState: ZoomPanState;
  isPanEnabled: boolean;
  isSyncEnabled: boolean;
  decision?: MarkingStatus;
  paneNumber: number;
  onSelect: () => void;
  onMark: (decision: MarkingStatus) => void;
}

export default function ComparePane({
  asset,
  isActive,
  zoomPanState,
  isPanEnabled,
  isSyncEnabled,
  decision,
  paneNumber,
  onSelect,
  onMark,
}: ComparePaneProps) {
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localPan, setLocalPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Use synced or local pan based on sync settings
  const effectivePan = isSyncEnabled
    ? { x: zoomPanState.offsetX, y: zoomPanState.offsetY }
    : localPan;

  useEffect(() => {
    // Reset local pan when sync is enabled
    if (isSyncEnabled) {
      setLocalPan({ x: 0, y: 0 });
    }
  }, [isSyncEnabled]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPanEnabled || zoomPanState.scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - effectivePan.x, y: e.clientY - effectivePan.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !isPanEnabled) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    if (isSyncEnabled) {
      // This would need to be handled by parent component
      // For now, we just update local state
      setLocalPan({ x: newX, y: newY });
    } else {
      setLocalPan({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatBytes = (bytes: number | undefined) => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getExifData = () => {
    const exif = (asset as any).exif || {};
    return {
      iso: exif.ISO || exif.iso,
      aperture: exif.FNumber || exif.fNumber || exif.aperture,
      shutter: exif.ExposureTime || exif.exposureTime || exif.shutter,
      focalLength: exif.FocalLength || exif.focalLength,
    };
  };

  const exif = getExifData();
  const aiScore = (asset as any).aiScore || (asset as any).ai_score;

  // Marking status badge config
  const markingConfig: Record<MarkingStatus, { icon: string; color: string } | null> = {
    unmarked: null,
    approved: { icon: 'check', color: 'text-[var(--color-status-approved)]' },
    favorite: { icon: 'star', color: 'text-[var(--color-status-favorite)]' },
    rejected: { icon: 'close', color: 'text-[var(--color-status-rejected)]' },
  };

  const currentMarking = decision || asset.markingStatus || 'unmarked';
  const markingBadge = markingConfig[currentMarking];

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col h-full rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        isActive
          ? 'border-[var(--color-primary)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
      }`}
      onClick={onSelect}
    >
      {/* Header with pane number and marking status */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-xs font-bold text-white">
            {paneNumber}
          </div>
          {markingBadge && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <Icon name={markingBadge.icon} size={14} className={markingBadge.color} />
              <span className="text-xs text-[var(--color-text-primary)] capitalize">{currentMarking}</span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMark('approved');
            }}
            className="w-7 h-7 rounded-md bg-[var(--color-status-approved-bg)] hover:bg-[var(--color-status-approved-bg)] flex items-center justify-center transition-colors"
            title="Aprovar (A)"
          >
            <Icon name="check" size={14} className="text-[var(--color-status-approved)]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMark('rejected');
            }}
            className="w-7 h-7 rounded-md bg-[var(--color-status-rejected-bg)] hover:bg-[var(--color-status-rejected-bg)] flex items-center justify-center transition-colors"
            title="Rejeitar (D)"
          >
            <Icon name="close" size={14} className="text-[var(--color-status-rejected)]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMark('unmarked');
            }}
            className="w-7 h-7 rounded-md bg-[rgba(var(--overlay-rgb),0.08)] hover:bg-[rgba(var(--overlay-rgb),0.15)] flex items-center justify-center transition-colors"
            title="Neutro (N)"
          >
            <Icon name="remove" size={14} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Image viewer */}
      <div
        className="flex-1 flex items-center justify-center bg-black/40 overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanEnabled && zoomPanState.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {!imageError ? (
          <img
            src={`zona21file://${asset.id}`}
            alt={asset.fileName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoomPanState.scale}) translate(${effectivePan.x / zoomPanState.scale}px, ${effectivePan.y / zoomPanState.scale}px)`,
              transformOrigin: 'center center',
            }}
            onError={() => setImageError(true)}
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
            <Icon name={asset.mediaType === 'video' ? 'videocam' : 'image'} size={48} />
            <p className="text-sm">Erro ao carregar</p>
          </div>
        )}
      </div>

      {/* Metadata footer */}
      <div className="bg-[var(--color-surface-floating)]/95 backdrop-blur-sm p-3 space-y-2">
        {/* Filename */}
        <div className="text-xs text-[var(--color-text-primary)] font-medium truncate" title={asset.fileName}>
          {asset.fileName}
        </div>

        {/* Technical specs */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--color-text-secondary)]">
          <div>
            <span className="text-[var(--color-text-muted)]">Dimensões:</span>{' '}
            {asset.width && asset.height ? `${asset.width}×${asset.height}` : 'N/A'}
          </div>
          <div>
            <span className="text-[var(--color-text-muted)]">Tamanho:</span>{' '}
            {formatBytes((asset as any).fileSize || (asset as any).file_size)}
          </div>

          {exif.iso && (
            <div>
              <span className="text-[var(--color-text-muted)]">ISO:</span> {exif.iso}
            </div>
          )}
          {exif.aperture && (
            <div>
              <span className="text-[var(--color-text-muted)]">Abertura:</span> f/{exif.aperture}
            </div>
          )}
          {exif.shutter && (
            <div>
              <span className="text-[var(--color-text-muted)]">Shutter:</span> {exif.shutter}
            </div>
          )}
          {exif.focalLength && (
            <div>
              <span className="text-[var(--color-text-muted)]">Focal:</span> {exif.focalLength}mm
            </div>
          )}
          {aiScore !== undefined && (
            <div>
              <span className="text-[var(--color-text-muted)]">IA Focus:</span>{' '}
              <span className={aiScore > 0.7 ? 'text-[var(--color-status-approved)]' : aiScore > 0.4 ? 'text-[var(--color-status-favorite)]' : 'text-[var(--color-status-rejected)]'}>
                {(aiScore * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
