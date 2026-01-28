/**
 * Hook para funcionalidades de IA
 *
 * Funcionalidades:
 * - Status de processamento
 * - Busca por similaridade
 * - Smart Culling (identificar bursts)
 * - Smart Rename
 */
import { useState, useCallback, useEffect } from 'react';

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
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isCulling, setIsCulling] = useState(false);

  const emitAiDisabledToast = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('zona21-toast', {
        detail: {
          type: 'info',
          message: 'As funcionalidades de IA estão desativadas nas preferências.'
        }
      })
    );
  }, []);

  // Sincronizar estado habilitado/desabilitado com preferências
  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        const settings = await (window as any).electronAPI?.aiGetSettings?.();
        if (mounted && typeof settings?.enabled === 'boolean') {
          setAiEnabled(settings.enabled);
        }
      } catch {
        if (mounted) {
          setAiEnabled(true);
        }
      }
    };

    loadSettings();

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AISettingsChangedDetail>).detail;
      if (typeof detail?.enabled === 'boolean') {
        setAiEnabled(detail.enabled);
      }
    };

    window.addEventListener('ai-settings-changed', handler as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('ai-settings-changed', handler as EventListener);
    };
  }, []);

  // Carregar status de IA periodicamente quando habilitado
  useEffect(() => {
    if (!aiEnabled) {
      setAiStatus(null);
      return;
    }

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
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [aiEnabled]);

  // Encontrar imagens similares
  const findSimilar = useCallback(async (assetId: string, limit = 10): Promise<SimilarityResult[]> => {
    if (!aiEnabled) {
      emitAiDisabledToast();
      return [];
    }
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
  }, [aiEnabled, emitAiDisabledToast]);

  // Smart Culling
  const smartCull = useCallback(async (options?: {
    timeThresholdMs?: number;
    similarityThreshold?: number;
    volumeUuid?: string;
    pathPrefix?: string;
  }): Promise<SmartCullGroup[]> => {
    if (!aiEnabled) {
      emitAiDisabledToast();
      return [];
    }
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
  }, [aiEnabled, emitAiDisabledToast]);

  // Smart Rename
  const getSmartName = useCallback(async (assetId: string): Promise<string | null> => {
    if (!aiEnabled) {
      emitAiDisabledToast();
      return null;
    }
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
  }, [aiEnabled, emitAiDisabledToast]);

  // Aplicar rename
  const applyRename = useCallback(async (assetId: string, newName: string): Promise<boolean> => {
    if (!aiEnabled) {
      emitAiDisabledToast();
      return false;
    }
    try {
      const result = await (window as any).electronAPI?.aiApplyRename?.(assetId, newName);
      return result?.success || false;
    } catch (error) {
      console.error('Apply rename failed:', error);
      return false;
    }
  }, [aiEnabled, emitAiDisabledToast]);

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
