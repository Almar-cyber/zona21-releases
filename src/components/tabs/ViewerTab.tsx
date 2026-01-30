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
import { useAI } from '../../hooks/useAI';
import { translateTag } from '../../shared/tagTranslations';
import QuickEditPanel from '../QuickEditPanel';
import VideoTrimPanel from '../VideoTrimPanel';

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
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [isQuickEditVisible, setIsQuickEditVisible] = useState(false);
  const [isVideoTrimVisible, setIsVideoTrimVisible] = useState(false);
  const { getSmartName, applyRename } = useAI();

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

  // Load AI suggestions
  useEffect(() => {
    const loadAIData = async () => {
      if (asset && asset.mediaType === 'photo') {
        const nameData = await getSmartName(asset.id);
        setSuggestedName(nameData);
      }
    };
    loadAIData();
  }, [asset?.id, asset?.mediaType, getSmartName]);

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

  const handleApplyRename = useCallback(async () => {
    if (!asset || !suggestedName) return;
    const success = await applyRename(asset.id, suggestedName);
    if (success) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: `Arquivo renomeado para ${suggestedName}` }
        })
      );
      // Update local asset
      setAsset({ ...asset, fileName: suggestedName });
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao renomear arquivo' }
        })
      );
    }
  }, [asset, suggestedName, applyRename]);

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

  return (
    <div className="flex h-full w-full">
      {/* Left: Image/Video preview (70%) */}
      <div className="flex-1 flex flex-col bg-black">
        {/* Top toolbar with zoom controls */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0d0d1a]/95 border-b border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Icon name="search" size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-white tabular-nums w-14">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content="Diminuir zoom (-)" position="top">
              <button
                type="button"
                onClick={() => {
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
                className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
              >
                <Icon name="remove" size={18} />
              </button>
            </Tooltip>

            <Tooltip content="Ajustar à tela (0)" position="top">
              <button
                type="button"
                onClick={() => setViewMode('fit')}
                className={`mh-btn h-8 px-3 text-sm ${viewMode === 'fit' ? 'mh-btn-indigo' : 'mh-btn-gray'}`}
              >
                Fit
              </button>
            </Tooltip>

            <Tooltip content="Tamanho real (1)" position="top">
              <button
                type="button"
                onClick={() => setViewMode('100')}
                className={`mh-btn h-8 px-3 text-sm ${viewMode === '100' ? 'mh-btn-indigo' : 'mh-btn-gray'}`}
              >
                100%
              </button>
            </Tooltip>

            <Tooltip content="Aumentar zoom (+)" position="top">
              <button
                type="button"
                onClick={() => {
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
                className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
              >
                <Icon name="add" size={18} />
              </button>
            </Tooltip>
          </div>

          <div className="text-xs text-gray-500">
            🖱️ Scroll: zoom · ✋ Arrastar: mover · 👆 Duplo clique: Fit/100%
          </div>
        </div>

        {/* Main preview area */}
        <div
          ref={mediaContainerRef}
          className="flex-1 relative overflow-hidden cursor-move"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          {asset.mediaType === 'video' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {videoError ? (
                <img src={thumbSrc} alt={asset.fileName} className="max-h-full max-w-full object-contain" />
              ) : (
                <video
                  src={fullResSrc}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-full max-w-full object-contain"
                  onError={() => setVideoError(true)}
                />
              )}
            </div>
          ) : (
            <div className="absolute inset-0">
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
          )}
        </div>
      </div>

      {/* Right: Metadata + Edit panels (30%) */}
      <div className="w-[30%] bg-[#0d0d1a]/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-semibold text-white">Detalhes</h2>
        </div>

        {/* Offline/Missing warning */}
        {(asset.status === 'offline' || asset.status === 'missing') && (
          <div className="mx-4 mt-4 rounded border border-amber-700 bg-amber-900/30 p-3 shrink-0">
            <div className="text-sm font-semibold text-amber-200">
              {asset.status === 'missing' ? 'Arquivo ausente' : 'Volume offline'}
            </div>
            <div className="mt-1 text-xs text-amber-200/80">
              O arquivo original pode não estar acessível.
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={revealInFinder}
                className="mh-btn mh-btn-gray px-2 py-1 text-xs"
              >
                Revelar
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Filename */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Nome do arquivo</div>
            <div className="text-sm text-white break-all">{asset.fileName}</div>
          </div>

          {/* Metadata */}
          <div>
            <div className="text-xs text-gray-400 mb-2">Metadados</div>
            {renderMetadata()}
          </div>

          {/* Notes */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Notas</div>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              onBlur={handleNotesBlur}
              placeholder="Adicionar notas..."
              className="w-full min-h-[80px] bg-black/30 rounded px-3 py-2 text-sm text-white placeholder-gray-500 border border-white/10 focus:border-blue-500 focus:outline-none resize-y"
            />
          </div>

          {/* AI Suggestions */}
          {suggestedName && suggestedName !== asset.fileName && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Sugestão de nome</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-sm text-white bg-black/30 rounded px-3 py-2 truncate">
                  {suggestedName}
                </div>
                <button
                  type="button"
                  onClick={handleApplyRename}
                  className="mh-btn mh-btn-indigo px-3 py-2 text-sm"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}

          {/* Edit Actions */}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            {asset.mediaType === 'photo' && (
              <button
                onClick={() => setIsQuickEditVisible(prev => !prev)}
                className={`flex-1 mh-btn h-10 flex items-center justify-center gap-2 transition-colors ${
                  isQuickEditVisible ? 'bg-blue-600 hover:bg-blue-700' : 'mh-btn-gray'
                }`}
                type="button"
              >
                <Icon name="edit" size={18} />
                <span className="text-sm">Quick Edit (E)</span>
              </button>
            )}
            {asset.mediaType === 'video' && (
              <button
                onClick={() => setIsVideoTrimVisible(prev => !prev)}
                className={`flex-1 mh-btn h-10 flex items-center justify-center gap-2 transition-colors ${
                  isVideoTrimVisible ? 'bg-red-600 hover:bg-red-700' : 'mh-btn-gray'
                }`}
                type="button"
              >
                <Icon name="movie" size={18} />
                <span className="text-sm">Video Trim (V)</span>
              </button>
            )}
          </div>

          {/* Embedded QuickEdit Panel */}
          {isQuickEditVisible && asset.mediaType === 'photo' && (
            <div className="border-t border-white/10 pt-4">
              <QuickEditPanel
                asset={asset}
                isVisible={true}
                onClose={() => setIsQuickEditVisible(false)}
                onEditComplete={(editedFilePath) => {
                  console.log('Edit completed:', editedFilePath);
                  // TODO: Refresh asset
                }}
              />
            </div>
          )}

          {/* Embedded VideoTrim Panel */}
          {isVideoTrimVisible && asset.mediaType === 'video' && (
            <div className="border-t border-white/10 pt-4">
              <VideoTrimPanel
                asset={asset}
                isVisible={true}
                onClose={() => setIsVideoTrimVisible(false)}
                onTrimComplete={(trimmedFilePath) => {
                  console.log('Trim completed:', trimmedFilePath);
                  // TODO: Refresh asset
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
