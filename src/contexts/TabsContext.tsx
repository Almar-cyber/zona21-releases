/**
 * TabsContext - Gerenciamento centralizado de tabs
 *
 * Responsável por:
 * - Gerenciar tabs abertas (array ordenado)
 * - Tab ativa (activeTabId)
 * - Lifecycle (open, close, switch, update)
 * - Home tab sempre aberta (não pode fechar)
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type TabType = 'home' | 'viewer' | 'compare' | 'batch-edit' | 'instagram' | 'review';

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  icon?: string;
  closeable: boolean;
  data?: any;
  isDirty?: boolean;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string;
  closedTabs: Tab[]; // Para Cmd+Shift+T (reopen)
}

interface TabsContextValue extends TabsState {
  openTab: (tab: Omit<Tab, 'id'>) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  closeAllTabs: (exceptHome?: boolean) => void;
  reopenLastTab: () => void;
  getTab: (tabId: string) => Tab | undefined;
  getTabByType: (type: TabType) => Tab | undefined;
}

// ============================================================================
// Actions
// ============================================================================

type Action =
  | { type: 'OPEN_TAB'; payload: { tab: Tab } }
  | { type: 'CLOSE_TAB'; payload: { tabId: string } }
  | { type: 'SWITCH_TAB'; payload: { tabId: string } }
  | { type: 'UPDATE_TAB'; payload: { tabId: string; updates: Partial<Tab> } }
  | { type: 'CLOSE_ALL_TABS'; payload: { exceptHome: boolean } }
  | { type: 'REOPEN_LAST_TAB' };

// ============================================================================
// Reducer
// ============================================================================

const MAX_TABS = 10;
const MAX_CLOSED_TABS_HISTORY = 5;

function tabsReducer(state: TabsState, action: Action): TabsState {
  switch (action.type) {
    case 'OPEN_TAB': {
      const { tab } = action.payload;

      // Check if tab already exists (by type + data key)
      const existingTab = state.tabs.find(t => {
        if (t.type !== tab.type) return false;

        // For viewer tabs, check if same asset
        if (tab.type === 'viewer' && tab.data?.assetId) {
          return t.data?.assetId === tab.data.assetId;
        }

        // For other tabs, just check type (only one instance)
        return true;
      });

      if (existingTab) {
        // Tab already exists, just switch to it
        return {
          ...state,
          activeTabId: existingTab.id
        };
      }

      // Warn if too many tabs
      if (state.tabs.length >= MAX_TABS) {
        console.warn(`[TabsContext] Máximo de ${MAX_TABS} tabs atingido`);
        // TODO: Show toast to user
      }

      // Add new tab
      const newTabs = [...state.tabs, tab];

      return {
        ...state,
        tabs: newTabs,
        activeTabId: tab.id
      };
    }

    case 'CLOSE_TAB': {
      const { tabId } = action.payload;

      const tabToClose = state.tabs.find(t => t.id === tabId);

      // Can't close Home tab
      if (!tabToClose || !tabToClose.closeable) {
        return state;
      }

      // Remove tab
      const newTabs = state.tabs.filter(t => t.id !== tabId);

      // Add to closed history (for reopen)
      const newClosedTabs = [tabToClose, ...state.closedTabs].slice(0, MAX_CLOSED_TABS_HISTORY);

      // If closing active tab, switch to another
      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === tabId) {
        // Find index of closed tab
        const closedIndex = state.tabs.findIndex(t => t.id === tabId);

        // Try to activate tab to the left, otherwise right, otherwise home
        if (closedIndex > 0) {
          newActiveTabId = state.tabs[closedIndex - 1].id;
        } else if (newTabs.length > 0) {
          newActiveTabId = newTabs[0].id;
        } else {
          newActiveTabId = 'home'; // Fallback to home
        }
      }

      return {
        ...state,
        tabs: newTabs,
        activeTabId: newActiveTabId,
        closedTabs: newClosedTabs
      };
    }

    case 'SWITCH_TAB': {
      const { tabId } = action.payload;

      // Check if tab exists
      if (!state.tabs.find(t => t.id === tabId)) {
        console.warn(`[TabsContext] Tab ${tabId} não encontrada`);
        return state;
      }

      return {
        ...state,
        activeTabId: tabId
      };
    }

    case 'UPDATE_TAB': {
      const { tabId, updates } = action.payload;

      const newTabs = state.tabs.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      );

      return {
        ...state,
        tabs: newTabs
      };
    }

    case 'CLOSE_ALL_TABS': {
      const { exceptHome } = action.payload;

      if (exceptHome) {
        // Close all except Home
        const closedTabs = state.tabs.filter(t => t.closeable);
        const homeTabs = state.tabs.filter(t => !t.closeable);

        return {
          ...state,
          tabs: homeTabs,
          activeTabId: 'home',
          closedTabs: [...closedTabs, ...state.closedTabs].slice(0, MAX_CLOSED_TABS_HISTORY)
        };
      } else {
        // Close all (including Home - rarely used)
        return {
          ...state,
          tabs: [state.tabs[0]], // Keep Home
          activeTabId: 'home'
        };
      }
    }

    case 'REOPEN_LAST_TAB': {
      if (state.closedTabs.length === 0) {
        return state;
      }

      const [lastClosedTab, ...restClosedTabs] = state.closedTabs;

      return {
        ...state,
        tabs: [...state.tabs, lastClosedTab],
        activeTabId: lastClosedTab.id,
        closedTabs: restClosedTabs
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: TabsState = {
  tabs: [
    {
      id: 'home',
      type: 'home',
      title: '',
      icon: 'home',
      closeable: false,
      data: null,
      isDirty: false
    }
  ],
  activeTabId: 'home',
  closedTabs: []
};

// ============================================================================
// Context
// ============================================================================

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tabsReducer, initialState);

  // ========================================================================
  // Actions
  // ========================================================================

  const openTab = useCallback((tab: Omit<Tab, 'id'>): string => {
    const newTab: Tab = {
      ...tab,
      id: uuidv4()
    };

    dispatch({ type: 'OPEN_TAB', payload: { tab: newTab } });

    return newTab.id;
  }, []);

  const closeTab = useCallback((tabId: string) => {
    dispatch({ type: 'CLOSE_TAB', payload: { tabId } });
  }, []);

  const switchTab = useCallback((tabId: string) => {
    dispatch({ type: 'SWITCH_TAB', payload: { tabId } });
  }, []);

  const updateTab = useCallback((tabId: string, updates: Partial<Tab>) => {
    dispatch({ type: 'UPDATE_TAB', payload: { tabId, updates } });
  }, []);

  const closeAllTabs = useCallback((exceptHome: boolean = true) => {
    dispatch({ type: 'CLOSE_ALL_TABS', payload: { exceptHome } });
  }, []);

  const reopenLastTab = useCallback(() => {
    dispatch({ type: 'REOPEN_LAST_TAB' });
  }, []);

  // ========================================================================
  // Helpers
  // ========================================================================

  const getTab = useCallback((tabId: string): Tab | undefined => {
    return state.tabs.find(t => t.id === tabId);
  }, [state.tabs]);

  const getTabByType = useCallback((type: TabType): Tab | undefined => {
    return state.tabs.find(t => t.type === type);
  }, [state.tabs]);

  // ========================================================================
  // Context Value
  // ========================================================================

  const value: TabsContextValue = {
    ...state,
    openTab,
    closeTab,
    switchTab,
    updateTab,
    closeAllTabs,
    reopenLastTab,
    getTab,
    getTabByType
  };

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useTabs(): TabsContextValue {
  const context = useContext(TabsContext);

  if (context === undefined) {
    throw new Error('useTabs must be used within a TabsProvider');
  }

  return context;
}
