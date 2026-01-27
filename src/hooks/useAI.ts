/**
 * Hook para funcionalidades de IA
 */
import { useState, useCallback, useEffect } from 'react';

interface AIStatus {
  total: number;
  processed: number;
  pending: number;
}

interface SemanticSearchResult {
  assetId: string;
  score: number;
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

interface Face {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  person_id?: string;
}

export function useAI() {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCulling, setIsCulling] = useState(false);

  // Carregar status de IA periodicamente
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await (window as any).electronAPI?.aiGetStatus?.();
        if (status) {
          setAiStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch AI status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Busca semântica por texto
  const semanticSearch = useCallback(async (query: string, limit = 20): Promise<SemanticSearchResult[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    try {
      const result = await (window as any).electronAPI?.aiSemanticSearch?.(query, limit);
      if (result?.success) {
        return result.results || [];
      }
      return [];
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Encontrar imagens similares
  const findSimilar = useCallback(async (assetId: string, limit = 10): Promise<SimilarityResult[]> => {
    try {
      const result = await (window as any).electronAPI?.aiFindSimilar?.(assetId, limit);
      if (result?.success) {
        return result.results || [];
      }
      return [];
    } catch (error) {
      console.error('Find similar failed:', error);
      return [];
    }
  }, []);

  // Smart Culling
  const smartCull = useCallback(async (options?: {
    timeThresholdMs?: number;
    similarityThreshold?: number;
    volumeUuid?: string;
    pathPrefix?: string;
  }): Promise<SmartCullGroup[]> => {
    setIsCulling(true);
    try {
      const result = await (window as any).electronAPI?.aiSmartCull?.(options);
      if (result?.success) {
        return result.groups || [];
      }
      return [];
    } catch (error) {
      console.error('Smart cull failed:', error);
      return [];
    } finally {
      setIsCulling(false);
    }
  }, []);

  // Obter faces de um asset
  const getFaces = useCallback(async (assetId: string): Promise<Face[]> => {
    try {
      const result = await (window as any).electronAPI?.aiGetFaces?.(assetId);
      if (result?.success) {
        return result.faces || [];
      }
      return [];
    } catch (error) {
      console.error('Get faces failed:', error);
      return [];
    }
  }, []);

  // Smart Rename
  const getSmartName = useCallback(async (assetId: string): Promise<string | null> => {
    try {
      const result = await (window as any).electronAPI?.aiSmartRename?.(assetId);
      if (result?.success) {
        return result.suggestedName || null;
      }
      return null;
    } catch (error) {
      console.error('Smart rename failed:', error);
      return null;
    }
  }, []);

  // Smart Rename em batch
  const getSmartNamesBatch = useCallback(async (assetIds: string[]): Promise<Array<{ assetId: string; suggestedName: string | null }>> => {
    try {
      const result = await (window as any).electronAPI?.aiSmartRenameBatch?.(assetIds);
      return result || [];
    } catch (error) {
      console.error('Smart rename batch failed:', error);
      return [];
    }
  }, []);

  // Aplicar rename
  const applyRename = useCallback(async (assetId: string, newName: string): Promise<boolean> => {
    try {
      const result = await (window as any).electronAPI?.aiApplyRename?.(assetId, newName);
      return result?.success || false;
    } catch (error) {
      console.error('Apply rename failed:', error);
      return false;
    }
  }, []);

  return {
    aiStatus,
    isSearching,
    isCulling,
    semanticSearch,
    findSimilar,
    smartCull,
    getFaces,
    getSmartName,
    getSmartNamesBatch,
    applyRename
  };
}
