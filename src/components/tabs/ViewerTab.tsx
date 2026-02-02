/**
 * ViewerTab - Fullscreen image/video viewer with embedded editing
 *
 * Layout 70/30:
 * - Left (70%): Large preview with zoom/pan controls
 * - Right (30%): Metadata + embedded QuickEdit/VideoTrim panels
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Asset } from '../../shared/types';
import { useTabs } from '../../contexts/TabsContext';
import { Tooltip } from '../Tooltip';
import Icon from '../Icon';
import { translateTag } from '../../shared/tagTranslations';
import QuickEditPanel from '../QuickEditPanel';
import VideoTrimPanel from '../VideoTrimPanel';
import FloatingVideoControls from '../FloatingVideoControls';
import FloatingPhotoControls from '../FloatingPhotoControls';

export interface ViewerTabData {
  assetId: string;
  asset?: Asset; // Optional initial asset data
  zoom?: number;
  panX?: number;
  panY?: number;
  fitMode?: 'fit' | '100';
}

interface ViewerTabProps {
  data: ViewerTabData;
  tabId: string;
}

export default function ViewerTab({ data, tabId }: ViewerTabProps) {
  const { updateTab, closeTab } = useTabs();
  const [asset, setAsset] = useState<Asset | null>(data.asset || null);
  const [notes, setNotes] = useState('');
  const [isQuickEditVisible, setIsQuickEditVisible] = useState(false);
  const [isVideoTrimVisible, setIsVideoTrimVisible] = useState(false);

  // Load asset if not provided
  useEffect(() => {
    const loadAsset = async () => {
      if (!data.asset) {
        const assets = await window.electronAPI.getAssetsByIds([data.assetId]);
        if (assets.length > 0) {
          setAsset(assets[0]);
          setNotes(assets[0].notes || '');
        }
      } else {
        setNotes(data.asset.notes || '');
      }
    };
    loadAsset();
  }, [data.assetId, data.asset]);

  // Update tab title when asset loads
  useEffect(() => {
    if (asset) {
      updateTab(tabId, {
        title: asset.fileName,
        icon: asset.mediaType === 'video' ? 'videocam' : 'photo',
      });
    }
  }, [asset?.fileName, asset?.mediaType, tabId, updateTab]);

  // Keyboard shortcut for Quick Edit panel toggle (E key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'e' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        asset?.mediaType === 'photo' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsQuickEditVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asset?.mediaType]);

  // Keyboard shortcut for Video Trim panel toggle (V key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'v' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        asset?.mediaType === 'video' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsVideoTrimVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asset?.mediaType]);

  // Zoom/pan state
  const mediaContainerRef = useRef<HTMLDivElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [viewMode, setViewMode] = useState<'fit' | '100'>(data.fitMode || 'fit');
  const [scale, setScale] = useState(data.zoom || 1);
  const [translate, setTranslate] = useState({ x: data.panX || 0, y: data.panY || 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fullResSrc = useMemo(() => asset ? `zona21file://${asset.id}` : '', [asset?.id]);
  const thumbSrc = useMemo(() => asset ? `zona21thumb://${asset.id}` : '', [asset?.id]);

  const assumedInitialSize = useMemo(() => {
    if (!asset) return null;
    const w = Number(asset.width || 0);
    const h = Number(asset.height || 0);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    const o = Number(asset.orientation || 0);
    const rotates90 = o === 5 || o === 6 || o === 7 || o === 8;
    return rotates90 ? { w: h, h: w } : { w, h };
  }, [asset?.height, asset?.orientation, asset?.width]);

  const revealInFinder = async () => {
    if (!asset) return;
    const res = await window.electronAPI.revealAsset(asset.id);
    if (!res?.success) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao revelar: ${res?.error || 'Erro desconhecido'}` }
        })
      );
    }
  };

  // Reset view when asset changes
  useEffect(() => {
    if (!asset) return;
    setNaturalSize(null);
    setFitScale(1);
    setViewMode('fit');
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setVideoError(false);
    setImageError(false);
  }, [asset?.id]);

  // Calculate fit scale
  useEffect(() => {
    if (!naturalSize) return;
    const el = mediaContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nextFit = Math.min(rect.width / naturalSize.w, rect.height / naturalSize.h);
    if (!Number.isFinite(nextFit) || nextFit <= 0) return;
    setFitScale(nextFit);

    if (viewMode === 'fit') {
      setScale(nextFit);
      setTranslate({
        x: (rect.width - naturalSize.w * nextFit) / 2,
        y: (rect.height - naturalSize.h * nextFit) / 2
      });
    }
    if (viewMode === '100') {
      setScale(1);
      setTranslate({
        x: (rect.width - naturalSize.w) / 2,
        y: (rect.height - naturalSize.h) / 2
      });
    }
  }, [naturalSize, viewMode]);

  // Pan handlers
  useEffect(() => {
    const onUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleNotesBlur = async () => {
    if (!asset) return;
    await window.electronAPI.updateAsset(asset.id, { notes });
  };

  const renderMetadata = () => {
    if (!asset) return null;

    if (asset.mediaType === 'video') {
      return (
        <>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Codec:</span>{' '}
            <span className="text-gray-200">{asset.codec}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Duração:</span>{' '}
            <span className="text-gray-200">{asset.duration?.toFixed(2)}s</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Taxa de quadros:</span>{' '}
            <span className="text-gray-200">{asset.frameRate?.toFixed(2)} fps</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Resolução:</span>{' '}
            <span className="text-gray-200">{asset.width} × {asset.height}</span>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Câmera:</span>{' '}
            <span className="text-gray-200">{asset.cameraMake} {asset.cameraModel}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Lente:</span>{' '}
            <span className="text-gray-200">{asset.lens || 'N/A'}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">ISO:</span>{' '}
            <span className="text-gray-200">{asset.iso || 'N/A'}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Abertura:</span>{' '}
            <span className="text-gray-200">f/{asset.aperture || 'N/A'}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Distância focal:</span>{' '}
            <span className="text-gray-200">{asset.focalLength}mm</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-gray-400">Resolução:</span>{' '}
            <span className="text-gray-200">{asset.width} × {asset.height}</span>
          </div>
        </>
      );
    }
  };

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  // Video fullscreen mode
  if (asset.mediaType === 'video') {
    return (
      <div className="relative h-full w-full bg-black">
        {/* Fullscreen video */}
        <div className="absolute inset-0 flex items-center justify-center">
          {videoError ? (
            <img src={thumbSrc} alt={asset.fileName} className="max-h-full max-w-full object-contain" />
          ) : (
            <video
              src={fullResSrc}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
              onError={() => setVideoError(true)}
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          )}
        </div>

        {/* Floating controls */}
        <FloatingVideoControls
          asset={asset}
          onToggleVideoTrim={() => setIsVideoTrimVisible(prev => !prev)}
          isVideoTrimVisible={isVideoTrimVisible}
        />

        {/* VideoTrim Panel (overlay) */}
        {isVideoTrimVisible && (
          <div className="absolute bottom-0 left-0 right-0 z-40">
            <VideoTrimPanel
              asset={asset}
              isVisible={true}
              onClose={() => setIsVideoTrimVisible(false)}
              onTrimComplete={(trimmedFilePath) => {
                console.log('Trim completed:', trimmedFilePath);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // Photo fullscreen mode
  return (
    <div className="relative h-full w-full bg-black">
      {/* Fullscreen photo */}
      <div
        ref={mediaContainerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : scale > fitScale ? 'grab' : 'default' }}
        onWheel={(e) => {
          if (!naturalSize) return;
          e.preventDefault();
          const rect = mediaContainerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
          const next = Math.min(8, Math.max(0.1, scale * zoomFactor));
          const worldX = (mx - translate.x) / scale;
          const worldY = (my - translate.y) / scale;
          setViewMode('fit');
          setScale(next);
          setTranslate({ x: mx - worldX * next, y: my - worldY * next });
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (!naturalSize) return;
          if (scale <= fitScale) return;
          setIsPanning(true);
          panStartRef.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
        }}
        onMouseMove={(e) => {
          if (!isPanning) return;
          const s = panStartRef.current;
          if (!s) return;
          setTranslate({ x: s.tx + (e.clientX - s.x), y: s.ty + (e.clientY - s.y) });
        }}
        onDoubleClick={() => {
          setViewMode((m) => (m === 'fit' ? '100' : 'fit'));
        }}
      >
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <img src={thumbSrc} alt={asset.fileName} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <img
            src={fullResSrc}
            alt={asset.fileName}
            className="absolute"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              maxWidth: 'none',
              maxHeight: 'none',
            }}
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            onError={() => setImageError(true)}
            draggable={false}
          />
        )}
      </div>

      {/* Floating controls */}
      <FloatingPhotoControls
        asset={asset}
        onToggleQuickEdit={() => setIsQuickEditVisible(prev => !prev)}
        isQuickEditVisible={isQuickEditVisible}
        scale={scale}
        viewMode={viewMode}
        onZoomIn={() => {
          const el = mediaContainerRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const next = Math.min(8, scale * 1.25);
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const worldX = (cx - translate.x) / scale;
          const worldY = (cy - translate.y) / scale;
          setViewMode('fit');
          setScale(next);
          setTranslate({ x: cx - worldX * next, y: cy - worldY * next });
        }}
        onZoomOut={() => {
          const el = mediaContainerRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const next = Math.max(0.1, scale / 1.25);
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const worldX = (cx - translate.x) / scale;
          const worldY = (cy - translate.y) / scale;
          setViewMode('fit');
          setScale(next);
          setTranslate({ x: cx - worldX * next, y: cy - worldY * next });
        }}
        onSetFit={() => setViewMode('fit')}
        onSet100={() => setViewMode('100')}
      />

      {/* QuickEdit Panel (overlay) */}
      {isQuickEditVisible && (
        <div className="absolute bottom-0 left-0 right-0 z-40">
          <QuickEditPanel
            asset={asset}
            isVisible={true}
            onClose={() => setIsQuickEditVisible(false)}
            onEditComplete={(editedFilePath) => {
              console.log('Edit completed:', editedFilePath);
            }}
            scale={scale}
            viewMode={viewMode}
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            onSetFit={() => setViewMode('fit')}
            onSet100={() => setViewMode('100')}
            onExport={() => {}}
            onInstagram={() => {}}
            onDelete={() => {}}
          />
        </div>
      )}
    </div>
  );
}
