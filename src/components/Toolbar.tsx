import { useState, useEffect, useCallback } from 'react';
import { IndexProgress } from '../shared/types';
import Icon from './Icon.tsx';
import CullingStats from './CullingStats.tsx';
import { Tooltip } from './Tooltip';
import { useAI } from '../hooks/useAI';

interface ToolbarProps {
  onOpenDuplicates: () => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  isIndexing: boolean;
  indexProgress: IndexProgress;
  indexStartTime?: number | null;
  hasSelection?: boolean;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onOpenSidebar?: () => void;
  onToggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
  cullingStats?: {
    totalCount: number;
    flaggedCount: number;
  };
  onSemanticSearch?: (assetIds: string[]) => void;
  onOpenSmartCulling?: () => void;
}

export default function Toolbar({
  onOpenDuplicates,
  filters,
  onFiltersChange,
  isIndexing,
  indexProgress,
  indexStartTime,
  hasSelection,
  onSelectAll,
  onClearSelection,
  onOpenSidebar,
  onToggleSidebarCollapse,
  isSidebarCollapsed,
  cullingStats,
  onSemanticSearch,
  onOpenSmartCulling
}: ToolbarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAISearch, setIsAISearch] = useState(false);
  const { semanticSearch, isSearching } = useAI();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    if (isAISearch && onSemanticSearch) {
      const results = await semanticSearch(searchQuery);
      const assetIds = results.map(r => r.assetId);
      onSemanticSearch(assetIds);
    }
  }, [searchQuery, isAISearch, semanticSearch, onSemanticSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Fechar menu com ESC e clique fora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFiltersOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.mh-popover') && !target.closest('button[aria-expanded]')) {
        setIsFiltersOpen(false);
      }
    };

    if (isFiltersOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isFiltersOpen]);

  const controlBase =
    'mh-control';
  const btnBase =
    'mh-btn px-3 py-2';
  const btnSecondary = `${btnBase} mh-btn-gray`;

  return (
    <div className="mh-topbar relative isolate z-[120] h-16 flex items-center px-2 sm:px-4 gap-2 sm:gap-4 min-w-0">
      {/* Esquerda - Botões de navegação */}
      <div className="flex items-center gap-2 shrink-0">
        <Tooltip content="Abrir barra lateral" position="bottom">
          <button
            type="button"
            className="mh-btn mh-btn-gray sm:hidden h-10 w-10 flex items-center justify-center"
            aria-label="Abrir barra lateral"
            onClick={() => onOpenSidebar?.()}
          >
            <Icon name="menu" size={20} />
          </button>
        </Tooltip>

        <Tooltip content={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'} position="bottom">
          <button
            type="button"
            className="mh-btn mh-btn-gray hidden sm:flex h-10 w-10 items-center justify-center"
            aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            onClick={() => onToggleSidebarCollapse?.()}
          >
            <Icon name={isSidebarCollapsed ? 'chevron_right' : 'chevron_left'} size={20} />
          </button>
        </Tooltip>

        {cullingStats && cullingStats.totalCount > 0 && !isIndexing && (
          <div className="hidden md:block">
            <CullingStats
              totalCount={cullingStats.totalCount}
              flaggedCount={cullingStats.flaggedCount}
            />
          </div>
        )}
      </div>

      {/* Centro - Busca com IA (usando flex para respeitar espaço dos botões) */}
      <div className="flex-1 flex justify-center min-w-0 hidden md:flex">
        <div className="relative w-full max-w-md">
          <div className="flex items-center w-full rounded-lg overflow-hidden border border-white/10 bg-black/20">
            {/* Toggle AI Search */}
            <Tooltip content={isAISearch ? 'Busca por IA (semântica)' : 'Busca normal'} position="bottom">
              <button
                type="button"
                onClick={() => setIsAISearch(!isAISearch)}
                className={`h-10 w-10 flex items-center justify-center shrink-0 transition-colors ${
                  isAISearch
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon name={isAISearch ? 'auto_awesome' : 'search'} size={18} />
              </button>
            </Tooltip>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAISearch ? 'Buscar com IA: "praia ao pôr do sol"...' : 'Buscar...'}
              className="flex-1 h-10 px-3 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
            />

            {/* Search Button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="h-10 px-3 shrink-0 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="arrow_forward" size={18} />
              )}
            </button>
          </div>

        </div>
      </div>


      {/* Direita - Filtros (sempre fixo) */}
      <div className="flex items-center gap-2 shrink-0">
        {hasSelection && (
          <>
            <Tooltip content="Selecionar tudo (Ctrl/Cmd+A)" position="bottom">
              <button
                type="button"
                className="mh-btn mh-btn-gray h-10 px-3"
                onClick={() => onSelectAll?.()}
              >
                <div className="flex items-center gap-2">
                  <Icon name="select_all" size={18} />
                  <span>Selecionar tudo</span>
                </div>
              </button>
            </Tooltip>

            <Tooltip content="Limpar seleção (Esc)" position="bottom">
              <button
                type="button"
                className="mh-btn mh-btn-gray h-10 px-3"
                onClick={() => onClearSelection?.()}
              >
                <div className="flex items-center gap-2">
                  <Icon name="close" size={18} />
                  <span>Limpar</span>
                </div>
              </button>
            </Tooltip>
          </>
        )}

        <div className="relative">
          <Tooltip content="Abrir filtros" position="bottom">
            <button
              type="button"
              className="mh-btn mh-btn-gray h-10 px-3"
              onClick={() => {
                setIsFiltersOpen((v) => !v);
              }}
              aria-expanded={isFiltersOpen}
            >
              <div className="flex items-center gap-2">
                <Icon name="filter_list" size={18} />
                <span>Filtros</span>
                {isIndexing && (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </button>
          </Tooltip>

          {isFiltersOpen && (
            <div
              className="mh-popover absolute mt-2 p-3 z-[140] left-1/2 -translate-x-1/2 sm:left-auto sm:-translate-x-0 sm:right-0 w-[92vw] sm:w-auto sm:max-w-md transition-all duration-200 ease-out"
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
                {/* Ações rápidas */}
                <div className="flex flex-wrap gap-2">
                  <Tooltip content="Encontrar arquivos duplicados" position="bottom">
                    <button
                      onClick={onOpenDuplicates}
                      className="mh-btn mh-btn-gray px-4 py-2 text-sm flex items-center gap-2"
                      type="button"
                    >
                      <Icon name="content_copy" size={16} />
                      <span>Duplicados</span>
                    </button>
                  </Tooltip>

                  {onOpenSmartCulling && (
                    <Tooltip content="Smart Culling - Encontrar a melhor foto de cada sequência" position="bottom">
                      <button
                        onClick={onOpenSmartCulling}
                        className="mh-btn mh-btn-gray px-4 py-2 text-sm flex items-center gap-2"
                        type="button"
                      >
                        <Icon name="auto_awesome" size={16} />
                        <span>Smart Culling</span>
                      </button>
                    </Tooltip>
                  )}

                  <button
                    onClick={() => onFiltersChange({ ...filters, groupByDate: !filters.groupByDate })}
                    className={`mh-btn px-4 py-2 text-sm flex items-center gap-2 ${
                      filters.groupByDate ? 'mh-btn-indigo' : 'mh-btn-gray'
                    }`}
                    type="button"
                  >
                    <Icon name="calendar_month" size={16} />
                    <span>Agrupar por data</span>
                  </button>
                </div>

                {/* Filtros de tipo */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Tipo de mídia</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={filters.mediaType || ''}
                      onChange={(e) => onFiltersChange({ ...filters, mediaType: e.target.value || undefined })}
                      className={`px-3 py-2 text-sm ${controlBase}`}
                    >
                      <option value="">Todas as mídias</option>
                      <option value="photo">Fotos</option>
                      <option value="video">Vídeos</option>
                    </select>

                    <select
                      value={filters.fileExtension || ''}
                      onChange={(e) => onFiltersChange({ ...filters, fileExtension: e.target.value || undefined })}
                      className={`px-3 py-2 text-sm ${controlBase}`}
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

                {/* Filtros de data */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Período</label>
                  <select
                    value={filters.datePreset || ''}
                    onChange={(e) => onFiltersChange({ ...filters, datePreset: e.target.value || undefined })}
                    className={`w-full px-3 py-2 text-sm ${controlBase}`}
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
                        onFiltersChange({ ...filters, datePreset: undefined, dateFrom: v });
                      }}
                      className={`flex-1 px-3 py-2 text-sm ${controlBase}`}
                    />
                    <span className="text-gray-500 text-sm">até</span>
                    <input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) => {
                        const v = e.target.value || undefined;
                        onFiltersChange({ ...filters, datePreset: undefined, dateTo: v });
                      }}
                      className={`flex-1 px-3 py-2 text-sm ${controlBase}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
