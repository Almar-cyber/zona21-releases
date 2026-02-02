/**
 * Hook para funcionalidades de IA
 *
 * Funcionalidades:
 * - Status de processamento
 * - Busca por similaridade
 * - Smart Culling (identificar bursts)
 * - Smart Rename
 */
import { useCallback } from 'react';

interface AIStatus {
  total: number;
  processed: number;
  pending: number;
  withEmbeddings?: number;
}

interface SimilarityResult {
  assetId: string;
  score: number;
}

interface SmartCullGroup {
  id: string;
  assetIds: string[];
  suggestedBestId: string;
  scores: Array<{ assetId: string; score: number; reason: string }>;
}

interface AISettingsChangedDetail {
  enabled: boolean;
}

export function useAI() {
  const aiEnabled = false;
  const aiStatus: AIStatus | null = null;
  const isCulling = false;

  // Encontrar imagens similares
  const findSimilar = useCallback(async (assetId: string, limit = 10): Promise<SimilarityResult[]> => {
    void assetId;
    void limit;
    return [];
  }, []);

  // Smart Culling
  const smartCull = useCallback(async (options?: {
    timeThresholdMs?: number;
    similarityThreshold?: number;
    volumeUuid?: string;
    pathPrefix?: string;
  }): Promise<SmartCullGroup[]> => {
    void options;
    return [];
  }, []);

  // Smart Rename
  const getSmartName = useCallback(async (assetId: string): Promise<string | null> => {
    void assetId;
    return null;
  }, []);

  // Aplicar rename
  const applyRename = useCallback(async (assetId: string, newName: string): Promise<boolean> => {
    void assetId;
    void newName;
    return false;
  }, []);

  return {
    aiEnabled,
    aiStatus,
    isCulling,
    findSimilar,
    smartCull,
    getSmartName,
    applyRename
  };
}
