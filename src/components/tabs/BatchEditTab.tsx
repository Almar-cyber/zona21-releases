/**
 * BatchEditTab - Fullscreen batch editing interface
 *
 * Features:
 * - 8-column preview grid (expanded from 6)
 * - 4-column preset layout
 * - Prominent progress tracking
 * - Operation selection: crop, resize, rotate, flip
 */

import React, { useState, useEffect } from 'react';
import { useBatchEdit } from '../../hooks/useBatchEdit';
import { useTabs } from '../../contexts/TabsContext';

export interface BatchEditTabData {
  assets: Array<{
    id: string;
    name: string;
    thumbnail?: string;
  }>;
}

interface BatchEditTabProps {
  data: BatchEditTabData;
  tabId: string;
}

type OperationType = 'crop' | 'resize' | 'rotate' | 'flip' | null;

export default function BatchEditTab({ data, tabId }: BatchEditTabProps) {
  const { updateTab, closeTab } = useTabs();
  const {
    isProcessing,
    progress,
    results,
    applyBatchCropPreset,
    applyBatchResize,
    batchRotateClockwise,
    applyBatchEdits,
    calculateTimeSaved,
    formatTimeSaved,
    clearResults,
    presets
  } = useBatchEdit();

  const [selectedOperation, setSelectedOperation] = useState<OperationType>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Update tab title
  useEffect(() => {
    updateTab(tabId, {
      title: `Editar ${data.assets.length} fotos`,
      isDirty: isProcessing || results.length > 0,
    });
  }, [data.assets.length, isProcessing, results.length, tabId, updateTab]);

  useEffect(() => {
    if (results.length > 0 && results.length === data.assets.length) {
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        setShowSuccess(true);
      }
    }
  }, [results, data.assets.length]);

  const handleClose = () => {
    if (!isProcessing) {
      closeTab(tabId);
    }
  };

  const handleApply = async () => {
    if (!selectedOperation || data.assets.length === 0) return;

    const assetIds = data.assets.map(a => a.id);

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
            flip: selectedPreset as any
          });
          break;

        default:
          return;
      }

      if (batchResults && batchResults.length > 0) {
        // Success handled by useEffect
      }
    } catch (error) {
      console.error('Batch edit failed:', error);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const timeSaved = calculateTimeSaved(data.assets.length, selectedOperation || 'crop');
  const formattedTime = formatTimeSaved(timeSaved);

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0d1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0d0d1a]/95 border-b border-white/10 backdrop-blur-xl shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Edição em Lote</h2>
          <p className="text-sm text-gray-400 mt-1">
            {data.assets.length} {data.assets.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
          </p>
        </div>
        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="mh-btn mh-btn-gray h-10 px-4 flex items-center gap-2 disabled:opacity-50"
        >
          <span>✕</span>
          <span>Fechar</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Success Message */}
          {showSuccess && !isProcessing && (
            <div className="p-6 bg-green-900/30 border border-green-700 rounded-xl">
              <div className="flex items-start gap-4">
                <svg className="w-8 h-8 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-300">Edição Concluída!</h3>
                  <p className="text-green-200 mt-2 text-lg">
                    {successCount} {successCount === 1 ? 'foto processada' : 'fotos processadas'} com sucesso
                  </p>
                  <p className="text-green-300/80 mt-3 flex items-center gap-2 text-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tempo economizado: <strong className="text-green-200">{formattedTime}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Grid - 8 columns for fullscreen */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
              Fotos Selecionadas
            </h3>
            <div className="grid grid-cols-8 gap-3 max-h-64 overflow-y-auto p-2 bg-black/20 rounded-xl">
              {data.assets.map((asset) => (
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
              {/* Operation Type - 4 columns */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                  Escolha a Operação
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <button
                    onClick={() => {
                      setSelectedOperation('crop');
                      setSelectedPreset('');
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedOperation === 'crop'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500'
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-10v10M4 7h16M4 17h16" />
                    </svg>
                    <div className="font-medium">Cortar</div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOperation('resize');
                      setSelectedPreset('');
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedOperation === 'resize'
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500'
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <div className="font-medium">Redimensionar</div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOperation('rotate');
                      setSelectedPreset('');
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedOperation === 'rotate'
                        ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/50'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-green-500'
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <div className="font-medium">Rotacionar 90°</div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOperation('flip');
                      setSelectedPreset('');
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedOperation === 'flip'
                        ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/50'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-500'
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <div className="font-medium">Espelhar</div>
                  </button>
                </div>
              </div>

              {/* Presets based on operation - 4 columns */}
              {selectedOperation && selectedOperation !== 'rotate' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
                    {selectedOperation === 'crop' && 'Proporções de Corte'}
                    {selectedOperation === 'resize' && 'Tamanhos de Saída'}
                    {selectedOperation === 'flip' && 'Direção do Espelhamento'}
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {(selectedOperation === 'crop' || selectedOperation === 'resize') && presets.map((preset: any) => (
                      <button
                        key={preset.name}
                        onClick={() => setSelectedPreset(preset.name)}
                        className={`p-5 rounded-xl border-2 transition-all text-left ${
                          selectedPreset === preset.name
                            ? (selectedOperation === 'crop' ? 'bg-blue-600 border-blue-500' : 'bg-purple-600 border-purple-500') + ' text-white shadow-lg'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-' + (selectedOperation === 'crop' ? 'blue' : 'purple') + '-500'
                        }`}
                      >
                        <div className="font-medium text-lg mb-1">{preset.label || preset.name}</div>
                        <div className="text-sm opacity-80">
                          {selectedOperation === 'crop' ? preset.ratio : `${preset.width}×${preset.height}`}
                        </div>
                      </button>
                    ))}

                    {selectedOperation === 'flip' && (
                      <>
                        <button
                          onClick={() => setSelectedPreset('horizontal')}
                          className={`p-5 rounded-xl border-2 transition-all ${
                            selectedPreset === 'horizontal'
                              ? 'bg-orange-600 border-orange-500 text-white shadow-lg'
                              : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-500'
                          }`}
                        >
                          <div className="font-medium text-lg">Horizontal</div>
                          <div className="text-sm opacity-80 mt-1">Esquerda ↔ Direita</div>
                        </button>
                        <button
                          onClick={() => setSelectedPreset('vertical')}
                          className={`p-5 rounded-xl border-2 transition-all ${
                            selectedPreset === 'vertical'
                              ? 'bg-orange-600 border-orange-500 text-white shadow-lg'
                              : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-orange-500'
                          }`}
                        >
                          <div className="font-medium text-lg">Vertical</div>
                          <div className="text-sm opacity-80 mt-1">Cima ↕ Baixo</div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && progress && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Processando...</h3>
                  <div className="text-sm text-gray-400">
                    {progress?.current || 0} / {progress?.total || 0}
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{
                      width: `${(progress?.total || 0) > 0 ? ((progress?.current || 0) / (progress?.total || 1)) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="text-center text-sm text-gray-400">
                Aguarde enquanto processamos suas fotos...
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="mh-btn mh-btn-gray h-12 px-6 text-base disabled:opacity-50"
            >
              {showSuccess ? 'Fechar' : 'Cancelar'}
            </button>
            {!showSuccess && (
              <button
                onClick={handleApply}
                disabled={!selectedOperation || (selectedOperation !== 'rotate' && !selectedPreset) || isProcessing}
                className="mh-btn mh-btn-indigo h-12 px-8 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processando...' : 'Aplicar Alterações'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
