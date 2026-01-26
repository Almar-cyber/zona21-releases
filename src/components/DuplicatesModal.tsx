import { useEffect, useState } from 'react';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
      <div className="mh-popover w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-lg font-semibold">Duplicados</div>
            <div className="text-xs text-gray-400">Agrupado por tamanho do arquivo + hash parcial</div>
          </div>
          <button
            onClick={onClose}
            className="mh-btn mh-btn-gray px-3 py-2 text-sm"
          >
            Fechar
          </button>
        </div>

        <div className="px-5 py-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-sm text-gray-300">Carregando…</div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Nenhum duplicado encontrado</h3>
              <p className="text-sm text-gray-400 text-center max-w-md">
                Ótimo! Não há arquivos duplicados na sua biblioteca. Todos os arquivos são únicos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={`${g.partialHash}-${g.fileSize}`} className="rounded-2xl border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-200">{g.count} duplicados</div>
                      <div className="mt-1 text-xs text-gray-400">
                        Tamanho: {(g.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectGroup(g.assetIds)}
                        className="mh-btn mh-btn-indigo px-3 py-2 text-xs"
                      >
                        Selecionar grupo
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-white/10 px-4 py-3">
                    <div className="grid grid-cols-6 gap-2">
                      {g.samples.slice(0, 6).map((a) => (
                        <div key={a.id} className="overflow-hidden rounded-xl bg-black/20 border border-white/10">
                          <div className="aspect-square">
                            <img src={`zona21thumb://${a.id}`} alt={a.fileName} className="h-full w-full object-cover" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {g.assetIds.length > g.samples.length && (
                      <div className="mt-2 text-xs text-gray-500">Mostrando {g.samples.length} prévia(s)</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
