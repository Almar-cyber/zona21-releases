import { useState } from 'react';
import { IndexProgress } from '../shared/types';
import MaterialIcon from './MaterialIcon.tsx';

interface ToolbarProps {
  onOpenDuplicates: () => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  isIndexing: boolean;
  indexProgress: IndexProgress;
  hasSelection?: boolean;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onOpenSidebar?: () => void;
  onToggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function Toolbar({
  onOpenDuplicates,
  filters,
  onFiltersChange,
  isIndexing,
  indexProgress,
  hasSelection,
  onSelectAll,
  onClearSelection,
  onOpenSidebar,
  onToggleSidebarCollapse,
  isSidebarCollapsed
}: ToolbarProps) {
  const progressPct = indexProgress.total > 0 ? (indexProgress.indexed / indexProgress.total) * 100 : 0;
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const controlBase =
    'mh-control';
  const btnBase =
    'mh-btn px-3 py-2';
  const btnSecondary = `${btnBase} mh-btn-gray`;

  return (
    <div className="mh-topbar relative isolate z-[120] h-16 flex items-center px-2 sm:px-4 gap-2 sm:gap-4 min-w-0">
      <button
        type="button"
        className="mh-btn mh-btn-gray sm:hidden h-10 w-10 flex items-center justify-center"
        aria-label="Abrir barra lateral"
        onClick={() => onOpenSidebar?.()}
      >
        <MaterialIcon name="menu" className="text-[20px]" />
      </button>

      <button
        type="button"
        className="mh-btn mh-btn-gray hidden sm:flex h-10 w-10 items-center justify-center"
        aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        onClick={() => onToggleSidebarCollapse?.()}
      >
        <MaterialIcon name={isSidebarCollapsed ? 'chevron_right' : 'chevron_left'} className="text-[20px]" />
      </button>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {hasSelection && (
          <>
            <button
              type="button"
              className="mh-btn mh-btn-gray h-10 px-3"
              onClick={() => onSelectAll?.()}
              title="Selecionar tudo (Ctrl/Cmd+A)"
            >
              <div className="flex items-center gap-2">
                <MaterialIcon name="select_all" className="text-[18px]" />
                <span>Selecionar tudo</span>
              </div>
            </button>

            <button
              type="button"
              className="mh-btn mh-btn-gray h-10 px-3"
              onClick={() => onClearSelection?.()}
              title="Limpar seleção (Esc)"
            >
              <div className="flex items-center gap-2">
                <MaterialIcon name="close" className="text-[18px]" />
                <span>Limpar</span>
              </div>
            </button>
          </>
        )}

        <div className="relative">
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
                    filters.groupByDate ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
            {indexProgress.status === 'scanning' ? 'Analisando…' : 'Indexando:'} {indexProgress.indexed} / {indexProgress.total}
          </div>
          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
