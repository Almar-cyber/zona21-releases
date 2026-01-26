import { useMemo, useRef, useState, useEffect } from 'react';
import type React from 'react';
import { Volume } from '../shared/types';
import MaterialIcon from './MaterialIcon.tsx';
import logoFull from '../assets/logotipo-white.png';
import logoCollapsed from '../assets/logotipo-resum-white.png';
import { APP_VERSION } from '../version';

interface SidebarProps {
  onIndexDirectory: () => void;
  selectedVolumeUuid: string | null;
  selectedPathPrefix: string | null;
  onSelectVolume: (volumeUuid: string | null) => void;
  onSelectFolder: (pathPrefix: string | null) => void;
  onMoveAssetsToFolder: (assetIds: string[], pathPrefix: string | null) => void;
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  collectionsRefreshToken: number;
  collapsed?: boolean;
  className?: string;
  onOpenPreferences?: () => void;
}

type FolderChild = { name: string; path: string; assetCount: number };

export default function Sidebar({
  onIndexDirectory,
  selectedVolumeUuid,
  selectedPathPrefix,
  onSelectVolume,
  onSelectFolder,
  onMoveAssetsToFolder,
  selectedCollectionId,
  onSelectCollection,
  collectionsRefreshToken,
  collapsed,
  className,
  onOpenPreferences
}: SidebarProps) {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const expandedRef = useRef<string[]>([]);
  const [childrenByPath, setChildrenByPath] = useState<Record<string, FolderChild[]>>({});
  const childrenByPathRef = useRef<Record<string, FolderChild[]>>({});
  const [collections, setCollections] = useState<Array<{ id: string; name: string; type: string; count: number }>>([]);
  const [editingVolumeUuid, setEditingVolumeUuid] = useState<string | null>(null);
  const [editingVolumeLabel, setEditingVolumeLabel] = useState('');
  const [dragXByVolumeUuid, setDragXByVolumeUuid] = useState<Record<string, number>>({});
  const dragVolumeStateRef = useRef<{ uuid: string; startX: number; dragging: boolean } | null>(null);
  const [openVolumeActionsUuid, setOpenVolumeActionsUuid] = useState<string | null>(null);
  const [volumeMenu, setVolumeMenu] = useState<{ uuid: string; x: number; y: number } | null>(null);
  const suppressVolumeClickRef = useRef<{ uuid: string; until: number } | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState('');
  const [openDeleteCollectionId, setOpenDeleteCollectionId] = useState<string | null>(null);
  const [dragXByCollectionId, setDragXByCollectionId] = useState<Record<string, number>>({});
  const dragStateRef = useRef<{ id: string; startX: number; dragging: boolean } | null>(null);
  const [collectionMenu, setCollectionMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const suppressClickRef = useRef<{ id: string; until: number } | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);

  useEffect(() => {
    childrenByPathRef.current = childrenByPath;
  }, [childrenByPath]);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    loadVolumes();
    loadCollections();
  }, []);

  // Escutar evento de mudança de volumes (indexação, remoção)
  useEffect(() => {
    const onVolumesChanged = () => {
      loadVolumes();
    };
    window.addEventListener('zona21-volumes-changed', onVolumesChanged);
    return () => window.removeEventListener('zona21-volumes-changed', onVolumesChanged);
  }, []);

  useEffect(() => {
    loadCollections();
  }, [collectionsRefreshToken]);

  useEffect(() => {
    loadCollections();
  }, [selectedCollectionId]);

  const loadVolumes = async () => {
    const loadedVolumes = await window.electronAPI.getVolumes();
    setVolumes(loadedVolumes);
    setOpenVolumeActionsUuid(null);
    setDragXByVolumeUuid({});
  };

  const handleEjectVolume = async (uuid: string) => {
    const ok = confirm('Ejetar este disco?');
    if (!ok) return;
    try {
      const result = await window.electronAPI.ejectVolume(uuid);
      if (!result?.success) {
        window.dispatchEvent(
          new CustomEvent('zona21-toast', {
            detail: { type: 'error', message: `Falha ao ejetar disco: ${result?.error || 'Erro desconhecido'}` }
          })
        );
        return;
      }
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: 'Disco ejetado com sucesso.' }
        })
      );
      await loadVolumes();
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao ejetar disco: ${(error as Error).message}` }
        })
      );
    }
  };

  const handleHideVolume = async (uuid: string, label: string) => {
    const ok = confirm(`Remover "${label}" da lista?`);
    if (!ok) return;
    try {
      const result = await window.electronAPI.hideVolume(uuid);
      if (!result?.success) {
        window.dispatchEvent(
          new CustomEvent('zona21-toast', {
            detail: { type: 'error', message: `Falha ao remover armazenamento: ${result?.error || 'Erro desconhecido'}` }
          })
        );
        return;
      }

      // Notificar App para atualizar estado de volumes E forçar reload dos assets
      window.dispatchEvent(new CustomEvent('zona21-volumes-changed'));
      window.dispatchEvent(new CustomEvent('zona21-force-reload-assets'));

      if (selectedVolumeUuid === uuid) {
        onSelectVolume(null);
      }

      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'success', message: 'Armazenamento removido da lista.' }
        })
      );
      
      await loadVolumes();
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao remover armazenamento: ${(error as Error).message}` }
        })
      );
    }
  };

  const beginRenameVolume = (uuid: string, label: string) => {
    setEditingVolumeUuid(uuid);
    setEditingVolumeLabel(label);
  };

  const commitRenameVolume = async (uuid: string) => {
    const next = editingVolumeLabel.trim();
    setEditingVolumeUuid(null);
    setEditingVolumeLabel('');
    if (!next) return;
    const result = await window.electronAPI.renameVolume(uuid, next);
    if (!result?.success) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao renomear volume: ${result?.error || 'Erro desconhecido'}` }
        })
      );
      return;
    }
    await loadVolumes();
  };

  const cancelRenameVolume = () => {
    setEditingVolumeUuid(null);
    setEditingVolumeLabel('');
  };

  const loadCollections = async () => {
    const cols = await window.electronAPI.getCollections();
    setCollections(cols);
    setOpenDeleteCollectionId(null);
    setDragXByCollectionId({});
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToCollection = async (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    const raw =
      e.dataTransfer.getData('application/x-zona21-asset-ids') ||
      e.dataTransfer.getData('application/x-zona21-asset-id');
    const ids = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (ids.length === 0) return;
    const result = await window.electronAPI.addAssetsToCollection(collectionId, ids);
    if (!result.success) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao adicionar à coleção: ${result.error || 'Erro desconhecido'}` }
        })
      );
      return;
    }
    await loadCollections();
  };

  const beginRenameCollection = (id: string, name: string) => {
    if (id === 'favorites') return;
    setEditingCollectionId(id);
    setEditingCollectionName(name);
  };

  const commitRenameCollection = async (id: string) => {
    if (id === 'favorites') return;
    const next = editingCollectionName.trim();
    setEditingCollectionId(null);
    setEditingCollectionName('');
    if (!next) return;
    await handleRenameCollection(id, next);
  };

  const cancelRenameCollection = () => {
    setEditingCollectionId(null);
    setEditingCollectionName('');
  };

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const onVolumePointerDown = (uuid: string, e: React.PointerEvent) => {
    if (editingVolumeUuid) return;
    dragVolumeStateRef.current = { uuid, startX: e.clientX, dragging: false };
  };

  const onVolumePointerMove = (uuid: string, e: React.PointerEvent) => {
    const s = dragVolumeStateRef.current;
    if (!s || s.uuid !== uuid) return;
    const dx = e.clientX - s.startX;
    if (!s.dragging) {
      if (Math.abs(dx) < 6) return;
      s.dragging = true;
      setOpenVolumeActionsUuid(null);
      setVolumeMenu(null);
    }
    const x = clamp(dx, -120, 0);
    setDragXByVolumeUuid((prev) => ({ ...prev, [uuid]: x }));
  };

  const onVolumePointerUp = (uuid: string) => {
    const s = dragVolumeStateRef.current;
    dragVolumeStateRef.current = null;
    const x = dragXByVolumeUuid[uuid] ?? 0;
    if (s?.dragging) {
      suppressVolumeClickRef.current = { uuid, until: Date.now() + 400 };
    }
    if (s?.dragging && x <= -60) {
      setOpenVolumeActionsUuid(uuid);
      setDragXByVolumeUuid((prev) => ({ ...prev, [uuid]: -120 }));
      return;
    }
    setOpenVolumeActionsUuid(null);
    setDragXByVolumeUuid((prev) => ({ ...prev, [uuid]: 0 }));
  };

  const closeVolumeSwipe = (uuid: string) => {
    setOpenVolumeActionsUuid(null);
    setDragXByVolumeUuid((prev) => ({ ...prev, [uuid]: 0 }));
  };

  const onCollectionPointerDown = (collectionId: string, e: React.PointerEvent) => {
    if (collectionId === 'favorites') return;
    if (editingCollectionId) return;
    dragStateRef.current = { id: collectionId, startX: e.clientX, dragging: false };
  };

  const onCollectionPointerMove = (collectionId: string, e: React.PointerEvent) => {
    const s = dragStateRef.current;
    if (!s || s.id !== collectionId) return;
    const dx = e.clientX - s.startX;
    if (!s.dragging) {
      if (Math.abs(dx) < 6) return;
      s.dragging = true;
      setOpenDeleteCollectionId(null);
      setCollectionMenu(null);
    }
    const x = clamp(dx, -80, 0);
    setDragXByCollectionId((prev) => ({ ...prev, [collectionId]: x }));
  };

  const onCollectionPointerUp = (collectionId: string) => {
    const s = dragStateRef.current;
    dragStateRef.current = null;
    const x = dragXByCollectionId[collectionId] ?? 0;
    if (s?.dragging) {
      suppressClickRef.current = { id: collectionId, until: Date.now() + 400 };
    }
    if (s?.dragging && x <= -40) {
      setOpenDeleteCollectionId(collectionId);
      setDragXByCollectionId((prev) => ({ ...prev, [collectionId]: -80 }));
      return;
    }
    setOpenDeleteCollectionId(null);
    setDragXByCollectionId((prev) => ({ ...prev, [collectionId]: 0 }));
  };

  const closeDeleteSwipe = (collectionId: string) => {
    setOpenDeleteCollectionId(null);
    setDragXByCollectionId((prev) => ({ ...prev, [collectionId]: 0 }));
  };

  useEffect(() => {
    if (!collectionMenu) return;
    const onDown = () => setCollectionMenu(null);
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [collectionMenu]);

  useEffect(() => {
    if (!volumeMenu) return;
    const onDown = () => setVolumeMenu(null);
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [volumeMenu]);

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
    await loadCollections();
    onSelectCollection(result.id);
  };

  const handleRenameCollection = async (collectionId: string, currentName: string) => {
    if (collectionId === 'favorites') return;
    const fn = (window.electronAPI as any)?.renameCollection;
    if (typeof fn !== 'function') {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Renomear coleção não está disponível. Reinicie o app.' }
        })
      );
      return;
    }
    const name = String(currentName || '').trim();
    if (!name) return;
    const result = await (window.electronAPI as any).renameCollection(collectionId, name);
    if (!result?.success) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao renomear coleção: ${result?.error || 'Erro desconhecido'}` }
        })
      );
      return;
    }
    await loadCollections();
  };

  const handleDeleteCollection = async (collectionId: string, currentName: string) => {
    if (collectionId === 'favorites') return;
    const ok = confirm(`Excluir a coleção "${currentName}"?`);
    if (!ok) return;
    const fn = (window.electronAPI as any)?.deleteCollection;
    if (typeof fn !== 'function') {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: 'Excluir coleção não está disponível. Reinicie o app.' }
        })
      );
      return;
    }
    const result = await (window.electronAPI as any).deleteCollection(collectionId);
    if (!result?.success) {
      window.dispatchEvent(
        new CustomEvent('zona21-toast', {
          detail: { type: 'error', message: `Falha ao excluir coleção: ${result?.error || 'Erro desconhecido'}` }
        })
      );
      return;
    }
    if (selectedCollectionId === collectionId) {
      onSelectCollection(null);
    }
    await loadCollections();
  };

  useEffect(() => {
    setExpanded([]);
    setChildrenByPath({});
    childrenByPathRef.current = {};
    if (selectedVolumeUuid) {
      void loadChildren(null);
    }
  }, [selectedVolumeUuid]);

  useEffect(() => {
    const run = async () => {
      if (!selectedVolumeUuid) return;
      const prefix = (selectedPathPrefix ?? '').replace(/\/+$/, '');
      if (!prefix) return;

      // ensure root is loaded
      await loadChildren(null);

      const parts = prefix.split('/').filter(Boolean);
      let current = '';
      const nextExpanded = new Set(expandedRef.current);
      for (const part of parts) {
        current = current ? `${current}/${part}` : part;
        // load children so expansion shows immediately
        await loadChildren(current);
        nextExpanded.add(current);
      }

      const merged = Array.from(nextExpanded);
      // avoid unnecessary set
      const prev = expandedRef.current;
      if (merged.length !== prev.length || merged.some((p) => !prev.includes(p))) {
        setExpanded(merged);
      }
    };

    void run();
  }, [selectedVolumeUuid, selectedPathPrefix]);

  const loadChildren = async (parentPath: string | null) => {
    if (!selectedVolumeUuid) return;
    const key = parentPath ?? '';
    if (childrenByPathRef.current[key]) return;
    if (key === '') setIsFoldersLoading(true);
    try {
      const children = await window.electronAPI.getFolderChildren(selectedVolumeUuid, parentPath);
      setChildrenByPath((prev) => ({ ...prev, [key]: children }));
    } finally {
      if (key === '') setIsFoldersLoading(false);
    }
  };

  const toggleExpand = async (path: string) => {
    const isOpen = expanded.includes(path);
    if (isOpen) {
      setExpanded((prev) => prev.filter((p) => p !== path));
      return;
    }
    await loadChildren(path);
    setExpanded((prev) => [...prev, path]);
  };

  const rootChildren = useMemo(() => childrenByPath[''] ?? [], [childrenByPath]);

  const folderBreadcrumb = useMemo(() => {
    const raw = (selectedPathPrefix ?? '').replace(/\/+$/, '');
    if (!raw) return [] as string[];
    return raw.split('/').filter(Boolean);
  }, [selectedPathPrefix]);

  const currentFolderLabel = folderBreadcrumb.length > 0 ? folderBreadcrumb[folderBreadcrumb.length - 1] : null;
  const currentFolderParent = folderBreadcrumb.length > 1 ? folderBreadcrumb.slice(0, -1).join('/') : null;

  const renderNode = (node: FolderChild, depth: number) => {
    const isOpen = expanded.includes(node.path);
    const key = node.path;
    const kids = childrenByPath[key] ?? null;
    const isActive = selectedPathPrefix === node.path;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 rounded px-2 py-1 cursor-pointer transition-colors ${
            isActive ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void toggleExpand(node.path);
            }}
            className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-white"
            title={isOpen ? 'Recolher' : 'Expandir'}
          >
            <span className={`inline-block transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
          </button>
          <div
            className="flex-1 min-w-0"
            onClick={() => {
              onSelectFolder(node.path);
              void (async () => {
                await loadChildren(node.path);
                setExpanded((prev) => (prev.includes(node.path) ? prev : [...prev, node.path]));
              })();
            }}
            onDragOver={(e) => {
              const types = Array.from((e.dataTransfer as any)?.types || []);
              const isInternal = types.includes('application/x-zona21-asset-id') || types.includes('application/x-zona21-asset-ids');
              if (!isInternal) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              const raw =
                e.dataTransfer.getData('application/x-zona21-asset-ids') ||
                e.dataTransfer.getData('application/x-zona21-asset-id');
              const ids = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
              if (ids.length === 0) return;
              e.preventDefault();
              e.stopPropagation();
              onMoveAssetsToFolder(ids, node.path);
            }}
            title={node.path}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm truncate">{node.name}</span>
              <span className="text-[10px] text-gray-400">{node.assetCount}</span>
            </div>
          </div>
        </div>

        {isOpen && kids && kids.length > 0 && (
          <div>
            {kids.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 mh-sidebar flex flex-col relative z-[60] ${className || ''}`}
    >
      <div
        className={`${collapsed ? 'p-2' : 'px-3 py-3'} border-b border-gray-700 flex items-center ${collapsed ? 'justify-center' : 'justify-start'}`}
      >
        {collapsed ? (
          <div className="w-8 mx-auto">
            <img src={logoCollapsed} alt="Zona21" className="w-full h-auto object-contain opacity-80" />
          </div>
        ) : (
          <div className="w-24">
            <img src={logoFull} alt="Zona21" className="w-full h-auto object-contain opacity-80" />
          </div>
        )}
      </div>

      <div className="p-4">
        <button
          onClick={onIndexDirectory}
          className={
            collapsed
              ? 'mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700'
              : 'w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-full transition'
          }
          title="Adicionar pasta"
        >
          <div className="flex items-center justify-center gap-2">
            <MaterialIcon name="create_new_folder" className="text-[18px]" />
            {!collapsed && <span>Adicionar pasta</span>}
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-w-0">
        {collapsed ? null : (
          <h2 className="text-sm font-semibold text-gray-400 mb-2">VOLUMES</h2>
        )}

        {!collapsed && (
          <>
            {volumes.map((volume) => {
              const revealX = dragXByVolumeUuid[volume.uuid] ?? (openVolumeActionsUuid === volume.uuid ? -120 : 0);
              const isRevealed = revealX < 0;
              const canEject = volume.type === 'external' && volume.status === 'connected' && !!volume.mountPoint;

              return (
                <div key={volume.uuid} className="relative mb-2">
                  <div
                    className={`absolute inset-0 flex items-center justify-end gap-2 rounded px-2 transition-opacity ${
                      revealX < -60 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    } bg-gray-800`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleHideVolume(volume.uuid, volume.label);
                        closeVolumeSwipe(volume.uuid);
                      }}
                      className="rounded bg-red-800 px-2 py-1 text-[10px] text-white transition hover:bg-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]"
                      title="Remover"
                    >
                      Remover
                    </button>

                    {canEject && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleEjectVolume(volume.uuid);
                          closeVolumeSwipe(volume.uuid);
                        }}
                        className="rounded bg-white/10 px-2 py-1 text-[10px] text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060010]"
                        title="Ejetar"
                      >
                        Ejetar
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => {
                      const sup = suppressVolumeClickRef.current;
                      if (sup && sup.uuid === volume.uuid && Date.now() < sup.until) {
                        return;
                      }
                      if (openVolumeActionsUuid === volume.uuid) {
                        closeVolumeSwipe(volume.uuid);
                        return;
                      }
                      onSelectVolume(volume.uuid);
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      beginRenameVolume(volume.uuid, volume.label);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setVolumeMenu({ uuid: volume.uuid, x: e.clientX, y: e.clientY });
                    }}
                    onPointerDown={(e) => onVolumePointerDown(volume.uuid, e)}
                    onPointerMove={(e) => onVolumePointerMove(volume.uuid, e)}
                    onPointerUp={() => onVolumePointerUp(volume.uuid)}
                    onPointerCancel={() => onVolumePointerUp(volume.uuid)}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedVolumeUuid === volume.uuid 
                        ? 'bg-white/10' 
                        : 'hover:bg-white/5'
                    }`}
                    style={{
                      transform: `translateX(${revealX}px)`,
                      transition:
                        dragVolumeStateRef.current?.uuid === volume.uuid && dragVolumeStateRef.current?.dragging
                          ? 'none'
                          : 'transform 120ms ease'
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          volume.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />

                      {editingVolumeUuid === volume.uuid ? (
                        <input
                          value={editingVolumeLabel}
                          onChange={(e) => setEditingVolumeLabel(e.target.value)}
                          onBlur={() => void commitRenameVolume(volume.uuid)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void commitRenameVolume(volume.uuid);
                            if (e.key === 'Escape') cancelRenameVolume();
                          }}
                          autoFocus
                          className="w-full px-2 py-1 text-sm mh-control"
                        />
                      ) : (
                        <span className="text-sm truncate flex-1">{volume.label}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 ml-4 truncate">
                      {volume.mountPoint || 'Desconectado'}
                    </div>
                  </div>
                </div>
              );
            })}

            {volumeMenu && (() => {
              const v = volumes.find((x) => x.uuid === volumeMenu.uuid);
              const canEject =
                v?.type === 'external' && v?.status === 'connected' && !!v?.mountPoint;

              return (
                <div
                  className="fixed z-[70] w-44 mh-menu shadow-xl"
                  style={{ left: volumeMenu.x, top: volumeMenu.y }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="mh-menu-item"
                    onClick={() => {
                      const uuid = volumeMenu.uuid;
                      const v2 = volumes.find((x) => x.uuid === uuid);
                      setVolumeMenu(null);
                      if (v2) beginRenameVolume(v2.uuid, v2.label);
                    }}
                  >
                    Renomear
                  </button>

                  {canEject && (
                    <button
                      type="button"
                      className="mh-menu-item"
                      onClick={() => {
                        const uuid = volumeMenu.uuid;
                        setVolumeMenu(null);
                        void handleEjectVolume(uuid);
                      }}
                    >
                      Ejetar
                    </button>
                  )}

                  <button
                    type="button"
                    className="mh-menu-item-danger"
                    onClick={() => {
                      const uuid = volumeMenu.uuid;
                      const v2 = volumes.find((x) => x.uuid === uuid);
                      setVolumeMenu(null);
                      if (v2) void handleHideVolume(v2.uuid, v2.label);
                    }}
                  >
                    Remover
                  </button>
                </div>
              );
            })()}

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-400">COLEÇÕES</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCollection((v) => !v)}
                    className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
                    aria-label="Adicionar coleção"
                    title="Adicionar coleção"
                  >
                    <MaterialIcon name="add" className="text-[18px]" />
                  </button>
                </div>
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
                    className="w-full px-2 py-2 text-sm mh-control"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCreateCollection()}
                      className="mh-btn mh-btn-indigo flex-1 px-3 py-2 text-xs"
                    >
                      Criar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCollection(false);
                        setNewCollectionName('');
                      }}
                      className="mh-btn mh-btn-gray flex-1 px-3 py-2 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {collections.map((c) => {
                  const revealX =
                    c.id === 'favorites'
                      ? 0
                      : (dragXByCollectionId[c.id] ?? (openDeleteCollectionId === c.id ? -80 : 0));
                  const isRevealed = c.id !== 'favorites' && revealX < 0;

                  return (
                    <div key={c.id} className="relative">
                      {c.id !== 'favorites' && (
                        <div
                          className={`absolute inset-0 flex items-center justify-end rounded bg-gray-800 px-2 transition-opacity ${
                            revealX < -60 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteCollection(c.id, c.name);
                              closeDeleteSwipe(c.id);
                            }}
                            className="rounded bg-red-800 px-2 py-1 text-[10px] text-white transition hover:bg-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        </div>
                      )}

                      <div
                      onClick={() => {
                        const sup = suppressClickRef.current;
                        if (sup && sup.id === c.id && Date.now() < sup.until) {
                          return;
                        }
                        if (openDeleteCollectionId === c.id) {
                          closeDeleteSwipe(c.id);
                          return;
                        }
                        onSelectCollection(c.id);
                      }}
                      onDoubleClick={(e) => {
                        if (c.id === 'favorites') return;
                        e.preventDefault();
                        e.stopPropagation();
                        beginRenameCollection(c.id, c.name);
                      }}
                      onContextMenu={(e) => {
                        if (c.id === 'favorites') return;
                        e.preventDefault();
                        e.stopPropagation();
                        setCollectionMenu({ id: c.id, x: e.clientX, y: e.clientY });
                      }}
                      onDragOver={allowDrop}
                      onDrop={(e) => void handleDropToCollection(e, c.id)}
                      onPointerDown={(e) => onCollectionPointerDown(c.id, e)}
                      onPointerMove={(e) => onCollectionPointerMove(c.id, e)}
                      onPointerUp={() => onCollectionPointerUp(c.id)}
                      onPointerCancel={() => onCollectionPointerUp(c.id)}
                      className={`flex items-center justify-between rounded px-2 py-1 cursor-pointer transition-colors ${
                        selectedCollectionId === c.id 
                          ? 'bg-white/10' 
                          : 'hover:bg-white/5'
                      }`}
                      title={c.id}
                      style={{
                        transform: `translateX(${revealX}px)`,
                        transition:
                          dragStateRef.current?.id === c.id && dragStateRef.current?.dragging ? 'none' : 'transform 120ms ease'
                      }}
                    >
                      {editingCollectionId === c.id ? (
                        <input
                          value={editingCollectionName}
                          onChange={(e) => setEditingCollectionName(e.target.value)}
                          onBlur={() => void commitRenameCollection(c.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void commitRenameCollection(c.id);
                            if (e.key === 'Escape') cancelRenameCollection();
                          }}
                          autoFocus
                          className="w-full px-2 py-1 text-sm mh-control"
                        />
                      ) : (
                        <span className="text-sm truncate">{c.name}</span>
                      )}
                      <span className="text-[10px] text-gray-400">{c.count}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {collectionMenu && (
              <div
                className="fixed z-[70] w-44 mh-menu shadow-xl"
                style={{ left: collectionMenu.x, top: collectionMenu.y }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="mh-menu-item"
                  onClick={() => {
                    const id = collectionMenu.id;
                    const c = collections.find((x) => x.id === id);
                    setCollectionMenu(null);
                    if (c) beginRenameCollection(c.id, c.name);
                  }}
                >
                  Renomear
                </button>
                <button
                  type="button"
                  className="mh-menu-item-danger"
                  onClick={() => {
                    const id = collectionMenu.id;
                    const c = collections.find((x) => x.id === id);
                    setCollectionMenu(null);
                    if (c) void handleDeleteCollection(c.id, c.name);
                  }}
                >
                  Excluir
                </button>
              </div>
            )}

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-400">PASTAS</h2>
                {selectedVolumeUuid && (
                  <button
                    type="button"
                    onClick={() => onSelectFolder(null)}
                    className="text-xs text-gray-300 hover:text-white"
                  >
                    Todas
                  </button>
                )}
              </div>

              {selectedVolumeUuid && currentFolderLabel && (
                <div className="mb-2 flex items-center justify-between rounded bg-gray-900/40 px-2 py-1">
                  <div className="min-w-0">
                    <div className="text-[10px] text-gray-400">Atual</div>
                    <div className="truncate text-xs text-gray-200" title={selectedPathPrefix ?? ''}>
                      {currentFolderLabel}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectFolder(currentFolderParent)}
                    className="rounded bg-white/10 px-2 py-1 text-[10px] text-white transition hover:bg-white/15"
                    title="Voltar"
                  >
                    <div className="flex items-center gap-1">
                      <MaterialIcon name="arrow_upward" className="text-[14px]" />
                      <span>Voltar</span>
                    </div>
                  </button>
                </div>
              )}

              {!selectedVolumeUuid ? (
                <div className="text-xs text-gray-500">Selecione um volume para navegar pelas pastas</div>
              ) : (
                <div className="space-y-1">
                  <div
                    onClick={() => onSelectFolder(null)}
                    className={`rounded px-2 py-1 cursor-pointer transition-colors ${
                      !selectedPathPrefix ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                    title="Todas as pastas"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">Todas as pastas</span>
                    </div>
                  </div>

                  {isFoldersLoading ? (
                    <div className="rounded bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-300">
                      Carregando pastas…
                    </div>
                  ) : rootChildren.length === 0 ? (
                    <div className="rounded bg-white/5 border border-white/10 px-3 py-2 text-xs text-gray-400">
                      Nenhuma pasta encontrada
                    </div>
                  ) : (
                    rootChildren.map((c) => renderNode(c, 0))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="px-4 pb-3">
          <button
            type="button"
            className="mh-btn mh-btn-gray w-full px-3 py-2 text-sm"
            onClick={() => onOpenPreferences?.()}
          >
            <div className="flex items-center justify-center gap-2">
              <MaterialIcon name="settings" className="text-[18px]" />
              <span>Preferências</span>
            </div>
          </button>
        </div>
      )}

      <div className={`p-4 border-t border-gray-700 text-xs text-gray-500 ${collapsed ? 'text-center' : ''}`}>
        {collapsed ? (
          <div>v{APP_VERSION}</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <img src={logoFull} alt="Zona21" className="h-4 opacity-70" />
              <span>v{APP_VERSION}</span>
            </div>
            <div>Feito com ❤️ por Almar</div>
            <div>© 2026. Todos os direitos reservados.</div>
          </>
        )}
      </div>
    </div>
  );
}
