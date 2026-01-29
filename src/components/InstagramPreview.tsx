import { useState, useEffect } from 'react';
import Icon from './Icon';
import type { Asset, InstagramAspectRatio } from '../shared/types';

interface InstagramPreviewProps {
  asset: Asset;
  aspectRatio: InstagramAspectRatio;
  onAspectRatioChange?: (ratio: InstagramAspectRatio) => void;
}

const ASPECT_RATIOS: { value: InstagramAspectRatio; label: string; icon: string; width: number; height: number }[] = [
  { value: '1:1', label: 'Square', icon: 'crop_square', width: 1, height: 1 },
  { value: '4:5', label: 'Portrait', icon: 'crop_portrait', width: 4, height: 5 },
  { value: '16:9', label: 'Landscape', icon: 'crop_landscape', width: 16, height: 9 },
];

export default function InstagramPreview({
  asset,
  aspectRatio,
  onAspectRatioChange,
}: InstagramPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Load image URL
    if (asset.thumbnailPaths && asset.thumbnailPaths.length > 0) {
      setImageUrl(`file://${asset.thumbnailPaths[0]}`);
    } else {
      setImageUrl(null);
    }
    setImageError(false);
  }, [asset]);

  const currentRatio = ASPECT_RATIOS.find((r) => r.value === aspectRatio) || ASPECT_RATIOS[0];

  // Calculate preview dimensions (max 400px width)
  const maxWidth = 400;
  const previewWidth = maxWidth;
  const previewHeight = (maxWidth * currentRatio.height) / currentRatio.width;

  return (
    <div className="flex flex-col gap-4">
      {/* Aspect Ratio Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Formato:</span>
        <div className="flex gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => onAspectRatioChange?.(ratio.value)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  aspectRatio === ratio.value
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }
              `}
              title={ratio.label}
            >
              <Icon name={ratio.icon} size={18} />
              <span className="hidden sm:inline">{ratio.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative rounded-lg overflow-hidden bg-black/50 border border-white/10"
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
          }}
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={asset.fileName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="image" size={48} className="text-gray-600" />
            </div>
          )}

          {/* Crop overlay grid */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Horizontal lines */}
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
            {/* Vertical lines */}
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
          </div>

          {/* Aspect ratio badge */}
          <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur-sm text-xs font-medium text-white">
            {aspectRatio}
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center">
          <div className="font-medium text-gray-400">{asset.fileName}</div>
          <div>
            Original: {asset.width}x{asset.height}px
          </div>
          <div>
            Preview: {Math.round(previewWidth)}x{Math.round(previewHeight)}px
          </div>
        </div>
      </div>

      {/* Format descriptions */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={`p-2 rounded-lg ${aspectRatio === '1:1' ? 'bg-pink-500/20 border border-pink-500/50' : 'bg-white/5'}`}>
          <div className="font-medium text-white mb-1">Square (1:1)</div>
          <div className="text-gray-400">Instagram Feed padrão</div>
        </div>
        <div className={`p-2 rounded-lg ${aspectRatio === '4:5' ? 'bg-pink-500/20 border border-pink-500/50' : 'bg-white/5'}`}>
          <div className="font-medium text-white mb-1">Portrait (4:5)</div>
          <div className="text-gray-400">Mais espaço vertical</div>
        </div>
        <div className={`p-2 rounded-lg ${aspectRatio === '16:9' ? 'bg-pink-500/20 border border-pink-500/50' : 'bg-white/5'}`}>
          <div className="font-medium text-white mb-1">Landscape (16:9)</div>
          <div className="text-gray-400">Reels, Stories</div>
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
        <div className="flex items-start gap-2">
          <Icon name="info" size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>Dica:</strong> Posts em formato 4:5 (portrait) têm{' '}
            <span className="text-blue-200 font-medium">~25% mais visibilidade</span> no feed do Instagram.
          </div>
        </div>
      </div>
    </div>
  );
}
