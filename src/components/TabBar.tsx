/**
 * TabBar Component
 *
 * Barra de navegação de tabs posicionada abaixo do Toolbar
 * Estilo VSCode/Chrome com glassmorphism
 *
 * Features:
 * - Click para trocar de tab
 * - Close button (hover only, exceto Home)
 * - Dirty indicator (dot laranja)
 * - Horizontal scroll para overflow
 * - Keyboard shortcuts (Cmd+1-9, Cmd+W, Cmd+Shift+]/[)
 */

import { useEffect, useCallback } from 'react';
import Icon from './Icon';
import { useTabs, Tab } from '../contexts/TabsContext';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';

export default function TabBar() {
  const { tabs, activeTabId, switchTab, closeTab, reopenLastTab } = useTabs();
  const { closeTabSafely } = useUnsavedChanges();

  // ========================================================================
  // Keyboard Shortcuts
  // ========================================================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // Cmd/Ctrl + 1-9: Switch to tab by index
    if (modKey && !e.shiftKey && e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      if (tabs[index]) {
        switchTab(tabs[index].id);
      }
    }

    // Cmd/Ctrl + W: Close active tab (except Home)
    if (modKey && !e.shiftKey && e.key === 'w') {
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab && activeTab.closeable) {
        e.preventDefault();
        closeTabSafely(activeTabId);
      }
    }

    // Cmd/Ctrl + Shift + ]: Next tab
    if (modKey && e.shiftKey && e.key === ']') {
      e.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      switchTab(tabs[nextIndex].id);
    }

    // Cmd/Ctrl + Shift + [: Previous tab
    if (modKey && e.shiftKey && e.key === '[') {
      e.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      switchTab(tabs[prevIndex].id);
    }

    // Cmd/Ctrl + Shift + T: Reopen last closed tab
    if (modKey && e.shiftKey && e.key === 't') {
      e.preventDefault();
      reopenLastTab();
    }
  }, [tabs, activeTabId, switchTab, closeTab, closeTabSafely, reopenLastTab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleTabClick = (tabId: string) => {
    switchTab(tabId);
  };

  const handleCloseClick = async (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    await closeTabSafely(tabId);
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="h-10 bg-[#0d0d1a]/95 backdrop-blur-xl border-b border-white/10 z-[115] relative">
      <div className="flex items-center h-full px-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {tabs.map((tab, index) => (
          <TabButton
            key={tab.id}
            tab={tab}
            index={index}
            isActive={tab.id === activeTabId}
            onClick={() => handleTabClick(tab.id)}
            onClose={(e) => handleCloseClick(e, tab.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TabButton Component
// ============================================================================

interface TabButtonProps {
  tab: Tab;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function TabButton({ tab, index, isActive, onClick, onClose }: TabButtonProps) {
  const showShortcut = index < 9; // Cmd+1-9

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        flex items-center gap-2 px-3 py-1.5 rounded-t-lg
        border-b-2 transition-all cursor-pointer shrink-0
        max-w-[200px] min-w-[120px]
        ${isActive
          ? 'bg-indigo-600/20 border-indigo-500 text-white'
          : 'bg-white/5 hover:bg-white/8 border-transparent text-gray-300 hover:text-white'
        }
      `}
      title={`${tab.title}${showShortcut ? ` (${index + 1})` : ''}`}
    >
      {/* Icon (optional) */}
      {tab.icon && (
        <Icon name={tab.icon} size={16} className="shrink-0" />
      )}

      {/* Title */}
      <span className="text-sm font-medium truncate flex-1">
        {tab.title}
      </span>

      {/* Dirty indicator */}
      {tab.isDirty && (
        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
      )}

      {/* Keyboard shortcut hint */}
      {showShortcut && !isActive && (
        <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {index + 1}
        </span>
      )}

      {/* Close button */}
      {tab.closeable && (
        <button
          type="button"
          onClick={onClose}
          className={`
            shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors
            ${isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70 group-hover:hover:opacity-100'}
          `}
          aria-label={`Fechar ${tab.title}`}
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </button>
  );
}
