import { useState } from 'react';
import { IndexProgress } from '../shared/types';
import MaterialIcon from './MaterialIcon.tsx';
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
  cullingStats
}: ToolbarProps) {
  const progressPct = indexProgress.total > 0 ? (indexProgress.indexed / indexProgress.total) * 100 : 0;
  
  // Calcular tempo restante estimado
  const getEstimatedTimeRemaining = () => {
    if (!indexStartTime || indexProgress.total === 0 || indexProgress.indexed === 0) return null;
    
    const elapsed = Date.now() - indexStartTime;
    const rate = indexProgress.indexed / (elapsed / 1000); // arquivos por segundo
    const remaining = indexProgress.total - indexProgress.indexed;
    const secondsRemaining = remaining / rate;
    
    if (secondsRemaining < 60) return `${Math.round(secondsRemaining)}s`;
    if (secondsRemaining < 3600) return `${Math.round(secondsRemaining / 60)}min`;
    return `${Math.round(secondsRemaining / 3600)}h`;
  };
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const controlBase =
    'mh-control';
  const btnBase =
    'mh-btn px-3 py-2';
  const btnSecondary = `${btnBase} mh-btn-gray`;

  return (
    <div className="mh-topbar relative isolate z-[120] h-16 flex items-center px-2 sm:px-4 gap-2 sm:gap-4 min-w-0">
      <Tooltip content="Abrir barra lateral" position="bottom">
        <button
          type="button"
          className="mh-btn mh-btn-gray sm:hidden h-10 w-10 flex items-center justify-center"
          aria-label="Abrir barra lateral"
          onClick={() => onOpenSidebar?.()}
        >
          <MaterialIcon name="menu" className="text-[20px]" />
        </button>
      </Tooltip>

      <Tooltip content={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'} position="bottom">
        <button
          type="button"
          className="mh-btn mh-btn-gray hidden sm:flex h-10 w-10 items-center justify-center"
          aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          onClick={() => onToggleSidebarCollapse?.()}
        >
          <MaterialIcon name={isSidebarCollapsed ? 'chevron_right' : 'chevron_left'} className="text-[20px]" />
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

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {hasSelection && (
          <>
            <Tooltip content="Selecionar tudo (Ctrl/Cmd+A)" position="bottom">
              <button
                type="button"
                className="mh-btn mh-btn-gray h-10 px-3"
                onClick={() => onSelectAll?.()}
              >
                <div className="flex items-center gap-2">
                  <MaterialIcon name="select_all" className="text-[18px]" />
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
                  <MaterialIcon name="close" className="text-[18px]" />
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
                <MaterialIcon name="filter_list" className="text-[18px]" />
                <span>Filtros</span>
              </div>
            </button>
          </Tooltip>

          {isFiltersOpen && (
            <div
              className="mh-popover absolute right-0 mt-2 w-[92vw] max-w-md z-[140] p-3"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Tooltip content="Encontrar arquivos duplicados" position="bottom">
                  <button
                    onClick={onOpenDuplicates}
                    className={btnSecondary}
                    type="button"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <MaterialIcon name="content_copy" className="text-[18px]" />
                      <span>Duplicados</span>
                    </div>
                  </button>
                </Tooltip>

                <select
                  value={filters.mediaType || ''}
                  onChange={(e) => onFiltersChange({ ...filters, mediaType: e.target.value || undefined })}
                  className={`px-3 py-2 ${controlBase}`}
                >
                  <option value="">Todas as mídias</option>
                  <option value="photo">Fotos</option>
                  <option value="video">Vídeos</option>
                </select>

                <select
                  value={filters.fileExtension || ''}
                  onChange={(e) => onFiltersChange({ ...filters, fileExtension: e.target.value || undefined })}
                  className={`px-3 py-2 ${controlBase}`}
                  title="Filtrar por tipo de arquivo"
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

                <select
                  value={filters.datePreset || ''}
                  onChange={(e) => onFiltersChange({ ...filters, datePreset: e.target.value || undefined })}
                  className={`px-3 py-2 ${controlBase}`}
                >
                  <option value="">Todo o período</option>
                  <option value="today">Hoje</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                  <option value="year">Este ano</option>
                </select>

                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => {
                    const v = e.target.value || undefined;
                    onFiltersChange({ ...filters, datePreset: undefined, dateFrom: v });
                  }}
                  className={`px-3 py-2 ${controlBase}`}
                  title="Data inicial"
                />

                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => {
                    const v = e.target.value || undefined;
                    onFiltersChange({ ...filters, datePreset: undefined, dateTo: v });
                  }}
                  className={`px-3 py-2 ${controlBase}`}
                  title="Data final"
                />

                <button
                  onClick={() => onFiltersChange({ ...filters, groupByDate: !filters.groupByDate })}
                  className={`${btnBase} ${
                    filters.groupByDate ? 'mh-btn-indigo' : 'mh-btn-gray'
                  }`}
                  title="Agrupar por data"
                  type="button"
                >
                  Agrupar por data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isIndexing && (
        <div className="hidden lg:flex ml-auto items-center gap-2">
          <div className="text-sm text-gray-400">
            {indexProgress.status === 'scanning' ? (
              <span>
                <span className="text-indigo-400">🔍 Analisando arquivos</span>
                {indexProgress.currentFile && (
                  <span className="text-gray-500 ml-2 text-xs">
                    ({indexProgress.currentFile.split('/').pop()})
                  </span>
                )}
              </span>
            ) : (
              <span>
                <span className="text-blue-400">📁 Processando mídias</span>
                <span className="ml-2">
                  {indexProgress.indexed} de {indexProgress.total} arquivos
                </span>
                {progressPct > 0 && (
                  <span className="text-gray-500 ml-2 text-xs">
                    ({Math.round(progressPct)}%)
                  </span>
                )}
                {getEstimatedTimeRemaining() && (
                  <span className="text-gray-500 ml-2 text-xs">
                    • restante ~{getEstimatedTimeRemaining()}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
