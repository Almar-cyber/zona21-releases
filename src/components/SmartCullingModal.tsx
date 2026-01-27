import { useState, useCallback } from 'react';
import Icon from './Icon';
import { useAI } from '../hooks/useAI';
import { Tooltip } from './Tooltip';

interface SmartCullGroup {
  id: string;
  assetIds: string[];
  suggestedBestId: string;
  scores: Array<{ assetId: string; score: number; reason: string }>;
}

interface SmartCullingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAssets: (assetIds: string[]) => void;
  onApproveAssets: (assetIds: string[]) => void;
  onRejectAssets: (assetIds: string[]) => void;
}

export default function SmartCullingModal({
  isOpen,
  onClose,
  onSelectAssets,
  onApproveAssets,
  onRejectAssets
}: SmartCullingModalProps) {
  const [groups, setGroups] = useState<SmartCullGroup[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const { smartCull, isCulling } = useAI();

  const handleAnalyze = useCallback(async () => {
    const result = await smartCull();
    setGroups(result);
    setHasAnalyzed(true);
  }, [smartCull]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedGroups(new Set(groups.map(g => g.id)));
  }, [groups]);

  const handleDeselectAll = useCallback(() => {
    setSelectedGroups(new Set());
  }, []);

  const handleApproveSuggested = useCallback(() => {
    const selectedGroupsList = groups.filter(g => selectedGroups.has(g.id));
    const suggestedBestIds = selectedGroupsList.map(g => g.suggestedBestId);
    onApproveAssets(suggestedBestIds);

    window.dispatchEvent(
      new CustomEvent('zona21-toast', {
        detail: { type: 'success', message: `${suggestedBestIds.length} fotos aprovadas` }
      })
    );
  }, [groups, selectedGroups, onApproveAssets]);

  const handleRejectOthers = useCallback(() => {
    const selectedGroupsList = groups.filter(g => selectedGroups.has(g.id));
    const othersToReject: string[] = [];

    for (const group of selectedGroupsList) {
      for (const assetId of group.assetIds) {
        if (assetId !== group.suggestedBestId) {
          othersToReject.push(assetId);
        }
      }
    }

    onRejectAssets(othersToReject);

    window.dispatchEvent(
      new CustomEvent('zona21-toast', {
        detail: { type: 'success', message: `${othersToReject.length} fotos rejeitadas` }
      })
    );
  }, [groups, selectedGroups, onRejectAssets]);

  const handleViewGroup = useCallback((group: SmartCullGroup) => {
    onSelectAssets(group.assetIds);
    onClose();
  }, [onSelectAssets, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mh-popover w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Icon name="auto_awesome" size={18} className="text-purple-400" />
            <h2 className="text-base font-semibold text-white">Smart Culling</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
            aria-label="Fechar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!hasAnalyzed ? (
            <div className="text-center py-12">
              <Icon name="auto_awesome" size={48} className="text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Encontrar sequências (burst)</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                O Smart Culling analisa suas fotos e identifica sequências tiradas em rajada,
                sugerindo a melhor foto de cada grupo baseado em qualidade e detecção de faces.
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isCulling}
                className="mh-btn mh-btn-indigo px-6 py-3 text-sm font-medium"
              >
                {isCulling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Icon name="search" size={18} className="mr-2" />
                    Analisar fotos
                  </>
                )}
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="check_circle" size={48} className="text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Nenhuma sequência encontrada</h3>
              <p className="text-sm text-gray-400">
                Não foram encontradas fotos em sequência (burst) para analisar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  {groups.length} {groups.length === 1 ? 'sequência encontrada' : 'sequências encontradas'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="mh-btn mh-btn-gray px-3 py-1 text-xs"
                  >
                    Selecionar todas
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="mh-btn mh-btn-gray px-3 py-1 text-xs"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                    selectedGroups.has(group.id)
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                  onClick={() => handleToggleGroup(group.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedGroups.has(group.id)}
                        onChange={() => handleToggleGroup(group.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-200">
                        {group.assetIds.length} fotos na sequência
                      </span>
                    </div>
                    <Tooltip content="Ver fotos no grid" position="left">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewGroup(group);
                        }}
                        className="mh-btn mh-btn-gray h-7 px-2 text-xs"
                      >
                        <Icon name="visibility" size={14} className="mr-1" />
                        Ver
                      </button>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {group.scores.slice(0, 6).map((score, idx) => (
                      <div
                        key={score.assetId}
                        className={`relative shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                          score.assetId === group.suggestedBestId
                            ? 'border-green-500 ring-2 ring-green-500/30'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={`zona21thumb://${score.assetId}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {score.assetId === group.suggestedBestId && (
                          <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Icon name="check" size={12} className="text-white" />
                          </div>
                        )}
                        {idx === 5 && group.assetIds.length > 6 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-medium">
                            +{group.assetIds.length - 6}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    Sugerida: foto {group.scores.findIndex(s => s.assetId === group.suggestedBestId) + 1}
                    {group.scores.find(s => s.assetId === group.suggestedBestId)?.reason && (
                      <span className="text-gray-600"> ({group.scores.find(s => s.assetId === group.suggestedBestId)?.reason})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasAnalyzed && groups.length > 0 && selectedGroups.size > 0 && (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedGroups.size} {selectedGroups.size === 1 ? 'sequência selecionada' : 'sequências selecionadas'}
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content="Aprovar as fotos sugeridas como melhores" position="top">
                <button
                  type="button"
                  onClick={handleApproveSuggested}
                  className="mh-btn mh-btn-gray px-4 py-2 text-sm text-green-400 hover:bg-green-600/20"
                >
                  <Icon name="check" size={16} className="mr-1" />
                  Aprovar sugeridas
                </button>
              </Tooltip>
              <Tooltip content="Rejeitar as outras fotos das sequências" position="top">
                <button
                  type="button"
                  onClick={handleRejectOthers}
                  className="mh-btn mh-btn-gray px-4 py-2 text-sm text-red-400 hover:bg-red-600/20"
                >
                  <Icon name="close" size={16} className="mr-1" />
                  Rejeitar outras
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
