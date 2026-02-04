/**
 * useUnsavedChanges Hook
 *
 * Gerencia avisos de alterações não salvas em tabs
 *
 * Features:
 * - Detecta tabs com isDirty=true
 * - Mostra confirmação antes de fechar tab
 * - Avisa antes de sair do app
 * - Integra com sistema de tabs
 */

import { useEffect, useCallback } from 'react';
import { useTabs } from '../contexts/TabsContext';

export interface UnsavedChangesOptions {
  onBeforeClose?: (tabId: string) => Promise<boolean>; // Return true to allow close
  confirmMessage?: string;
}

export function useUnsavedChanges(options: UnsavedChangesOptions = {}) {
  const { tabs, closeTab: originalCloseTab } = useTabs();

  const {
    confirmMessage = 'Você tem alterações não salvas. Deseja realmente sair sem salvar?',
    onBeforeClose
  } = options;

  /**
   * Check if there are any dirty tabs
   */
  const hasDirtyTabs = useCallback(() => {
    return tabs.some(tab => tab.isDirty);
  }, [tabs]);

  /**
   * Get all dirty tabs
   */
  const getDirtyTabs = useCallback(() => {
    return tabs.filter(tab => tab.isDirty);
  }, [tabs]);

  /**
   * Safe close tab - checks for unsaved changes
   */
  const closeTabSafely = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);

    if (!tab) {
      console.warn('[useUnsavedChanges] Tab not found:', tabId);
      return false;
    }

    // If tab is not dirty, close immediately
    if (!tab.isDirty) {
      originalCloseTab(tabId);
      return true;
    }

    // If custom handler provided, use it
    if (onBeforeClose) {
      const canClose = await onBeforeClose(tabId);
      if (canClose) {
        originalCloseTab(tabId);
        return true;
      }
      return false;
    }

    // Default: show browser confirm dialog
    const confirmed = window.confirm(
      `A tab "${tab.title}" tem alterações não salvas.\n\n${confirmMessage}`
    );

    if (confirmed) {
      originalCloseTab(tabId);
      return true;
    }

    return false;
  }, [tabs, originalCloseTab, confirmMessage, onBeforeClose]);

  /**
   * Warn before unload (app quit or browser refresh)
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasDirtyTabs()) {
        e.preventDefault();
        // Modern browsers require returnValue to be set
        e.returnValue = confirmMessage;
        return confirmMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasDirtyTabs, confirmMessage]);

  return {
    hasDirtyTabs,
    getDirtyTabs,
    closeTabSafely,
  };
}

/**
 * Hook específico para tabs com formulários
 */
export function useFormDirtyState(tabId: string) {
  const { updateTab } = useTabs();

  const setDirty = useCallback((isDirty: boolean) => {
    updateTab(tabId, { isDirty });
  }, [tabId, updateTab]);

  return { setDirty };
}
