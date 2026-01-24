import { useEffect, useMemo, useState, type DragEvent } from 'react';

type DropAction =
  | { type: 'flag'; value: boolean }
  | { type: 'reject'; value: boolean }
  | { type: 'rating'; value: number }
  | { type: 'addTag' }
  | { type: 'clearTags' };

interface OrganizationPanelProps {
  isOpen: boolean;
  selectedIds: string[];
  selectedCount: number;
  onClose: () => void;
  onApplyToIds: (assetIds: string[], updates: any) => void;
  onAddTagToIds: (assetIds: string[], tag: string) => void;
  onClearTagsOnIds: (assetIds: string[]) => void;
}

export default function OrganizationPanel({
  isOpen,
  selectedIds,
  selectedCount,
  onClose,
  onApplyToIds,
  onAddTagToIds,
  onClearTagsOnIds
}: OrganizationPanelProps) {
  const [tag, setTag] = useState('');
  const [collections, setCollections] = useState<Array<{ id: string; name: string; type: string; count: number }>>([]);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);

  const btnBase =
    'rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';
  const inputBase =
    'rounded bg-gray-800 border border-gray-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900';

  const canShow = isOpen;

  useEffect(() => {
    if (!canShow) return;
    let cancelled = false;

    const run = async () => {
      setIsCollectionsLoading(true);
      try {
        const cols = await window.electronAPI.getCollections();
        if (!cancelled) setCollections(cols);
      } finally {
        if (!cancelled) setIsCollectionsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [canShow]);

  const handleAddSelectionToCollection = async (collectionId: string) => {
    if (!selectedIds || selectedIds.length === 0) return;
    const result = await window.electronAPI.addAssetsToCollection(collectionId, selectedIds);
    if (!result.success) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao adicionar à coleção: ${result.error || 'Erro desconhecido'}` }
        })
      );
      return;
    }
    const cols = await window.electronAPI.getCollections();
    setCollections(cols);
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const fn = (window.electronAPI as any)?.createCollection;
    if (typeof fn !== 'function') {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Criar coleção não está disponível. Reinicie o app.' }
        })
      );
      return;
    }

    const result = await window.electronAPI.createCollection(name);
    if (!result.success || !result.id) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao criar coleção: ${result.error || 'Erro desconhecido'}` }
        })
      );
      return;
    }

    setIsCreatingCollection(false);
    setNewCollectionName('');
    const cols = await window.electronAPI.getCollections();
    setCollections(cols);
  };

  const actions = useMemo(
    () =>
      [
        { key: 'flag-true', label: 'Marcar', action: { type: 'flag', value: true } as DropAction, color: 'bg-blue-600 hover:bg-blue-700' },
        { key: 'flag-false', label: 'Desmarcar', action: { type: 'flag', value: false } as DropAction, color: 'bg-gray-700 hover:bg-gray-600' },
        { key: 'reject-true', label: 'Rejeitar', action: { type: 'reject', value: true } as DropAction, color: 'bg-red-600 hover:bg-red-700' },
        { key: 'reject-false', label: 'Desrejeitar', action: { type: 'reject', value: false } as DropAction, color: 'bg-gray-700 hover:bg-gray-600' },
        { key: 'rating-5', label: '★★★★★', action: { type: 'rating', value: 5 } as DropAction, color: 'bg-yellow-600 hover:bg-yellow-700' },
        { key: 'rating-0', label: 'Limpar avaliação', action: { type: 'rating', value: 0 } as DropAction, color: 'bg-gray-700 hover:bg-gray-600' }
      ] as const,
    []
  );

  const handleDrop = (e: DragEvent, action: DropAction) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/x-zona21-asset-ids') || e.dataTransfer.getData('application/x-zona21-asset-id');
    const ids = raw
      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (ids.length === 0) return;

    if (action.type === 'flag') onApplyToIds(ids, { flagged: action.value });
    if (action.type === 'reject') onApplyToIds(ids, { rejected: action.value });
    if (action.type === 'rating') onApplyToIds(ids, { rating: action.value });
    if (action.type === 'addTag') {
      const trimmed = tag.trim();
      if (!trimmed) return;
      onAddTagToIds(ids, trimmed);
      setTag('');
    }
    if (action.type === 'clearTags') onClearTagsOnIds(ids);
  };

  const allowDrop = (e: DragEvent) => {
    e.preventDefault();
  };

  if (!canShow) return null;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-[360px] border-l border-gray-700 bg-gray-900 text-white z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div>
          <div className="text-sm font-semibold">Organização</div>
          <div className="text-xs text-gray-400">{selectedCount} selecionados</div>
        </div>
        <button
          onClick={onClose}
          className={`${btnBase} bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600`}
        >
          Fechar
        </button>
      </div>

      <div className="p-4 space-y-3">
        {actions.map((a) => (
          <div
            key={a.key}
            onDragOver={allowDrop}
            onDrop={(e) => handleDrop(e, a.action)}
            className={`w-full rounded px-3 py-3 text-sm font-medium ${a.color} transition select-none`}
          >
            Solte aqui: {a.label}
          </div>
        ))}

        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Tags</div>
          <div className="flex gap-2">
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Adicionar tag"
              className={`flex-1 px-2 py-2 text-sm ${inputBase}`}
            />
            <div
              onDragOver={allowDrop}
              onDrop={(e) => handleDrop(e, { type: 'addTag' })}
              className="rounded bg-green-600 hover:bg-green-700 px-3 py-2 text-sm transition"
            >
              Solte
            </div>
          </div>

          <div
            onDragOver={allowDrop}
            onDrop={(e) => handleDrop(e, { type: 'clearTags' })}
            className="mt-2 rounded bg-gray-700 hover:bg-gray-600 px-3 py-2 text-sm transition"
          >
            Solte aqui: Limpar tags
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-400">Coleções</div>
            <button
              type="button"
              onClick={() => setIsCreatingCollection((v) => !v)}
              className={`${btnBase} bg-gray-700 px-2 py-1 text-[10px] hover:bg-gray-600`}
            >
              +
            </button>
          </div>

          {isCreatingCollection && (
            <div className="mb-2 space-y-2">
              <input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleCreateCollection();
                  }
                  if (e.key === 'Escape') {
                    setIsCreatingCollection(false);
                    setNewCollectionName('');
                  }
                }}
                placeholder="Nome da nova coleção"
                className={`w-full px-2 py-2 text-sm ${inputBase}`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleCreateCollection()}
                  className={`${btnBase} flex-1 bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700`}
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCollection(false);
                    setNewCollectionName('');
                  }}
                  className={`${btnBase} flex-1 bg-gray-700 px-3 py-2 text-xs text-white hover:bg-gray-600`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {isCollectionsLoading ? (
            <div className="rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-300">
              Carregando…
            </div>
          ) : collections.length === 0 ? (
            <div className="rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-400">
              Nenhuma coleção
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => void handleAddSelectionToCollection(c.id)}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 transition"
                  title={selectedIds.length === 0 ? 'Selecione arquivos para adicionar' : `Adicionar ${selectedIds.length} selecionado(s)`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] text-gray-400">{c.count}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-gray-500">
                    Adicionar selecionados
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
