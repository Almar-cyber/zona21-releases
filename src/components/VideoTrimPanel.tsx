/**
 * Video Trim Panel - Professional Timeline UI
 *
 * Bottom-positioned horizontal panel following industry patterns:
 * - CapCut: Yellow handles, full-width filmstrip
 * - Premiere Pro: In/Out points (I/O keys), time ruler
 * - Final Cut Pro: Red playhead, precision editing
 * - DaVinci Resolve: Compact toolbar, dual timeline
 *
 * Design System: Uses CSS custom properties from design-system.css
 * Layout: Toolbar → Time Ruler → Filmstrip → Status Bar
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Asset } from '../shared/types';
import { useVideoTrim, VideoMetadata } from '../hooks/useVideoTrim';
import Icon from './Icon';
import { Tooltip } from './Tooltip';

interface VideoTrimPanelProps {
  asset: Asset;
  isVisible: boolean;
  onClose: () => void;
  onTrimComplete?: (trimmedFilePath: string) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export default function VideoTrimPanel({
  asset,
  isVisible,
  onClose,
  onTrimComplete,
  videoRef
}: VideoTrimPanelProps) {
  const {
    isProcessing,
    progress,
    trimVideo,
    extractAudio,
    extractTrimmedAudio,
    generateThumbnails,
    formatTime,
    formatTimeDetailed
  } = useVideoTrim();

  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [showTrimChoice, setShowTrimChoice] = useState(false);
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Check FFmpeg availability once
  useEffect(() => {
    (window as any).electronAPI?.checkFfmpegAvailable?.()
      .then((result: { available: boolean; error?: string }) => {
        setFfmpegAvailable(result.available);
        if (!result.available) {
          console.warn('[VideoTrim] FFmpeg não disponível:', result.error);
        }
      })
      .catch(() => setFfmpegAvailable(false));
  }, []);

  // Load metadata from asset prop + generate thumbnails via canvas
  useEffect(() => {
    if (!isVisible || asset.mediaType !== 'video') return;

    const meta: VideoMetadata = {
      duration: asset.duration || 0,
      width: asset.width || 0,
      height: asset.height || 0,
      codec: asset.codec || 'unknown',
      frameRate: asset.frameRate || 0,
      bitrate: 0,
      format: (asset as any).container || 'unknown'
    };
    setMetadata(meta);
    setStartTime(0);
    setEndTime(meta.duration);

    if (meta.duration > 0) {
      generateThumbnails(asset.id, 20, meta.duration).then(thumbs => {
        if (thumbs) setThumbnails(thumbs);
      });
    }
  }, [asset.id, asset.mediaType, isVisible, generateThumbnails, asset.duration, asset.width, asset.height, asset.codec, asset.frameRate]);

  // Sync playhead with video currentTime
  useEffect(() => {
    if (!videoRef?.current || !isVisible) return;

    const video = videoRef.current;
    const syncPlayhead = () => {
      if (video && !isDraggingPlayhead) {
        setPlayheadTime(video.currentTime);
      }
      rafRef.current = requestAnimationFrame(syncPlayhead);
    };

    rafRef.current = requestAnimationFrame(syncPlayhead);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [videoRef, isVisible, isDraggingPlayhead]);

  // Handle mouse move for dragging handles and playhead
  useEffect(() => {
    if (!isDraggingStart && !isDraggingEnd && !isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current || !metadata) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      const time = percent * metadata.duration;

      if (isDraggingStart) {
        setStartTime(Math.max(0, Math.min(time, endTime - 0.1)));
      } else if (isDraggingEnd) {
        setEndTime(Math.max(startTime + 0.1, Math.min(time, metadata.duration)));
      } else if (isDraggingPlayhead) {
        const clampedTime = Math.max(0, Math.min(time, metadata.duration));
        setPlayheadTime(clampedTime);
        if (videoRef?.current) {
          videoRef.current.currentTime = clampedTime;
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
      setIsDraggingPlayhead(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, isDraggingPlayhead, metadata, startTime, endTime, videoRef]);

  // Keyboard shortcuts: I = In point, O = Out point
  useEffect(() => {
    if (!isVisible || !metadata) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (key === 'i' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setStartTime(Math.min(playheadTime, endTime - 0.1));
      } else if (key === 'o' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setEndTime(Math.max(playheadTime, startTime + 0.1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, metadata, playheadTime, startTime, endTime]);

  // Click on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || !metadata) return;
    if (isDraggingStart || isDraggingEnd) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const time = percent * metadata.duration;

    setPlayheadTime(time);
    if (videoRef?.current) {
      videoRef.current.currentTime = time;
    }
  }, [metadata, videoRef, isDraggingStart, isDraggingEnd]);

  if (!isVisible || asset.mediaType !== 'video') return null;

  const duration = metadata?.duration || 0;
  const selectionDuration = endTime - startTime;
  const startPercent = duration > 0 ? (startTime / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endTime / duration) * 100 : 100;
  const playheadPercent = duration > 0 ? (playheadTime / duration) * 100 : 0;

  const handleTrimClick = () => {
    if (!metadata || selectionDuration <= 0) return;
    setShowTrimChoice(true);
  };

  const handleTrimNewFile = async () => {
    setShowTrimChoice(false);
    if (!metadata || selectionDuration <= 0) return;

    const result = await trimVideo(asset.id, { startTime, endTime });
    if (typeof result === 'string') {
      const copyResult = await (window as any).electronAPI?.copyTrimmedToOriginalFolder?.(asset.id, result);
      if (copyResult?.success) {
        window.dispatchEvent(
          new CustomEvent('zona21-toast', {
            detail: { type: 'success', message: `Novo arquivo criado: ${copyResult.filename}` }
          })
        );
        if (onTrimComplete) onTrimComplete(copyResult.filePath);
      } else {
        window.dispatchEvent(
          new CustomEvent('zona21-toast', {
            detail: { type: 'success', message: `Video trimado: ${formatTime(selectionDuration)}` }
          })
        );
        if (onTrimComplete) onTrimComplete(result);
      }
    } else {
      const errorMsg = (result && typeof result === 'object') ? result.error : 'Falha ao trimar video';
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: errorMsg }
        })
      );
    }
  };

  const handleTrimReplaceOriginal = async () => {
    setShowTrimChoice(false);
    if (!metadata || selectionDuration <= 0) return;

    const result = await trimVideo(asset.id, { startTime, endTime });
    if (typeof result === 'string') {
      const replaceResult = await (window as any).electronAPI?.replaceTrimmedOriginal?.(asset.id, result);
      if (replaceResult?.success) {
        window.dispatchEvent(
          new CustomEvent('zona21-toast', {
            detail: { type: 'success', message: 'Original substituido com sucesso' }
          })
        );
        if (onTrimComplete) onTrimComplete(replaceResult.filePath);
      } else {
        window.dispatchEvent(
          new CustomEvent('zona21-toast', {
            detail: { type: 'error', message: replaceResult?.error || 'Falha ao substituir original' }
          })
        );
      }
    } else {
      const errorMsg = (result && typeof result === 'object') ? result.error : 'Falha ao trimar video';
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: errorMsg }
        })
      );
    }
  };

  const handleExtractAudio = async () => {
    const result = await extractAudio(asset.id);
    window.dispatchEvent(
      new CustomEvent('zona21-toast', {
        detail: result
          ? { type: 'success', message: 'Audio extraido com sucesso!' }
          : { type: 'error', message: 'Falha ao extrair audio' }
      })
    );
  };

  const handleExtractTrimmedAudio = async () => {
    if (!metadata || selectionDuration <= 0) return;
    const result = await extractTrimmedAudio(asset.id, { startTime, endTime });
    window.dispatchEvent(
      new CustomEvent('zona21-toast', {
        detail: result
          ? { type: 'success', message: `Audio extraido: ${formatTime(selectionDuration)}` }
          : { type: 'error', message: 'Falha ao extrair audio' }
      })
    );
  };

  const handleReset = () => {
    if (metadata) {
      setStartTime(0);
      setEndTime(metadata.duration);
    }
  };

  // Time ruler ticks
  const renderTimeRuler = () => {
    if (!duration || duration <= 0) return null;

    const ticks: { time: number; label: string; major: boolean }[] = [];
    let interval = 1;
    if (duration > 120) interval = 10;
    else if (duration > 60) interval = 5;
    else if (duration > 20) interval = 5;
    else if (duration < 10) interval = 1;

    for (let t = 0; t <= duration; t += interval) {
      ticks.push({
        time: t,
        label: formatTime(t),
        major: true
      });
    }

    // Minor ticks
    const minorInterval = interval >= 5 ? 1 : 0.5;
    for (let t = 0; t <= duration; t += minorInterval) {
      if (t % interval !== 0) {
        ticks.push({ time: t, label: '', major: false });
      }
    }

    return (
      <div className="relative h-5 mx-4" style={{ userSelect: 'none' }}>
        {ticks.map((tick, i) => {
          const left = (tick.time / duration) * 100;
          return (
            <div
              key={i}
              className="absolute"
              style={{ left: `${left}%` }}
            >
              <div
                className="w-px"
                style={{
                  height: tick.major ? '10px' : '6px',
                  background: tick.major ? 'var(--color-border-hover)' : 'var(--color-border)'
                }}
              />
              {tick.major && tick.label && (
                <span
                  className="absolute top-2.5 text-[9px] -translate-x-1/2 whitespace-nowrap"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {tick.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const isFullSelection = startTime === 0 && endTime === duration;
  const trimDisabled = isProcessing || selectionDuration <= 0 || ffmpegAvailable === false;

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-40" style={{ height: '164px' }}>
        {/* Backdrop layer - separate so tooltips aren't clipped by backdrop-filter */}
        <div
          className="absolute inset-0 backdrop-blur-xl pointer-events-none"
          style={{
            background: 'var(--color-timeline-surface)',
            borderTop: '1px solid var(--color-border)',
          }}
        />
        {/* Content layer - tooltips can overflow above the panel */}
        <div className="relative h-full flex flex-col">

          {/* Toolbar Row */}
          <div
            className="flex items-center px-4 h-9 gap-1 shrink-0"
            style={{ borderBottom: '1px solid var(--color-sidebar-stroke)' }}
          >
            {/* Trim actions */}
            <Tooltip content={`Cortar selecao (${formatTimeDetailed(selectionDuration)})`} position="top">
              <button
                type="button"
                onClick={handleTrimClick}
                disabled={trimDisabled}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--color-trim-accent)',
                  color: 'var(--color-trim-accent-text)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => { if (!trimDisabled) e.currentTarget.style.background = 'var(--color-trim-accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-trim-accent)'; }}
              >
                <Icon name="content_cut" size={14} />
                Cortar
              </button>
            </Tooltip>

            <Tooltip content="Extrair audio da selecao (MP3)" position="top">
              <button
                type="button"
                onClick={isFullSelection ? handleExtractAudio : handleExtractTrimmedAudio}
                disabled={trimDisabled}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  color: 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => { if (!trimDisabled) e.currentTarget.style.background = 'var(--color-overlay-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name="volume_up" size={14} />
                Audio
              </button>
            </Tooltip>

            <Tooltip content="Resetar selecao" position="top">
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing || isFullSelection}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!(isProcessing || isFullSelection)) {
                    e.currentTarget.style.background = 'var(--color-overlay-light)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                <Icon name="refresh" size={14} />
              </button>
            </Tooltip>

            {/* Progress indicator */}
            {progress && (
              <div className="flex items-center gap-2 ml-2">
                <div
                  className="w-20 h-1 overflow-hidden"
                  style={{ background: 'var(--color-border)', borderRadius: 'var(--radius-full)' }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${progress.percent}%`,
                      background: 'var(--color-trim-handle)',
                      transition: 'width var(--transition-slow)',
                    }}
                  />
                </div>
                <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {progress.percent}%
                </span>
              </div>
            )}

            {/* FFmpeg warning */}
            {ffmpegAvailable === false && (
              <Tooltip content="Instale FFmpeg: brew install ffmpeg" position="top">
                <div className="flex items-center gap-1 text-[10px] ml-2" style={{ color: 'var(--color-warning)' }}>
                  <Icon name="warning" size={12} />
                  FFmpeg
                </div>
              </Tooltip>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Time display */}
            <div className="flex items-center gap-3 text-xs font-mono mr-3">
              <span style={{ color: 'var(--color-text-muted)' }}>IN</span>
              <span style={{ color: 'var(--color-text-primary)' }}>{formatTimeDetailed(startTime)}</span>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ color: 'var(--color-text-muted)' }}>OUT</span>
              <span style={{ color: 'var(--color-text-primary)' }}>{formatTimeDetailed(endTime)}</span>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <span className="font-semibold" style={{ color: 'var(--color-trim-handle)' }}>
                {formatTimeDetailed(selectionDuration)}
              </span>
            </div>

            {/* Close */}
            <Tooltip content="Fechar (V)" position="top">
              <button
                type="button"
                onClick={onClose}
                className="p-1"
                style={{
                  color: 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-overlay-light)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <Icon name="close" size={16} />
              </button>
            </Tooltip>
          </div>

          {/* Time Ruler */}
          <div className="shrink-0">
            {renderTimeRuler()}
          </div>

          {/* Filmstrip Timeline */}
          <div className="flex-1 px-4 pb-1 min-h-0">
            <div
              ref={timelineRef}
              className="relative h-full overflow-hidden cursor-pointer"
              style={{ userSelect: 'none', borderRadius: 'var(--radius-sm)' }}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest('[data-handle]')) {
                  setIsDraggingPlayhead(true);
                  handleTimelineClick(e);
                }
              }}
            >
              {/* Thumbnail filmstrip */}
              <div className="absolute inset-0 flex flex-row">
                {thumbnails.map((thumb, i) => (
                  <img
                    key={i}
                    src={thumb}
                    alt=""
                    className="h-full object-cover flex-1 min-w-0"
                    draggable={false}
                  />
                ))}
                {thumbnails.length === 0 && (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--color-overlay-light)' }}
                  >
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Gerando filmstrip...
                    </span>
                  </div>
                )}
              </div>

              {/* Dimmed regions outside selection */}
              <div
                className="absolute top-0 bottom-0 left-0 pointer-events-none"
                style={{ width: `${startPercent}%`, background: 'var(--color-timeline-dim)' }}
              />
              <div
                className="absolute top-0 bottom-0 right-0 pointer-events-none"
                style={{ width: `${100 - endPercent}%`, background: 'var(--color-timeline-dim)' }}
              />

              {/* Selection border (yellow, CapCut style) */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: `${startPercent}%`,
                  width: `${endPercent - startPercent}%`
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'var(--color-trim-handle)' }} />
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'var(--color-trim-handle)' }} />
              </div>

              {/* Start handle */}
              <div
                data-handle="start"
                className="absolute top-0 bottom-0 z-20 cursor-ew-resize group/handle"
                style={{
                  left: `${startPercent}%`,
                  width: '14px',
                  marginLeft: '-7px'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingStart(true);
                }}
              >
                <div
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[5px] rounded-l-sm
                    group-hover/handle:brightness-110 transition-all"
                  style={{
                    background: 'var(--color-trim-handle)',
                    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <div className="w-[3px] h-[3px] rounded-full" style={{ background: 'rgba(0,0,0,0.3)' }} />
                    <div className="w-[3px] h-[3px] rounded-full" style={{ background: 'rgba(0,0,0,0.3)' }} />
                    <div className="w-[3px] h-[3px] rounded-full" style={{ background: 'rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
              </div>

              {/* End handle */}
              <div
                data-handle="end"
                className="absolute top-0 bottom-0 z-20 cursor-ew-resize group/handle"
                style={{
                  left: `${endPercent}%`,
                  width: '14px',
                  marginLeft: '-7px'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingEnd(true);
                }}
              >
                <div
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[5px] rounded-r-sm
                    group-hover/handle:brightness-110 transition-all"
                  style={{
                    background: 'var(--color-trim-handle)',
                    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <div className="w-[3px] h-[3px] rounded-full" style={{ background: 'rgba(0,0,0,0.3)' }} />
                    <div className="w-[3px] h-[3px] rounded-full" style={{ background: 'rgba(0,0,0,0.3)' }} />
                    <div className="w-[3px] h-[3px] rounded-full" style={{ background: 'rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
              </div>

              {/* Playhead (red line) */}
              <div
                className="absolute top-0 bottom-0 z-30 pointer-events-none"
                style={{ left: `${playheadPercent}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '6px solid var(--color-playhead)'
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 left-1/2 -translate-x-[0.5px] w-[2px]"
                  style={{
                    background: 'var(--color-playhead)',
                    boxShadow: `0 0 4px var(--color-playhead-glow)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div
            className="flex items-center px-4 h-6 text-[10px] gap-4 shrink-0"
            style={{
              color: 'var(--color-text-muted)',
              borderTop: '1px solid var(--color-sidebar-stroke)',
            }}
          >
            <span>
              <span style={{ color: 'var(--color-text-muted)' }}>Playhead:</span>{' '}
              <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                {formatTimeDetailed(playheadTime)}
              </span>
            </span>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <span>
              {metadata && (
                <>
                  {metadata.width}x{metadata.height} {metadata.codec} {metadata.frameRate > 0 && `${metadata.frameRate.toFixed(0)}fps`}
                </>
              )}
            </span>
            <div className="flex-1" />
            <span style={{ color: 'var(--color-text-muted)' }}>
              I/O para pontos | V para fechar
            </span>
          </div>
        </div>
      </div>

      {/* Trim Choice Modal */}
      {showTrimChoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTrimChoice(false)} />
          <div className="mh-popover relative max-w-xs w-full overflow-hidden">
            <div className="text-center px-5 py-4 border-b border-[var(--color-border)]">
              <span className="mx-auto mb-2 inline-block text-[var(--color-trim-handle)]"><Icon name="content_cut" size={28} /></span>
              <h4 className="font-semibold text-[var(--color-text-primary)]">Como deseja salvar?</h4>
              <p className="text-xs mt-1 text-[var(--color-text-secondary)]">
                Duracao: {formatTime(selectionDuration)}
              </p>
            </div>

            <div className="px-5 py-4 space-y-2">
              <button
                type="button"
                onClick={handleTrimNewFile}
                className="mh-btn mh-btn-indigo w-full px-4 py-3 text-sm font-medium flex items-center gap-3"
              >
                <Icon name="add" size={20} />
                <div className="text-left">
                  <div>Criar novo arquivo</div>
                  <div className="text-xs opacity-70">Mantem o original intacto</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleTrimReplaceOriginal}
                className="mh-btn mh-btn-danger w-full px-4 py-3 text-sm font-medium flex items-center gap-3"
              >
                <Icon name="swap_horiz" size={20} />
                <div className="text-left">
                  <div>Substituir original</div>
                  <div className="text-xs opacity-70">Acao irreversivel</div>
                </div>
              </button>
            </div>

            <div className="px-5 py-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setShowTrimChoice(false)}
                className="mh-btn mh-btn-gray w-full px-3 py-2 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
