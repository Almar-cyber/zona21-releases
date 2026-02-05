/**
 * Panoramic Edit Panel Component
 *
 * Provides 360/panoramic editing operations:
 * - Reframe 360° video/photo to flat projection
 * - Adjust orientation (yaw, pitch, roll, FOV)
 * - Video stabilization
 * - Aspect ratio presets
 * - Direction presets (front, back, left, right, up, down)
 */

import { useState, useEffect } from 'react';
import { Asset } from '../shared/types';
import { usePanoramicEdit, ReframeOptions, StabilizeOptions, Video360Metadata } from '../hooks/usePanoramicEdit';
import Icon from './Icon';
import { Tooltip } from './Tooltip';

interface PanoramicEditPanelProps {
  asset: Asset;
  isVisible: boolean;
  onClose: () => void;
  onEditComplete?: (filePath: string) => void;
}

export default function PanoramicEditPanel({
  asset,
  isVisible,
  onClose,
  onEditComplete
}: PanoramicEditPanelProps) {
  const {
    isProcessing,
    progress,
    metadata,
    error,
    getMetadata,
    reframeVideo,
    stabilizeVideo,
    reframePhoto,
    clearError
  } = usePanoramicEdit();

  // UI mode
  const [mode, setMode] = useState<'reframe' | 'stabilize'>('reframe');

  // Reframe controls
  const [fov, setFov] = useState(90);
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');

  // Stabilize controls
  const [shakiness, setShakiness] = useState(5);
  const [smoothing, setSmoothing] = useState(30);

  // Load metadata when panel opens
  useEffect(() => {
    if (!isVisible) return;

    const is360File = asset.fileName.toLowerCase().match(/\.(insv|lrv|insp)$/);
    if (!is360File) return;

    const loadMetadata = async () => {
      await getMetadata(asset.id);
    };

    loadMetadata();
  }, [asset.id, asset.fileName, isVisible, getMetadata]);

  // Handle reframe
  const handleReframe = async () => {
    clearError();

    const options: ReframeOptions = {
      outputProjection: 'flat',
      outputAspectRatio: aspectRatio,
      fov,
      yaw,
      pitch,
      roll
    };

    const isVideo = asset.mediaType === 'video';
    const result = isVideo
      ? await reframeVideo(asset.id, options)
      : await reframePhoto(asset.id, {
          fov,
          yaw,
          pitch,
          roll,
          outputWidth: getOutputDimensions(aspectRatio).width,
          outputHeight: getOutputDimensions(aspectRatio).height
        });

    if (result && onEditComplete) {
      onEditComplete(result);
    }
  };

  // Handle stabilize
  const handleStabilize = async () => {
    clearError();

    const options: StabilizeOptions = {
      shakiness,
      smoothing
    };

    const result = await stabilizeVideo(asset.id, options);
    if (result && onEditComplete) {
      onEditComplete(result);
    }
  };

  // Preset direction buttons
  const applyDirectionPreset = (direction: 'front' | 'back' | 'left' | 'right' | 'up' | 'down') => {
    switch (direction) {
      case 'front':
        setYaw(0); setPitch(0); setRoll(0);
        break;
      case 'back':
        setYaw(180); setPitch(0); setRoll(0);
        break;
      case 'left':
        setYaw(-90); setPitch(0); setRoll(0);
        break;
      case 'right':
        setYaw(90); setPitch(0); setRoll(0);
        break;
      case 'up':
        setYaw(0); setPitch(90); setRoll(0);
        break;
      case 'down':
        setYaw(0); setPitch(-90); setRoll(0);
        break;
    }
  };

  // Reset controls
  const resetControls = () => {
    setFov(90);
    setYaw(0);
    setPitch(0);
    setRoll(0);
    setAspectRatio('16:9');
    setShakiness(5);
    setSmoothing(30);
  };

  // Get output dimensions based on aspect ratio
  const getOutputDimensions = (ratio: '16:9' | '9:16' | '1:1' | '4:3') => {
    switch (ratio) {
      case '16:9':
        return { width: 1920, height: 1080 };
      case '9:16':
        return { width: 1080, height: 1920 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '4:3':
        return { width: 1600, height: 1200 };
      default:
        return { width: 1920, height: 1080 };
    }
  };

  if (!isVisible) return null;

  const is360File = asset.fileName.toLowerCase().match(/\.(insv|lrv|insp)$/);
  if (!is360File) return null;

  const isVideo = asset.mediaType === 'video';
  const isPhoto = asset.mediaType === 'photo';

  return (
    <div className="panoramic-edit-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <Icon name="globe" size={20} />
          <span>360° Edit</span>
          {metadata && (
            <span className="metadata-badge">
              {metadata.projectionType === 'equirectangular' ? '360°' : 'Flat'} • {Math.round(metadata.originalResolution.width)}×{Math.round(metadata.originalResolution.height)}
            </span>
          )}
        </div>
        <button className="close-button" onClick={onClose} disabled={isProcessing}>
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Mode Tabs */}
      {isVideo && (
        <div className="mode-tabs">
          <button
            className={mode === 'reframe' ? 'active' : ''}
            onClick={() => setMode('reframe')}
            disabled={isProcessing}
          >
            <Icon name="target" size={16} />
            Reframing
          </button>
          <button
            className={mode === 'stabilize' ? 'active' : ''}
            onClick={() => setMode('stabilize')}
            disabled={isProcessing}
          >
            <Icon name="activity" size={16} />
            Stabilize
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <Icon name="alert-circle" size={16} />
          <span>{error}</span>
          <button onClick={clearError}>
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      <div className="panel-content">
        {/* Reframe Mode */}
        {mode === 'reframe' && (
          <div className="reframe-controls">
            <div className="section-title">Orientation Controls</div>

            {/* Yaw Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Yaw (Pan Horizontal)</span>
                <span className="control-value">{yaw}°</span>
              </div>
              <div className="slider-container">
                <span className="slider-min">-180°</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={yaw}
                  onChange={(e) => setYaw(Number(e.target.value))}
                  disabled={isProcessing}
                  className="slider"
                />
                <span className="slider-max">180°</span>
              </div>
            </div>

            {/* Pitch Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Pitch (Tilt Vertical)</span>
                <span className="control-value">{pitch}°</span>
              </div>
              <div className="slider-container">
                <span className="slider-min">-90°</span>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  disabled={isProcessing}
                  className="slider"
                />
                <span className="slider-max">90°</span>
              </div>
            </div>

            {/* Roll Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Roll (Rotation)</span>
                <span className="control-value">{roll}°</span>
              </div>
              <div className="slider-container">
                <span className="slider-min">-180°</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={roll}
                  onChange={(e) => setRoll(Number(e.target.value))}
                  disabled={isProcessing}
                  className="slider"
                />
                <span className="slider-max">180°</span>
              </div>
            </div>

            {/* FOV Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Field of View</span>
                <span className="control-value">{fov}°</span>
              </div>
              <div className="slider-container">
                <span className="slider-min">60°</span>
                <input
                  type="range"
                  min="60"
                  max="120"
                  value={fov}
                  onChange={(e) => setFov(Number(e.target.value))}
                  disabled={isProcessing}
                  className="slider"
                />
                <span className="slider-max">120°</span>
              </div>
            </div>

            {/* Direction Presets */}
            <div className="section-title">Direction Presets</div>
            <div className="preset-buttons">
              <Tooltip content="View Front (0°, 0°, 0°)">
                <button onClick={() => applyDirectionPreset('front')} disabled={isProcessing}>
                  <Icon name="arrow-up" size={16} />
                  Front
                </button>
              </Tooltip>
              <Tooltip content="View Back (180°, 0°, 0°)">
                <button onClick={() => applyDirectionPreset('back')} disabled={isProcessing}>
                  <Icon name="arrow-down" size={16} />
                  Back
                </button>
              </Tooltip>
              <Tooltip content="View Left (-90°, 0°, 0°)">
                <button onClick={() => applyDirectionPreset('left')} disabled={isProcessing}>
                  <Icon name="arrow-left" size={16} />
                  Left
                </button>
              </Tooltip>
              <Tooltip content="View Right (90°, 0°, 0°)">
                <button onClick={() => applyDirectionPreset('right')} disabled={isProcessing}>
                  <Icon name="arrow-right" size={16} />
                  Right
                </button>
              </Tooltip>
              <Tooltip content="View Up (0°, 90°, 0°)">
                <button onClick={() => applyDirectionPreset('up')} disabled={isProcessing}>
                  <Icon name="chevron-up" size={16} />
                  Up
                </button>
              </Tooltip>
              <Tooltip content="View Down (0°, -90°, 0°)">
                <button onClick={() => applyDirectionPreset('down')} disabled={isProcessing}>
                  <Icon name="chevron-down" size={16} />
                  Down
                </button>
              </Tooltip>
            </div>

            {/* Aspect Ratio */}
            <div className="section-title">Output Aspect Ratio</div>
            <div className="aspect-ratio-buttons">
              <button
                className={aspectRatio === '16:9' ? 'active' : ''}
                onClick={() => setAspectRatio('16:9')}
                disabled={isProcessing}
              >
                16:9
                <span className="resolution">1920×1080</span>
              </button>
              <button
                className={aspectRatio === '9:16' ? 'active' : ''}
                onClick={() => setAspectRatio('9:16')}
                disabled={isProcessing}
              >
                9:16
                <span className="resolution">1080×1920</span>
              </button>
              <button
                className={aspectRatio === '1:1' ? 'active' : ''}
                onClick={() => setAspectRatio('1:1')}
                disabled={isProcessing}
              >
                1:1
                <span className="resolution">1080×1080</span>
              </button>
              <button
                className={aspectRatio === '4:3' ? 'active' : ''}
                onClick={() => setAspectRatio('4:3')}
                disabled={isProcessing}
              >
                4:3
                <span className="resolution">1600×1200</span>
              </button>
            </div>
          </div>
        )}

        {/* Stabilize Mode */}
        {mode === 'stabilize' && isVideo && (
          <div className="stabilize-controls">
            <div className="section-title">Stabilization Settings</div>

            {/* Shakiness Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Shakiness Detection</span>
                <span className="control-value">{shakiness}</span>
              </div>
              <div className="slider-container">
                <span className="slider-min">Low (1)</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={shakiness}
                  onChange={(e) => setShakiness(Number(e.target.value))}
                  disabled={isProcessing}
                  className="slider"
                />
                <span className="slider-max">High (10)</span>
              </div>
              <p className="control-hint">
                Higher values detect more shakiness but may be less accurate
              </p>
            </div>

            {/* Smoothing Slider */}
            <div className="control-group">
              <div className="control-label">
                <span>Smoothing</span>
                <span className="control-value">{smoothing}</span>
              </div>
              <div className="slider-container">
                <span className="slider-min">Light (0)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={smoothing}
                  onChange={(e) => setSmoothing(Number(e.target.value))}
                  disabled={isProcessing}
                  className="slider"
                />
                <span className="slider-max">Heavy (100)</span>
              </div>
              <p className="control-hint">
                Higher values create smoother motion but may crop more
              </p>
            </div>

            <div className="info-box">
              <Icon name="info" size={16} />
              <div>
                <strong>Two-Pass Stabilization</strong>
                <p>Pass 1: Analyzes motion • Pass 2: Applies stabilization</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="panel-footer">
        <div className="footer-left">
          <button onClick={resetControls} disabled={isProcessing} className="reset-button">
            <Icon name="rotate-ccw" size={16} />
            Reset
          </button>
          {progress && (
            <div className="progress-info">
              <span className="progress-operation">{progress.operation}</span>
              <span className="progress-percent">{progress.percent}%</span>
            </div>
          )}
        </div>

        <div className="footer-right">
          <button onClick={onClose} disabled={isProcessing} className="cancel-button">
            Cancel
          </button>
          <button
            onClick={mode === 'reframe' ? handleReframe : handleStabilize}
            disabled={isProcessing}
            className="export-button primary"
          >
            {isProcessing ? (
              <>
                <Icon name="loader" size={16} className="spin" />
                Processing...
              </>
            ) : mode === 'reframe' ? (
              <>
                <Icon name="download" size={16} />
                Export {isPhoto ? 'Photo' : 'Video'}
              </>
            ) : (
              <>
                <Icon name="activity" size={16} />
                Stabilize Video
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && progress && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress.percent}%` }} />
        </div>
      )}

      <style>{`
        .panoramic-edit-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          height: 100vh;
          background: var(--background);
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .metadata-badge {
          font-size: 11px;
          padding: 2px 6px;
          background: var(--accent-color);
          color: white;
          border-radius: 4px;
          font-weight: 500;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .close-button:hover {
          background: var(--hover-background);
        }

        .mode-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color);
        }

        .mode-tabs button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          border-bottom: 2px solid transparent;
        }

        .mode-tabs button.active {
          border-bottom-color: var(--accent-color);
          color: var(--accent-color);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--error-background);
          color: var(--error-color);
          font-size: 13px;
        }

        .error-message button {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .section-title {
          font-weight: 600;
          margin: 20px 0 12px 0;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
        }

        .control-group {
          margin-bottom: 20px;
        }

        .control-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .control-value {
          font-weight: 600;
          color: var(--accent-color);
        }

        .slider-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .slider-min,
        .slider-max {
          font-size: 11px;
          color: var(--text-secondary);
          min-width: 40px;
        }

        .slider {
          flex: 1;
        }

        .control-hint {
          margin-top: 6px;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .preset-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .preset-buttons button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: var(--hover-background);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .preset-buttons button:hover:not(:disabled) {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
        }

        .aspect-ratio-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .aspect-ratio-buttons button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          background: var(--hover-background);
          border: 2px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .aspect-ratio-buttons button.active {
          border-color: var(--accent-color);
          background: var(--accent-background);
        }

        .resolution {
          font-size: 11px;
          font-weight: 400;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .info-box {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: var(--info-background);
          border: 1px solid var(--info-border);
          border-radius: 6px;
          margin-top: 16px;
        }

        .info-box strong {
          display: block;
          margin-bottom: 4px;
        }

        .info-box p {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        .panel-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-top: 1px solid var(--border-color);
          background: var(--background-secondary);
        }

        .footer-left,
        .footer-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-info {
          display: flex;
          flex-direction: column;
          font-size: 12px;
        }

        .progress-operation {
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .progress-percent {
          font-weight: 600;
          color: var(--accent-color);
        }

        .reset-button,
        .cancel-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .export-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .export-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .progress-bar-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--border-color);
        }

        .progress-bar {
          height: 100%;
          background: var(--accent-color);
          transition: width 0.3s ease;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
