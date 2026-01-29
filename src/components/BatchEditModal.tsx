/**
 * Batch Edit Modal
 *
 * Allows applying the same Quick Edit operation to multiple photos simultaneously.
 * Features:
 * - Preview grid of selected photos
 * - Operation selection (crop, resize, rotate, flip)
 * - Real-time progress tracking
 * - Celebration message with time saved
 */

import React, { useState, useEffect } from 'react';
import { useBatchEdit } from '../hooks/useBatchEdit';
import { useCelebration } from '../hooks/useCelebration';

export interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssets: Array<{
    id: string;
    name: string;
    thumbnail?: string;
  }>;
  onComplete?: () => void;
}

type OperationType = 'crop' | 'resize' | 'rotate' | 'flip' | null;

export function BatchEditModal({
  isOpen,
  onClose,
  selectedAssets,
  onComplete
}: BatchEditModalProps) {
  const {
    isProcessing,
    progress,
    results,
    applyBatchEdits,
    applyBatchCropPreset,
    applyBatchResize,
    batchRotateClockwise,
    calculateTimeSaved,
    formatTimeSaved,
    clearResults,
    presets
  } = useBatchEdit();

  const [selectedOperation, setSelectedOperation] = useState<OperationType>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { celebrate } = useCelebration();

  useEffect(() => {
    if (results.length > 0 && results.length === selectedAssets.length) {
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        setShowSuccess(true);
        // Trigger batch completion celebration
        celebrate('batch', 'default');
      }
    }
  }, [results, selectedAssets.length, celebrate]);

  const handleClose = () => {
    if (!isProcessing) {
      clearResults();
      setSelectedOperation(null);
      setSelectedPreset('');
      setShowSuccess(false);
      onClose();
    }
  };

  const handleApply = async () => {
    if (!selectedOperation || selectedAssets.length === 0) return;

    const assetIds = selectedAssets.map(a => a.id);

    try {
      let batchResults;

      switch (selectedOperation) {
        case 'crop':
          if (!selectedPreset) return;
          batchResults = await applyBatchCropPreset(assetIds, selectedPreset);
          break;

        case 'resize':
          if (!selectedPreset) return;
          batchResults = await applyBatchResize(assetIds, selectedPreset);
          break;

        case 'rotate':
          batchResults = await batchRotateClockwise(assetIds);
          break;

        case 'flip':
          batchResults = await applyBatchEdits(assetIds, {
            flip: selectedPreset as 'horizontal' | 'vertical'
          });
          break;

        default:
          return;
      }

      if (batchResults && batchResults.length > 0) {
        onComplete?.();
      }
    } catch (error) {
      console.error('Batch edit failed:', error);
    }
  };

  if (!isOpen) return null;

  const successCount = results.filter(r => r.success).length;
  const timeSaved = calculateTimeSaved(selectedAssets.length, selectedOperation || 'crop');
  const formattedTime = formatTimeSaved(timeSaved);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Edição em Lote</h2>
            <p className="text-sm text-gray-400 mt-1">
              {selectedAssets.length} {selectedAssets.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Success Message */}
          {showSuccess && !isProcessing && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-300">Edição Concluída!</h3>
                  <p className="text-green-200 mt-1">
                    {successCount} {successCount === 1 ? 'foto processada' : 'fotos processadas'} com sucesso
                  </p>
                  <p className="text-green-300/80 text-sm mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tempo economizado: <strong>{formattedTime}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Grid */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Fotos Selecionadas
            </h3>
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
              {selectedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="aspect-square bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-colors"
                >
                  {asset.thumbnail ? (
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operation Selection */}
          {!isProcessing && !showSuccess && (
            <div className="space-y-6">
              {/* Operation Type */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                  Escolha a Operação
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => {
                      setSelectedOperation('crop');
                      setSelectedPreset('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedOperation === 'crop'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500'
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-10v10M4 7h16M4 17h16" />
                    </svg>
                    <div className="text-sm font-medium">Cortar</div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOperation('resize');
                      setSelectedPreset('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedOperation === 'resize'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500'
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <div className="text-sm font-medium">Redimensionar</div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOperation('rotate');
                      setSelectedPreset('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedOperation === 'rotate'
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <div className="text-sm font-medium">Rotacionar 90°</div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOperation('flip');
                      setSelectedPreset('');
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedOperation === 'flip'
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-500'
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <div className="text-sm font-medium">Espelhar</div>
                  </button>
                </div>
              </div>

              {/* Crop Presets */}
              {selectedOperation === 'crop' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                    Escolha o Preset de Corte
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setSelectedPreset(preset.name)}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          selectedPreset === preset.name
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500'
                        }`}
                      >
                        <div className="text-sm font-medium">{preset.label}</div>
                        <div className="text-xs opacity-75 mt-1">{preset.ratio}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resize Presets */}
              {selectedOperation === 'resize' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                    Escolha o Tamanho
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Instagram Feed', 'Instagram Story', 'Instagram Reels'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setSelectedPreset(preset)}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          selectedPreset === preset
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500'
                        }`}
                      >
                        <div className="text-sm font-medium">{preset}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {preset === 'Instagram Feed' && '1080×1080px'}
                          {preset === 'Instagram Story' && '1080×1920px'}
                          {preset === 'Instagram Reels' && '1080×1920px'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Flip Direction */}
              {selectedOperation === 'flip' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                    Escolha a Direção
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedPreset('horizontal')}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedPreset === 'horizontal'
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-500'
                      }`}
                    >
                      <div className="text-sm font-medium">Horizontal ↔️</div>
                    </button>
                    <button
                      onClick={() => setSelectedPreset('vertical')}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedPreset === 'vertical'
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-500'
                      }`}
                    >
                      <div className="text-sm font-medium">Vertical ↕️</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">
                  Processando {progress.current} de {progress.total}...
                </span>
                <span className="text-blue-400 font-semibold">{progress.percent}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              {progress.currentAssetId && (
                <p className="text-xs text-gray-500">
                  Asset: {progress.currentAssetId}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showSuccess ? 'Fechar' : 'Cancelar'}
          </button>
          {!showSuccess && (
            <button
              onClick={handleApply}
              disabled={
                isProcessing ||
                !selectedOperation ||
                (selectedOperation !== 'rotate' && !selectedPreset)
              }
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processando...' : 'Aplicar Edição'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
