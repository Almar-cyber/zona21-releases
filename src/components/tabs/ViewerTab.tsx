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
import Icon from '../Icon';
import VideoTrimPanel from '../VideoTrimPanel';
import FloatingVideoControls from '../FloatingVideoControls';
import FloatingPhotoControls from '../FloatingPhotoControls';
import ConfirmDialog from '../ConfirmDialog';
import CropOverlay, { CropResult } from '../CropOverlay';

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
  const [isVideoTrimVisible, setIsVideoTrimVisible] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [editedFilePath, setEditedFilePath] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  const pushToast = useCallback((type: 'success' | 'error' | 'info', message: string, dedupeKey?: string) => {
    window.dispatchEvent(new CustomEvent('zona21-toast', { detail: { type, message, dedupeKey } }));
  }, []);

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
      console.log('[ViewerTab] Asset loaded:', {
        id: asset.id,
        fileName: asset.fileName,
        mediaType: asset.mediaType
      });
      updateTab(tabId, {
        title: asset.fileName,
        icon: asset.mediaType === 'video' ? 'videocam' : 'photo',
      });
    }
  }, [asset?.fileName, asset?.mediaType, tabId, updateTab]);

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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Use edited file path if available, otherwise use original asset
  const fullResSrc = useMemo(() => {
    if (editedFilePath) {
      // Add cache-busting timestamp for edited files
      return `file://${editedFilePath}?t=${Date.now()}`;
    }
    return asset ? `zona21file://${asset.id}` : '';
  }, [asset?.id, editedFilePath]);
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
      pushToast('error', `Falha ao revelar: ${res?.error || 'Erro desconhecido'}`);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!asset) return;
    try {
      const result = await (window.electronAPI as any).exportCopyAssets({ assetIds: [asset.id] });
      if (result?.canceled) return;
      if (!result?.success) {
        pushToast('error', `Falha ao copiar: ${result?.error || 'Erro desconhecido'}`);
        return;
      }
      pushToast('success', 'Cópia iniciada');
    } catch (error) {
      pushToast('error', `Falha ao copiar: ${(error as Error).message}`);
    }
  }, [asset, pushToast]);

  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (!asset) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Mover para Lixeira',
      message: `Tem certeza que deseja mover "${asset.fileName}" para a Lixeira?`,
      confirmLabel: 'Mover para Lixeira',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await window.electronAPI.trashAssets([asset.id]);
          if (!res?.success) {
            pushToast('error', `Falha ao enviar para a lixeira: ${res?.error || 'Erro desconhecido'}`);
            return;
          }
          pushToast('success', 'Arquivo enviado para a lixeira');
          window.dispatchEvent(new CustomEvent('zona21-refresh-assets'));
          closeTab(tabId);
        } catch (error) {
          pushToast('error', `Falha ao enviar para a lixeira: ${(error as Error).message}`);
        }
      }
    });
  }, [asset, closeTab, pushToast, tabId]);

  // Handle crop apply
  const handleCropApply = useCallback(async (cropResult: CropResult) => {
    if (!asset) return;
    try {
      // Build operations object for quickEditApply
      const operations: {
        crop?: { left: number; top: number; width: number; height: number };
        rotate?: { angle: 90 | 180 | 270 };
        flip?: { horizontal?: boolean; vertical?: boolean };
      } = {};

      // Add crop if not full image
      if (cropResult.x !== 0 || cropResult.y !== 0 ||
          cropResult.width !== asset.width || cropResult.height !== asset.height) {
        operations.crop = {
          left: Math.round(cropResult.x),
          top: Math.round(cropResult.y),
          width: Math.round(cropResult.width),
          height: Math.round(cropResult.height),
        };
      }

      // Handle rotation (normalize to 0, 90, 180, 270)
      let angle = Math.round(cropResult.rotation) % 360;
      if (angle < 0) angle += 360;
      
      if (angle === 90 || angle === 180 || angle === 270) {
        operations.rotate = { angle: angle as 90 | 180 | 270 };
      }

      // Add flip if enabled
      if (cropResult.flipH || cropResult.flipV) {
        operations.flip = {
          horizontal: cropResult.flipH,
          vertical: cropResult.flipV,
        };
      }

      // Only apply if there are operations
      if (Object.keys(operations).length === 0) {
        pushToast('info', 'Nenhuma alteração para aplicar');
        setIsCropMode(false);
        return;
      }

      const result = await (window.electronAPI as any).quickEditApply(
        asset.id,
        operations
      );

      if (result?.success) {
        pushToast('success', 'Edição aplicada com sucesso');
        // Update viewer to show the edited file
        if (result.filePath) {
          setEditedFilePath(result.filePath);
          setNaturalSize(null);
        }
        window.dispatchEvent(new CustomEvent('zona21-refresh-assets'));
        setIsCropMode(false);
      } else {
        pushToast('error', result?.error || 'Falha ao aplicar edição');
      }
    } catch (error) {
      pushToast('error', `Falha ao aplicar edição: ${(error as Error).message}`);
    }
  }, [asset, pushToast]);

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
    setIsVideoPlaying(false);
    setEditedFilePath(null);
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
            <span className="text-[var(--color-text-secondary)]">Codec:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.codec}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Duração:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.duration?.toFixed(2)}s</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Taxa de quadros:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.frameRate?.toFixed(2)} fps</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Resolução:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.width} × {asset.height}</span>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Câmera:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.cameraMake} {asset.cameraModel}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Lente:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.lens || 'N/A'}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">ISO:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.iso || 'N/A'}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Abertura:</span>{' '}
            <span className="text-[var(--color-text-primary)]">f/{asset.aperture || 'N/A'}</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Distância focal:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.focalLength}mm</span>
          </div>
          <div className="mb-2 text-sm">
            <span className="text-[var(--color-text-secondary)]">Resolução:</span>{' '}
            <span className="text-[var(--color-text-primary)]">{asset.width} × {asset.height}</span>
          </div>
        </>
      );
    }
  };

  if (!asset) {
    console.log('[ViewerTab] No asset - showing loading');
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-[var(--color-text-secondary)]">Carregando...</div>
      </div>
    );
  }

  console.log('[ViewerTab] Rendering with mediaType:', asset.mediaType);

  // Video fullscreen mode
  if (asset.mediaType === 'video') {
    console.log('[ViewerTab] Rendering VIDEO UI');

    return (
      <div className="relative h-full w-full bg-black">
        {/* Fullscreen video - shrinks when trim panel is open */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-[padding] duration-200"
          style={{ paddingBottom: isVideoTrimVisible ? '164px' : '0' }}
        >
          {videoError ? (
            <img src={thumbSrc} alt={asset.fileName} className="max-h-full max-w-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              src={fullResSrc}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
              onError={() => setVideoError(true)}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          )}
        </div>

        {/* Floating controls */}
        <FloatingVideoControls
          asset={asset}
          onToggleVideoTrim={() => setIsVideoTrimVisible(prev => !prev)}
          isVideoTrimVisible={isVideoTrimVisible}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onTogglePlay={handleTogglePlay}
          isPlaying={isVideoPlaying}
        />

        {/* VideoTrim Panel (bottom bar) */}
        {isVideoTrimVisible && (
          <VideoTrimPanel
            asset={asset}
            isVisible={true}
            onClose={() => setIsVideoTrimVisible(false)}
            videoRef={videoRef}
            onTrimComplete={(trimmedFilePath) => {
              console.log('Trim completed:', trimmedFilePath);
              window.dispatchEvent(new CustomEvent('zona21-refresh-assets'));
            }}
          />
        )}

        <ConfirmDialog
          isOpen={confirmDialog?.isOpen ?? false}
          title={confirmDialog?.title ?? ''}
          message={confirmDialog?.message ?? ''}
          confirmLabel={confirmDialog?.confirmLabel}
          variant={confirmDialog?.variant}
          onConfirm={() => confirmDialog?.onConfirm?.()}
          onCancel={() => setConfirmDialog(null)}
        />
      </div>
    );
  }

  // Photo fullscreen mode
  console.log('[ViewerTab] Rendering PHOTO UI - FloatingPhotoControls should render');
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

          // Pinch-to-zoom gesture (trackpad two-finger pinch)
          // Browsers report pinch gestures as wheel events with ctrlKey=true
          if (e.ctrlKey) {
            // Smoother zoom for pinch gestures
            const pinchSensitivity = 0.01;
            const zoomDelta = -e.deltaY * pinchSensitivity;
            const next = Math.min(8, Math.max(0.1, scale * (1 + zoomDelta)));
            const worldX = (mx - translate.x) / scale;
            const worldY = (my - translate.y) / scale;
            setViewMode('fit');
            setScale(next);
            setTranslate({ x: mx - worldX * next, y: my - worldY * next });
          } else {
            // Regular scroll wheel zoom
            const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
            const next = Math.min(8, Math.max(0.1, scale * zoomFactor));
            const worldX = (mx - translate.x) / scale;
            const worldY = (my - translate.y) / scale;
            setViewMode('fit');
            setScale(next);
            setTranslate({ x: mx - worldX * next, y: my - worldY * next });
          }
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
        onRotate={() => setIsCropMode(true)}
        onCrop={() => setIsCropMode(true)}
        onDownload={handleDownload}
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
        onSetFit={() => {
          // Force recalculate fit by temporarily changing viewMode
          setViewMode('100');
          requestAnimationFrame(() => setViewMode('fit'));
        }}
      />

      {/* Crop Overlay - Lightroom style */}
      {isCropMode && naturalSize && (
        <CropOverlay
          imageWidth={naturalSize.w}
          imageHeight={naturalSize.h}
          containerWidth={mediaContainerRef.current?.clientWidth || 0}
          containerHeight={mediaContainerRef.current?.clientHeight || 0}
          scale={scale}
          translateX={translate.x}
          translateY={translate.y}
          onApply={handleCropApply}
          onCancel={() => setIsCropMode(false)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog?.isOpen ?? false}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
