import { useState, useEffect } from 'react';
import { IndexProgress } from '../shared/types';
import { translateTag } from '../shared/tagTranslations';
import Icon from './Icon.tsx';
import CullingStats from './CullingStats.tsx';
import { Tooltip } from './Tooltip';

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
}

interface TagOption {
  tag: string;
  count: number;
}

// Detecta se uma tag é uma localização (padrão: "Cidade - UF")
function isLocationTag(tag: string): boolean {
  const match = tag.match(/^.+ - ([A-Z]{2})$/);
  return match !== null;
}

export default function Toolbar({
  onOpenDuplicates,
  filters,
  onFiltersChange,
  isIndexing,
  hasSelection,
  onSelectAll,
  onOpenSidebar,
  onToggleSidebarCollapse,
  isSidebarCollapsed,
  cullingStats,
}: ToolbarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [availableLocations, setAvailableLocations] = useState<TagOption[]>([]);

  // Verifica se há filtros ativos
  const hasActiveFilters = Boolean(
    filters.mediaType ||
    filters.fileExtension ||
    filters.datePreset ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.locations && filters.locations.length > 0)
  );

  // Carregar tags disponíveis (separando localizações)
  useEffect(() => {
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
    // Recarregar tags periodicamente (a cada 60s) para pegar novas tags processadas
    const interval = setInterval(loadTags, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const controlBase = 'mh-control';

  return (
    <div className="mh-topbar relative isolate z-[120] h-16 flex items-center pl-3 pr-2 sm:pr-4 gap-2 sm:gap-4 min-w-0">
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

      {/* Espaçador para manter os filtros à direita */}
      <div className="flex-1" />

      {/* Direita - Ações e Filtros (sempre fixo) */}
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

          </>
        )}

        <div className="relative">
          <Tooltip content={hasActiveFilters ? "Filtros ativos" : "Abrir filtros"} position="bottom">
            <button
              type="button"
              className={`mh-btn h-10 px-3 ${hasActiveFilters ? 'mh-btn-indigo' : 'mh-btn-gray'}`}
              onClick={() => {
                setIsFiltersOpen((v) => !v);
              }}
              aria-expanded={isFiltersOpen}
            >
              <div className="flex items-center gap-2">
                <Icon name="filter_list" size={18} />
                <span>Filtros</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
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
              role="dialog"
              aria-modal="false"
              aria-labelledby="filters-title"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 id="filters-title" className="text-sm font-semibold text-[var(--color-text-primary)]">Filtros</h2>
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
                <fieldset className="space-y-2">
                  <legend className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Tipo de mídia</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      id="media-type-filter"
                      aria-label="Tipo de mídia"
                      value={filters.mediaType || ''}
                      onChange={(e) => onFiltersChange({ ...filters, mediaType: e.target.value || undefined })}
                      className={`px-3 py-2 text-sm ${controlBase}`}
                    >
                      <option value="">Todas as mídias</option>
                      <option value="photo">Fotos</option>
                      <option value="video">Vídeos</option>
                    </select>

                    <select
                      id="file-extension-filter"
                      aria-label="Formato do arquivo"
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
                        <option value=".raf">.raf (Fujifilm)</option>
                        <option value=".rw2">.rw2 (Panasonic)</option>
                        <option value=".orf">.orf (Olympus)</option>
                        <option value=".pef">.pef (Pentax)</option>
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
                </fieldset>

                {/* Filtros de data */}
                <fieldset className="space-y-2">
                  <legend className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">Período</legend>
                  <select
                    id="date-preset-filter"
                    aria-label="Período predefinido"
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
                      aria-label="Data inicial"
                      value={filters.dateFrom || ''}
                      onChange={(e) => {
                        const v = e.target.value || undefined;
                        onFiltersChange({ ...filters, datePreset: undefined, dateFrom: v });
                      }}
                      className={`flex-1 px-3 py-2 text-sm ${controlBase}`}
                    />
                    <span className="text-[var(--color-text-muted)] text-sm" aria-hidden="true">até</span>
                    <input
                      type="date"
                      aria-label="Data final"
                      value={filters.dateTo || ''}
                      onChange={(e) => {
                        const v = e.target.value || undefined;
                        onFiltersChange({ ...filters, datePreset: undefined, dateTo: v });
                      }}
                      className={`flex-1 px-3 py-2 text-sm ${controlBase}`}
                    />
                  </div>
                </fieldset>

                {/* Filtros por Tags */}
                {availableTags.length > 0 && (
                  <fieldset className="space-y-2">
                    <legend className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide flex items-center gap-2">
                      <Icon name="label" size={14} aria-hidden="true" />
                      Tags
                    </legend>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto" role="group" aria-label="Filtrar por tags">
                      {availableTags.slice(0, 20).map(({ tag, count }) => {
                        const isSelected = filters.tags?.includes(tag);
                        const translatedTag = translateTag(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected}
                            aria-label={`${translatedTag} (${count} ${count === 1 ? 'arquivo' : 'arquivos'})`}
                            onClick={() => {
                              const currentTags = filters.tags || [];
                              const newTags = isSelected
                                ? currentTags.filter((t: string) => t !== tag)
                                : [...currentTags, tag];
                              onFiltersChange({
                                ...filters,
                                tags: newTags.length > 0 ? newTags : undefined
                              });
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                              isSelected
                                ? 'bg-purple-600 text-white'
                                : 'bg-[var(--color-overlay-medium)] text-[var(--color-text-secondary)] hover:bg-[var(--color-overlay-strong)]'
                            }`}
                            title={tag !== translatedTag ? tag : undefined}
                          >
                            <span>{translatedTag}</span>
                            <span className="opacity-60" aria-hidden="true">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                    {filters.tags?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onFiltersChange({ ...filters, tags: undefined })}
                        className="text-xs text-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
                        aria-label="Limpar todos os filtros de tags"
                      >
                        Limpar tags
                      </button>
                    )}
                  </fieldset>
                )}

                {/* Filtros por Localização */}
                {availableLocations.length > 0 && (
                  <fieldset className="space-y-2">
                    <legend className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide flex items-center gap-2">
                      <Icon name="location_on" size={14} aria-hidden="true" />
                      Localizações
                    </legend>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto" role="group" aria-label="Filtrar por localização">
                      {availableLocations.slice(0, 20).map(({ tag, count }) => {
                        const isSelected = filters.tags?.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected}
                            aria-label={`${tag} (${count} ${count === 1 ? 'arquivo' : 'arquivos'})`}
                            onClick={() => {
                              const currentTags = filters.tags || [];
                              const newTags = isSelected
                                ? currentTags.filter((t: string) => t !== tag)
                                : [...currentTags, tag];
                              onFiltersChange({
                                ...filters,
                                tags: newTags.length > 0 ? newTags : undefined
                              });
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-[var(--color-overlay-medium)] text-[var(--color-text-secondary)] hover:bg-[var(--color-overlay-strong)]'
                            }`}
                          >
                            <span>{tag}</span>
                            <span className="opacity-60" aria-hidden="true">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
