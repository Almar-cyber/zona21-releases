import { useState } from 'react';
import { Asset } from '../shared/types';
import Icon from './Icon';

interface ReviewGridProps {
  assets: Asset[];
  onRemove: (assetId: string) => void;
}

interface GridItemProps {
  asset: Asset;
  onRemove: (assetId: string) => void;
}

function GridItem({ asset, onRemove }: GridItemProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(`zona21thumb://${asset.id}`);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-overlay-light)] border border-[var(--color-border)] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      {!imageError ? (
        <img
          src={thumbnailUrl}
          alt={asset.fileName}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
          {asset.mediaType === 'video' ? '🎬' : '📷'}
        </div>
      )}

      {/* Hover overlay com nome */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end p-2">
          <p className="text-xs text-white truncate drop-shadow-lg">
            {asset.fileName}
          </p>
        </div>
      )}

      {/* Botão remover - sempre visível no mobile, hover no desktop */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(asset.id);
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 hover:bg-[var(--color-error)] backdrop-blur-sm border border-[var(--color-border-hover)] flex items-center justify-center transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        title="Remover da seleção"
      >
        <Icon name="close" size={14} className="text-white" />
      </button>

      {/* Badge de tipo de mídia */}
      {asset.mediaType === 'video' && asset.duration && (
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white">
          {Math.floor(asset.duration / 60)}:{String(Math.floor(asset.duration % 60)).padStart(2, '0')}
        </div>
      )}
    </div>
  );
}

export default function ReviewGrid({ assets, onRemove }: ReviewGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-muted)]">
        <div className="text-center">
          <Icon name="check_circle" size={48} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p>Todos os itens foram removidos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {assets.map((asset) => (
        <GridItem key={asset.id} asset={asset} onRemove={onRemove} />
      ))}
    </div>
  );
}
