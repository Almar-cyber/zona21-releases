
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

import { useEffect, useCallback, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Icon from './Icon';
import { useTabs, Tab } from '../contexts/TabsContext';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { Tooltip } from './Tooltip';
import { translateTag } from '../shared/tagTranslations';
import { IndexProgress } from '../shared/types';

interface TabBarHomeControls {
  onOpenDuplicates?: () => void;
  filters?: any;
  onFiltersChange?: (filters: any) => void;
  isIndexing?: boolean;
  indexProgress?: IndexProgress;
  indexStartTime?: number | null;
  hasSelection?: boolean;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onOpenSidebar?: () => void;
  onToggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
}

interface TabBarProps {
  homeControls?: TabBarHomeControls;
}

interface TagOption {
  tag: string;
  count: number;
}

function isLocationTag(tag: string): boolean {
  const match = tag.match(/^.+ - ([A-Z]{2})$/);
  return match !== null;
}

export default function TabBar({ homeControls }: TabBarProps) {
  const { tabs, activeTabId, switchTab, closeTab, reopenLastTab } = useTabs();
  const { closeTabSafely } = useUnsavedChanges();
  const [leftPadding, setLeftPadding] = useState('pl-2');
  const isHome = activeTabId === 'home';

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [availableLocations, setAvailableLocations] = useState<TagOption[]>([]);

  const filters = homeControls?.filters ?? {};
  const onFiltersChange = homeControls?.onFiltersChange;

  const hasActiveFilters = useMemo(() => {
    if (!isHome) return false;
    return Boolean(
      filters.mediaType ||
      filters.fileExtension ||
      filters.datePreset ||
      filters.dateFrom ||
      filters.dateTo ||
      (filters.tags && filters.tags.length > 0) ||
      (filters.locations && filters.locations.length > 0)
    );
  }, [filters, isHome]);

  useEffect(() => {
    if (!isHome) return;

    const loadTags = async () => {
      try {
        const tags = await (window as any).electronAPI?.getAllTags?.();
        if (tags) {
          const regularTags: TagOption[] = [];
          const locationTags: TagOption[] = [];

          for (const item of tags) {
            if (!item || typeof item.count !== 'number' || item.count <= 0) continue;
            if (isLocationTag(item.tag)) {
              locationTags.push(item);
            } else {
              regularTags.push(item);
            }
          }

          setAvailableTags(regularTags);
          setAvailableLocations(locationTags);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };

    loadTags();
    const interval = setInterval(loadTags, 60000);
    return () => clearInterval(interval);
  }, [isHome]);

  useEffect(() => {
    if (!isFiltersOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFiltersOpen(false);
      }
    };

    const handleClickOutside = (e: Event) => {
      const target = e.target as Element;
      if (!target.closest('.mh-popover') && !target.closest('button[aria-expanded]')) {
        setIsFiltersOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isFiltersOpen]);

  // Detect window configuration (traffic lights / fullscreen)
  useEffect(() => {
    let timeout: number | null = null;

    const fetchWindowConfig = async () => {
      try {
        const config = await window.electronAPI.getWindowConfig();

        if (config?.hasTrafficLights) {
          setLeftPadding('pl-20');
        } else {
          setLeftPadding('pl-0');
        }
      } catch (error) {
        console.error('Failed to get window config:', error);
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        setLeftPadding(isMac ? 'pl-20' : 'pl-0');
      }
    };

    const scheduleFetch = () => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        void fetchWindowConfig();
      }, 50);
    };

    void fetchWindowConfig();
    window.addEventListener('resize', scheduleFetch);
    window.addEventListener('focus', scheduleFetch);

    return () => {
      if (timeout) window.clearTimeout(timeout);
      window.removeEventListener('resize', scheduleFetch);
      window.removeEventListener('focus', scheduleFetch);
    };
  }, []);

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

  const handleCloseClick = async (e: ReactMouseEvent, tabId: string) => {
    e.stopPropagation();
    await closeTabSafely(tabId);
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div
      className="mh-topbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '48px',
        margin: 0,
        padding: 0,
        borderRadius: 0,
        zIndex: 120,
        backgroundColor: '#100A4D',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      } as any}
    >
      {/* Drag region for window (macOS/Windows) */}
      <div className="absolute inset-0 pointer-events-none" style={{ WebkitAppRegion: 'drag' } as any} />

      <div
        className={`flex items-center h-12 ${leftPadding} pr-4 gap-1 relative`}
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {isHome && homeControls && (
          <div className="flex items-center shrink-0 mr-2">
            <Tooltip content="Abrir barra lateral" position="bottom">
              <button
                type="button"
                className="mh-btn mh-btn-gray sm:hidden h-9 w-9 flex items-center justify-center"
                aria-label="Abrir barra lateral"
                onClick={() => homeControls.onOpenSidebar?.()}
              >
                <Icon name="menu" size={18} />
              </button>
            </Tooltip>
          </div>
        )}

        <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="flex items-center">
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

        {isHome && homeControls && (
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <div className="relative">
              <Tooltip content={hasActiveFilters ? 'Filtros ativos' : 'Abrir filtros'} position="bottom">
                <button
                  type="button"
                  className={`mh-btn h-9 px-3 ${hasActiveFilters ? 'mh-btn-indigo' : 'mh-btn-gray'} ${isFiltersOpen ? 'ring-2 ring-indigo-500/50' : ''}`}
                  onClick={() => setIsFiltersOpen((v) => !v)}
                  aria-expanded={isFiltersOpen}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="filter_list" size={16} />
                    <span className="text-sm">Filtros</span>
                    {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    {homeControls.isIndexing && (
                      <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </button>
              </Tooltip>

              {isFiltersOpen && (
                <div
                  className="mh-popover absolute mt-2 p-3 z-[140] right-0 w-[92vw] sm:w-auto sm:max-w-md transition-all duration-200 ease-out"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-200">Filtros</div>
                    <button
                      type="button"
                      className="mh-btn mh-btn-gray h-8 w-8"
                      onClick={() => setIsFiltersOpen(false)}
                      aria-label="Fechar filtros"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4 min-w-[320px]">
                    <div className="flex flex-wrap gap-2">
                      <Tooltip content="Encontrar arquivos duplicados" position="bottom">
                        <button
                          onClick={() => homeControls.onOpenDuplicates?.()}
                          className="mh-btn mh-btn-gray px-4 py-2 text-sm flex items-center gap-2"
                          type="button"
                        >
                          <Icon name="content_copy" size={16} />
                          <span>Duplicados</span>
                        </button>
                      </Tooltip>

                      <button
                        onClick={() => onFiltersChange?.({ ...filters, groupByDate: !filters.groupByDate })}
                        className={`mh-btn px-4 py-2 text-sm flex items-center gap-2 ${
                          filters.groupByDate ? 'mh-btn-indigo' : 'mh-btn-gray'
                        }`}
                        type="button"
                      >
                        <Icon name="calendar_month" size={16} />
                        <span>Agrupar por data</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Tipo de mídia</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={filters.mediaType || ''}
                          onChange={(e) => onFiltersChange?.({ ...filters, mediaType: e.target.value || undefined })}
                          className="px-3 py-2 text-sm mh-control"
                        >
                          <option value="">Todas as mídias</option>
                          <option value="photo">Fotos</option>
                          <option value="video">Vídeos</option>
                        </select>

                        <select
                          value={filters.fileExtension || ''}
                          onChange={(e) => onFiltersChange?.({ ...filters, fileExtension: e.target.value || undefined })}
                          className="px-3 py-2 text-sm mh-control"
                        >
                          <option value="">Todos os formatos</option>
                          <optgroup label="Fotos">
                            <option value=".jpg">.jpg</option>
                            <option value=".jpeg">.jpeg</option>
                            <option value=".png">.png</option>
                            <option value=".tiff">.tiff</option>
                            <option value=".heic">.heic</option>
                          </optgroup>
                          <optgroup label="RAW">
                            <option value=".cr2">.cr2 (Canon)</option>
                            <option value=".cr3">.cr3 (Canon)</option>
                            <option value=".arw">.arw (Sony)</option>
                            <option value=".nef">.nef (Nikon)</option>
                            <option value=".dng">.dng (Adobe)</option>
                          </optgroup>
                          <optgroup label="Vídeos">
                            <option value=".mp4">.mp4</option>
                            <option value=".mov">.mov</option>
                            <option value=".avi">.avi</option>
                            <option value=".mkv">.mkv</option>
                            <option value=".mxf">.mxf</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Período</label>
                      <select
                        value={filters.datePreset || ''}
                        onChange={(e) => onFiltersChange?.({ ...filters, datePreset: e.target.value || undefined })}
                        className="w-full px-3 py-2 text-sm mh-control"
                      >
                        <option value="">Todo o período</option>
                        <option value="today">Hoje</option>
                        <option value="week">Esta semana</option>
                        <option value="month">Este mês</option>
                        <option value="year">Este ano</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={filters.dateFrom || ''}
                          onChange={(e) => {
                            const v = e.target.value || undefined;
                            onFiltersChange?.({ ...filters, datePreset: undefined, dateFrom: v });
                          }}
                          className="flex-1 px-3 py-2 text-sm mh-control"
                        />
                        <span className="text-gray-500 text-sm">até</span>
                        <input
                          type="date"
                          value={filters.dateTo || ''}
                          onChange={(e) => {
                            const v = e.target.value || undefined;
                            onFiltersChange?.({ ...filters, datePreset: undefined, dateTo: v });
                          }}
                          className="flex-1 px-3 py-2 text-sm mh-control"
                        />
                      </div>
                    </div>

                    {availableTags.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-2">
                          <Icon name="label" size={14} />
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          {availableTags.slice(0, 20).map(({ tag, count }) => {
                            const isSelected = filters.tags?.includes(tag);
                            const translatedTag = translateTag(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const currentTags = filters.tags || [];
                                  const newTags = isSelected
                                    ? currentTags.filter((t: string) => t !== tag)
                                    : [...currentTags, tag];
                                  onFiltersChange?.({
                                    ...filters,
                                    tags: newTags.length > 0 ? newTags : undefined
                                  });
                                }}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                                  isSelected
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                                title={tag !== translatedTag ? tag : undefined}
                              >
                                <span>{translatedTag}</span>
                                <span className="opacity-60">({count})</span>
                              </button>
                            );
                          })}
                        </div>
                        {filters.tags?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onFiltersChange?.({ ...filters, tags: undefined })}
                            className="text-xs text-purple-400 hover:text-purple-300"
                          >
                            Limpar tags
                          </button>
                        )}
                      </div>
                    )}

                    {availableLocations.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-2">
                          <Icon name="location_on" size={14} />
                          Localizações
                        </label>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          {availableLocations.slice(0, 20).map(({ tag, count }) => {
                            const isSelected = filters.tags?.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const currentTags = filters.tags || [];
                                  const newTags = isSelected
                                    ? currentTags.filter((t: string) => t !== tag)
                                    : [...currentTags, tag];
                                  onFiltersChange?.({
                                    ...filters,
                                    tags: newTags.length > 0 ? newTags : undefined
                                  });
                                }}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                <span>{tag}</span>
                                <span className="opacity-60">({count})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
  onClose: (e: ReactMouseEvent) => void;
}

function TabButton({ tab, index, isActive, onClick, onClose }: TabButtonProps) {
  const showShortcut = index >= 0 && index < 9; // Cmd+1-9
  const accessibleTitle = tab.title || 'Início';
  const shortcutNumber = index + 1;
  const title = showShortcut && shortcutNumber > 0 ? `${accessibleTitle} (${shortcutNumber})` : accessibleTitle;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        group relative overflow-hidden
        transition-all duration-150 cursor-pointer shrink-0
        ${tab.title
          ? 'flex items-center gap-2 px-4 h-12 max-w-[240px] rounded-t-lg'
          : 'flex items-center justify-center w-12 h-12 rounded-t-lg'
        }
        ${isActive
          ? 'bg-[#121124] text-white'
          : 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white'
        }
      `}
      title={title}
      aria-label={accessibleTitle}
    >
      {/* Content wrapper for proper z-index */}
      <div className={`relative z-10 flex items-center gap-2 ${!tab.title ? 'w-full justify-center' : ''}`}>
        {/* Icon (optional) */}
        {tab.icon && (
          <Icon name={tab.icon} size={18} className={`shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
        )}

        {/* Title */}
        {tab.title && (
          <span className={`text-sm truncate flex-1 ${isActive ? 'font-medium' : 'font-normal'}`}>
            {tab.title}
          </span>
        )}

        {/* Dirty indicator */}
        {tab.isDirty && (
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
        )}

        {/* Close button */}
        {tab.closeable && (
          <button
            type="button"
            onClick={onClose}
            className={`
              shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors
              ${isActive ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 group-hover:hover:opacity-100'}
            `}
            aria-label={`Fechar ${tab.title}`}
          >
            <Icon name="close" size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
