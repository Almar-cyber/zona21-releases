import { useMemo, useRef, useState, useEffect } from 'react';
import type React from 'react';
import { Volume } from '../shared/types';
import Icon from './Icon.tsx';
import logoFull from '../assets/logotipo-white.png';
import logoCollapsed from '../assets/logotipo-resum-white.png';
import ConfirmDialog from './ConfirmDialog';

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
  onToggleCollapse?: () => void;
}

type FolderChild = { name: string; path: string; assetCount: number };

export default function Sidebar({
  onIndexDirectory,
  selectedVolumeUuid,
  selectedPathPrefix,
  onSelectVolume,
  onSelectCollection,
  onSelectFolder,
  onMoveAssetsToFolder,
  selectedCollectionId,
  collectionsRefreshToken,
  collapsed,
  className,
  onOpenPreferences,
  onToggleCollapse
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
  const [markingCounts, setMarkingCounts] = useState<{
    favorites: number;
    approved: number;
    rejected: number;
  }>({ favorites: 0, approved: 0, rejected: 0 });
  const [dragOverCollection, setDragOverCollection] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    childrenByPathRef.current = childrenByPath;
  }, [childrenByPath]);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  useEffect(() => {
    loadVolumes();
    loadCollections();
    loadMarkingCounts();
  }, []);

  // Escutar evento de mudança de volumes (indexação, remoção)
  useEffect(() => {
    const onVolumesChanged = () => {
      loadVolumes();
    };
    window.addEventListener('zona21-volumes-changed', onVolumesChanged);
    return () => window.removeEventListener('zona21-volumes-changed', onVolumesChanged);
  }, []);

  // Listen for marking changes
  useEffect(() => {
    const onMarkingsChanged = () => {
      loadMarkingCounts();
    };
    window.addEventListener('zona21-markings-changed', onMarkingsChanged);
    return () => window.removeEventListener('zona21-markings-changed', onMarkingsChanged);
  }, []);

  useEffect(() => {
    loadCollections();
  }, [collectionsRefreshToken]);

  useEffect(() => {
    loadCollections();
  }, [selectedCollectionId]);

  const loadVolumes = async () => {
    try {
      const loadedVolumes = await window.electronAPI.getVolumes();
      setVolumes(Array.isArray(loadedVolumes) ? loadedVolumes : []);
    } catch {
      setVolumes([]);
    }
    setOpenVolumeActionsUuid(null);
    setDragXByVolumeUuid({});
  };

  const handleEjectVolume = (uuid: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Ejetar disco',
      message: 'Deseja ejetar este disco? Certifique-se de que não há operações em andamento.',
      confirmLabel: 'Ejetar',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(null);
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
      }
    });
  };

  const handleHideVolume = (uuid: string, label: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remover armazenamento',
      message: `Deseja remover "${label}" da lista? Os arquivos não serão excluídos do disco.`,
      confirmLabel: 'Remover',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
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
      }
    });
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

  const loadMarkingCounts = async () => {
    try {
      const counts = await (window.electronAPI as any).getMarkingCounts();
      if (counts && !counts.error) {
        setMarkingCounts(counts);
      }
    } catch {
      // ignore
    }
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToCollection = async (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    setDragOverCollection(null);
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
    const x = clamp(dx, -80, 0);
    setDragXByVolumeUuid((prev) => ({ ...prev, [uuid]: x }));
  };

  const onVolumePointerUp = (uuid: string) => {
    const s = dragVolumeStateRef.current;
    dragVolumeStateRef.current = null;
    const x = dragXByVolumeUuid[uuid] ?? 0;
    if (s?.dragging) {
      suppressVolumeClickRef.current = { uuid, until: Date.now() + 400 };
    }
    if (s?.dragging && x <= -40) {
      setOpenVolumeActionsUuid(uuid);
      setDragXByVolumeUuid((prev) => ({ ...prev, [uuid]: -80 }));
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
    const x = clamp(dx, -70, 0);
    setDragXByCollectionId((prev) => ({ ...prev, [collectionId]: x }));
  };

  const onCollectionPointerUp = (collectionId: string) => {
    const s = dragStateRef.current;
    dragStateRef.current = null;
    const x = dragXByCollectionId[collectionId] ?? 0;
    if (s?.dragging) {
      suppressClickRef.current = { id: collectionId, until: Date.now() + 400 };
    }
    if (s?.dragging && x <= -35) {
      setOpenDeleteCollectionId(collectionId);
      setDragXByCollectionId((prev) => ({ ...prev, [collectionId]: -70 }));
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

  const handleDeleteCollection = (collectionId: string, currentName: string) => {
    if (collectionId === 'favorites') return;
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir coleção',
      message: `Deseja excluir a coleção "${currentName}"? Os arquivos não serão excluídos.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
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
      }
    });
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

  useEffect(() => {
    const preloadChildren = async () => {
      for (const node of rootChildren) {
        if (childrenByPath[node.path] === undefined) {
          await loadChildren(node.path);
        }
      }
    };
    if (rootChildren.length > 0) {
      void preloadChildren();
    }
  }, [rootChildren]);

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
    const kids = childrenByPath[key];
    const isActive = selectedPathPrefix === node.path;
    const hasChildren = kids !== undefined ? kids.length > 0 : true;

    return (
      <div key={node.path} className="relative">
        {/* Linha vertical conectora para profundidade > 0 */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-gray-700/50"
            style={{ left: `${8 + (depth - 1) * 16}px` }}
          />
        )}

        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors relative ${
            isActive ? 'bg-[#0D0D1A]' : isOpen ? 'bg-[#0D0D1A]/50' : 'hover:bg-white/5'
          }`}
          style={{ paddingLeft: depth > 0 ? 8 + depth * 16 : 12 }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void toggleExpand(node.path);
              }}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white shrink-0"
              title={isOpen ? 'Recolher' : 'Expandir'}
            >
              <Icon name={isOpen ? 'expand_more' : 'chevron_right'} size={18} className="text-gray-400" />
            </button>
          ) : (
            <div className="w-5 h-5 shrink-0" />
          )}
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
              <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{node.name}</span>
              {node.assetCount > 0 && (
                <span className="min-w-[24px] text-center text-xs font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full tabular-nums">{node.assetCount}</span>
              )}
            </div>
          </div>
          {isActive && (
            <Icon name="chevron_right" size={18} className="text-gray-400 shrink-0" />
          )}
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
    <div className="relative shrink-0 flex mx-4 my-5">
      {/* Botão de Collapse - Flutuante no canto superior direito, alinhado com header */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-[22px] z-[70] w-[44px] h-[44px] flex items-center justify-center transition-all"
          style={{
            top: collapsed ? '26px' : '18px',
            WebkitAppRegion: 'no-drag',
            filter: 'drop-shadow(0 0 6px rgba(28, 117, 253, 0.3))'
          } as any}
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {/* Circle with exact Figma specs */}
          <div className="w-7 h-7 rounded-full bg-[#744AD5] hover:bg-[#6838C7] flex items-center justify-center transition-colors">
            <Icon name={collapsed ? "chevron_right" : "chevron_left"} size={16} className="text-white" />
          </div>
        </button>
      )}

      {/* Container da Sidebar */}
      <div
        className={`${collapsed ? 'w-[124px]' : 'w-60'} mh-sidebar flex flex-col relative z-[60] ${className || ''}`}
        style={{
          background: '#121124',
          borderRadius: '24px',
          backdropFilter: 'blur(150px)',
          WebkitBackdropFilter: 'blur(150px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Header com espaço para traffic lights e logo - centralizado verticalmente */}
        <div
          className={`shrink-0 flex items-center relative ${collapsed ? 'h-24 justify-center px-2' : 'h-20 px-4'}`}
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          {collapsed ? (
            <div className="w-14">
              <img src={logoCollapsed} alt="Zona21" className="w-full h-auto object-contain" />
            </div>
          ) : (
            <div className="w-24">
              <img src={logoFull} alt="Zona21" className="w-full h-auto object-contain" />
            </div>
          )}
        </div>

        {/* Separador após header quando colapsado */}
        {collapsed && <div className="mx-6 border-t border-white/10 mb-4" />}

      <div className="p-4">
        <div className={collapsed ? 'mx-auto flex flex-col items-center gap-2' : ''}>
          <button
            onClick={onIndexDirectory}
            className={
              collapsed
                ? 'flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] text-white transition hover:bg-[#6D28D9] shadow-[0_6px_20px_rgba(124,58,237,0.45)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.55)]'
                : 'w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3.5 px-6 rounded-full transition shadow-[0_4px_16px_rgba(124,58,237,0.5)] hover:shadow-[0_6px_24px_rgba(124,58,237,0.6)] font-semibold'
            }
            title="Adicionar pasta"
            type="button"
          >
            <div className="flex items-center justify-center gap-2">
              <Icon name="create_new_folder" size={collapsed ? 20 : 20} />
              {!collapsed && <span className="text-sm">Adicionar pasta</span>}
            </div>
          </button>
          {collapsed && (
            <div className="text-[10px] font-medium text-gray-400">Adicionar</div>
          )}
        </div>
      </div>


      <div className={`flex-1 overflow-y-auto p-4 min-w-0 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {collapsed ? (
          <div className="w-full flex flex-col items-center">
            <div className="space-y-3">
              {volumes.map((volume) => (
                <button
                  key={volume.uuid}
                  type="button"
                  onClick={() => onSelectVolume(volume.uuid)}
                  className="w-20 flex flex-col items-center gap-1"
                  title={volume.label}
                >
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-xl cursor-pointer transition-colors ${
                      selectedVolumeUuid === volume.uuid ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <Icon
                      name="folder"
                      size={20}
                      className={selectedVolumeUuid === volume.uuid ? 'text-indigo-400' : 'text-gray-400'}
                    />
                  </div>
                  <div className="max-w-[80px] truncate text-[10px] text-gray-500">
                    {volume.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="my-4 w-20 border-t border-white/10" />

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onSelectCollection('__marking_favorites')}
                className="w-20 flex flex-col items-center gap-1"
                title="Favoritos"
              >
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-xl cursor-pointer transition-colors ${
                    selectedCollectionId === '__marking_favorites' ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <Icon
                    name="star"
                    size={20}
                    className={selectedCollectionId === '__marking_favorites' ? 'text-yellow-400' : 'text-gray-400'}
                  />
                </div>
                <div className="text-[10px] text-gray-500">Favoritos</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectCollection('__marking_approved')}
                className="w-20 flex flex-col items-center gap-1"
                title="Aprovados"
              >
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-xl cursor-pointer transition-colors ${
                    selectedCollectionId === '__marking_approved' ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <Icon
                    name="check"
                    size={20}
                    className={selectedCollectionId === '__marking_approved' ? 'text-green-400' : 'text-gray-400'}
                  />
                </div>
                <div className="text-[10px] text-gray-500">Aprovados</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectCollection('__marking_rejected')}
                className="w-20 flex flex-col items-center gap-1"
                title="Desprezados"
              >
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-xl cursor-pointer transition-colors ${
                    selectedCollectionId === '__marking_rejected' ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <Icon
                    name="close"
                    size={20}
                    className={selectedCollectionId === '__marking_rejected' ? 'text-red-400' : 'text-gray-400'}
                  />
                </div>
                <div className="text-[10px] text-gray-500">Rejeit.</div>
              </button>
            </div>
          </div>
        ) : (
          <h2 className="text-xs font-semibold text-gray-500 mb-3 tracking-wider">VOLUME</h2>
        )}

        {!collapsed && (
          <>
            {volumes.map((volume) => {
              const revealX = dragXByVolumeUuid[volume.uuid] ?? (openVolumeActionsUuid === volume.uuid ? -80 : 0);
              const revealProgress = Math.min(1, Math.abs(revealX) / 80);
              const isDragging = dragVolumeStateRef.current?.uuid === volume.uuid && dragVolumeStateRef.current?.dragging;

              return (
                <div key={volume.uuid} className="relative mb-2 overflow-hidden rounded-lg">
                  {/* Ação de swipe - estilo Gmail */}
                  <div
                    className="absolute inset-y-0 right-0 flex items-center"
                    style={{
                      width: '80px',
                      background: `rgba(185, 28, 28, ${0.6 + revealProgress * 0.4})`,
                      opacity: revealProgress > 0.1 ? 1 : 0,
                      transition: isDragging ? 'none' : 'opacity 150ms ease, background 150ms ease',
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleHideVolume(volume.uuid, volume.label);
                        closeVolumeSwipe(volume.uuid);
                      }}
                      className="w-full h-full flex flex-col items-center justify-center gap-1 text-white/90 hover:text-white transition-colors"
                      style={{
                        transform: `scale(${0.8 + revealProgress * 0.2})`,
                        opacity: revealProgress,
                        transition: isDragging ? 'none' : 'transform 150ms ease, opacity 150ms ease',
                      }}
                    >
                      <Icon name="trash" size={18} />
                      <span className="text-[10px] font-medium">Remover</span>
                    </button>
                  </div>

                  {/* Item principal */}
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
                    className={`relative px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedVolumeUuid === volume.uuid
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    } ${revealX < 0 ? 'bg-[#0d0d1a]' : ''}`}
                    style={{
                      transform: `translateX(${revealX}px)`,
                      transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="folder" size={18} className={selectedVolumeUuid === volume.uuid ? 'text-indigo-400 shrink-0' : 'text-gray-400 shrink-0'} />
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
                          className="w-full px-2 py-1 text-sm font-medium mh-control"
                        />
                      ) : (
                        <span className={`text-sm font-medium truncate ${selectedVolumeUuid === volume.uuid ? 'text-white' : 'text-gray-300'}`}>{volume.label}</span>
                      )}
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

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-gray-500 tracking-wider">COLEÇÕES</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCollection((v) => !v)}
                    className="mh-btn mh-btn-gray h-8 w-8 flex items-center justify-center"
                    aria-label="Adicionar coleção"
                    title="Adicionar coleção"
                  >
                    <Icon name="add" size={18} />
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

              {/* Fixed marking collections */}
              <div className="space-y-1 mb-3">
                {/* Favoritos */}
                <div
                  onClick={() => onSelectCollection('__marking_favorites')}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    selectedCollectionId === '__marking_favorites'
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon name="star" size={18} className={selectedCollectionId === '__marking_favorites' ? 'text-yellow-400' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${selectedCollectionId === '__marking_favorites' ? 'text-white' : 'text-gray-300'}`}>Favoritos</span>
                  </div>
                  <span className="min-w-[24px] text-center text-xs font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full tabular-nums">{markingCounts.favorites}</span>
                </div>

                {/* Aprovados */}
                <div
                  onClick={() => onSelectCollection('__marking_approved')}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    selectedCollectionId === '__marking_approved'
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon name="check" size={18} className={selectedCollectionId === '__marking_approved' ? 'text-green-400' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${selectedCollectionId === '__marking_approved' ? 'text-white' : 'text-gray-300'}`}>Aprovados</span>
                  </div>
                  <span className="min-w-[24px] text-center text-xs font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full tabular-nums">{markingCounts.approved}</span>
                </div>

                {/* Desprezados */}
                <div
                  onClick={() => onSelectCollection('__marking_rejected')}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                    selectedCollectionId === '__marking_rejected'
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon name="close" size={18} className={selectedCollectionId === '__marking_rejected' ? 'text-red-400' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${selectedCollectionId === '__marking_rejected' ? 'text-white' : 'text-gray-300'}`}>Desprezados</span>
                  </div>
                  <span className="min-w-[24px] text-center text-xs font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full tabular-nums">{markingCounts.rejected}</span>
                </div>
              </div>

              {/* User collections */}
              <div className="space-y-1">
                {collections.map((c) => {
                  const revealX =
                    c.id === 'favorites'
                      ? 0
                      : (dragXByCollectionId[c.id] ?? (openDeleteCollectionId === c.id ? -70 : 0));
                  const revealProgress = Math.min(1, Math.abs(revealX) / 70);
                  const isDraggingCollection = dragStateRef.current?.id === c.id && dragStateRef.current?.dragging;

                  return (
                    <div key={c.id} className="relative overflow-hidden rounded-lg">
                      {/* Ação de swipe - estilo Gmail */}
                      {c.id !== 'favorites' && (
                        <div
                          className="absolute inset-y-0 right-0 flex items-center"
                          style={{
                            width: '70px',
                            background: `rgba(185, 28, 28, ${0.6 + revealProgress * 0.4})`,
                            opacity: revealProgress > 0.1 ? 1 : 0,
                            transition: isDraggingCollection ? 'none' : 'opacity 150ms ease, background 150ms ease',
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteCollection(c.id, c.name);
                              closeDeleteSwipe(c.id);
                            }}
                            className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-white/90 hover:text-white transition-colors"
                            style={{
                              transform: `scale(${0.8 + revealProgress * 0.2})`,
                              opacity: revealProgress,
                              transition: isDraggingCollection ? 'none' : 'transform 150ms ease, opacity 150ms ease',
                            }}
                          >
                            <Icon name="trash" size={16} />
                            <span className="text-[9px] font-medium">Excluir</span>
                          </button>
                        </div>
                      )}

                      {/* Item principal */}
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
                        onDragOver={(e: React.DragEvent) => {
                          allowDrop(e);
                          setDragOverCollection(c.id);
                        }}
                        onDragLeave={() => setDragOverCollection(null)}
                        onDrop={(e) => void handleDropToCollection(e, c.id)}
                        onPointerDown={(e) => onCollectionPointerDown(c.id, e)}
                        onPointerMove={(e) => onCollectionPointerMove(c.id, e)}
                        onPointerUp={() => onCollectionPointerUp(c.id)}
                        onPointerCancel={() => onCollectionPointerUp(c.id)}
                        className={`relative flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 ${
                          selectedCollectionId === c.id
                            ? 'bg-white/10'
                            : 'hover:bg-white/5'
                        } ${revealX < 0 ? 'bg-[#0d0d1a]' : ''} ${
                          dragOverCollection === c.id
                            ? 'ring-2 ring-[#4F46E5] bg-[#4F46E5]/10 scale-105'
                            : ''
                        }`}
                        title={c.name}
                        style={{
                          transform: `translateX(${revealX}px)`,
                          transition: isDraggingCollection ? 'none' : 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        }}
                      >
                      {/* Ícone de "drop here" quando dragging */}
                      {dragOverCollection === c.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#4F46E5]/20 rounded-lg pointer-events-none">
                          <Icon name="add_circle" size={24} className="text-[#4F46E5]" />
                        </div>
                      )}

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
                        <span className={`text-sm font-medium truncate relative z-10 ${selectedCollectionId === c.id ? 'text-white' : 'text-gray-300'}`}>{c.name}</span>
                      )}
                      <span className="min-w-[24px] text-center text-xs font-medium text-gray-500 bg-white/5 px-2 py-0.5 rounded-full tabular-nums relative z-10">{c.count}</span>
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

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-gray-500 tracking-wider">PASTAS</h2>
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
                      <Icon name="arrow_upward" size={14} />
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

      <div className={`p-4 mt-auto border-t border-white/5 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          className={
            collapsed
              ? 'h-10 w-10 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5'
              : 'w-full px-3 py-2 text-sm rounded-lg transition-colors hover:bg-white/5'
          }
          onClick={() => onOpenPreferences?.()}
          aria-label="Preferências"
          title="Preferências"
        >
          {collapsed ? (
            <Icon name="settings" size={18} className="text-gray-400" />
          ) : (
            <div className="flex items-center gap-3 w-full">
              <Icon name="settings" size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Preferências</span>
            </div>
          )}
        </button>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog?.isOpen ?? false}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        onCancel={() => setConfirmDialog(null)}
      />
      </div>
    </div>
  );
}
