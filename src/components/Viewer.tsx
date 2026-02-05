import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Asset } from '../shared/types';
import { Tooltip } from './Tooltip';
import Icon from './Icon';
import QuickEditPanel from './QuickEditPanel';
import VideoTrimPanel from './VideoTrimPanel';
import PanoramicEditPanel from './PanoramicEditPanel';

interface ViewerProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: (assetId: string, updates: any) => void;
}

export default function Viewer({ asset, onClose, onUpdate }: ViewerProps) {
  const [notes, setNotes] = useState(asset.notes);
  const [isQuickEditVisible, setIsQuickEditVisible] = useState(false);
  const [isVideoTrimVisible, setIsVideoTrimVisible] = useState(false);
  const [isPanoramicEditVisible, setIsPanoramicEditVisible] = useState(false);

  // Keyboard shortcut for Quick Edit panel toggle (E key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only toggle if 'e' is pressed and not in an input/textarea
      if (
        e.key.toLowerCase() === 'e' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        asset.mediaType === 'photo' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsQuickEditVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asset.mediaType]);

  // Keyboard shortcut for Video Trim panel toggle (V key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only toggle if 'v' is pressed and not in an input/textarea
      if (
        e.key.toLowerCase() === 'v' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        asset.mediaType === 'video' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsVideoTrimVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asset.mediaType]);

  const mediaContainerRef = useRef<HTMLDivElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [viewMode, setViewMode] = useState<'fit' | '100'>('fit');
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fullResSrc = useMemo(() => `zona21file://${asset.id}`, [asset.id]);
  const thumbSrc = useMemo(() => `zona21thumb://${asset.id}`, [asset.id]);

  const assumedInitialSize = useMemo(() => {
    const w = Number(asset.width || 0);
    const h = Number(asset.height || 0);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    const o = Number(asset.orientation || 0);
    const rotates90 = o === 5 || o === 6 || o === 7 || o === 8;
    return rotates90 ? { w: h, h: w } : { w, h };
  }, [asset.height, asset.orientation, asset.width]);

  const revealInFinder = async () => {
    const fn = (window.electronAPI as any)?.revealAsset;
    if (typeof fn !== 'function') return;
    const res = await (window.electronAPI as any).revealAsset(asset.id);
    if (!res?.success) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao revelar: ${res?.error || 'Erro desconhecido'}` }
        })
      );
    }
  };

  useEffect(() => {
    setNotes(asset.notes);
    setNaturalSize(null);
    setFitScale(1);
    setViewMode('fit');
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setVideoError(false);
    setImageError(false);
  }, [asset.id]);

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

  const handleNotesBlur = () => {
    onUpdate(asset.id, { notes });
  };

  const renderMetadata = () => {
    if (asset.mediaType === 'video') {
      return (
        <>
          <div className="mb-2">
            <span className="text-gray-400">Codec:</span> {asset.codec}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Duração:</span> {asset.duration?.toFixed(2)}s
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Taxa de quadros:</span> {asset.frameRate?.toFixed(2)} fps
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Resolução:</span> {asset.width} × {asset.height}
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="mb-2">
            <span className="text-gray-400">Câmera:</span> {asset.cameraMake} {asset.cameraModel}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Lente:</span> {asset.lens || 'N/A'}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">ISO:</span> {asset.iso || 'N/A'}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Abertura:</span> f/{asset.aperture || 'N/A'}
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Distância focal:</span> {asset.focalLength}mm
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Resolução:</span> {asset.width} × {asset.height}
          </div>
        </>
      );
    }
  };

  return (
    <div className="relative flex h-full">
      <div className="w-96 h-full mh-sidebar border-l border-white/10 flex flex-col overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Detalhes</h2>
        <div className="flex items-center gap-2">
          {asset.mediaType === 'photo' && (
            <Tooltip content="Quick Edit (E)" position="bottom">
              <button
                onClick={() => setIsQuickEditVisible(prev => !prev)}
                className={`mh-btn h-8 w-8 flex items-center justify-center transition-colors ${
                  isQuickEditVisible ? 'bg-blue-600 hover:bg-blue-700' : 'mh-btn-gray'
                }`}
                aria-label="Toggle Quick Edit Panel"
                type="button"
              >
                <Icon name="edit" size={18} />
              </button>
            </Tooltip>
          )}
          {asset.mediaType === 'video' && (
            <Tooltip content="Video Trim (V)" position="bottom">
              <button
                onClick={() => setIsVideoTrimVisible(prev => !prev)}
                className={`mh-btn h-8 w-8 flex items-center justify-center transition-colors ${
                  isVideoTrimVisible ? 'bg-red-600 hover:bg-red-700' : 'mh-btn-gray'
                }`}
                aria-label="Toggle Video Trim Panel"
                type="button"
              >
                <Icon name="movie" size={18} />
              </button>
            </Tooltip>
          )}
          {asset.fileName.toLowerCase().match(/\.(insv|lrv|insp)$/) && (
            <Tooltip content="360° Edit" position="bottom">
              <button
                onClick={() => setIsPanoramicEditVisible(prev => !prev)}
                className={`mh-btn h-8 w-8 flex items-center justify-center transition-colors ${
                  isPanoramicEditVisible ? 'bg-green-600 hover:bg-green-700' : 'mh-btn-gray'
                }`}
                aria-label="Toggle 360 Edit Panel"
                type="button"
              >
                <Icon name="globe" size={18} />
              </button>
            </Tooltip>
          )}
          <button
            onClick={onClose}
            className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
            aria-label="Fechar detalhes"
            type="button"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {(asset.status === 'offline' || asset.status === 'missing') && (
          <div className="mb-3 rounded border border-amber-700 bg-amber-900/30 p-2">
            <div className="text-xs font-semibold text-amber-200">
              {asset.status === 'missing' ? 'Arquivo ausente' : 'Volume offline'}
            </div>
            <div className="mt-0.5 text-[11px] text-amber-200/80">
              O arquivo original pode não estar acessível. Tente reconectar o drive ou revelar o local esperado.
            </div>
            <div className="mt-2 flex gap-2">
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

        <div className="mb-4">
          <div className="rounded bg-black/30 overflow-hidden">
            {asset.mediaType === 'video' ? (
              <>
                <div className="flex items-center justify-between px-2 py-2 border-b border-gray-700 bg-gray-900/40">
                  <div className="text-xs text-gray-300">Vídeo</div>
                </div>

                <div className="w-full h-[320px] bg-black/20 overflow-hidden">
                  {videoError ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src={thumbSrc} alt={asset.fileName} className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <video
                      src={fullResSrc}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                      onError={() => setVideoError(true)}
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 px-2 py-2 border-t border-gray-700 bg-gray-900/30">
                  <img
                    src={thumbSrc}
                    alt={asset.fileName}
                    className="h-12 w-20 rounded object-cover bg-black/20"
                    draggable={false}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-200 truncate">{asset.fileName}</div>
                    <div className="text-[11px] text-gray-400">
                      {asset.width}×{asset.height}
                      {asset.duration ? ` · ${asset.duration.toFixed(1)}s` : ''}
                    </div>
                  </div>
                </div>

                <div className="px-2 py-1 text-[10px] text-gray-500 bg-gray-900/20 border-b border-gray-700 flex items-center gap-3">
                  <span>🖱️ Scroll: zoom</span>
                  <span>✋ Arrastar: mover</span>
                  <span>👆 Duplo clique: Fit/100%</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between px-2 py-2 border-b border-gray-700 bg-gray-900/40">
                  <div className="flex items-center gap-2">
                    <Icon name="search" size={14} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-300 tabular-nums w-12">
                      {Math.round(scale * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
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
                        className="mh-btn mh-btn-gray h-7 w-7 flex items-center justify-center text-sm"
                      >
                        <Icon name="remove" size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Ajustar à tela (0)" position="top">
                      <button
                        type="button"
                        onClick={() => setViewMode('fit')}
                        className={`mh-btn h-7 px-2 text-xs ${viewMode === 'fit' ? 'mh-btn-indigo' : 'mh-btn-gray'}`}
                      >
                        Fit
                      </button>
                    </Tooltip>
                    <Tooltip content="Tamanho real (1)" position="top">
                      <button
                        type="button"
                        onClick={() => setViewMode('100')}
                        className={`mh-btn h-7 px-2 text-xs ${viewMode === '100' ? 'mh-btn-indigo' : 'mh-btn-gray'}`}
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
                        className="mh-btn mh-btn-gray h-7 w-7 flex items-center justify-center text-sm"
                      >
                        <Icon name="add" size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <div
                  ref={mediaContainerRef}
                  className={`relative w-full h-[320px] bg-black/20 overflow-hidden ${isPanning ? 'cursor-grabbing' : scale > fitScale ? 'cursor-grab' : 'cursor-default'}`}
                  onWheel={(e) => {
                    if (!naturalSize) return;
                    e.preventDefault();
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
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
                  <img
                    src={imageError ? thumbSrc : fullResSrc}
                    alt={asset.fileName}
                    draggable={false}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) {
                        // Browsers modernos aplicam EXIF rotation automaticamente
                        // Então usamos as dimensões naturais diretamente
                        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                      }
                    }}
                    onError={() => {
                      // If full-res is missing/offline or fails, fallback to thumb.
                      setImageError(true);
                    }}
                    style={{
                      width: naturalSize?.w ?? assumedInitialSize?.w ?? 'auto',
                      height: naturalSize?.h ?? assumedInitialSize?.h ?? 'auto',
                      maxWidth: naturalSize || assumedInitialSize ? 'none' : '100%',
                      maxHeight: naturalSize || assumedInitialSize ? 'none' : '100%',
                      objectFit: naturalSize || assumedInitialSize ? 'none' : 'contain',
                      transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                      transformOrigin: '0 0',
                      willChange: 'transform'
                    }}
                    className={`absolute top-0 left-0 select-none pointer-events-none ${naturalSize || assumedInitialSize ? '' : 'opacity-0'}`}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-400 mb-2">ARQUIVO</div>
          <div className="text-sm break-all">{asset.fileName}</div>
          <div className="text-xs text-gray-500 mt-1">{asset.relativePath}</div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-400 mb-2">NOTAS</div>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            onBlur={handleNotesBlur}
            placeholder="Adicionar notas..."
            className="w-full p-2 mh-control resize-none"
            rows={4}
          />
        </div>

        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-400 mb-2">METADADOS</div>
          <div className="text-sm">
            {renderMetadata()}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-400 mb-2">INFORMAÇÕES DO ARQUIVO</div>
          <div className="text-sm">
            <div className="mb-2">
              <span className="text-gray-400">Tamanho:</span> {(asset.fileSize / 1024 / 1024).toFixed(2)} MB
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Criado em:</span> {new Date(asset.createdAt).toLocaleString()}
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Tipo:</span> {asset.mediaType === 'video' ? 'Vídeo' : 'Foto'}
            </div>
          </div>
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <Icon name="label" size={14} className="text-gray-400" />
              TAGS
            </div>

            <div className="flex flex-wrap gap-1">
              {asset.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-xs text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700" />
      </div>

      {/* Quick Edit Panel */}
      <QuickEditPanel
        asset={asset}
        isVisible={isQuickEditVisible}
        onClose={() => setIsQuickEditVisible(false)}
        onEditComplete={(editedFilePath) => {
          console.log('Edit completed:', editedFilePath);
          // Notify that asset was edited - triggers thumbnail regeneration and UI refresh
          onUpdate(asset.id, { editedAt: Date.now() });
          window.dispatchEvent(new CustomEvent('zona21-toast', {
            detail: { type: 'success', message: 'Edição salva com sucesso' }
          }));
          window.dispatchEvent(new CustomEvent('zona21-refresh-assets'));
        }}
      />

      {/* Video Trim Panel */}
      <VideoTrimPanel
        asset={asset}
        isVisible={isVideoTrimVisible}
        onClose={() => setIsVideoTrimVisible(false)}
        onTrimComplete={(trimmedFilePath) => {
          console.log('Trim completed:', trimmedFilePath);
          // Notify that video was trimmed - triggers thumbnail regeneration and UI refresh
          onUpdate(asset.id, { editedAt: Date.now() });
          window.dispatchEvent(new CustomEvent('zona21-toast', {
            detail: { type: 'success', message: 'Vídeo cortado com sucesso' }
          }));
          window.dispatchEvent(new CustomEvent('zona21-refresh-assets'));
        }}
      />

      {/* Panoramic 360 Edit Panel */}
      <PanoramicEditPanel
        asset={asset}
        isVisible={isPanoramicEditVisible}
        onClose={() => setIsPanoramicEditVisible(false)}
        onEditComplete={(editedFilePath) => {
          console.log('360 edit completed:', editedFilePath);
          // Notify that 360 file was edited - triggers thumbnail regeneration and UI refresh
          onUpdate(asset.id, { editedAt: Date.now() });
          window.dispatchEvent(new CustomEvent('zona21-toast', {
            detail: { type: 'success', message: 'Edição 360° concluída com sucesso' }
          }));
          window.dispatchEvent(new CustomEvent('zona21-refresh-assets'));
        }}
      />
    </div>
  );
}
