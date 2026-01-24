import { useEffect, useRef, useState, memo, type DragEvent as ReactDragEvent, type MouseEvent } from 'react';
import { Asset } from '../shared/types';
import MaterialIcon from './MaterialIcon.tsx';

interface AssetCardProps {
  asset: Asset;
  index?: number;
  tileWidth?: number;
  tileHeight?: number;
  fit?: 'cover' | 'contain';
  onClick: (e: MouseEvent) => void;
  onDoubleClick: () => void;
  onToggleMarked: (assetId: string) => void;
  onTrashAsset: (assetId: string) => void;
  isSelected: boolean;
  isInTray: boolean;
  isMarked: boolean;
  dragAssetIds?: string[];
}

function AssetCard({ asset, index, tileWidth, tileHeight, fit = 'cover', onClick, onDoubleClick, onToggleMarked, onTrashAsset, isSelected, isInTray, isMarked, dragAssetIds }: AssetCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(`zona21thumb://${asset.id}`);
  const thumbAttemptRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    e.preventDefault();
    e.stopPropagation();
    onClick(e as any);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Deixar a imagem thumbnail definir sua própria altura ao carregar
  // Os thumbnails já são gerados com rotação EXIF aplicada pelo sharp
  // Usamos aspect-ratio apenas como placeholder enquanto carrega
  const placeholderAspect = asset.mediaType === 'video' ? '16 / 9' : '4 / 3';

  return (
    <div
      data-asset-card="true"
      data-asset-id={asset.id}
      data-asset-index={index}
      className={`group relative w-full rounded-lg overflow-hidden border transition-all duration-200 bg-black/20 ${
        isSelected
          ? 'border-indigo-400 shadow-lg shadow-indigo-400/30'
          : 'border-white/10 hover:border-white/20'
      } ${isInTray ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#060010]' : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      draggable={dragAssetIds !== undefined}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Imagem como elemento de fluxo para definir altura natural */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={asset.fileName}
          className="block w-full h-auto"
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
        <div className="w-full bg-black/40" style={{ aspectRatio: placeholderAspect }}>
          <div className="flex items-center justify-center h-full text-gray-500">
            {asset.mediaType === 'video' ? '🎬' : '📷'}
          </div>
        </div>
      )}

      {/* Overlay para vídeo preview */}
      {asset.mediaType === 'video' && thumbnailUrl && (
        <video
          ref={videoRef}
          src={`zona21file://${asset.id}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setIsHovered(false)}
        />
      )}

      {/* Controles e overlays */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <button
          type="button"
          aria-label={isMarked ? 'Unmark' : 'Mark'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMarked(asset.id);
          }}
          className={`rounded bg-black/50 backdrop-blur-sm text-gray-200 transition-[opacity,width,padding,border] duration-200 overflow-hidden border border-white/10 ${
            isMarked
              ? 'p-1 opacity-100'
              : 'w-0 border-0 p-0 opacity-0 group-hover:w-auto group-hover:border group-hover:p-1 group-hover:opacity-100'
          }`}
          title={isMarked ? 'Marcado' : 'Marcar'}
        >
          <MaterialIcon name="flag" className={`text-[16px] ${isMarked ? 'text-indigo-300' : 'text-gray-200'}`} />
        </button>

        {fileExt && (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-white bg-black/40 backdrop-blur-sm border border-white/10">
            {fileExt}
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label="Trash"
        onClick={(e) => {
          e.stopPropagation();
          onTrashAsset(asset.id);
        }}
        className="absolute top-2 right-2 z-10 rounded border border-white/10 bg-black/50 backdrop-blur-sm p-1 text-gray-200 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]"
        title="Trash"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l1 16h10l1-16" />
        </svg>
      </button>

      {asset.rejected && (
        <div className="absolute top-2 left-10 text-xl">❌</div>
      )}
      
      {asset.mediaType === 'video' && asset.duration && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded text-xs z-10">
          {formatDuration(asset.duration)}
        </div>
      )}

      {/* Overlay progressivo sutil */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      
      {/* Metadados no hover */}
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="text-xs text-white drop-shadow-lg">
          {asset.width}×{asset.height}
        </div>
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
    a.duration === b.duration &&
    a.width === b.width &&
    a.height === b.height &&
    a.colorLabel === b.colorLabel
  );
});
