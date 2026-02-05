import { useEffect, useState } from 'react';
import Icon from './Icon';

type DuplicateGroup = {
  partialHash: string;
  fileSize: number;
  count: number;
  assetIds: string[];
  samples: Array<{ id: string; fileName: string; relativePath: string }>;
};

interface DuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGroup: (assetIds: string[]) => void;
}

export default function DuplicatesModal({ isOpen, onClose, onSelectGroup }: DuplicatesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const fn = (window.electronAPI as any)?.getDuplicateGroups;
        if (typeof fn !== 'function') {
          if (!cancelled) setGroups([]);
          return;
        }
        const res = await (window.electronAPI as any).getDuplicateGroups();
        if (!cancelled) setGroups(Array.isArray(res) ? res : []);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
      <div
        className="mh-popover w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicates-title"
        aria-describedby="duplicates-desc"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="duplicates-title" className="text-lg font-semibold">Duplicados</h2>
            <p id="duplicates-desc" className="text-xs text-gray-400">Agrupado por tamanho do arquivo + hash parcial</p>
          </div>
          <button
            onClick={onClose}
            className="mh-btn mh-btn-gray px-3 py-2 text-sm"
            aria-label="Fechar modal de duplicados"
          >
            Fechar
          </button>
        </div>

        <div className="px-5 py-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-sm text-gray-300" role="status" aria-live="polite">Carregando…</div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" role="status">
              <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mb-4" aria-hidden="true">
                <Icon name="check_circle" size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Nenhum duplicado encontrado</h3>
              <p className="text-sm text-gray-400 text-center max-w-md">
                Ótimo! Não há arquivos duplicados na sua biblioteca. Todos os arquivos são únicos.
              </p>
            </div>
          ) : (
            <div className="space-y-3" role="list" aria-label={`${groups.length} grupos de duplicados encontrados`}>
              {groups.map((g, index) => (
                <article key={`${g.partialHash}-${g.fileSize}`} className="rounded-2xl border border-white/10 bg-white/5" role="listitem" aria-label={`Grupo ${index + 1}: ${g.count} duplicados`}>
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-200">{g.count} duplicados</h4>
                      <p className="mt-1 text-xs text-gray-400">
                        Tamanho: {(g.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectGroup(g.assetIds)}
                        className="mh-btn mh-btn-indigo px-3 py-2 text-xs"
                        aria-label={`Selecionar ${g.count} arquivos duplicados deste grupo`}
                      >
                        Selecionar grupo
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/10 px-4 py-3">
                    <div className="grid grid-cols-6 gap-2" role="list" aria-label="Pré-visualização dos arquivos">
                      {g.samples.slice(0, 6).map((a) => (
                        <div key={a.id} className="overflow-hidden rounded-xl bg-black/20 border border-white/10" role="listitem">
                          <div className="aspect-square">
                            <img src={`zona21thumb://${a.id}`} alt={a.fileName} className="h-full w-full object-cover" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {g.assetIds.length > g.samples.length && (
                      <p className="mt-2 text-xs text-gray-500">Mostrando {g.samples.length} prévia(s)</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
