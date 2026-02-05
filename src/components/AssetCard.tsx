import { useEffect, useRef, useState, memo, type DragEvent as ReactDragEvent, type MouseEvent } from 'react';
import { Asset, MarkingStatus } from '../shared/types';
import Icon from './Icon.tsx';

interface AssetCardProps {
  asset: Asset;
  index: number;
  tileWidth: number;
  tileHeight: number;
  fit?: 'cover' | 'contain';
  onClick: (asset: Asset, index: number, e: MouseEvent) => void;
  onDoubleClick: () => void;
  onToggleMarked: (assetId: string) => void;
  onToggleSelection: (assetId: string, e: MouseEvent) => void;
  onContextMenu?: (asset: Asset, position: { x: number; y: number }) => void;
  isSelected: boolean;
  isInTray: boolean;
  isMarked: boolean;
  dragAssetIds?: string[];
}

// Marking status badge configuration - subtle style matching sidebar
const markingConfig: Record<MarkingStatus, { icon: string; iconColor: string; bgColor: string; borderColor: string } | null> = {
  unmarked: null,
  approved: { icon: 'check', iconColor: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/50' },
  favorite: { icon: 'star', iconColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/50' },
  rejected: { icon: 'close', iconColor: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50' }
};

function AssetCard({ asset, index, tileWidth, tileHeight, fit = 'cover', onClick, onDoubleClick, onToggleMarked, onToggleSelection, onContextMenu, isSelected, isInTray, isMarked, dragAssetIds }: AssetCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(`zona21thumb://${asset.id}`);
  const thumbAttemptRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setThumbnailUrl(`zona21thumb://${asset.id}`);
    thumbAttemptRef.current = 0;
  }, [asset.id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (asset.mediaType !== 'video') return;
    if (!isHovered) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        // ignore
      }
      return;
    }
    try {
      void v.play();
    } catch {
      // ignore
    }
  }, [asset.mediaType, isHovered]);

  // Cleanup hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fileExt = (() => {
    const a: any = asset as any;
    const name = asset.fileName || a.file_name || a.relativePath || a.relative_path || '';
    const idx = name.lastIndexOf('.');
    if (idx < 0) return '';
    return name.slice(idx + 1).toUpperCase();
  })();

  const formatBytes = (bytes: number) => {
    const n = typeof (bytes as any) === 'string' ? Number(bytes) : bytes;
    if (!Number.isFinite(n) || n <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
    const v = n / Math.pow(1024, i);
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const createdLabel = (() => {
    const d = new Date(asset.createdAt as any);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  })();

  const tagsPreview = (asset.tags || []).slice(0, 2);
  const moreTags = (asset.tags || []).length - tagsPreview.length;

  // EXIF orientation não precisa mais de wrapper complexo - browsers modernos já aplicam automaticamente
  // Mantemos apenas como fallback visual simples
  void tileWidth;
  void tileHeight;

  void fit; // kept for API compatibility but flow layout doesn't need object-fit


  const handleDragStart = (e: ReactDragEvent) => {
    setIsDragging(true);
    const ids = Array.isArray(dragAssetIds) && dragAssetIds.length > 0 ? dragAssetIds : [asset.id];
    e.dataTransfer.setData('application/x-zona21-asset-id', ids[0]);
    e.dataTransfer.setData('application/x-zona21-asset-ids', ids.join(','));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: MouseEvent) => {
    onClick(asset, index, e);
  };

  const handleMouseEnter = () => {
    // Debounce video preview loading - 300ms delay
    if (asset.mediaType === 'video') {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = setTimeout(() => {
        setIsHovered(true);
        hoverTimerRef.current = null;
      }, 300);
    } else {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    // Cancel pending hover timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(false);
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(asset, { x: e.clientX, y: e.clientY });
    }
  };

  // Deixar a imagem thumbnail definir sua própria altura ao carregar
  // Os thumbnails já são gerados com rotação EXIF aplicada pelo sharp
  // Usamos aspect-ratio apenas como placeholder enquanto carrega
  // Use real aspect ratio from asset metadata for Pinterest-style masonry layout
  // Fallback to 16:9 for video, 3:2 for photos if dimensions unknown
  const aspectRatio = asset.width && asset.height
    ? asset.width / asset.height
    : (asset.mediaType === 'video' ? 16 / 9 : 3 / 2);

  const markingStatus = asset.markingStatus || 'unmarked';
  const markingBadge = markingConfig[markingStatus];
  const isRejected = markingStatus === 'rejected';

  return (
    <div
      data-asset-card="true"
      data-asset-id={asset.id}
      data-asset-index={index}
      className={`group relative w-full rounded-xl overflow-hidden border transition-all duration-200 ease-out bg-black/20 hover:scale-[1.02] hover:shadow-xl ${
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/30 scale-[1.02]'
          : 'border-white/10 hover:border-white/30'
      } ${isInTray ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#060010]' : ''} ${isRejected ? 'opacity-50' : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      draggable={dragAssetIds !== undefined}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    >
      {/* Thumbnail com aspect ratio dinâmico para layout masonry (Pinterest) */}
      <div className="relative w-full bg-black/40" style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={asset.fileName}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
            decoding="async"
            onError={() => {
              const attempt = Number(thumbAttemptRef.current || 0);
              if (attempt >= 5) {
                setThumbnailUrl(null);
                return;
              }
              thumbAttemptRef.current = attempt + 1;
              setTimeout(() => {
                setThumbnailUrl(`zona21thumb://${asset.id}?cb=${Date.now()}`);
              }, 250 * (attempt + 1));
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600">
            {asset.mediaType === 'video' ? '🎬' : '📷'}
          </div>
        )}
      </div>

      {/* Overlay para vídeo preview */}
      {asset.mediaType === 'video' && thumbnailUrl && isHovered && (
        <video
          ref={videoRef}
          src={`zona21file://${asset.id}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setIsHovered(false)}
        />
      )}

      {/* Controles e overlays */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        {/* Marking status badge - subtle style */}
        {markingBadge && (
          <div
            className={`w-6 h-6 flex items-center justify-center rounded-md border ${markingBadge.bgColor} ${markingBadge.borderColor} backdrop-blur-sm`}
            role="img"
            aria-label={markingStatus === 'favorite' ? 'Favorito' : markingStatus === 'approved' ? 'Aprovado' : 'Desprezado'}
            title={markingStatus === 'favorite' ? 'Favorito' : markingStatus === 'approved' ? 'Aprovado' : 'Desprezado'}
          >
            <Icon name={markingBadge.icon} size={14} className={markingBadge.iconColor} strokeWidth={2.5} />
          </div>
        )}

        {fileExt && (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-white bg-black/40 backdrop-blur-sm border border-white/10">
            {fileExt}
          </span>
        )}
      </div>

      {/* Checkbox de seleção no hover */}
      <button
        type="button"
        aria-label={isInTray ? 'Remover da seleção' : 'Adicionar à seleção'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelection(asset.id, e as any);
        }}
        className={`absolute top-2 right-2 z-10 rounded border backdrop-blur-sm p-1.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010] ${
          isInTray
            ? 'bg-[#4F46E5] border-[#4338CA] opacity-100 shadow-[0_2px_8px_rgba(79,70,229,0.4)]'
            : 'bg-black/50 border-white/10 opacity-0 group-hover:opacity-100'
        }`}
        title={isInTray ? 'Remover da seleção' : 'Adicionar à seleção'}
      >
        <div className="w-4 h-4 flex items-center justify-center">
          {isInTray ? (
            <Icon name="check" size={16} className="text-white" />
          ) : (
            <div className="w-3 h-3 border-2 border-white rounded" />
          )}
        </div>
      </button>

      {asset.mediaType === 'video' && asset.duration && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs z-10">
          {formatDuration(asset.duration)}
        </div>
      )}

      {/* 360° Badge for panoramic files */}
      {asset.is360 && (
        <div className="absolute top-2 left-2 bg-green-600 bg-opacity-90 px-2 py-1 rounded text-xs font-semibold z-10 flex items-center gap-1">
          <Icon name="globe" size={12} />
          360°
        </div>
      )}

      {/* Overlay progressivo sutil */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      
      {/* Metadados no hover */}
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {asset.width && asset.height ? (
          <div className="text-xs text-white drop-shadow-lg">
            {asset.width}×{asset.height}
          </div>
        ) : null}
        <div className="text-[10px] text-gray-200 drop-shadow-lg">
          {createdLabel}{createdLabel ? ' · ' : ''}{formatBytes(((asset as any).fileSize ?? (asset as any).file_size) as any)}
        </div>
        {(tagsPreview.length > 0 || moreTags > 0) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tagsPreview.map((t) => (
              <span key={t} className="rounded bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white border border-white/10">
                {t}
              </span>
            ))}
            {moreTags > 0 && (
              <span className="rounded bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white border border-white/10">
                +{moreTags}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AssetCard, (prev, next) => {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isInTray !== next.isInTray) return false;
  if (prev.isMarked !== next.isMarked) return false;
  if (prev.tileWidth !== next.tileWidth) return false;
  if (prev.tileHeight !== next.tileHeight) return false;

  const a = prev.asset;
  const b = next.asset;

  return (
    a.id === b.id &&
    a.fileName === b.fileName &&
    a.mediaType === b.mediaType &&
    a.rating === b.rating &&
    a.flagged === b.flagged &&
    a.rejected === b.rejected &&
    a.markingStatus === b.markingStatus &&
    a.duration === b.duration &&
    a.width === b.width &&
    a.height === b.height &&
    a.colorLabel === b.colorLabel
  );
});
