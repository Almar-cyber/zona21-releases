/**
 * Quick Edit Panel Component
 *
 * Sidebar para edição de fotos seguindo o Design System Zona21:
 * - Usa tokens de cor e espaçamento do design system
 * - Glassmorphism com backdrop-blur
 * - Botões com estados hover/active consistentes
 */

import { useState, useEffect } from 'react';
import { Asset } from '../shared/types';
import { useQuickEdit, ASPECT_RATIO_PRESETS, CropOptions } from '../hooks/useQuickEdit';
import Icon from './Icon';
import { Tooltip } from './Tooltip';

type EditMode = 'none' | 'crop' | 'rotate' | 'flip' | 'resize';

interface QuickEditPanelProps {
  asset: Asset;
  isVisible: boolean;
  onClose: () => void;
  onEditComplete?: (editedFilePath: string) => void;
  initialMode?: EditMode;
  scale?: number;
  viewMode?: 'fit' | '100';
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSetFit?: () => void;
  onSet100?: () => void;
}

export default function QuickEditPanel({
  asset,
  isVisible,
  onClose,
  onEditComplete,
  initialMode = 'none',
  scale,
  viewMode,
  onZoomIn,
  onZoomOut,
  onSetFit,
  onSet100,
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

  const [editMode, setEditMode] = useState<EditMode>(initialMode);
  const [selectedPreset, setSelectedPreset] = useState<string>('Instagram Square');
  const [cropPreview, setCropPreview] = useState<CropOptions | null>(null);

  useEffect(() => {
    if (isVisible && initialMode !== 'none') {
      setEditMode(initialMode);
    } else if (!isVisible) {
      setEditMode('none');
    }
  }, [isVisible, initialMode]);

  if (!isVisible || asset.mediaType !== 'photo') return null;

  const showToast = (type: 'success' | 'error', message: string) => {
    window.dispatchEvent(new CustomEvent('zona21-toast', { detail: { type, message } }));
  };

  const handleRotateCW = async () => {
    const result = await rotateClockwise(asset.id);
    if (result) {
      showToast('success', 'Rotacionado 90° horário');
      onEditComplete?.(result);
    } else {
      showToast('error', 'Falha ao rotacionar');
    }
  };

  const handleRotateCCW = async () => {
    const result = await rotateCounterClockwise(asset.id);
    if (result) {
      showToast('success', 'Rotacionado 90° anti-horário');
      onEditComplete?.(result);
    } else {
      showToast('error', 'Falha ao rotacionar');
    }
  };

  const handleFlipH = async () => {
    const result = await flipHorizontal(asset.id);
    if (result) {
      showToast('success', 'Espelhado horizontalmente');
      onEditComplete?.(result);
    } else {
      showToast('error', 'Falha ao espelhar');
    }
  };

  const handleFlipV = async () => {
    const result = await flipVertical(asset.id);
    if (result) {
      showToast('success', 'Espelhado verticalmente');
      onEditComplete?.(result);
    } else {
      showToast('error', 'Falha ao espelhar');
    }
  };

  const handleApplyCrop = async () => {
    if (!selectedPreset) return;
    const result = await applyCropPreset(asset.id, selectedPreset);
    if (result) {
      showToast('success', `Crop aplicado: ${selectedPreset}`);
      onEditComplete?.(result);
      setEditMode('none');
      setCropPreview(null);
    } else {
      showToast('error', 'Falha ao aplicar crop');
    }
  };

  const handleApplyResize = async () => {
    if (!selectedPreset) return;
    const result = await resizeToInstagram(asset.id, selectedPreset);
    if (result) {
      showToast('success', `Redimensionado: ${selectedPreset}`);
      onEditComplete?.(result);
      setEditMode('none');
    } else {
      showToast('error', 'Falha ao redimensionar');
    }
  };

  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = ASPECT_RATIO_PRESETS.find(p => p.name === presetName);
    if (preset && preset.ratio > 0 && asset.width && asset.height) {
      setCropPreview(calculateCropForAspectRatio(asset.width, asset.height, preset.ratio));
    } else {
      setCropPreview(null);
    }
  };

  // Icon button - usando tokens do design system
  const IconBtn = ({
    icon,
    label,
    onClick,
    isActive = false,
    disabled = false,
    rotateIcon = false,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    rotateIcon?: boolean;
  }) => (
    <Tooltip content={label} position="bottom">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
          p-2 rounded-md transition-all
          ${isActive
            ? 'bg-[var(--color-overlay-strong)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-light)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ transition: 'var(--transition-fast)' }}
      >
        <Icon name={icon} size={18} className={rotateIcon ? 'rotate-90' : ''} />
      </button>
    </Tooltip>
  );

  // Section header
  const SectionHeader = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
        {children}
      </span>
      {action}
    </div>
  );

  // Divider
  const Divider = () => <div className="h-px bg-[var(--color-border)] my-4" />;

  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-72 overflow-y-auto z-40 backdrop-blur-xl"
      style={{
        background: 'var(--color-sidebar-bg)',
        borderRight: '1px solid var(--color-border)'
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between backdrop-blur-xl"
        style={{
          background: 'var(--color-sidebar-bg)',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <span className="text-sm font-medium text-[var(--color-text-primary)]">Quick Edit</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-light)] transition-colors"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="p-4">
        {/* Zoom Section */}
        {scale !== undefined && (
          <>
            <SectionHeader>Zoom</SectionHeader>
            <div className="flex items-center gap-1 mb-2">
              <IconBtn icon="remove" label="Diminuir" onClick={() => onZoomOut?.()} />
              <div className="flex-1 text-center">
                <span className="text-sm text-[var(--color-text-primary)] tabular-nums font-medium">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <IconBtn icon="add" label="Aumentar" onClick={() => onZoomIn?.()} />
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onSetFit}
                className={`
                  flex-1 py-1.5 rounded-md text-xs font-medium transition-all
                  ${viewMode === 'fit'
                    ? 'bg-[var(--color-overlay-strong)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-light)]'
                  }
                `}
              >
                Ajustar
              </button>
              <button
                type="button"
                onClick={onSet100}
                className={`
                  flex-1 py-1.5 rounded-md text-xs font-medium transition-all
                  ${viewMode === '100'
                    ? 'bg-[var(--color-overlay-strong)] text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-light)]'
                  }
                `}
              >
                100%
              </button>
            </div>
            <Divider />
          </>
        )}

        {/* Transform Section */}
        <SectionHeader>Transformar</SectionHeader>

        {/* Rotation Row */}
        <div className="mb-3">
          <div className="text-[10px] text-[var(--color-text-muted)] mb-1.5">Rotação</div>
          <div className="flex gap-1">
            <IconBtn icon="rotate_left" label="90° anti-horário" onClick={handleRotateCCW} disabled={isProcessing} />
            <IconBtn icon="rotate_right" label="90° horário" onClick={handleRotateCW} disabled={isProcessing} />
          </div>
        </div>

        {/* Flip Row */}
        <div className="mb-1">
          <div className="text-[10px] text-[var(--color-text-muted)] mb-1.5">Espelhar</div>
          <div className="flex gap-1">
            <IconBtn icon="flip" label="Horizontal" onClick={handleFlipH} disabled={isProcessing} />
            <IconBtn icon="flip" label="Vertical" onClick={handleFlipV} disabled={isProcessing} rotateIcon />
          </div>
        </div>

        <Divider />

        {/* Dimensions Section */}
        <SectionHeader>Dimensões</SectionHeader>
        <div className="flex gap-2 mb-1">
          <div className="flex-1">
            <div className="text-[10px] text-[var(--color-text-muted)] mb-1">Largura</div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
              style={{ background: 'var(--color-overlay-light)' }}
            >
              <span className="text-[10px] text-[var(--color-text-muted)]">L</span>
              <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">{asset.width || '—'}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-[var(--color-text-muted)] mb-1">Altura</div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
              style={{ background: 'var(--color-overlay-light)' }}
            >
              <span className="text-[10px] text-[var(--color-text-muted)]">A</span>
              <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">{asset.height || '—'}</span>
            </div>
          </div>
        </div>

        <Divider />

        {/* Crop Section */}
        <SectionHeader
          action={editMode === 'crop' ? (
            <button
              type="button"
              onClick={() => { setEditMode('none'); setCropPreview(null); }}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              Cancelar
            </button>
          ) : undefined}
        >
          Aspect Ratio
        </SectionHeader>

        {editMode !== 'crop' ? (
          <button
            type="button"
            onClick={() => setEditMode('crop')}
            className="w-full py-2 rounded-md text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
            style={{ background: 'var(--color-overlay-light)' }}
          >
            Escolher proporção
          </button>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {ASPECT_RATIO_PRESETS.filter(p => p.ratio > 0).slice(0, 6).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset.name)}
                  className={`
                    text-left px-2.5 py-2 rounded-md transition-all text-[11px]
                    ${selectedPreset === preset.name
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }
                  `}
                  style={{
                    background: selectedPreset === preset.name
                      ? 'var(--color-primary)'
                      : 'var(--color-overlay-light)'
                  }}
                >
                  <div className="font-medium truncate">{preset.name.replace('Instagram ', '')}</div>
                  <div className="text-[9px] opacity-70">{preset.width}×{preset.height}</div>
                </button>
              ))}
            </div>

            {cropPreview && (
              <div className="text-[10px] text-[var(--color-text-muted)] px-1">
                Resultado: {cropPreview.width}×{cropPreview.height}
              </div>
            )}

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing || !selectedPreset}
              className="mh-btn mh-btn-indigo w-full py-2 text-xs font-medium disabled:opacity-50"
            >
              {isProcessing ? 'Aplicando...' : 'Aplicar Crop'}
            </button>
          </div>
        )}

        <Divider />

        {/* Instagram Resize Section */}
        <SectionHeader
          action={editMode === 'resize' ? (
            <button
              type="button"
              onClick={() => setEditMode('none')}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              Cancelar
            </button>
          ) : undefined}
        >
          Instagram
        </SectionHeader>

        {editMode !== 'resize' ? (
          <button
            type="button"
            onClick={() => setEditMode('resize')}
            className="w-full py-2 rounded-md text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
            style={{ background: 'var(--color-overlay-light)' }}
          >
            Redimensionar para Instagram
          </button>
        ) : (
          <div className="space-y-2">
            <div className="space-y-1">
              {ASPECT_RATIO_PRESETS.filter(p => p.name.includes('Instagram')).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePresetSelect(preset.name)}
                  className={`
                    w-full text-left px-3 py-2 rounded-md transition-all text-[11px]
                    ${selectedPreset === preset.name
                      ? 'text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }
                  `}
                  style={{
                    background: selectedPreset === preset.name
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)'
                      : 'var(--color-overlay-light)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{preset.name.replace('Instagram ', '')}</span>
                    <span className="text-[10px] opacity-60">{preset.width}×{preset.height}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleApplyResize}
              disabled={isProcessing || !selectedPreset}
              className="w-full py-2 rounded-md text-xs text-white font-medium disabled:opacity-50 transition-all"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
              }}
            >
              {isProcessing ? 'Redimensionando...' : 'Aplicar'}
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
            <Icon name="info" size={12} />
            <span>Edições salvas como cópias</span>
          </div>
        </div>
      </div>
    </div>
  );
}
