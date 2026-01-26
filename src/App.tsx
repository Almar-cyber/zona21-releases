import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import Library from './components/Library.tsx';
import Toolbar from './components/Toolbar.tsx';
import Sidebar from './components/Sidebar.tsx';
import Viewer from './components/Viewer.tsx';
import { APP_VERSION } from './version';
import SelectionTray from './components/SelectionTray.tsx';
import MoveModal from './components/MoveModal.tsx';
import DuplicatesModal from './components/DuplicatesModal.tsx';
import CopyModal from './components/CopyModal.tsx';
import ExportZipModal from './components/ExportZipModal.tsx';
import ToastHost, { type Toast } from './components/ToastHost.tsx';
import LastOperationPanel, { type LastOperation } from './components/LastOperationPanel.tsx';
import GalaxyBackground from './components/GalaxyBackground.tsx';
import OnboardingWizard from './components/OnboardingWizard.tsx';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal.tsx';
import PreferencesModal from './components/PreferencesModal.tsx';
import EmptyState from './components/EmptyState';
import UpdateBanner from './components/UpdateBanner';
import MobileSidebar from './components/MobileSidebar.tsx';
import MaterialIcon from './components/MaterialIcon.tsx';
import { Asset, IndexProgress } from './shared/types';
import { ipcInvoke } from './shared/ipcInvoke';

function App() {
  const PAGE_SIZE = 500;

  const assetsRef = useRef<Array<Asset | null>>([]);
  const [assetsVersion, setAssetsVersion] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewerAsset, setViewerAsset] = useState<Asset | null>(null);
  const [trayAssetIds, setTrayAssetIds] = useState<string[]>([]);
  const [trayAssets, setTrayAssets] = useState<Asset[]>([]);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isDuplicatesOpen, setIsDuplicatesOpen] = useState(false);
  const [isCopyOpen, setIsCopyOpen] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyProgress, setCopyProgress] = useState<any>(null);
  const [isZipOpen, setIsZipOpen] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipProgress, setZipProgress] = useState<any>(null);
  const [zipJobId, setZipJobId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastOp, setLastOp] = useState<LastOperation | null>(null);
  const [moveDestinationMode, setMoveDestinationMode] = useState<'tree' | 'dialog'>('tree');
  const [moveDestinationDir, setMoveDestinationDir] = useState<string | null>(null);
  const [moveDestinationPathPrefix, setMoveDestinationPathPrefix] = useState<string | null>(null);
  const [moveUnderstood, setMoveUnderstood] = useState(false);
  const [moveBusy, setMoveBusy] = useState(false);
  const [moveConflictsCount, setMoveConflictsCount] = useState(0);
  const [collectionsRefreshToken, setCollectionsRefreshToken] = useState(0);
  const [selectedVolumeDisconnected, setSelectedVolumeDisconnected] = useState(false);
  const [isSelectedVolumeStatusLoading, setIsSelectedVolumeStatusLoading] = useState(false);
  const [hasAnyConnectedVolume, setHasAnyConnectedVolume] = useState<boolean | null>(null);
  const [isVolumesStatusLoading, setIsVolumesStatusLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [telemetryConsent, setTelemetryConsent] = useState<boolean | null>(null); // Mantido para compatibilidade futura
  const [showTelemetryPrompt, setShowTelemetryPrompt] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [filters, setFilters] = useState({
    mediaType: undefined,
    datePreset: undefined,
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
    groupByDate: false,
    flagged: undefined as boolean | undefined,
    volumeUuid: null as string | null,
    pathPrefix: null as string | null,
    collectionId: null as string | null
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const findVisualNeighborIndex = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down', fromIndex: number): number | null => {
      const fromNode = document.querySelector(`[data-asset-index="${fromIndex}"]`) as HTMLElement | null;
      if (!fromNode) return null;
      const fromRect = fromNode.getBoundingClientRect();
      const fromCx = fromRect.left + fromRect.width / 2;
      const fromCy = fromRect.top + fromRect.height / 2;

      const nodes = Array.from(document.querySelectorAll('[data-asset-index]')) as HTMLElement[];
      if (nodes.length === 0) return null;

      let best: { idx: number; score: number } | null = null;
      for (const n of nodes) {
        const raw = n.getAttribute('data-asset-index');
        if (!raw) continue;
        const idx = Number(raw);
        if (!Number.isFinite(idx) || idx === fromIndex) continue;

        const r = n.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - fromCx;
        const dy = cy - fromCy;

        // filter by direction (with a small tolerance)
        const tol = 6;
        if (direction === 'left' && dx >= -tol) continue;
        if (direction === 'right' && dx <= tol) continue;
        if (direction === 'up' && dy >= -tol) continue;
        if (direction === 'down' && dy <= tol) continue;

        // score prefers mostly-horizontal moves for left/right, mostly-vertical for up/down
        const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
        const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
        const score = primary * 1 + secondary * 2;

        if (!best || score < best.score) best = { idx, score };
      }

      return best?.idx ?? null;
    },
    [assetsVersion] // Recalcular quando os assets mudam
  );

  const loadedPagesRef = useRef<Set<number>>(new Set());
  const inFlightPagesRef = useRef<Set<number>>(new Set());
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState<IndexProgress>({
    total: 0,
    indexed: 0,
    currentFile: null,
    status: 'idle'
  });
  const [indexStartTime, setIndexStartTime] = useState<number | null>(null);
  const [updateStatus, setUpdateStatus] = useState<any>(null);

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, ...t }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showOfflineLibraryMessage = useMemo(() => {
    if (selectedVolumeDisconnected) return true;
    if (totalCount <= 0) return false;

    const sample = assetsRef.current
      .filter(Boolean)
      .slice(0, 80) as Asset[];

    if (sample.length === 0) return false;
    const hasAnyOnline = sample.some((a) => a.status === 'online');
    const hasAnyThumb = sample.some((a) => Array.isArray(a.thumbnailPaths) && a.thumbnailPaths.length > 0);
    if (!hasAnyOnline) return true;
    if (!hasAnyThumb) return true;
    return false;
  }, [selectedVolumeDisconnected, totalCount, assetsVersion]);

  const refreshVolumesStatus = useCallback(async () => {
    try {
      setIsVolumesStatusLoading(true);
      const vols = await window.electronAPI.getVolumes();
      setHasAnyConnectedVolume(vols.some((v: any) => v?.status === 'connected'));
    } catch {
      setHasAnyConnectedVolume(null);
    } finally {
      setIsVolumesStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshVolumesStatus();
  }, [refreshVolumesStatus]);

  useEffect(() => {
    const onFocus = () => {
      void refreshVolumesStatus();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshVolumesStatus]);

  const revealPath = useCallback(async (p: string) => {
    const fn = (window.electronAPI as any)?.revealPath;
    if (typeof fn !== 'function') return;
    await (window.electronAPI as any).revealPath(p);
  }, []);

  const copyText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        pushToast({ type: 'success', message: 'Copiado para a área de transferência', timeoutMs: 2000 });
      } catch {
        pushToast({ type: 'error', message: 'Não foi possível copiar para a área de transferência' });
      }
    },
    [pushToast]
  );

  useEffect(() => {
    const run = async () => {
      const fnGet = (window.electronAPI as any)?.getTelemetryConsent;
      if (typeof fnGet !== 'function') return;
      try {
        const consent = await (window.electronAPI as any).getTelemetryConsent();
        setTelemetryConsent(consent);
        setShowTelemetryPrompt(consent === null);
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  useEffect(() => {
    // Verificar se é primeira execução para mostrar onboarding
    const hasCompletedOnboarding = localStorage.getItem(`zona21-onboarding-${APP_VERSION}`);
    const hasAnyVolume = localStorage.getItem('zona21-has-any-volume');
    
    // Se não completou onboarding E não tem nenhum volume, mostrar onboarding
    if (!hasCompletedOnboarding && !hasAnyVolume) {
      setShowOnboarding(true);
    }
  }, []);

  const confirmTelemetryConsent = useCallback(async (enabled: boolean) => {
    const fnSet = (window.electronAPI as any)?.setTelemetryConsent;
    if (typeof fnSet !== 'function') {
      setTelemetryConsent(enabled);
      setShowTelemetryPrompt(false);
      return;
    }
    try {
      await (window.electronAPI as any).setTelemetryConsent(enabled);
    } catch {
      // ignore
    }
    setTelemetryConsent(enabled);
    setShowTelemetryPrompt(false);
  }, []);

  useEffect(() => {
    const onToast = (e: CustomEvent) => {
      const detail: any = (e as any).detail;
      if (!detail) return;
      const type = detail.type;
      if (type !== 'success' && type !== 'error' && type !== 'info') return;
      pushToast({ type, message: detail.message, timeoutMs: detail.timeoutMs });
    };
    window.addEventListener('zona21-toast', onToast as any);
    return () => window.removeEventListener('zona21-toast', onToast as any);
  }, [pushToast]);

  // Atualizar estado de volumes quando um volume é adicionado/removido
  useEffect(() => {
    const onVolumesChanged = () => {
      refreshVolumesStatus();
    };
    window.addEventListener('zona21-volumes-changed', onVolumesChanged);
    return () => window.removeEventListener('zona21-volumes-changed', onVolumesChanged);
  }, [refreshVolumesStatus]);

  // Forçar reload dos assets quando um volume é removido
  useEffect(() => {
    const onForceReload = () => {
      // Limpar assets imediatamente
      assetsRef.current = [];
      setTotalCount(0);
      setAssetsVersion((v) => v + 1);
      // Aguardar um pouco para o backend processar e depois recarregar
      setTimeout(() => {
        resetAndLoad(filtersRef.current);
      }, 100);
    };
    window.addEventListener('zona21-force-reload-assets', onForceReload);
    return () => window.removeEventListener('zona21-force-reload-assets', onForceReload);
  }, []);

  // Refs para controlar throttle durante indexação
  const lastReloadTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(0);
  
  useEffect(() => {
    window.electronAPI.onIndexProgress((progress) => {
      // Throttle atualizações de progresso: máximo 5x por segundo
      const now = Date.now();
      if (progress.status === 'indexing' && now - lastProgressUpdateRef.current < 200) {
        return; // Ignorar atualização se muito frequente
      }
      lastProgressUpdateRef.current = now;
      setIndexProgress(progress);
      if (progress.status === 'scanning' || progress.status === 'indexing') {
        setIsIndexing(true);
        
        // Atualizar volumes na sidebar logo no início (após 10 arquivos)
        if (progress.indexed === 10) {
          window.dispatchEvent(new CustomEvent('zona21-volumes-changed'));
        }
        
        // Primeiro reload mais cedo (50 arquivos), depois a cada 100
        const timeSinceLastReload = now - lastReloadTimeRef.current;
        const shouldReload = 
          (progress.indexed === 50) || // Primeiro reload cedo
          (progress.indexed > 50 && progress.indexed % 100 === 0 && timeSinceLastReload > 2000);
        
        if (shouldReload) {
          lastReloadTimeRef.current = now;
          // Auto-selecionar volume se nenhum selecionado
          const currentFilters = filtersRef.current;
          if (!currentFilters.volumeUuid && !currentFilters.collectionId && !currentFilters.flagged) {
            window.electronAPI.getVolumes().then((volumes: any[]) => {
              if (volumes && volumes.length > 0) {
                setFilters((prev) => ({ ...prev, volumeUuid: volumes[0].uuid, pathPrefix: null }));
              }
            }).catch(() => {});
          } else {
            resetAndLoad(filtersRef.current);
          }
        }
      }
      if (progress.status === 'completed') {
        setIsIndexing(false);
        setIndexStartTime(null);
        // Atualizar lista de volumes na Sidebar
        window.dispatchEvent(new CustomEvent('zona21-volumes-changed'));
        
        // Auto-selecionar primeiro volume se nenhum estiver selecionado
        const currentFilters = filtersRef.current;
        if (!currentFilters.volumeUuid && !currentFilters.collectionId && !currentFilters.flagged) {
          // Buscar volumes disponíveis e selecionar o primeiro
          window.electronAPI.getVolumes().then((volumes: any[]) => {
            if (volumes && volumes.length > 0) {
              const firstVolume = volumes[0];
              setFilters((prev) => ({ ...prev, volumeUuid: firstVolume.uuid, pathPrefix: null }));
            }
          }).catch(() => {});
        } else {
          resetAndLoad(currentFilters);
        }
        
        // Mostrar mensagem de sucesso
        if (progress.total > 0) {
          pushToast({
            type: 'success',
            message: `✅ Indexação concluída! ${progress.total} arquivos processados com sucesso.`
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setIsPreferencesOpen(true);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const ids = assetsRef.current.filter(Boolean).map((a) => (a as Asset).id);
        setTrayAssetIds((prev) => {
          if (prev.length > 0 && prev.length === ids.length) return [];
          return ids;
        });
        return;
      }

      // Delete/Backspace: Limpar seleção
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (trayAssetIds.length > 0) {
          // Limpa seleção múltipla
          setTrayAssetIds([]);
        }
        if (selectedAsset) {
          setSelectedAsset(null);
          setSelectedIndex(null);
        }
        return;
      }

      // Enter: Abrir viewer do asset selecionado
      if (e.key === 'Enter' && selectedAsset) {
        e.preventDefault();
        setViewerAsset(selectedAsset);
        return;
      }

      if (!selectedAsset) return;

      if (e.key.toLowerCase() === 'p') {
        handleUpdateAsset(selectedAsset.id, { flagged: !selectedAsset.flagged });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (selectedIndex === null) return;

        let nextIndex = selectedIndex;

        const dir =
          e.key === 'ArrowRight'
            ? 'right'
            : e.key === 'ArrowLeft'
              ? 'left'
              : e.key === 'ArrowUp'
                ? 'up'
                : 'down';
        const neighbor = findVisualNeighborIndex(dir as any, selectedIndex);
        if (neighbor !== null) nextIndex = neighbor;

        if (nextIndex !== selectedIndex) {
          setSelectedIndex(nextIndex);
          setTrayAssetIds([]); // Limpa seleção múltipla ao navegar por setas
          const maybe = assetsRef.current[nextIndex];
          if (maybe) {
            setSelectedAsset(maybe);
          } else {
            ensureRangeLoaded(nextIndex, nextIndex, filtersRef.current);
          }
          
          // Scroll automático para manter o asset visível
          queueMicrotask(() => {
            const element = document.querySelector(`[data-asset-index="${nextIndex}"]`);
            if (element) {
              element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
            }
          });
        }
      } else if (e.key === 'Escape') {
        setSelectedAsset(null);
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedAsset, selectedIndex, assetsVersion, totalCount, findVisualNeighborIndex]);

  const handleSelectDuplicatesGroup = (assetIds: string[]) => {
    const ids = (assetIds || []).map((s) => String(s)).filter(Boolean);
    if (ids.length === 0) return;
    setTrayAssetIds(ids);
    setIsDuplicatesOpen(false);
  };

  useEffect(() => {
    if (selectedIndex === null) return;
    const a = assetsRef.current[selectedIndex];
    if (a) setSelectedAsset(a);
  }, [selectedIndex, assetsVersion]);

  const resetAndLoad = async (f: typeof filters) => {
    loadedPagesRef.current.clear();
    inFlightPagesRef.current.clear();
    setSelectedAsset(null);
    setSelectedIndex(null);
    setViewerAsset(null);

    if ((f as any).groupByDate) {
      try {
        const results = await window.electronAPI.getAssets(f);
        setTotalCount(results.length);
        assetsRef.current = results;
        setAssetsVersion((v) => v + 1);
      } catch (error) {
        console.error('Error loading assets:', error);
        setTotalCount(0);
        assetsRef.current = [];
        setAssetsVersion((v) => v + 1);
      }
      return;
    }

    await loadPage(0, f);
  };

  const loadPage = async (pageIndex: number, f: typeof filters) => {
    if (loadedPagesRef.current.has(pageIndex)) return;
    if (inFlightPagesRef.current.has(pageIndex)) return;

    inFlightPagesRef.current.add(pageIndex);
    try {
      const offset = pageIndex * PAGE_SIZE;
      const { items, total } = await window.electronAPI.getAssetsPage(f, offset, PAGE_SIZE);
      setTotalCount(total);
      if (!assetsRef.current || assetsRef.current.length !== total) {
        assetsRef.current = Array.from({ length: total }, () => null);
      }
      for (let i = 0; i < items.length; i++) {
        assetsRef.current[offset + i] = items[i];
      }
      setAssetsVersion((v) => v + 1);
      loadedPagesRef.current.add(pageIndex);
    } catch (error) {
      console.error('Error loading assets page:', error);
    } finally {
      inFlightPagesRef.current.delete(pageIndex);
    }
  };

  const ensureRangeLoaded = (startIndex: number, stopIndex: number, f: typeof filters) => {
    const startPage = Math.floor(Math.max(0, startIndex) / PAGE_SIZE);
    const stopPage = Math.floor(Math.max(0, stopIndex) / PAGE_SIZE);

    // Priority 1: load what the user is actually looking at (plus a tiny lookahead)
    const lookAhead = 1;
    for (let p = startPage; p <= Math.min(stopPage + lookAhead, startPage + 6); p++) {
      loadPage(p, f);
    }

    // Priority 2: keep the top stable by gradually filling gaps from page 0 upwards.
    // We do this with a small budget per call to avoid triggering a huge burst of requests.
    let contiguous = 0;
    while (loadedPagesRef.current.has(contiguous)) contiguous++;
    const backfillBudget = 2;
    const target = Math.min(startPage, contiguous + backfillBudget);
    for (let p = contiguous; p <= target; p++) {
      loadPage(p, f);
    }
  };

  // Carregar assets da bandeja por IDs (permite persistir ao trocar filtros/pastas)
  useEffect(() => {
    const run = async () => {
      if (trayAssetIds.length === 0) {
        setTrayAssets([]);
        return;
      }

      try {
        const tray = await window.electronAPI.getAssetsByIds(trayAssetIds);
        // manter ordem conforme IDs
        const byId = new Map(tray.map((a) => [a.id, a]));
        setTrayAssets(trayAssetIds.map((id) => byId.get(id)).filter(Boolean) as Asset[]);
      } catch (error) {
        console.error('Error loading tray assets:', error);
      }
    };

    run();
  }, [trayAssetIds]);

  const handleIndexDirectory = async () => {
    const dirPath = await window.electronAPI.selectDirectory();
    if (!dirPath) return;
    setIsIndexing(true);
    setIndexStartTime(Date.now());
    setIndexProgress({ total: 0, indexed: 0, currentFile: dirPath, status: 'scanning' });
    try {
      await ipcInvoke('App.indexDirectory', window.electronAPI.indexDirectory, dirPath);
    } catch (error) {
      console.error('Error indexing directory:', error);
      pushToast({ 
        type: 'error', 
        message: 'Não foi possível indexar esta pasta. Verifique se ela existe e se você tem permissão de acesso.' 
      });
      setIsIndexing(false);
      setIndexStartTime(null);
      setIndexProgress({ total: 0, indexed: 0, currentFile: null, status: 'idle' });
    }
  };

  const handleImportPaths = async (paths: string[]) => {
    const items = (paths || []).map((p) => String(p)).filter(Boolean);
    if (items.length === 0) return;

    setIsIndexing(true);
    setIndexStartTime(Date.now());
    setIndexProgress({ total: 0, indexed: 0, currentFile: items[0], status: 'scanning' });
    try {
      for (const p of items) {
        setIndexProgress({ total: 0, indexed: 0, currentFile: p, status: 'scanning' });
        await ipcInvoke('App.indexDirectory', window.electronAPI.indexDirectory, p);
      }
    } catch (error) {
      console.error('Error indexing dropped paths:', error);
      pushToast({ 
        type: 'error', 
        message: 'Não foi possível processar os arquivos arrastados. Verifique se são pastas válidas.' 
      });
      setIsIndexing(false);
      setIndexStartTime(null);
      setIndexProgress({ total: 0, indexed: 0, currentFile: null, status: 'idle' });
    }
  };

  const handleSelectVolume = (volumeUuid: string | null) => {
    // Ensure we never show a "blank" library while switching volumes.
    assetsRef.current = [];
    setTotalCount(0);
    setAssetsVersion((v) => v + 1);

    setSelectedVolumeDisconnected(false);
    setIsSelectedVolumeStatusLoading(!!volumeUuid);

    setFilters((prev) => ({
      ...prev,
      collectionId: null,
      flagged: undefined,
      volumeUuid,
      pathPrefix: null
    }));

    if (!volumeUuid) {
      setIsSelectedVolumeStatusLoading(false);
      return;
    }

    // Proactively check status (do not rely only on effect timing)
    (async () => {
      try {
        const vols = await window.electronAPI.getVolumes();
        const v = vols.find((x: any) => x.uuid === volumeUuid);
        setSelectedVolumeDisconnected(!v || v.status === 'disconnected');
      } catch {
        setSelectedVolumeDisconnected(false);
      } finally {
        setIsSelectedVolumeStatusLoading(false);
      }
    })();
  };

  const handleSelectFolder = (pathPrefix: string | null) => {
    setFilters((prev) => ({
      ...prev,
      collectionId: null,
      flagged: undefined,
      pathPrefix,
    }));
  };

  const handleSelectCollection = (collectionId: string | null) => {
    if (collectionId === 'favorites') {
      setFilters((prev) => ({
        ...prev,
        collectionId: null,
        flagged: true,
        volumeUuid: null,
        pathPrefix: null
      }));
      return;
    }
    setFilters((prev) => ({
      ...prev,
      collectionId,
      flagged: undefined,
      volumeUuid: null,
      pathPrefix: null
    }));
  };

  const handleToggleMarked = useCallback(async (assetId: string) => {
    const idx = assetsRef.current.findIndex((a) => a?.id === assetId);
    const current = idx >= 0 ? assetsRef.current[idx] : null;
    const next = !current?.flagged;

    await window.electronAPI.updateAsset(assetId, { flagged: next });
    if (idx >= 0 && current) {
      assetsRef.current[idx] = { ...current, flagged: next } as any;
      setAssetsVersion((v) => v + 1);
    }

    // If viewing Marcados (flagged filter), refresh list to reflect removal/addition
    if (filtersRef.current.flagged) {
      await resetAndLoad(filtersRef.current);
    }
  }, []);

  const toggleTrayAsset = useCallback((assetId: string) => {
    setTrayAssetIds((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]));
  }, []);

  const handleLassoSelect = useCallback((assetIds: string[], additive: boolean) => {
    const ids = (assetIds || []).map((s) => String(s)).filter(Boolean);
    if (ids.length === 0) return;

    setTrayAssetIds((prev) => {
      if (!additive) {
        queueMicrotask(() => {
          pushToast({ type: 'info', message: `Selected ${ids.length}`, timeoutMs: 1800 });
        });
        return ids;
      }
      const set = new Set(prev);
      let addedCount = 0;
      for (const id of ids) {
        if (!set.has(id)) {
          set.add(id);
          addedCount++;
        }
      }
      queueMicrotask(() => {
        pushToast({ type: 'info', message: `Added ${addedCount} to selection`, timeoutMs: 1800 });
      });
      return Array.from(set);
    });
  }, [pushToast]);

  const handleToggleSelection = useCallback((assetId: string, e: MouseEvent) => {
    e.stopPropagation();
    toggleTrayAsset(assetId);
  }, [toggleTrayAsset]);

  const handleAssetClickAtIndex = (asset: Asset, index: number, e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      toggleTrayAsset(asset.id);
      return;
    }
    setSelectedIndex(index);
    setSelectedAsset(asset);
    setTrayAssetIds([asset.id]);
  };

  const handleAssetDoubleClickAtIndex = (asset: Asset, index: number) => {
    setSelectedIndex(index);
    setSelectedAsset(asset);
    setViewerAsset(asset);
  };

  const handleUpdateAsset = async (assetId: string, updates: any) => {
    await window.electronAPI.updateAsset(assetId, updates);
    for (let i = 0; i < assetsRef.current.length; i++) {
      const a = assetsRef.current[i];
      if (a && a.id === assetId) {
        assetsRef.current[i] = { ...a, ...updates } as any;
        break;
      }
    }
    setAssetsVersion((v) => v + 1);
    if (trayAssetIds.includes(assetId)) {
      const tray = await window.electronAPI.getAssetsByIds(trayAssetIds);
      const byId = new Map(tray.map((a) => [a.id, a]));
      setTrayAssets(trayAssetIds.map((id) => byId.get(id)).filter(Boolean) as Asset[]);
    }
  };

  const handleTrayRemove = (assetId: string) => {
    setTrayAssetIds((prev) => prev.filter((id) => id !== assetId));
  };

  const handleTrayClear = () => {
    setTrayAssetIds([]);
    setTrayAssets([]);
  };

  const handleTrayCopy = async (assetIds: string[]) => {
    if (!assetIds || assetIds.length === 0) return;
    setIsCopyOpen(true);
  };

  const handleTrayExportZip = async (assetIds: string[]) => {
    if (!assetIds || assetIds.length === 0) return;
    setIsZipOpen(true);
  };

  const handleTrayTrashSelected = async (assetIds: string[]) => {
    const ids = (assetIds || []).map((s) => String(s)).filter(Boolean);
    if (ids.length === 0) return;
    const ok = confirm(`Mover ${ids.length} arquivo${ids.length === 1 ? '' : 's'} para a Lixeira?`);
    if (!ok) return;
    try {
      const res = await ipcInvoke<any>('App.trashAssets', window.electronAPI.trashAssets, ids);
      if (!res.success) {
        pushToast({ type: 'error', message: `Falha ao enviar para a lixeira: ${res.error || 'Erro desconhecido'}` });
        return;
      }
      pushToast({ type: 'success', message: `Enviado ${ids.length} para a lixeira` });
      handleTrayClear();
      await resetAndLoad(filtersRef.current);
    } catch (error) {
      console.error('Error trashing selected assets:', error);
      pushToast({ type: 'error', message: 'Falha ao enviar para a lixeira. Tente novamente.' });
    }
  };

  useEffect(() => {
    const fn = (window.electronAPI as any)?.onExportCopyProgress;
    if (typeof fn !== 'function') return;
    (window.electronAPI as any).onExportCopyProgress((p: any) => {
      setCopyProgress(p);
      if (p?.status === 'done') {
        setCopyBusy(false);
      }
    });
  }, []);

  useEffect(() => {
    const fn = (window.electronAPI as any)?.onExportZipProgress;
    if (typeof fn !== 'function') return;
    (window.electronAPI as any).onExportZipProgress((p: any) => {
      setZipProgress(p);
      if (p?.jobId) setZipJobId(String(p.jobId));
      if (p?.status === 'done' || p?.status === 'canceled' || p?.status === 'error') {
        setZipBusy(false);
      }
    });
  }, []);

  const confirmCopy = async (opts: { preserveFolders: boolean; conflictDecision: 'rename' | 'overwrite' | 'skip' }) => {
    if (trayAssetIds.length === 0) return;
    setCopyBusy(true);
    setCopyProgress({ status: 'started', total: trayAssetIds.length, copied: 0, failed: 0, skipped: 0 });
    try {
      const result = await window.electronAPI.exportCopyAssets({ assetIds: trayAssetIds, ...opts });
      if (result.canceled) {
        setCopyBusy(false);
        return;
      }
      if (!result.success) {
        setCopyBusy(false);
        pushToast({ type: 'error', message: `Falha ao copiar: ${result.error || 'Erro desconhecido'}` });
        return;
      }
      setLastOp({
        kind: 'copy',
        title: 'Cópia concluída',
        destinationDir: result.destinationDir,
        copied: result.copied ?? 0,
        skipped: result.skipped ?? 0,
        skippedMissing: result.skippedMissing ?? 0,
        skippedOffline: result.skippedOffline ?? 0,
        failed: result.failed ?? 0
      });
      pushToast({ type: 'success', message: 'Cópia concluída' });
      setIsCopyOpen(false);
    } finally {
      setCopyBusy(false);
    }
  };

  const confirmZip = async (opts: { preserveFolders: boolean }) => {
    if (trayAssetIds.length === 0) return;
    setZipBusy(true);
    setZipProgress({ status: 'started', total: trayAssetIds.length, added: 0, failed: 0 });
    setZipJobId(null);
    try {
      const res = await (window.electronAPI as any).exportZipAssets({ assetIds: trayAssetIds, ...opts });
      if (res?.canceled) {
        setZipBusy(false);
        return;
      }
      if (!res?.success) {
        setZipBusy(false);
        pushToast({ type: 'error', message: `Falha ao exportar ZIP: ${res?.error || 'Erro desconhecido'}` });
        return;
      }
      setZipJobId(res.jobId ? String(res.jobId) : null);
      setLastOp({
        kind: 'zip',
        title: 'ZIP exportado',
        path: res.path,
        added: res.added,
        skippedMissing: res.skippedMissing,
        skippedOffline: res.skippedOffline,
        failed: res.failed
      });
      pushToast({ type: 'success', message: 'ZIP exportado' });
      setIsZipOpen(false);
    } finally {
      setZipBusy(false);
    }
  };

  const cancelZip = async () => {
    if (!zipJobId) return;
    const fn = (window.electronAPI as any)?.cancelExportZip;
    if (typeof fn !== 'function') return;
    await (window.electronAPI as any).cancelExportZip(zipJobId);
  };

  const handleTrayMove = async (assetIds: string[]) => {
    if (!assetIds || assetIds.length === 0) return;
    setMoveDestinationMode('tree');
    setMoveDestinationDir(null);
    setMoveDestinationPathPrefix(null);
    setMoveUnderstood(false);
    setMoveConflictsCount(0);
    setIsMoveOpen(true);
  };

  const handleMoveAssetsToFolder = (assetIds: string[], pathPrefix: string | null) => {
    const ids = (assetIds || []).map((s) => String(s)).filter(Boolean);
    if (ids.length === 0) return;
    setTrayAssetIds(ids);
    setMoveDestinationMode('tree');
    setMoveDestinationDir(null);
    setMoveDestinationPathPrefix(pathPrefix);
    setMoveUnderstood(false);
    setMoveConflictsCount(0);
    setIsMoveOpen(true);
  };

  const closeMoveModal = () => {
    if (moveBusy) return;
    setIsMoveOpen(false);
    setMoveBusy(false);
    setMoveConflictsCount(0);
  };

  const pickMoveDestinationDialog = async () => {
    const dir = await window.electronAPI.selectMoveDestination();
    if (!dir) return;
    setMoveDestinationDir(dir);
  };

  const planMove = async () => {
    if (trayAssetIds.length === 0) return;
    setMoveBusy(true);
    try {
      const res = await window.electronAPI.planMoveAssets({
        assetIds: trayAssetIds,
        destinationMode: moveDestinationMode,
        destinationDir: moveDestinationMode === 'dialog' ? moveDestinationDir : null,
        destinationVolumeUuid: moveDestinationMode === 'tree' ? filtersRef.current.volumeUuid : null,
        destinationPathPrefix: moveDestinationMode === 'tree' ? (moveDestinationPathPrefix ?? filtersRef.current.pathPrefix) : null
      });
      if (!res.success) {
        if (!res.canceled) pushToast({ type: 'error', message: `Falha ao mover: ${res.error || 'Erro desconhecido'}` });
        return;
      }
      setMoveConflictsCount(res.conflictsCount ?? 0);
      if ((res.conflictsCount ?? 0) === 0) {
        const exec = await window.electronAPI.executeMoveAssets({
          assetIds: trayAssetIds,
          destinationMode: moveDestinationMode,
          destinationDir: moveDestinationMode === 'dialog' ? moveDestinationDir : null,
          destinationVolumeUuid: moveDestinationMode === 'tree' ? filtersRef.current.volumeUuid : null,
          destinationPathPrefix: moveDestinationMode === 'tree' ? (moveDestinationPathPrefix ?? filtersRef.current.pathPrefix) : null,
          conflictDecision: 'rename'
        });
        if (!exec.success) {
          if (!exec.canceled) pushToast({ type: 'error', message: `Falha ao mover: ${exec.error || 'Erro desconhecido'}` });
          return;
        }
        setTrayAssetIds([]);
        setTrayAssets([]);
        closeMoveModal();
        await resetAndLoad(filtersRef.current);
      }
    } finally {
      setMoveBusy(false);
    }
  };

  const resolveMoveConflicts = async (decision: 'overwrite' | 'rename' | 'cancel') => {
    if (decision === 'cancel') {
      closeMoveModal();
      return;
    }
    setMoveBusy(true);
    try {
      const exec = await window.electronAPI.executeMoveAssets({
        assetIds: trayAssetIds,
        destinationMode: moveDestinationMode,
        destinationDir: moveDestinationMode === 'dialog' ? moveDestinationDir : null,
        destinationVolumeUuid: moveDestinationMode === 'tree' ? filtersRef.current.volumeUuid : null,
        destinationPathPrefix: moveDestinationMode === 'tree' ? (moveDestinationPathPrefix ?? filtersRef.current.pathPrefix) : null,
        conflictDecision: decision
      });
      if (!exec.success) {
        if (!exec.canceled) pushToast({ type: 'error', message: `Falha ao mover: ${exec.error || 'Erro desconhecido'}` });
        return;
      }
      setTrayAssetIds([]);
      setTrayAssets([]);
      closeMoveModal();
      await resetAndLoad(filtersRef.current);
    } finally {
      setMoveBusy(false);
    }
  };

  const handleRemoveFromCollection = useCallback(async (assetIds: string[]) => {
    const collectionId = filtersRef.current.collectionId;
    if (!collectionId) return;

    const result = await window.electronAPI.removeAssetsFromCollection(collectionId, assetIds);
    if (!result.success) {
      pushToast({ type: 'error', message: `Falha ao remover da coleção: ${result.error || 'Erro desconhecido'}` });
      return;
    }

    setTrayAssetIds((prev) => prev.filter((id) => !assetIds.includes(id)));
    setCollectionsRefreshToken((v) => v + 1);
    await resetAndLoad(filtersRef.current);
  }, []);

  const handleTrayExport = async (type: 'premiere' | 'lightroom') => {
    if (trayAssetIds.length === 0) return;
    if (type === 'premiere') {
      const result = await window.electronAPI.exportPremiere(trayAssetIds);
      if (result.success) {
        setLastOp({ kind: 'export', title: 'XML exportado', path: result.path });
        pushToast({ type: 'success', message: 'XML exportado' });
      } else if (!result.canceled) {
        pushToast({ type: 'error', message: `Falha ao exportar: ${result.error || 'Erro desconhecido'}` });
      }
    } else {
      const result = await window.electronAPI.exportLightroom(trayAssetIds);
      if (result.success) {
        setLastOp({ kind: 'export', title: 'XMP exportado', count: result.count });
        pushToast({ type: 'success', message: `Exportado(s) ${result.count} XMP` });
      } else {
        pushToast({ type: 'error', message: `Falha ao exportar: ${result.error || 'Erro desconhecido'}` });
      }
    }
  };

  const trayAssetIdsSet = useMemo(() => new Set(trayAssetIds), [trayAssetIds]);

  const markedIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of assetsRef.current) {
      if (a?.flagged) set.add(a.id);
    }
    return set;
  }, [assetsVersion]);

  useEffect(() => {
    resetAndLoad(filtersRef.current);
  }, [filters.mediaType, filters.datePreset, filters.dateFrom, filters.dateTo, filters.groupByDate, filters.flagged, filters.volumeUuid, filters.pathPrefix, filters.collectionId]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!filters.volumeUuid) {
          setSelectedVolumeDisconnected(false);
          setIsSelectedVolumeStatusLoading(false);
          return;
        }
        setIsSelectedVolumeStatusLoading(true);
        const vols = await window.electronAPI.getVolumes();
        const v = vols.find((x: any) => x.uuid === filters.volumeUuid);
        setSelectedVolumeDisconnected(!v || v.status === 'disconnected');
        setIsSelectedVolumeStatusLoading(false);
      } catch {
        setSelectedVolumeDisconnected(false);
        setIsSelectedVolumeStatusLoading(false);
      }
    };
    run();
  }, [filters.volumeUuid]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSidebarOpen]);

  // Listener para status de update
  useEffect(() => {
    const fn = (window.electronAPI as any)?.onUpdateStatus;
    if (typeof fn !== 'function') return;
    
    fn((status: any) => {
      setUpdateStatus(status);
      
      // Mostrar toast quando update está disponível
      if (status.state === 'available') {
        pushToast({
          type: 'info',
          message: `Atualização disponível: Nova versão ${status.version} disponível!`,
          timeoutMs: 5000
        });
      }
    });
  }, [pushToast]);

  return (
    <div className="relative flex h-screen text-white overflow-x-hidden">
      <GalaxyBackground />
      
      {/* Banner de atualização disponível */}
      <UpdateBanner 
        isVisible={updateStatus?.state === 'available' || updateStatus?.state === 'download-progress'}
        downloadProgress={updateStatus?.state === 'download-progress' ? {
          percent: updateStatus.percent || 0,
          transferred: updateStatus.transferred || 0,
          total: updateStatus.total || 0
        } : undefined}
        onUpdateClick={() => {
          // Abrir preferences na aba de updates
          setIsPreferencesOpen(true);
        }}
      />

      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      <KeyboardShortcutsModal 
        isOpen={isShortcutsOpen} 
        onClose={() => setIsShortcutsOpen(false)} 
      />

      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />

      {showTelemetryPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="mh-popover w-full max-w-lg p-5">
            <div className="text-base font-semibold text-white">Diagnósticos (beta)</div>
            <div className="mt-2 text-sm text-gray-300">
              Você autoriza o envio de diagnósticos anônimos (erros e crashes) para melhorar o app durante o beta?
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Não enviamos nomes ou caminhos de arquivos. Você pode desativar depois nas Configurações.
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                onClick={() => void confirmTelemetryConsent(false)}
              >
                Agora não
              </button>
              <button
                type="button"
                className="mh-btn mh-btn-gray px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700"
                onClick={() => void confirmTelemetryConsent(true)}
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
      <LastOperationPanel
        op={lastOp}
        onDismiss={() => setLastOp(null)}
        onRevealPath={revealPath}
        onCopyText={copyText}
      />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-[80] sm:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Fechar barra lateral"
            onClick={() => setIsSidebarOpen(false)}
          />
          <Sidebar
            className="relative z-[81] h-full"
            onIndexDirectory={handleIndexDirectory}
            selectedVolumeUuid={filters.volumeUuid}
            selectedPathPrefix={filters.pathPrefix}
            onSelectVolume={handleSelectVolume}
            onSelectFolder={handleSelectFolder}
            onMoveAssetsToFolder={handleMoveAssetsToFolder}
            selectedCollectionId={filters.collectionId}
            onSelectCollection={handleSelectCollection}
            collectionsRefreshToken={collectionsRefreshToken}
            collapsed={false}
            onOpenPreferences={() => setIsPreferencesOpen(true)}
          />
        </div>
      )}

      <div className={`flex ${(updateStatus?.state === 'available' || updateStatus?.state === 'download-progress') ? 'mt-12' : ''} transition-all duration-300`} style={{ width: '100vw', height: '100vh' }}>
        <Sidebar
          className="hidden sm:flex"
        onIndexDirectory={handleIndexDirectory}
        selectedVolumeUuid={filters.volumeUuid}
        selectedPathPrefix={filters.pathPrefix}
        onSelectVolume={handleSelectVolume}
        onSelectFolder={handleSelectFolder}
        onMoveAssetsToFolder={handleMoveAssetsToFolder}
        selectedCollectionId={filters.flagged ? 'favorites' : filters.collectionId}
        onSelectCollection={handleSelectCollection}
        collectionsRefreshToken={collectionsRefreshToken}
        collapsed={isSidebarCollapsed}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
      />

        {/* Mobile Sidebar */}
        <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
          <Sidebar
            className="flex w-full"
            onIndexDirectory={handleIndexDirectory}
            selectedVolumeUuid={filters.volumeUuid}
            selectedPathPrefix={filters.pathPrefix}
            onSelectVolume={handleSelectVolume}
            onSelectFolder={handleSelectFolder}
            onMoveAssetsToFolder={handleMoveAssetsToFolder}
            selectedCollectionId={filters.flagged ? 'favorites' : filters.collectionId}
            onSelectCollection={handleSelectCollection}
            collectionsRefreshToken={collectionsRefreshToken}
            collapsed={false}
            onOpenPreferences={() => setIsPreferencesOpen(true)}
          />
        </MobileSidebar>

        <div className="flex-1 flex flex-col" style={{ width: 'calc(100vw - 280px)' }}>
        <Toolbar 
          onOpenDuplicates={() => setIsDuplicatesOpen(true)}
          filters={filters}
          onFiltersChange={setFilters}
          isIndexing={isIndexing}
          indexProgress={indexProgress}
          indexStartTime={indexStartTime}
          hasSelection={trayAssetIds.length > 0}
          onSelectAll={() => {
            const ids = assetsRef.current.filter(Boolean).map((a) => (a as Asset).id);
            setTrayAssetIds(ids);
          }}
          onClearSelection={handleTrayClear}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <div className="flex-1 flex overflow-hidden" style={{ height: '100%' }}>
          {!filters.volumeUuid && !filters.collectionId && !filters.flagged ? (
            (() => {
              // Debug: console.log('[App] Rendering EmptyState - filters:', filters);
              return (
                <EmptyState 
                  type="volume"
                  onAction={handleIndexDirectory}
                />
              );
            })()
          ) : isSelectedVolumeStatusLoading && filters.volumeUuid && !showOfflineLibraryMessage ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-lg w-full rounded border border-gray-700 bg-gray-900/40 p-6">
                <div className="text-sm font-semibold text-gray-200">Verificando volume…</div>
                <div className="mt-2 text-sm text-gray-400">Aguarde enquanto verificamos se o disco está conectado.</div>
              </div>
            </div>
          ) : showOfflineLibraryMessage ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-lg w-full rounded border border-amber-700 bg-amber-900/20 p-6">
                <div className="text-sm font-semibold text-amber-100">Volume desconectado</div>
                <div className="mt-2 text-sm text-amber-200/90">
                  Você está navegando um volume que não está conectado. Conecte o disco novamente, ou volte para outra pasta/volume.
                </div>
                <div className="mt-2 text-xs text-amber-200/70">
                  Se esse volume não será mais usado, você pode removê-lo na barra lateral.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                    onClick={() => {
                      handleSelectVolume(null);
                      handleSelectFolder(null);
                      handleSelectCollection(null);
                      setViewerAsset(null);
                    }}
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    Abrir barra lateral
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Library 
              assets={assetsRef.current}
              totalCount={totalCount}
              onRangeRendered={(startIndex, stopIndex) => ensureRangeLoaded(startIndex, stopIndex, filtersRef.current)}
              onAssetClick={handleAssetClickAtIndex}
              onAssetDoubleClick={handleAssetDoubleClickAtIndex}
              onImportPaths={handleImportPaths}
              onLassoSelect={handleLassoSelect}
              onToggleMarked={handleToggleMarked}
              markedIds={markedIds}
              onToggleSelection={handleToggleSelection}
              selectedAssetId={selectedAsset?.id ?? null}
              trayAssetIds={trayAssetIdsSet}
              groupByDate={filters.groupByDate}
              viewerAsset={viewerAsset}
              onIndexDirectory={handleIndexDirectory}
              emptyStateType={filters.flagged ? 'flagged' : filters.collectionId ? 'collection' : 'files'}
            />
          )}
          
          {viewerAsset && (
            <Viewer 
              asset={viewerAsset}
              onClose={() => {
                setViewerAsset(null);
              }}
              onUpdate={handleUpdateAsset}
            />
          )}
          </div>

      <SelectionTray
        selectedAssets={trayAssets}
        currentCollectionId={filters.collectionId}
        isBusy={copyBusy || zipBusy || moveBusy}
        onRemoveFromSelection={handleTrayRemove}
        onClearSelection={handleTrayClear}
        onCopySelected={handleTrayCopy}
        onMoveSelected={handleTrayMove}
        onTrashSelected={handleTrayTrashSelected}
        onExportSelected={handleTrayExport}
        onExportZipSelected={handleTrayExportZip}
        onRemoveFromCollection={handleRemoveFromCollection}
      />
      </div>
    </div>

      <CopyModal
        isOpen={isCopyOpen}
        assets={trayAssets}
        isBusy={copyBusy}
        onClose={() => {
          if (copyBusy) return;
          setIsCopyOpen(false);
        }}
        onConfirm={confirmCopy}
      />

      <ExportZipModal
        isOpen={isZipOpen}
        assets={trayAssets}
        isBusy={zipBusy}
        onClose={() => {
          if (zipBusy) return;
          setIsZipOpen(false);
        }}
        onConfirm={confirmZip}
      />

      <DuplicatesModal
        isOpen={isDuplicatesOpen}
        onClose={() => setIsDuplicatesOpen(false)}
        onSelectGroup={handleSelectDuplicatesGroup}
      />

      {copyProgress && (copyBusy || copyProgress.status === 'started' || copyProgress.status === 'progress') && (
        <div className="fixed inset-x-0 bottom-16 z-[60] mx-auto w-full max-w-xl rounded bg-gray-800/95 p-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-200">Copying…</div>
            <div className="text-xs text-gray-400">
              {copyProgress.copied ?? 0}/{copyProgress.total ?? 0}
              {copyProgress.skipped ? ` · skipped ${copyProgress.skipped}` : ''}
              {copyProgress.skippedOffline ? ` · offline ${copyProgress.skippedOffline}` : ''}
              {copyProgress.skippedMissing ? ` · missing ${copyProgress.skippedMissing}` : ''}
              {copyProgress.failed ? ` · failed ${copyProgress.failed}` : ''}
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-700">
            <div
              className="h-full bg-sky-500 transition-all"
              style={{
                width:
                  copyProgress.total > 0
                    ? `${Math.min(100, ((copyProgress.copied ?? 0) + (copyProgress.skipped ?? 0) + (copyProgress.failed ?? 0)) / copyProgress.total * 100)}%`
                    : '0%'
              }}
            />
          </div>
        </div>
      )}

      {zipProgress && (zipBusy || zipProgress.status === 'started' || zipProgress.status === 'progress') && (
        <div className="fixed inset-x-0 bottom-28 z-[60] mx-auto w-full max-w-xl rounded bg-gray-800/95 p-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-200">Exporting ZIP…</div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-400">
                {zipProgress.added ?? 0}/{zipProgress.total ?? 0}
                {zipProgress.skippedOffline ? ` · offline ${zipProgress.skippedOffline}` : ''}
                {zipProgress.skippedMissing ? ` · missing ${zipProgress.skippedMissing}` : ''}
                {zipProgress.failed ? ` · failed ${zipProgress.failed}` : ''}
              </div>
              <button
                type="button"
                onClick={cancelZip}
                disabled={!zipJobId}
                className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-700">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{
                width:
                  zipProgress.total > 0
                    ? `${Math.min(100, ((zipProgress.added ?? 0) + (zipProgress.failed ?? 0)) / zipProgress.total * 100)}%`
                    : '0%'
              }}
            />
          </div>
        </div>
      )}

      <MoveModal
        isOpen={isMoveOpen}
        assets={trayAssets}
        currentVolumeUuid={filters.volumeUuid}
        currentPathPrefix={filters.pathPrefix}
        destinationDir={moveDestinationDir}
        destinationMode={moveDestinationMode}
        conflictsCount={moveConflictsCount}
        isBusy={moveBusy}
        understood={moveUnderstood}
        onUnderstoodChange={setMoveUnderstood}
        onDestinationModeChange={(m) => setMoveDestinationMode(m)}
        onPickDestinationDialog={pickMoveDestinationDialog}
        onClose={closeMoveModal}
        onConfirm={planMove}
        onResolveConflicts={resolveMoveConflicts}
      />
    </div>
  );
}

export default App;
