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
    <div className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700 overflow-y-auto z-40">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="edit" size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">Quick Edit</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label="Fechar Quick Edit"
        >
          <Icon name="close" size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Rotate Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="rotate_right" size={12} />
            Rotacionar
          </h4>
          <div className="flex gap-2">
            <Tooltip content="Rotacionar 90° horário" position="bottom">
              <button
                type="button"
                onClick={handleRotateCW}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="rotate_left" size={16} />
                90° CCW
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Flip Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="flip" size={12} />
            Espelhar
          </h4>
          <div className="flex gap-2">
            <Tooltip content="Espelhar horizontalmente" position="bottom">
              <button
                type="button"
                onClick={handleFlipH}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="flip" size={16} className="rotate-90" />
                Vertical
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Crop Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="crop" size={12} />
            Crop & Aspect Ratio
          </h4>

          {editMode !== 'crop' ? (
            <button
              type="button"
              onClick={() => setEditMode('crop')}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedPreset === preset.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                <div className="text-xs text-gray-400 bg-black/20 rounded p-2">
                  <div className="font-medium mb-1">Preview do Crop:</div>
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
                  className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={isProcessing || !selectedPreset}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isProcessing ? 'Processando...' : 'Aplicar Crop'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resize Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="photo_size_select_large" size={12} />
            Redimensionar (Instagram)
          </h4>

          {editMode !== 'resize' ? (
            <button
              type="button"
              onClick={() => setEditMode('resize')}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedPreset === preset.name
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                  className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyResize}
                  disabled={isProcessing || !selectedPreset}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isProcessing ? 'Processando...' : 'Aplicar Resize'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="text-xs text-gray-600 text-center py-4 border-t border-gray-800">
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
