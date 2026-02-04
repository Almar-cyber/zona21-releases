/**
 * MenuContext - Gerenciamento centralizado de menus contextuais
 *
 * Responsável por:
 * - Gerenciar estado de menus laterais (esquerda/direita)
 * - Collapse/expand state por tab
 * - Largura de cada menu (resizable)
 * - Persistência em localStorage
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react';
import { TabType } from './TabsContext';

// ============================================================================
// Types
// ============================================================================

export type MenuSide = 'left' | 'right';

export interface MenuPanelState {
  isCollapsed: boolean;
  width: number;
}

export interface MenuState {
  left: MenuPanelState;
  right: MenuPanelState;
}

// Default widths per tab type
const DEFAULT_WIDTHS: Record<TabType, MenuState> = {
  home: {
    left: { isCollapsed: false, width: 280 },
    right: { isCollapsed: false, width: 320 }
  },
  viewer: {
    left: { isCollapsed: false, width: 280 },
    right: { isCollapsed: false, width: 320 }
  },
  compare: {
    left: { isCollapsed: false, width: 280 },
    right: { isCollapsed: false, width: 320 }
  },
  'batch-edit': {
    left: { isCollapsed: false, width: 280 },
    right: { isCollapsed: false, width: 320 }
  },
  review: {
    left: { isCollapsed: false, width: 280 },
    right: { isCollapsed: false, width: 320 }
  }
};

interface MenusState {
  menus: Record<TabType, MenuState>;
}

interface MenuContextValue extends MenusState {
  getMenuState: (tabType: TabType) => MenuState;
  toggleMenu: (tabType: TabType, side: MenuSide) => void;
  setMenuWidth: (tabType: TabType, side: MenuSide, width: number) => void;
  collapseMenu: (tabType: TabType, side: MenuSide) => void;
  expandMenu: (tabType: TabType, side: MenuSide) => void;
}

// ============================================================================
// Actions
// ============================================================================

type Action =
  | { type: 'TOGGLE_MENU'; payload: { tabType: TabType; side: MenuSide } }
  | { type: 'SET_MENU_WIDTH'; payload: { tabType: TabType; side: MenuSide; width: number } }
  | { type: 'COLLAPSE_MENU'; payload: { tabType: TabType; side: MenuSide } }
  | { type: 'EXPAND_MENU'; payload: { tabType: TabType; side: MenuSide } }
  | { type: 'LOAD_PERSISTED_STATE'; payload: { menus: Record<TabType, MenuState> } };

// ============================================================================
// Reducer
// ============================================================================

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

function clampWidth(width: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
}

function menusReducer(state: MenusState, action: Action): MenusState {
  switch (action.type) {
    case 'TOGGLE_MENU': {
      const { tabType, side } = action.payload;
      const currentMenu = state.menus[tabType]?.[side];

      if (!currentMenu) return state;

      return {
        ...state,
        menus: {
          ...state.menus,
          [tabType]: {
            ...state.menus[tabType],
            [side]: {
              ...currentMenu,
              isCollapsed: !currentMenu.isCollapsed
            }
          }
        }
      };
    }

    case 'SET_MENU_WIDTH': {
      const { tabType, side, width } = action.payload;
      const clampedWidth = clampWidth(width);

      return {
        ...state,
        menus: {
          ...state.menus,
          [tabType]: {
            ...state.menus[tabType],
            [side]: {
              ...state.menus[tabType][side],
              width: clampedWidth
            }
          }
        }
      };
    }

    case 'COLLAPSE_MENU': {
      const { tabType, side } = action.payload;

      return {
        ...state,
        menus: {
          ...state.menus,
          [tabType]: {
            ...state.menus[tabType],
            [side]: {
              ...state.menus[tabType][side],
              isCollapsed: true
            }
          }
        }
      };
    }

    case 'EXPAND_MENU': {
      const { tabType, side } = action.payload;

      return {
        ...state,
        menus: {
          ...state.menus,
          [tabType]: {
            ...state.menus[tabType],
            [side]: {
              ...state.menus[tabType][side],
              isCollapsed: false
            }
          }
        }
      };
    }

    case 'LOAD_PERSISTED_STATE': {
      const { menus } = action.payload;

      return {
        ...state,
        menus: {
          ...state.menus,
          ...menus
        }
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// LocalStorage Persistence
// ============================================================================

const STORAGE_KEY = 'zona21:menu-state';

function loadPersistedState(): Record<TabType, MenuState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Record<TabType, MenuState>;
    }
  } catch (error) {
    console.error('[MenuContext] Error loading persisted state:', error);
  }
  return null;
}

function savePersistedState(menus: Record<TabType, MenuState>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(menus));
  } catch (error) {
    console.error('[MenuContext] Error saving persisted state:', error);
  }
}

// ============================================================================
// Initial State
// ============================================================================

const persistedState = loadPersistedState();

const initialState: MenusState = {
  menus: persistedState || DEFAULT_WIDTHS
};

// ============================================================================
// Context
// ============================================================================

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(menusReducer, initialState);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    savePersistedState(state.menus);
  }, [state.menus]);

  // ========================================================================
  // Actions
  // ========================================================================

  const getMenuState = useCallback((tabType: TabType): MenuState => {
    return state.menus[tabType] || DEFAULT_WIDTHS[tabType];
  }, [state.menus]);

  const toggleMenu = useCallback((tabType: TabType, side: MenuSide) => {
    dispatch({ type: 'TOGGLE_MENU', payload: { tabType, side } });
  }, []);

  const setMenuWidth = useCallback((tabType: TabType, side: MenuSide, width: number) => {
    dispatch({ type: 'SET_MENU_WIDTH', payload: { tabType, side, width } });
  }, []);

  const collapseMenu = useCallback((tabType: TabType, side: MenuSide) => {
    dispatch({ type: 'COLLAPSE_MENU', payload: { tabType, side } });
  }, []);

  const expandMenu = useCallback((tabType: TabType, side: MenuSide) => {
    dispatch({ type: 'EXPAND_MENU', payload: { tabType, side } });
  }, []);

  // ========================================================================
  // Context Value
  // ========================================================================

  const value: MenuContextValue = {
    ...state,
    getMenuState,
    toggleMenu,
    setMenuWidth,
    collapseMenu,
    expandMenu
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useMenu(): MenuContextValue {
  const context = useContext(MenuContext);

  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }

  return context;
}
