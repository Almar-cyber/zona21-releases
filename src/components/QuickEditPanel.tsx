/**
 * Quick Edit Panel Component
 *
 * Provides basic non-destructive photo editing in the viewer:
 * - Crop with aspect ratio presets
 * - Rotate 90° CW/CCW
 * - Flip horizontal/vertical
 * - Resize to Instagram presets
 */

import { useState } from 'react';
import { Asset } from '../shared/types';
import { useQuickEdit, ASPECT_RATIO_PRESETS, CropOptions } from '../hooks/useQuickEdit';
import Icon from './Icon';
import { Tooltip } from './Tooltip';

interface QuickEditPanelProps {
  asset: Asset;
  isVisible: boolean;
  onClose: () => void;
  onEditComplete?: (editedFilePath: string) => void;
}

type EditMode = 'none' | 'crop' | 'rotate' | 'flip' | 'resize';

export default function QuickEditPanel({
  asset,
  isVisible,
  onClose,
  onEditComplete
}: QuickEditPanelProps) {
  const {
    isProcessing,
    rotateClockwise,
    rotateCounterClockwise,
    flipHorizontal,
    flipVertical,
    applyCropPreset,
    resizeToInstagram,
    calculateCropForAspectRatio
  } = useQuickEdit();

  const [editMode, setEditMode] = useState<EditMode>('none');
  const [selectedPreset, setSelectedPreset] = useState<string>('Instagram Square');
  const [cropPreview, setCropPreview] = useState<CropOptions | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [flipState, setFlipState] = useState({ horizontal: false, vertical: false });

  if (!isVisible || asset.mediaType !== 'photo') return null;

  const handleRotateCW = async () => {
    const result = await rotateClockwise(asset.id);
    if (result) {
      setRotationAngle((prev) => (prev + 90) % 360);
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: 'Rotacionado 90° no sentido horário' }
        })
      );
      if (onEditComplete) onEditComplete(result);
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao rotacionar imagem' }
        })
      );
    }
  };

  const handleRotateCCW = async () => {
    const result = await rotateCounterClockwise(asset.id);
    if (result) {
      setRotationAngle((prev) => (prev - 90 + 360) % 360);
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: 'Rotacionado 90° no sentido anti-horário' }
        })
      );
      if (onEditComplete) onEditComplete(result);
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao rotacionar imagem' }
        })
      );
    }
  };

  const handleFlipH = async () => {
    const result = await flipHorizontal(asset.id);
    if (result) {
      setFlipState((prev) => ({ ...prev, horizontal: !prev.horizontal }));
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: 'Espelhado horizontalmente' }
        })
      );
      if (onEditComplete) onEditComplete(result);
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao espelhar imagem' }
        })
      );
    }
  };

  const handleFlipV = async () => {
    const result = await flipVertical(asset.id);
    if (result) {
      setFlipState((prev) => ({ ...prev, vertical: !prev.vertical }));
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: 'Espelhado verticalmente' }
        })
      );
      if (onEditComplete) onEditComplete(result);
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao espelhar imagem' }
        })
      );
    }
  };

  const handleApplyCrop = async () => {
    if (!selectedPreset) return;

    const result = await applyCropPreset(asset.id, selectedPreset);
    if (result) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: `Crop aplicado: ${selectedPreset}` }
        })
      );
      if (onEditComplete) onEditComplete(result);
      setEditMode('none');
      setCropPreview(null);
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao aplicar crop' }
        })
      );
    }
  };

  const handleApplyResize = async () => {
    if (!selectedPreset) return;

    const result = await resizeToInstagram(asset.id, selectedPreset);
    if (result) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: `Redimensionado: ${selectedPreset}` }
        })
      );
      if (onEditComplete) onEditComplete(result);
      setEditMode('none');
    } else {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Falha ao redimensionar' }
        })
      );
    }
  };

  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName);

    // Calculate crop preview
    const preset = ASPECT_RATIO_PRESETS.find(p => p.name === presetName);
    if (preset && preset.ratio > 0 && asset.width && asset.height) {
      const crop = calculateCropForAspectRatio(asset.width, asset.height, preset.ratio);
      setCropPreview(crop);
    } else {
      setCropPreview(null);
    }
  };

  const handleCancel = () => {
    setEditMode('none');
    setCropPreview(null);
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 w-80 bg-[#0d0d1a]/95 backdrop-blur-xl border-r border-white/10 overflow-y-auto z-40">
      {/* Header */}
      <div className="sticky top-0 bg-[#0d0d1a]/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="edit" size={18} className="text-white/70" />
          <h3 className="text-sm font-semibold text-white">Quick Edit</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Fechar Quick Edit"
        >
          <Icon name="close" size={18} className="text-white/50 hover:text-white/70" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Rotate Section */}
        <div>
          <h4 className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="rotate_right" size={12} />
            Rotacionar
          </h4>
          <div className="flex gap-2">
            <Tooltip content="Rotacionar 90° horário" position="bottom">
              <button
                type="button"
                onClick={handleRotateCW}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="rotate_right" size={16} />
                90° CW
              </button>
            </Tooltip>
            <Tooltip content="Rotacionar 90° anti-horário" position="bottom">
              <button
                type="button"
                onClick={handleRotateCCW}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="rotate_left" size={16} />
                90° CCW
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Flip Section */}
        <div>
          <h4 className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="flip" size={12} />
            Espelhar
          </h4>
          <div className="flex gap-2">
            <Tooltip content="Espelhar horizontalmente" position="bottom">
              <button
                type="button"
                onClick={handleFlipH}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="flip" size={16} />
                Horizontal
              </button>
            </Tooltip>
            <Tooltip content="Espelhar verticalmente" position="bottom">
              <button
                type="button"
                onClick={handleFlipV}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="flip" size={16} className="rotate-90" />
                Vertical
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Crop Section */}
        <div>
          <h4 className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="crop" size={12} />
            Crop & Aspect Ratio
          </h4>

          {editMode !== 'crop' ? (
            <button
              type="button"
              onClick={() => setEditMode('crop')}
              className="w-full px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 border border-white/10 text-white rounded-lg text-sm font-medium transition-all"
            >
              Escolher Aspect Ratio
            </button>
          ) : (
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto space-y-1">
                {ASPECT_RATIO_PRESETS.filter(p => p.ratio > 0).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      selectedPreset === preset.name
                        ? 'bg-indigo-500/30 text-white border border-indigo-500/50'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-[10px] opacity-70">
                      {preset.width}×{preset.height} ({preset.ratio.toFixed(2)}:1)
                    </div>
                  </button>
                ))}
              </div>

              {cropPreview && (
                <div className="text-xs text-white/50 bg-white/5 border border-white/10 rounded p-2">
                  <div className="font-medium mb-1 text-white/70">Preview do Crop:</div>
                  <div className="text-[10px]">
                    Posição: {cropPreview.left}, {cropPreview.top}
                    <br />
                    Tamanho: {cropPreview.width}×{cropPreview.height}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={isProcessing || !selectedPreset}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500/30 to-green-500/30 hover:from-emerald-500/40 hover:to-green-500/40 border border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                >
                  {isProcessing ? 'Processando...' : 'Aplicar Crop'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resize Section */}
        <div>
          <h4 className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="photo_size_select_large" size={12} />
            Redimensionar (Instagram)
          </h4>

          {editMode !== 'resize' ? (
            <button
              type="button"
              onClick={() => setEditMode('resize')}
              className="w-full px-3 py-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 hover:from-purple-500/30 hover:to-violet-500/30 border border-white/10 text-white rounded-lg text-sm font-medium transition-all"
            >
              Escolher Preset Instagram
            </button>
          ) : (
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto space-y-1">
                {ASPECT_RATIO_PRESETS.filter(p => p.name.includes('Instagram')).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      selectedPreset === preset.name
                        ? 'bg-purple-500/30 text-white border border-purple-500/50'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-[10px] opacity-70">
                      {preset.width}×{preset.height}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyResize}
                  disabled={isProcessing || !selectedPreset}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500/30 to-violet-500/30 hover:from-purple-500/40 hover:to-violet-500/40 border border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                >
                  {isProcessing ? 'Processando...' : 'Aplicar Resize'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="text-xs text-white/30 text-center py-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Icon name="info" size={12} />
            <span>Edições não-destrutivas</span>
          </div>
          <div className="text-[10px]">
            O arquivo original é preservado.
            <br />
            Edições são salvas como novas cópias.
          </div>
        </div>
      </div>
    </div>
  );
}
