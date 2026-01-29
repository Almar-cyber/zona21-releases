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
    approved: { icon: 'check', color: 'text-green-400' },
    favorite: { icon: 'star', color: 'text-yellow-400' },
    rejected: { icon: 'close', color: 'text-red-400' },
  };

  const currentMarking = decision || asset.markingStatus || 'unmarked';
  const markingBadge = markingConfig[currentMarking];

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col h-full rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        isActive
          ? 'border-blue-500 shadow-lg shadow-blue-500/50'
          : 'border-white/10 hover:border-white/30'
      }`}
      onClick={onSelect}
    >
      {/* Header with pane number and marking status */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-2 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
            {paneNumber}
          </div>
          {markingBadge && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <Icon name={markingBadge.icon} size={14} className={markingBadge.color} />
              <span className="text-xs text-white capitalize">{currentMarking}</span>
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
            className="w-7 h-7 rounded-md bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition-colors"
            title="Aprovar (A)"
          >
            <Icon name="check" size={14} className="text-green-400" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMark('rejected');
            }}
            className="w-7 h-7 rounded-md bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
            title="Rejeitar (D)"
          >
            <Icon name="close" size={14} className="text-red-400" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMark('unmarked');
            }}
            className="w-7 h-7 rounded-md bg-gray-500/20 hover:bg-gray-500/40 flex items-center justify-center transition-colors"
            title="Neutro (N)"
          >
            <Icon name="remove" size={14} className="text-gray-400" />
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
          <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
            <Icon name={asset.mediaType === 'video' ? 'videocam' : 'image'} size={48} />
            <p className="text-sm">Erro ao carregar</p>
          </div>
        )}
      </div>

      {/* Metadata footer */}
      <div className="bg-black/90 backdrop-blur-sm p-3 space-y-2">
        {/* Filename */}
        <div className="text-xs text-white font-medium truncate" title={asset.fileName}>
          {asset.fileName}
        </div>

        {/* Technical specs */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
          <div>
            <span className="text-gray-500">Dimensões:</span>{' '}
            {asset.width && asset.height ? `${asset.width}×${asset.height}` : 'N/A'}
          </div>
          <div>
            <span className="text-gray-500">Tamanho:</span>{' '}
            {formatBytes((asset as any).fileSize || (asset as any).file_size)}
          </div>

          {exif.iso && (
            <div>
              <span className="text-gray-500">ISO:</span> {exif.iso}
            </div>
          )}
          {exif.aperture && (
            <div>
              <span className="text-gray-500">Abertura:</span> f/{exif.aperture}
            </div>
          )}
          {exif.shutter && (
            <div>
              <span className="text-gray-500">Shutter:</span> {exif.shutter}
            </div>
          )}
          {exif.focalLength && (
            <div>
              <span className="text-gray-500">Focal:</span> {exif.focalLength}mm
            </div>
          )}
          {aiScore !== undefined && (
            <div>
              <span className="text-gray-500">IA Focus:</span>{' '}
              <span className={aiScore > 0.7 ? 'text-green-400' : aiScore > 0.4 ? 'text-yellow-400' : 'text-red-400'}>
                {(aiScore * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
