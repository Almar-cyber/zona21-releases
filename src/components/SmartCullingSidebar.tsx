import { useEffect, useState } from 'react';
import { Asset } from '../shared/types';
import { useAI } from '../hooks/useAI';
import Icon from './Icon';
import { Tooltip } from './Tooltip';
import { translateTag } from '../shared/tagTranslations';

interface SmartCullingSidebarProps {
  asset: Asset;
  isVisible: boolean;
  onToggle: () => void;
  onApprove?: (assetId: string) => void;
  onReject?: (assetId: string) => void;
}

interface SimilarAsset {
  assetId: string;
  score: number;
}

export default function SmartCullingSidebar({
  asset,
  isVisible,
  onToggle,
  onApprove,
  onReject
}: SmartCullingSidebarProps) {
  const { findSimilar } = useAI();
  const [similarAssets, setSimilarAssets] = useState<SimilarAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load similar assets when sidebar is opened or asset changes
  useEffect(() => {
    if (!isVisible || asset.mediaType !== 'photo') return;

    const loadSimilarAssets = async () => {
      setIsLoading(true);
      try {
        const results = await findSimilar(asset.id, 6);
        if (results && Array.isArray(results)) {
          setSimilarAssets(results);
        }
      } catch (error) {
        console.error('Failed to load similar assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSimilarAssets();
  }, [asset.id, asset.mediaType, isVisible, findSimilar]);

  // Calculate quality indicators based on available data
  const qualityIndicators = () => {
    const indicators = [];

    // Tags as quality proxy
    if (asset.tags && asset.tags.length > 0) {
      indicators.push({
        icon: 'label',
        label: 'Tags IA',
        value: `${asset.tags.length} detectadas`,
        status: 'good' as const,
        color: 'text-purple-400'
      });
    }

    // Check for common quality-related tags
    const qualityTags = ['desfocado', 'blur', 'escuro', 'dark', 'claro', 'bright'];
    const hasQualityIssue = asset.tags?.some(tag =>
      qualityTags.some(qt => tag.toLowerCase().includes(qt))
    );

    if (hasQualityIssue) {
      indicators.push({
        icon: 'warning',
        label: 'Possível problema',
        value: 'Verificar qualidade',
        status: 'warning' as const,
        color: 'text-yellow-400'
      });
    }

    // File size as quality indicator
    if (asset.fileSize) {
      const sizeMB = asset.fileSize / (1024 * 1024);
      const sizeStatus: 'good' | 'medium' | 'low' = sizeMB > 5 ? 'good' : sizeMB > 2 ? 'medium' : 'low';
      indicators.push({
        icon: 'image',
        label: 'Qualidade',
        value: `${sizeMB.toFixed(1)} MB`,
        status: sizeStatus,
        color: sizeStatus === 'good' ? 'text-green-400' :
               sizeStatus === 'medium' ? 'text-yellow-400' : 'text-orange-400'
      });
    }

    // Resolution as quality indicator
    if (asset.width && asset.height) {
      const megapixels = (asset.width * asset.height) / 1000000;
      const resStatus: 'good' | 'medium' = megapixels > 12 ? 'good' : 'medium';
      indicators.push({
        icon: 'aspect_ratio',
        label: 'Resolução',
        value: `${megapixels.toFixed(1)} MP`,
        status: resStatus,
        color: megapixels > 12 ? 'text-green-400' : 'text-yellow-400'
      });
    }

    return indicators;
  };

  const indicators = qualityIndicators();

  // Format similarity score as percentage
  const formatScore = (score: number) => {
    return `${(score * 100).toFixed(0)}%`;
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score > 0.9) return 'text-red-400'; // Very similar (possible duplicate)
    if (score > 0.75) return 'text-yellow-400'; // Similar
    return 'text-green-400'; // Different enough
  };

  if (!isVisible) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700 overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="auto_awesome" size={18} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-gray-200">Smart Culling</h3>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label="Fechar sidebar"
        >
          <Icon name="close" size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Quality Indicators */}
        {indicators.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Indicadores de Qualidade
            </h4>
            <div className="space-y-2">
              {indicators.map((indicator, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 bg-black/20 rounded-lg"
                >
                  <Icon name={indicator.icon} size={16} className={indicator.color} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400">{indicator.label}</div>
                    <div className={`text-sm font-medium ${indicator.color}`}>
                      {indicator.value}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {indicator.status === 'good' && (
                      <Icon name="check_circle" size={16} className="text-green-400" />
                    )}
                    {indicator.status === 'warning' && (
                      <Icon name="warning" size={16} className="text-yellow-400" />
                    )}
                    {indicator.status === 'low' && (
                      <Icon name="error" size={16} className="text-orange-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags Section */}
        {asset.tags && asset.tags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
              <Icon name="label" size={12} />
              Tags Detectadas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {asset.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-1 text-xs text-purple-300"
                >
                  {translateTag(tag)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Similar Assets Section */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Icon name="collections" size={12} />
            Fotos Similares
            {isLoading && <span className="text-gray-500 text-xs">(carregando...)</span>}
          </h4>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin">
                <Icon name="refresh" size={24} className="text-purple-400" />
              </div>
            </div>
          )}

          {!isLoading && similarAssets.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-4">
              Nenhuma foto similar encontrada
            </div>
          )}

          {!isLoading && similarAssets.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {similarAssets.map((similar) => (
                <Tooltip
                  key={similar.assetId}
                  content={`Similaridade: ${formatScore(similar.score)}`}
                  position="top"
                >
                  <div className="relative group cursor-pointer">
                    <div className="aspect-square rounded-lg overflow-hidden bg-black/40">
                      <img
                        src={`zona21thumb://${similar.assetId}`}
                        alt="Similar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-xs font-medium">
                      <span className={getScoreColor(similar.score)}>
                        {formatScore(similar.score)}
                      </span>
                    </div>
                    {similar.score > 0.9 && (
                      <div className="absolute top-1 right-1">
                        <Icon name="warning" size={14} className="text-red-400" />
                      </div>
                    )}
                  </div>
                </Tooltip>
              ))}
            </div>
          )}

          {similarAssets.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              {similarAssets.filter(s => s.score > 0.9).length > 0 && (
                <div className="flex items-center gap-1 text-red-400 mb-1">
                  <Icon name="info" size={12} />
                  <span>Fotos muito similares podem ser duplicatas</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Icon name="info" size={12} />
                <span>Score de similaridade: 0% (diferente) a 100% (idêntico)</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(onApprove || onReject) && (
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Ações Rápidas
            </h4>
            <div className="flex gap-2">
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(asset.id)}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="check" size={16} />
                  Aprovar
                </button>
              )}
              {onReject && (
                <button
                  type="button"
                  onClick={() => onReject(asset.id)}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="close" size={16} />
                  Rejeitar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Future Features Placeholder */}
        <div className="text-xs text-gray-600 text-center py-4 border-t border-gray-800">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Icon name="construction" size={12} />
            <span>Em breve</span>
          </div>
          <div className="text-[10px]">
            • Detecção de foco
            <br />
            • Análise de exposição
            <br />
            • Detecção facial e olhos fechados
            <br />
            • Score de composição
          </div>
        </div>
      </div>
    </div>
  );
}
