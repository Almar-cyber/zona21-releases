import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import Library from './components/Library.tsx';
import Sidebar from './components/Sidebar.tsx';
// import Viewer from './components/Viewer.tsx'; // Now using ViewerTab
import { APP_VERSION } from './version';
import { TabsProvider, useTabs } from './contexts/TabsContext';
import { MenuProvider, useMenu } from './contexts/MenuContext';
import { CommandProvider, useCommands, Command } from './contexts/CommandContext';
import TabBar from './components/TabBar';
import TabContainer from './components/TabContainer';
import SelectionTray from './components/SelectionTray.tsx';
import MoveModal from './components/MoveModal.tsx';
import DuplicatesModal from './components/DuplicatesModal.tsx';
import CopyModal from './components/CopyModal.tsx';
import ExportZipModal from './components/ExportZipModal.tsx';
import ToastHost, { type Toast } from './components/ToastHost.tsx';
import KeyboardHintsBar from './components/KeyboardHintsBar.tsx';
import LastOperationPanel, { type LastOperation } from './components/LastOperationPanel.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';
import OnboardingWizard from './components/OnboardingWizard.tsx';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal.tsx';
import PreferencesModal from './components/PreferencesModal.tsx';
import EmptyState from './components/EmptyState';
import UpdateBanner from './components/UpdateBanner';
import MobileSidebar from './components/MobileSidebar.tsx';
import IndexingOverlay from './components/IndexingOverlay.tsx';
import AppErrorBoundary from './components/ErrorBoundary';
import ConfirmDialog from './components/ConfirmDialog.tsx';
import { MilestoneNotification } from './components/MilestoneModal';
import ReviewModal from './components/ReviewModal.tsx';
// import CompareMode from './components/CompareMode.tsx'; // Now using CompareTab
// import { BatchEditModal } from './components/BatchEditModal.tsx'; // Now using BatchEditTab
import { ProductivityDashboard } from './components/ProductivityDashboard.tsx';
import { MilestoneNotificationEnhanced } from './components/MilestoneNotificationEnhanced.tsx';
import { SmartOnboarding } from './components/SmartOnboarding';
import CommandPalette from './components/CommandPalette.tsx';
import AssetContextMenu, { type AssetContextMenuPosition } from './components/AssetContextMenu.tsx';
import { useCommandPalette } from './hooks/useCommandPalette';
import { onboardingService } from './services/onboarding-service';
import { Asset, IndexProgress } from './shared/types';
import { ipcInvoke } from './shared/ipcInvoke';
import { useProductivityStats } from './hooks/useProductivityStats';
import { useSuggestions } from './hooks/useSuggestions';

function AppContent() {
  const PAGE_SIZE = 100;

  // Access tabs and menu contexts
  const { openTab, activeTabId, getTab } = useTabs();
  const { toggleMenu } = useMenu();

  // Get active tab to check if we should show SelectionTray
  const activeTab = getTab(activeTabId);

  const assetsRef = useRef<Array<Asset | null>>([]);
  const [assetsVersion, setAssetsVersion] = useState(0);

  const [totalCount, setTotalCount] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // viewerAsset removed - now using ViewerTab
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
  const [showKeyboardHints, setShowKeyboardHints] = useState(() => {
    const saved = localStorage.getItem('zona21-show-keyboard-hints');
    return saved !== 'false'; // Show by default unless explicitly disabled
  });

  // Review Modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'delete' | 'export' | null>(null);
  const [reviewAssets, setReviewAssets] = useState<Asset[]>([]);

  // Compare Mode - now handled by tabs (CompareTab)

  // Batch Edit state
  // BatchEdit now handled by BatchEditTab

  // Growth Features state
  const [isProductivityDashboardOpen, setIsProductivityDashboardOpen] = useState(false);
  const [isSmartOnboardingOpen, setIsSmartOnboardingOpen] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<any>(null);

  // Confirm dialogs state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  // Asset Context Menu state
  const [assetContextMenu, setAssetContextMenu] = useState<{
    asset: Asset;
    position: AssetContextMenuPosition;
  } | null>(null);

  // AI hooks

  // Productivity stats hook
  const productivityStats = useProductivityStats();

  // Command Palette hook
  const { registerCommand, recentCommandIds } = useCommands();
  const commandPalette = useCommandPalette({ activeContext: activeTabId });

  const [showLoading, setShowLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [filters, setFilters] = useState({
    mediaType: undefined,
    datePreset: undefined,
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
    groupByDate: false,
    flagged: undefined as boolean | undefined,
    markingStatus: undefined as string[] | undefined,
    volumeUuid: null as string | null,
    pathPrefix: null as string | null,
    collectionId: null as string | null,
    tags: undefined as string[] | undefined
  });

  // Remember last selected volume so we can restore when returning from collections
  const lastVolumeUuidRef = useRef<string | null>(null);

  // Keep lastVolumeUuidRef in sync whenever volumeUuid changes to a valid value
  useEffect(() => {
    if (filters.volumeUuid) {
      lastVolumeUuidRef.current = filters.volumeUuid;
    }
  }, [filters.volumeUuid]);

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Spatial index cache for optimized keyboard navigation (O(1) instead of O(n²))
  const spatialIndexRef = useRef<Map<number, { x: number; y: number; rect: DOMRect }>>(new Map());
  const spatialIndexVersionRef = useRef(0);

  // Build spatial index cache from DOM
  const rebuildSpatialIndex = useCallback(() => {
    const nodes = Array.from(document.querySelectorAll('[data-asset-index]')) as HTMLElement[];
    const newIndex = new Map<number, { x: number; y: number; rect: DOMRect }>();

    for (const node of nodes) {
      const raw = node.getAttribute('data-asset-index');
      if (!raw) continue;
      const idx = Number(raw);
      if (!Number.isFinite(idx)) continue;

      const rect = node.getBoundingClientRect();
      newIndex.set(idx, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        rect,
      });
    }

    spatialIndexRef.current = newIndex;
    spatialIndexVersionRef.current++;
  }, []);

  // Invalidate spatial index on assets change
  useEffect(() => {
    rebuildSpatialIndex();
  }, [assetsVersion, rebuildSpatialIndex]);

  // Debounced scroll/resize listener to update spatial index
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;

    const handleScrollOrResize = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        rebuildSpatialIndex();
      }, 150); // Debounce 150ms
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [rebuildSpatialIndex]);

  const findVisualNeighborIndex = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down', fromIndex: number): number | null => {
      // Rebuild index if stale
      if (spatialIndexRef.current.size === 0) {
        rebuildSpatialIndex();
      }

      const fromData = spatialIndexRef.current.get(fromIndex);
      if (!fromData) return null;

      const fromCx = fromData.x;
      const fromCy = fromData.y;

      let best: { idx: number; score: number } | null = null;
      const tol = 6;

      // Iterate through cached positions (much faster than DOM queries)
      for (const [idx, data] of spatialIndexRef.current.entries()) {
        if (idx === fromIndex) continue;

        const cx = data.x;
        const cy = data.y;
        const dx = cx - fromCx;
        const dy = cy - fromCy;

        // Filter by direction with tolerance
        if (direction === 'left' && dx >= -tol) continue;
        if (direction === 'right' && dx <= tol) continue;
        if (direction === 'up' && dy >= -tol) continue;
        if (direction === 'down' && dy <= tol) continue;

        // Score prefers mostly-horizontal moves for left/right, mostly-vertical for up/down
        const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
        const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
        const score = primary * 1 + secondary * 2;

        if (!best || score < best.score) best = { idx, score };
      }

      return best?.idx ?? null;
    },
    [rebuildSpatialIndex]
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

  // Smart suggestions hooks
  const { suggestions, refreshSuggestions } = useSuggestions({
    onCompare: () => {
      // Open duplicates modal for similar photos
      setIsDuplicatesOpen(true);
    },
    onReview: () => {
      // Open review modal for rejected photos
      const rejectedAssets = assetsRef.current.filter(
        (a) => a && a.markingStatus === 'rejected'
      ) as Asset[];
      setReviewAssets(rejectedAssets);
      setReviewAction('delete');
      setIsReviewOpen(true);
    },
  });

  // Show suggestions as toasts (only one at a time to avoid fatigue)
  useEffect(() => {
    if (suggestions.length > 0) {
      // Show only the first suggestion
      const suggestion = suggestions[0];
      pushToast({
        type: 'info',
        message: suggestion.message,
        actions: [
          {
            label: suggestion.actionLabel,
            onClick: suggestion.action,
          },
        ],
        timeoutMs: 12000, // Auto-dismiss after 12 seconds
      });
    }
  }, [suggestions, pushToast]);

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
      setHasAnyConnectedVolume(vols.some((v) => v?.status === 'connected'));
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

  // Smart Onboarding - check for first-time user
  useEffect(() => {
    const hasCompletedSmartOnboarding = localStorage.getItem('zona21-smart-onboarding-completed');
    const hasAnyPhotos = totalCount > 0;

    // Show Smart Onboarding if: not completed AND has photos (so there's something to interact with)
    if (!hasCompletedSmartOnboarding && hasAnyPhotos && !showLoading) {
      // Delay a bit to let the UI settle
      const timer = setTimeout(() => {
        setIsSmartOnboardingOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [totalCount, showLoading]);

  // Listen for milestone achievements
  useEffect(() => {
    const unlockedMilestones = productivityStats.milestones.filter(m => m.achieved);
    const shownMilestonesStr = localStorage.getItem('zona21-shown-milestones');
    const shownMilestones = shownMilestonesStr ? JSON.parse(shownMilestonesStr) : [];

    // Find newest unlocked milestone that hasn't been shown yet
    const newMilestone = unlockedMilestones.find(m => !shownMilestones.includes(m.id));

    if (newMilestone && !currentMilestone) {
      setCurrentMilestone(newMilestone);
      // Add to shown milestones list
      const updatedShownMilestones = [...shownMilestones, newMilestone.id];
      localStorage.setItem('zona21-shown-milestones', JSON.stringify(updatedShownMilestones));
    }
  }, [productivityStats.milestones]);

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
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ type: string; message: string; timeoutMs?: number }>).detail;
      if (!detail) return;
      const type = detail.type;
      if (type !== 'success' && type !== 'error' && type !== 'info') return;
      pushToast({ type, message: detail.message, timeoutMs: detail.timeoutMs });
    };
    window.addEventListener('zona21-toast', onToast);
    return () => window.removeEventListener('zona21-toast', onToast);
  }, [pushToast]);

  // Refresh assets when requested (e.g., after CompareTab applies decisions)
  useEffect(() => {
    const onRefreshAssets = () => {
      setAssetsVersion((v) => v + 1);
      resetAndLoad(filtersRef.current);
    };
    window.addEventListener('zona21-refresh-assets', onRefreshAssets);
    return () => window.removeEventListener('zona21-refresh-assets', onRefreshAssets);
  }, []);

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
  const currentIndexRunIdRef = useRef<string | null>(null);
  const completionToastShownRef = useRef<boolean>(false);
  
  useEffect(() => {
    const unsubscribe = window.electronAPI.onIndexProgress((progress) => {
      // Throttle atualizações de progresso: máximo 5x por segundo
      const now = Date.now();
      if (progress.status === 'indexing' && now - lastProgressUpdateRef.current < 200) {
        return; // Ignorar atualização se muito frequente
      }
      lastProgressUpdateRef.current = now;
      setIndexProgress(progress);
      if (progress.status === 'scanning' || progress.status === 'indexing') {
        setIsIndexing(true);

        // Novo ciclo de indexação: gerar runId e resetar toast
        if (progress.status === 'scanning') {
          currentIndexRunIdRef.current = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          completionToastShownRef.current = false;
        }
        
        // Atualizar volumes na sidebar logo no início (após 10 arquivos)
        if (progress.indexed === 10) {
          window.dispatchEvent(new CustomEvent('zona21-volumes-changed'));
        }
        
        // Recarregar assets periodicamente durante indexação
        // Primeiro reload aos 20 arquivos, depois a cada 50
        const timeSinceLastReload = now - lastReloadTimeRef.current;
        const shouldReload = 
          (progress.indexed === 20) || // Primeiro reload cedo
          (progress.indexed > 20 && progress.indexed % 50 === 0 && timeSinceLastReload > 1500);
        
        if (shouldReload) {
          lastReloadTimeRef.current = now;
          // Sempre recarregar - o filtro atual pode já estar selecionado
          resetAndLoad(filtersRef.current);
        }
      }
      if (progress.status === 'completed') {
        setIsIndexing(false);
        setIndexStartTime(null);
        // Atualizar lista de volumes na Sidebar
        window.dispatchEvent(new CustomEvent('zona21-volumes-changed'));
        
        // Sempre recarregar ao completar
        setTimeout(() => {
          resetAndLoad(filtersRef.current);
        }, 200);
        
        // Mostrar mensagem de sucesso
        if (progress.total > 0 && !completionToastShownRef.current) {
          completionToastShownRef.current = true;
          pushToast({
            type: 'success',
            message: `✅ Indexação concluída! ${progress.total} arquivos processados com sucesso.`
          });
        }
      }
    });
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
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

  // Marking system - transition functions
  type MarkingStatus = 'unmarked' | 'approved' | 'favorite' | 'rejected';

  const getNextMarkingStatus = (current: MarkingStatus, action: 'approve' | 'reject' | 'favorite'): MarkingStatus => {
    if (action === 'approve') {
      // A key
      if (current === 'unmarked') return 'approved';
      if (current === 'approved') return 'unmarked';
      if (current === 'favorite') return 'approved'; // remove only favorite, keep approved
      if (current === 'rejected') return 'approved';
    } else if (action === 'reject') {
      // D key
      if (current === 'unmarked') return 'rejected';
      if (current === 'approved') return 'rejected';
      if (current === 'favorite') return 'rejected';
      if (current === 'rejected') return 'unmarked';
    } else if (action === 'favorite') {
      // F key
      if (current === 'unmarked') return 'favorite';
      if (current === 'approved') return 'favorite';
      if (current === 'favorite') return 'approved'; // remove only favorite
      if (current === 'rejected') return 'favorite';
    }
    return current;
  };

  const handleMarkAssets = useCallback(async (assetIds: string[], action: 'approve' | 'reject' | 'favorite', advance?: boolean, usedKeyboard: boolean = false) => {
    if (!assetIds || assetIds.length === 0) return;

    // Get current assets
    const assets = assetIds.map(id => assetsRef.current.find(a => a?.id === id)).filter(Boolean) as Asset[];
    if (assets.length === 0) return;

    // Calculate next status for each asset
    const updates: { id: string; newStatus: MarkingStatus }[] = assets.map(asset => ({
      id: asset.id,
      newStatus: getNextMarkingStatus((asset.markingStatus || 'unmarked') as MarkingStatus, action)
    }));

    // Update all assets
    for (const { id, newStatus } of updates) {
      await window.electronAPI.updateAsset(id, { markingStatus: newStatus });
      // Update local state
      for (let i = 0; i < assetsRef.current.length; i++) {
        const a = assetsRef.current[i];
        if (a && a.id === id) {
          assetsRef.current[i] = { ...a, markingStatus: newStatus };
          break;
        }
      }
    }

    setAssetsVersion((v) => v + 1);

    // Track productivity stats
    if (action === 'approve' || action === 'favorite') {
      productivityStats.incrementApproved(assetIds.length);
    } else if (action === 'reject') {
      productivityStats.incrementRejected(assetIds.length);
    }

    // Track onboarding events
    if (action === 'approve') {
      onboardingService.trackEvent('asset-approved');
    } else if (action === 'favorite') {
      onboardingService.trackEvent('asset-favorited');
    } else if (action === 'reject') {
      onboardingService.trackEvent('asset-rejected');
    }

    // Track input method
    if (usedKeyboard) {
      onboardingService.trackEvent('keyboard-shortcut-used');
    } else {
      onboardingService.trackEvent('mouse-click-used');
    }

    // Update checklist
    const stats = onboardingService.getState().stats;
    if (stats.photosMarked >= 5) {
      onboardingService.updateChecklistItem('mark-5-photos', true);
    }
    if (usedKeyboard && stats.keyboardUsageCount > 0) {
      onboardingService.updateChecklistItem('use-keyboard', true);
    }

    // Show toast for multiple assets
    if (assetIds.length >= 2) {
      const actionLabel = action === 'approve' ? 'aprovados' : action === 'reject' ? 'desprezados' : 'favoritados';
      pushToast({ type: 'success', message: `${assetIds.length} arquivos ${actionLabel}`, timeoutMs: 2000 });
    }

    // Notify sidebar to refresh counts
    window.dispatchEvent(new CustomEvent('zona21-markings-changed'));

    // If viewing marking collection, refresh
    if (filtersRef.current.markingStatus) {
      await resetAndLoad(filtersRef.current);
    }

    // Advance to next if requested
    if (advance && selectedIndex !== null) {
      const nextIndex = selectedIndex + 1;
      if (nextIndex < totalCount) {
        setSelectedIndex(nextIndex);
        setTrayAssetIds([]);
        const maybe = assetsRef.current[nextIndex];
        if (maybe) {
          setSelectedAsset(maybe);
        } else {
          ensureRangeLoaded(nextIndex, nextIndex, filtersRef.current);
        }
        queueMicrotask(() => {
          const element = document.querySelector(`[data-asset-index="${nextIndex}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
        });
      }
    }
  }, [selectedIndex, totalCount, pushToast]);

  const handleClearMarking = useCallback(async (assetIds: string[]) => {
    if (!assetIds || assetIds.length === 0) return;

    for (const id of assetIds) {
      await window.electronAPI.updateAsset(id, { markingStatus: 'unmarked' });
      for (let i = 0; i < assetsRef.current.length; i++) {
        const a = assetsRef.current[i];
        if (a && a.id === id) {
          assetsRef.current[i] = { ...a, markingStatus: 'unmarked' };
          break;
        }
      }
    }
    setAssetsVersion((v) => v + 1);
    window.dispatchEvent(new CustomEvent('zona21-markings-changed'));
    if (assetIds.length >= 2) {
      pushToast({ type: 'info', message: `${assetIds.length} arquivos desmarcados`, timeoutMs: 2000 });
    }

    // If viewing marking collection, refresh
    if (filtersRef.current.markingStatus) {
      await resetAndLoad(filtersRef.current);
    }
  }, [pushToast]);

  // Compare Mode handlers
  const handleOpenCompare = useCallback((assets: Asset[]) => {
    if (assets.length < 2) {
      pushToast({ type: 'info', message: 'Selecione pelo menos 2 fotos para comparar' });
      return;
    }
    if (assets.length > 4) {
      pushToast({ type: 'info', message: 'Máximo de 4 fotos para comparação' });
      return;
    }

    // Open CompareTab instead of modal
    openTab({
      type: 'compare',
      title: `Comparar (${assets.length})`,
      icon: 'compare',
      closeable: true,
      data: { assets, layout: 2 },
    });
  }, [pushToast, openTab]);

  // Batch Edit handlers
  const handleOpenBatchEdit = useCallback(() => {
    void (async () => {
      const ids = trayAssetIds;
      let assets = trayAssets;

      if (assets.length === 0 && ids.length > 0) {
        try {
          const loaded = await window.electronAPI.getAssetsByIds(ids);
          const byId = new Map(loaded.map((a) => [a.id, a]));
          assets = ids.map((id) => byId.get(id)).filter(Boolean) as Asset[];
        } catch (error) {
          console.error('Error loading tray assets for batch edit:', error);
        }
      }

      if (assets.length === 0) {
        pushToast({ type: 'info', message: 'Selecione pelo menos 1 foto para edição em lote' });
        return;
      }

      // Open BatchEditTab
      openTab({
        type: 'batch-edit',
        title: `Editar ${assets.length} fotos`,
        closeable: true,
        icon: 'edit',
        data: {
          assets: assets.map((asset) => ({
            id: asset.id,
            name: asset.fileName,
            thumbnail: asset.thumbnailPaths?.[0] ? `file://${asset.thumbnailPaths[0]}` : undefined,
          })),
        },
      });
    })();
  }, [trayAssetIds, trayAssets, pushToast, openTab]);

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

      // Shift+P: Open Productivity Dashboard
      if (e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsProductivityDashboardOpen(true);
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

      // Cmd+C: Open compare mode with selected assets
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && !e.shiftKey) {
        if (trayAssetIds.length >= 2 && trayAssetIds.length <= 4) {
          e.preventDefault();
          const assets = trayAssetIds
            .map(id => assetsRef.current.find(a => a?.id === id))
            .filter(Boolean) as Asset[];
          if (assets.length >= 2) {
            handleOpenCompare(assets);
          }
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        if (trayAssetIds.length > 0) {
          e.preventDefault();
          void handleOpenBatchEdit();
        }
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
        // Open ViewerTab
        openTab({
          type: 'viewer',
          title: selectedAsset.fileName,
          closeable: true,
          icon: selectedAsset.mediaType === 'video' ? 'videocam' : 'photo',
          data: {
            assetId: selectedAsset.id,
            asset: selectedAsset,
            zoom: 1,
            panX: 0,
            panY: 0,
            fitMode: 'fit',
          },
        });
        return;
      }

      // Marking shortcuts - work with selected asset or tray selection
      const targetIds = trayAssetIds.length > 0 ? trayAssetIds : (selectedAsset ? [selectedAsset.id] : []);
      const advance = e.shiftKey && targetIds.length === 1;

      if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (targetIds.length > 0) {
          handleMarkAssets(targetIds, 'approve', advance, true); // keyboard = true
        }
        return;
      }

      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (targetIds.length > 0) {
          handleMarkAssets(targetIds, 'reject', advance, true); // keyboard = true
        }
        return;
      }

      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (targetIds.length > 0) {
          handleMarkAssets(targetIds, 'favorite', advance, true); // keyboard = true
        }
        return;
      }

      // Ctrl+Z: Clear marking (set to unmarked)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (targetIds.length > 0) {
          handleClearMarking(targetIds);
        }
        return;
      }

      // Space or Right Arrow: Next file
      if (e.key === ' ' && selectedAsset) {
        e.preventDefault();
        if (selectedIndex !== null && selectedIndex + 1 < totalCount) {
          const nextIndex = selectedIndex + 1;
          setSelectedIndex(nextIndex);
          setTrayAssetIds([]);
          const maybe = assetsRef.current[nextIndex];
          if (maybe) {
            setSelectedAsset(maybe);
          } else {
            ensureRangeLoaded(nextIndex, nextIndex, filtersRef.current);
          }
          queueMicrotask(() => {
            const element = document.querySelector(`[data-asset-index="${nextIndex}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
          });
        }
        return;
      }

      if (!selectedAsset) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
  }, [selectedAsset, selectedIndex, assetsVersion, totalCount, findVisualNeighborIndex, trayAssetIds, handleMarkAssets, handleClearMarking]);

  // Menu toggle keyboard shortcuts
  useEffect(() => {
    const handleMenuToggle = (e: KeyboardEvent) => {
      // Cmd+\ (backslash) - Toggle left menu
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        const tabType = activeTabId as any; // Type cast to TabType
        toggleMenu(tabType, 'left');
      }

      // Cmd+/ - Toggle right menu
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        const tabType = activeTabId as any; // Type cast to TabType
        toggleMenu(tabType, 'right');
      }
    };

    window.addEventListener('keydown', handleMenuToggle);
    return () => window.removeEventListener('keydown', handleMenuToggle);
  }, [activeTabId, toggleMenu]);

  // Asset Context Menu handlers
  const handleAssetContextMenu = useCallback((asset: Asset, position: AssetContextMenuPosition) => {
    setAssetContextMenu({ asset, position });
  }, []);

  const handleCloseAssetContextMenu = useCallback(() => {
    setAssetContextMenu(null);
  }, []);

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

      // Track onboarding: first folder import
      onboardingService.trackEvent('folder-added');
      onboardingService.updateChecklistItem('import-folder', true);
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

    // Save last selected volume for restoring after collection navigation
    if (volumeUuid) {
      lastVolumeUuidRef.current = volumeUuid;
    }

    setFilters((prev) => ({
      ...prev,
      collectionId: null,
      flagged: undefined,
      markingStatus: undefined,
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
        const v = vols.find((x) => x.uuid === volumeUuid);
        setSelectedVolumeDisconnected(!v || v.status === 'disconnected');
      } catch {
        setSelectedVolumeDisconnected(false);
      } finally {
        setIsSelectedVolumeStatusLoading(false);
      }
    })();
  };

  const handleSelectFolder = (pathPrefix: string | null) => {
    setFilters((prev) => {
      // If volumeUuid is null (e.g., after viewing a collection), restore the last known volume
      const volumeToUse = prev.volumeUuid || lastVolumeUuidRef.current;

      return {
        ...prev,
        collectionId: null,
        flagged: undefined,
        markingStatus: undefined,
        volumeUuid: volumeToUse,
        pathPrefix,
      };
    });
  };

  const handleSelectCollection = (collectionId: string | null) => {
    // Handle legacy favorites (backward compatibility)
    if (collectionId === 'favorites') {
      setFilters((prev) => ({
        ...prev,
        collectionId: null,
        flagged: true,
        markingStatus: undefined,
        volumeUuid: null,
        pathPrefix: null
      }));
      return;
    }
    // Handle marking collections (virtual)
    if (collectionId === '__marking_favorites') {
      setFilters((prev) => ({
        ...prev,
        collectionId: '__marking_favorites',
        flagged: undefined,
        markingStatus: ['favorite'],
        volumeUuid: null,
        pathPrefix: null
      }));
      return;
    }
    if (collectionId === '__marking_approved') {
      setFilters((prev) => ({
        ...prev,
        collectionId: '__marking_approved',
        flagged: undefined,
        markingStatus: ['approved', 'favorite'],
        volumeUuid: null,
        pathPrefix: null
      }));
      return;
    }
    if (collectionId === '__marking_rejected') {
      setFilters((prev) => ({
        ...prev,
        collectionId: '__marking_rejected',
        flagged: undefined,
        markingStatus: ['rejected'],
        volumeUuid: null,
        pathPrefix: null
      }));
      return;
    }
    setFilters((prev) => ({
      ...prev,
      collectionId,
      flagged: undefined,
      markingStatus: undefined,
      volumeUuid: null,
      pathPrefix: null
    }));
  };

  // Legacy toggle marked - now uses the new marking system (approve action)
  const handleToggleMarked = useCallback(async (assetId: string) => {
    handleMarkAssets([assetId], 'approve');
  }, [handleMarkAssets]);

  const toggleTrayAsset = useCallback((assetId: string) => {
    setTrayAssetIds((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]));
  }, []);

  const handleLassoSelect = useCallback((assetIds: string[], additive: boolean) => {
    const ids = (assetIds || []).map((s) => String(s)).filter(Boolean);
    if (ids.length === 0) return;

    setTrayAssetIds((prev) => {
      if (!additive) {
        queueMicrotask(() => {
          pushToast({ type: 'info', message: `${ids.length} selecionado${ids.length > 1 ? 's' : ''}`, timeoutMs: 1800 });
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
        pushToast({ type: 'info', message: `${addedCount} adicionado${addedCount > 1 ? 's' : ''} à seleção`, timeoutMs: 1800 });
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

    // Open ViewerTab instead of sidebar
    openTab({
      type: 'viewer',
      title: asset.fileName,
      closeable: true,
      icon: asset.mediaType === 'video' ? 'videocam' : 'photo',
      data: {
        assetId: asset.id,
        asset: asset,
        zoom: 1,
        panX: 0,
        panY: 0,
        fitMode: 'fit',
      },
    });
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

    setConfirmDialog({
      isOpen: true,
      title: 'Mover para Lixeira',
      message: `Tem certeza que deseja mover ${ids.length} arquivo${ids.length === 1 ? '' : 's'} para a Lixeira?`,
      confirmLabel: 'Mover para Lixeira',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await ipcInvoke<any>('App.trashAssets', window.electronAPI.trashAssets, ids);
          if (!res.success) {
            pushToast({ type: 'error', message: `Falha ao enviar para a lixeira: ${res.error || 'Erro desconhecido'}` });
            return;
          }
          pushToast({ type: 'success', message: `${ids.length} arquivo${ids.length === 1 ? '' : 's'} enviado${ids.length === 1 ? '' : 's'} para a lixeira` });
          handleTrayClear();
          await resetAndLoad(filtersRef.current);
        } catch (error) {
          console.error('Error trashing selected assets:', error);
          pushToast({ type: 'error', message: 'Falha ao enviar para a lixeira. Tente novamente.' });
        }
      }
    });
  };

  // Review Modal handlers
  const handleOpenReview = useCallback((action: 'delete' | 'export', assets: Asset[]) => {
    if (assets.length === 0) return;
    setReviewAction(action);
    setReviewAssets(assets);
    setIsReviewOpen(true);
  }, []);

  const handleReviewRemoveAsset = useCallback((assetId: string) => {
    setReviewAssets(prev => prev.filter(a => a.id !== assetId));
    // Também remover do tray principal
    setTrayAssetIds(prev => prev.filter(id => id !== assetId));
  }, []);

  const handleReviewConfirm = useCallback(async () => {
    const assetIds = reviewAssets.map(a => a.id);

    if (reviewAction === 'delete') {
      // Executar lógica de trash
      setIsReviewOpen(false);
      try {
        const res = await ipcInvoke<any>('App.trashAssets', window.electronAPI.trashAssets, assetIds);
        if (!res.success) {
          pushToast({ type: 'error', message: `Falha ao enviar para a lixeira: ${res.error || 'Erro desconhecido'}` });
          return;
        }

        // Celebration toast
        pushToast({
          type: 'success',
          message: `🎉 Você organizou ${assetIds.length} foto${assetIds.length > 1 ? 's' : ''}!`,
          timeoutMs: 3000
        });

        handleTrayClear();
        await resetAndLoad(filtersRef.current);
      } catch (error) {
        console.error('Error trashing selected assets:', error);
        pushToast({ type: 'error', message: 'Falha ao enviar para a lixeira. Tente novamente.' });
      }
    } else if (reviewAction === 'export') {
      // Abrir modal de exportação ZIP
      setIsReviewOpen(false);
      setIsZipOpen(true);

      // Celebration toast
      pushToast({
        type: 'success',
        message: `📦 Preparando exportação de ${assetIds.length} arquivo${assetIds.length > 1 ? 's' : ''}!`,
        timeoutMs: 3000
      });
    }
  }, [reviewAction, reviewAssets, pushToast, handleTrayClear, resetAndLoad]);

  // Smart Onboarding handlers
  const handleCompleteSmartOnboarding = useCallback(() => {
    localStorage.setItem('zona21-smart-onboarding-completed', 'true');
    setIsSmartOnboardingOpen(false);
    pushToast({
      type: 'success',
      message: '🎉 Você está pronto! Aproveite o Zona21!',
      timeoutMs: 3000
    });
  }, [pushToast]);

  const handleSkipSmartOnboarding = useCallback(() => {
    localStorage.setItem('zona21-smart-onboarding-completed', 'true');
    setIsSmartOnboardingOpen(false);
  }, []);

  // Register commands for Command Palette
  useEffect(() => {
    const commands: Command[] = [
      // Navigation commands
      {
        id: 'nav-next',
        title: 'Próximo arquivo',
        shortcut: ['Space'],
        category: 'navigation',
        icon: 'arrow_forward',
        action: () => {
          if (selectedIndex !== null && selectedIndex + 1 < totalCount) {
            const nextIndex = selectedIndex + 1;
            setSelectedIndex(nextIndex);
            setTrayAssetIds([]);
            const maybe = assetsRef.current[nextIndex];
            if (maybe) setSelectedAsset(maybe);
          }
        },
        isEnabled: () => selectedIndex !== null && selectedIndex + 1 < totalCount,
        keywords: ['next', 'proximo', 'avançar'],
      },
      {
        id: 'nav-open-viewer',
        title: 'Abrir no Viewer',
        shortcut: ['Enter'],
        category: 'navigation',
        icon: 'visibility',
        action: () => {
          if (selectedAsset) {
            openTab({
              type: 'viewer',
              title: selectedAsset.fileName,
              closeable: true,
              icon: selectedAsset.mediaType === 'video' ? 'videocam' : 'photo',
              data: {
                assetId: selectedAsset.id,
                asset: selectedAsset,
                zoom: 1,
                panX: 0,
                panY: 0,
                fitMode: 'fit',
              },
            });
          }
        },
        isEnabled: () => selectedAsset !== null,
        keywords: ['view', 'viewer', 'abrir', 'detalhes'],
      },
      // Marking commands
      {
        id: 'mark-approve',
        title: 'Aprovar seleção',
        shortcut: ['A'],
        category: 'marking',
        icon: 'check',
        action: () => {
          const targetIds = trayAssetIds.length > 0 ? trayAssetIds : (selectedAsset ? [selectedAsset.id] : []);
          if (targetIds.length > 0) handleMarkAssets(targetIds, 'approve');
        },
        isEnabled: () => trayAssetIds.length > 0 || selectedAsset !== null,
        keywords: ['aprovar', 'approve', 'aceitar'],
      },
      {
        id: 'mark-favorite',
        title: 'Favoritar seleção',
        shortcut: ['F'],
        category: 'marking',
        icon: 'star',
        action: () => {
          const targetIds = trayAssetIds.length > 0 ? trayAssetIds : (selectedAsset ? [selectedAsset.id] : []);
          if (targetIds.length > 0) handleMarkAssets(targetIds, 'favorite');
        },
        isEnabled: () => trayAssetIds.length > 0 || selectedAsset !== null,
        keywords: ['favorito', 'favorite', 'estrela', 'star'],
      },
      {
        id: 'mark-reject',
        title: 'Rejeitar seleção',
        shortcut: ['D'],
        category: 'marking',
        icon: 'close',
        action: () => {
          const targetIds = trayAssetIds.length > 0 ? trayAssetIds : (selectedAsset ? [selectedAsset.id] : []);
          if (targetIds.length > 0) handleMarkAssets(targetIds, 'reject');
        },
        isEnabled: () => trayAssetIds.length > 0 || selectedAsset !== null,
        keywords: ['rejeitar', 'reject', 'descartar'],
      },
      // Selection commands
      {
        id: 'select-all',
        title: 'Selecionar tudo',
        shortcut: ['⌘', 'A'],
        category: 'selection',
        icon: 'select_all',
        action: () => {
          const ids = assetsRef.current.filter(Boolean).map((a) => (a as Asset).id);
          setTrayAssetIds(ids);
        },
        keywords: ['selecionar', 'todos', 'all'],
      },
      {
        id: 'clear-selection',
        title: 'Limpar seleção',
        shortcut: ['Esc'],
        category: 'selection',
        icon: 'deselect',
        action: () => {
          setTrayAssetIds([]);
          setSelectedAsset(null);
          setSelectedIndex(null);
        },
        keywords: ['limpar', 'clear', 'deselect'],
      },
      // View commands
      {
        id: 'toggle-left-menu',
        title: 'Alternar menu esquerdo',
        shortcut: ['⌘', '\\'],
        category: 'view',
        icon: 'menu',
        action: () => toggleMenu(activeTabId as any, 'left'),
        keywords: ['sidebar', 'menu', 'esquerda', 'left'],
      },
      {
        id: 'toggle-right-menu',
        title: 'Alternar menu direito',
        shortcut: ['⌘', '/'],
        category: 'view',
        icon: 'menu_open',
        action: () => toggleMenu(activeTabId as any, 'right'),
        keywords: ['menu', 'direita', 'right', 'properties'],
      },
      // Export commands
      {
        id: 'export-xml',
        title: 'Exportar XML (Premiere)',
        category: 'export',
        icon: 'ios_share',
        action: () => {
          if (trayAssetIds.length > 0) handleTrayExport('premiere');
        },
        isEnabled: () => trayAssetIds.length > 0,
        keywords: ['premiere', 'resolve', 'xml', 'exportar'],
      },
      {
        id: 'export-xmp',
        title: 'Exportar XMP (Lightroom)',
        category: 'export',
        icon: 'ios_share',
        action: () => {
          if (trayAssetIds.length > 0) handleTrayExport('lightroom');
        },
        isEnabled: () => trayAssetIds.length > 0,
        keywords: ['lightroom', 'xmp', 'exportar'],
      },
      {
        id: 'export-zip',
        title: 'Exportar ZIP',
        category: 'export',
        icon: 'folder_zip',
        action: () => {
          if (trayAssetIds.length > 0) handleTrayExportZip(trayAssetIds);
        },
        isEnabled: () => trayAssetIds.length > 0,
        keywords: ['zip', 'compactar', 'exportar'],
      },
      // General commands
      {
        id: 'open-preferences',
        title: 'Abrir Preferências',
        shortcut: ['⌘', ','],
        category: 'general',
        icon: 'settings',
        action: () => setIsPreferencesOpen(true),
        keywords: ['configurações', 'settings', 'opcoes'],
      },
      {
        id: 'open-shortcuts',
        title: 'Atalhos de teclado',
        shortcut: ['?'],
        category: 'general',
        icon: 'keyboard',
        action: () => setIsShortcutsOpen(true),
        keywords: ['keyboard', 'shortcuts', 'atalhos', 'teclas'],
      },
      {
        id: 'scan-duplicates',
        title: 'Escanear duplicatas',
        category: 'general',
        icon: 'content_copy',
        action: () => setIsDuplicatesOpen(true),
        keywords: ['duplicatas', 'duplicates', 'similares'],
      },
      {
        id: 'open-compare',
        title: 'Comparar selecionados',
        shortcut: ['⌘', 'C'],
        category: 'view',
        icon: 'compare',
        action: () => {
          if (trayAssetIds.length >= 2 && trayAssetIds.length <= 4) {
            const assets = trayAssetIds
              .map(id => assetsRef.current.find(a => a?.id === id))
              .filter(Boolean) as Asset[];
            if (assets.length >= 2) handleOpenCompare(assets);
          }
        },
        isEnabled: () => trayAssetIds.length >= 2 && trayAssetIds.length <= 4,
        keywords: ['compare', 'comparar', 'lado a lado'],
      },
      {
        id: 'open-batch-edit',
        title: 'Edição em lote',
        shortcut: ['⌘', 'B'],
        category: 'edit',
        icon: 'edit',
        action: handleOpenBatchEdit,
        isEnabled: () => trayAssetIds.length > 0,
        keywords: ['batch', 'lote', 'editar', 'multiplos'],
      },
      {
        id: 'open-productivity',
        title: 'Dashboard de Produtividade',
        shortcut: ['Shift', 'P'],
        category: 'general',
        icon: 'insights',
        action: () => setIsProductivityDashboardOpen(true),
        keywords: ['productivity', 'produtividade', 'estatisticas', 'stats'],
      },
    ];

    // Register all commands
    commands.forEach(cmd => registerCommand(cmd));
  }, [
    selectedIndex,
    selectedAsset,
    totalCount,
    trayAssetIds,
    trayAssets,
    activeTabId,
    registerCommand,
    openTab,
    toggleMenu,
    handleMarkAssets,
    handleOpenCompare,
    handleOpenBatchEdit,
  ]);

  // Compare decisions are handled in CompareTab.handleClose
  // It dispatches zona21-refresh-assets and zona21-toast events which are handled above

  useEffect(() => {
    const unsubscribe = window.electronAPI.onExportCopyProgress((p) => {
      setCopyProgress(p);
      if (p?.done) {
        setCopyBusy(false);
      }
    });
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onExportZipProgress((p) => {
      setZipProgress(p);
      if (p?.jobId) setZipJobId(String(p.jobId));
      if (p?.done || p?.error) {
        setZipBusy(false);
      }
    });
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
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

        // Track onboarding: Export project
        onboardingService.trackEvent('project-exported');
        onboardingService.updateChecklistItem('export-project', true);
      } else if (!result.canceled) {
        pushToast({ type: 'error', message: `Falha ao exportar: ${result.error || 'Erro desconhecido'}` });
      }
    } else {
      const result = await window.electronAPI.exportLightroom(trayAssetIds);
      if (result.success) {
        setLastOp({ kind: 'export', title: 'XMP exportado', count: result.count });
        pushToast({ type: 'success', message: `Exportado(s) ${result.count} XMP` });

        // Track onboarding: Export project
        onboardingService.trackEvent('project-exported');
        onboardingService.updateChecklistItem('export-project', true);
      } else {
        pushToast({ type: 'error', message: `Falha ao exportar: ${result.error || 'Erro desconhecido'}` });
      }
    }
  };

  const trayAssetIdsSet = useMemo(() => new Set(trayAssetIds), [trayAssetIds]);

  // Optimize markedIds calculation with cached ref
  const markedIdsRef = useRef<Set<string>>(new Set());
  const markedIds = useMemo(() => {
    const newSet = new Set<string>();
    for (const a of assetsRef.current) {
      if (a?.flagged) newSet.add(a.id);
    }

    // Only update if the set actually changed
    if (newSet.size !== markedIdsRef.current.size) {
      markedIdsRef.current = newSet;
      return newSet;
    }

    // Check if contents are the same
    for (const id of newSet) {
      if (!markedIdsRef.current.has(id)) {
        markedIdsRef.current = newSet;
        return newSet;
      }
    }

    // No changes, return cached set
    return markedIdsRef.current;
  }, [assetsVersion]);

  useEffect(() => {
    resetAndLoad(filtersRef.current);
  }, [filters.mediaType, filters.datePreset, filters.dateFrom, filters.dateTo, filters.groupByDate, filters.flagged, filters.markingStatus, filters.volumeUuid, filters.pathPrefix, filters.collectionId, filters.tags]);

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
        const v = vols.find((x) => x.uuid === filters.volumeUuid);
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
    const unsubscribe = window.electronAPI.onUpdateStatus((status) => {
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
    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, [pushToast]);

  const showUpdateBanner = updateStatus?.state === 'available' || updateStatus?.state === 'download-progress' || updateStatus?.state === 'downloaded';

  return (
    <div className="flex flex-col h-screen text-white">
        {showLoading && (
          <LoadingScreen
            onComplete={() => setShowLoading(false)}
            minDuration={2500}
          />
        )}

      {showUpdateBanner && (
        <UpdateBanner
          isVisible={true}
          downloadProgress={updateStatus?.state === 'download-progress'
            ? { percent: updateStatus.percent || 0, transferred: updateStatus.transferred || 0, total: updateStatus.total || 0 }
            : undefined}
          isDownloaded={updateStatus?.state === 'downloaded'}
        />
      )}

      {!showLoading && showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <PreferencesModal isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)} />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        query={commandPalette.query}
        onQueryChange={commandPalette.setQuery}
        results={commandPalette.results}
        selectedIndex={commandPalette.selectedIndex}
        onSelectIndex={commandPalette.setSelectedIndex}
        onExecute={commandPalette.executeCommand}
        recentCommandIds={recentCommandIds}
      />

      {/* Asset Context Menu */}
      {assetContextMenu && (
        <AssetContextMenu
          asset={assetContextMenu.asset}
          position={assetContextMenu.position}
          isInTray={trayAssetIdsSet.has(assetContextMenu.asset.id)}
          onClose={handleCloseAssetContextMenu}
          onOpenViewer={(asset) => {
            openTab({
              type: 'viewer',
              title: asset.fileName,
              closeable: true,
              icon: asset.mediaType === 'video' ? 'videocam' : 'photo',
              data: {
                assetId: asset.id,
                asset: asset,
                zoom: 1,
                panX: 0,
                panY: 0,
                fitMode: 'fit',
              },
            });
          }}
          onToggleSelection={(assetId) => {
            if (trayAssetIdsSet.has(assetId)) {
              setTrayAssetIds(prev => prev.filter(id => id !== assetId));
            } else {
              setTrayAssetIds(prev => [...prev, assetId]);
            }
          }}
          onMarkApprove={(assetId) => handleMarkAssets([assetId], 'approve')}
          onMarkFavorite={(assetId) => handleMarkAssets([assetId], 'favorite')}
          onMarkReject={(assetId) => handleMarkAssets([assetId], 'reject')}
          onExportXML={(ids) => {
            setTrayAssetIds(ids);
            handleTrayExport('premiere');
          }}
          onExportXMP={(ids) => {
            setTrayAssetIds(ids);
            handleTrayExport('lightroom');
          }}
          onExportZIP={(ids) => handleTrayExportZip(ids)}
          onAddToCollection={(ids) => {
            setTrayAssetIds(ids);
            setIsMoveOpen(true);
          }}
          onDelete={(ids) => handleTrayTrashSelected(ids)}
        />
      )}

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
              <button type="button" className="mh-btn mh-btn-gray px-3 py-2 text-sm" onClick={() => void confirmTelemetryConsent(false)}>
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
      <IndexingOverlay progress={indexProgress} isVisible={isIndexing} />
      <LastOperationPanel op={lastOp} onDismiss={() => setLastOp(null)} onRevealPath={revealPath} onCopyText={copyText} />

      {/* Tab Bar - positioned at the very top */}
      <TabBar
        homeControls={{
          onOpenDuplicates: () => setIsDuplicatesOpen(true),
          filters,
          onFiltersChange: setFilters,
          isIndexing,
          indexProgress,
          indexStartTime,
          hasSelection: trayAssetIds.length > 0,
          onSelectAll: () => {
            const ids = assetsRef.current.filter(Boolean).map((a) => (a as Asset).id);
            setTrayAssetIds(ids);
          },
          onClearSelection: handleTrayClear,
          onOpenSidebar: () => setIsSidebarOpen(true),
          onToggleSidebarCollapse: () => setIsSidebarCollapsed((v) => !v),
          isSidebarCollapsed,
        }}
      />

      {/* Spacer para compensar TabBar fixa (h-12 = 48px) */}
      <div className="h-12" />

      {/* Hide sidebar overlay for viewer and compare tabs */}
      {isSidebarOpen && activeTab?.type !== 'viewer' && activeTab?.type !== 'compare' && (
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

      <div className="flex flex-1 min-h-0 w-full">
        {/* Hide sidebar for viewer and compare tabs */}
        {activeTab?.type !== 'viewer' && activeTab?.type !== 'compare' && (
          <>
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
              onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
            />

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
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TabBar moved to top - no longer here */}

          <TabContainer
            renderHomeTab={() => (
              <>
                {/* HomeTabMenu disabled - menu removed from home */}
                {/* <HomeTabMenu ... /> */}

                <div className="flex-1 flex flex-row overflow-hidden">
                  {/* Main content area (Library or empty states) */}
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  {totalCount > 0 ? (
                    <AppErrorBoundary>
                      <Library
                        assets={assetsRef.current}
                        totalCount={totalCount}
                        assetsVersion={assetsVersion}
                        onRangeRendered={(startIndex, stopIndex) => ensureRangeLoaded(startIndex, stopIndex, filtersRef.current)}
                        onAssetClick={handleAssetClickAtIndex}
                        onAssetDoubleClick={handleAssetDoubleClickAtIndex}
                        onImportPaths={handleImportPaths}
                        onLassoSelect={handleLassoSelect}
                        onToggleMarked={handleToggleMarked}
                        markedIds={markedIds}
                        onToggleSelection={handleToggleSelection}
                        onAssetContextMenu={handleAssetContextMenu}
                        selectedAssetId={selectedAsset?.id ?? null}
                        trayAssetIds={trayAssetIdsSet}
                        groupByDate={filters.groupByDate}
                        viewerAsset={null}
                        onIndexDirectory={handleIndexDirectory}
                        emptyStateType={filters.flagged ? 'flagged' : filters.collectionId ? 'collection' : 'files'}
                      />
                    </AppErrorBoundary>
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
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="mh-btn mh-btn-gray px-3 py-2 text-sm"
                            onClick={() => {
                              handleSelectVolume(null);
                              handleSelectFolder(null);
                              handleSelectCollection(null);
                            }}
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState type="volume" onAction={handleIndexDirectory} />
                  )}
                </div>

                {/* Viewer now handled by ViewerTab in tab system */}
              </div>
              </>
            )}
          />
        </div>
      </div>

      {/* SelectionTray hidden in ViewerTab - actions are in QuickEditPanel */}
      {activeTab?.type !== 'viewer' && (
        <SelectionTray
          selectedAssets={trayAssets}
          currentCollectionId={filters.collectionId}
          isBusy={copyBusy || zipBusy || moveBusy}
          onRemoveFromSelection={handleTrayRemove}
          onClearSelection={handleTrayClear}
          onCopySelected={handleTrayCopy}
          onTrashSelected={handleTrayTrashSelected}
          onExportSelected={handleTrayExport}
          onExportZipSelected={handleTrayExportZip}
          onOpenReview={handleOpenReview}
          onRemoveFromCollection={handleRemoveFromCollection}
          onOpenCompare={handleOpenCompare}
          onOpenBatchEdit={handleOpenBatchEdit}
        />
      )}

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

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        assets={reviewAssets}
        action={reviewAction || 'delete'}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleReviewConfirm}
        onRemoveAsset={handleReviewRemoveAsset}
      />

      {/* Compare Mode - now handled by CompareTab in tab system */}

      {/* Batch Edit - now handled by BatchEditTab in tab system */}

      {/* Growth Features */}
      {/* Productivity Dashboard */}
      <ProductivityDashboard
        isOpen={isProductivityDashboardOpen}
        onClose={() => setIsProductivityDashboardOpen(false)}
      />

      {/* Enhanced Milestone Notification */}
      {currentMilestone && (
        <MilestoneNotificationEnhanced
          milestone={currentMilestone}
          onClose={() => setCurrentMilestone(null)}
        />
      )}

      {/* Keyboard Hints Bar */}
      <KeyboardHintsBar
        visible={showKeyboardHints}
        onDismiss={() => {
          setShowKeyboardHints(false);
          localStorage.setItem('zona21-show-keyboard-hints', 'false');
        }}
      />

      {/* Smart Onboarding */}
      <SmartOnboarding
        isOpen={isSmartOnboardingOpen}
        onComplete={handleCompleteSmartOnboarding}
        onSkip={handleSkipSmartOnboarding}
      />

      {/* Milestone Notifications (Growth Design - non-intrusive) */}
      <MilestoneNotification />

      {copyProgress && (copyBusy || copyProgress.status === 'started' || copyProgress.status === 'progress') && (
        <div className="fixed inset-x-0 bottom-16 z-[60] mx-auto w-full max-w-xl rounded bg-gray-800/95 p-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-200">Copiando…</div>
            <div className="text-xs text-gray-400">
              {copyProgress.copied ?? 0}/{copyProgress.total ?? 0}
              {copyProgress.skipped ? ` · ${copyProgress.skipped} ignorado${copyProgress.skipped > 1 ? 's' : ''}` : ''}
              {copyProgress.skippedOffline ? ` · ${copyProgress.skippedOffline} offline` : ''}
              {copyProgress.skippedMissing ? ` · ${copyProgress.skippedMissing} não encontrado${copyProgress.skippedMissing > 1 ? 's' : ''}` : ''}
              {copyProgress.failed ? ` · ${copyProgress.failed} falha${copyProgress.failed > 1 ? 's' : ''}` : ''}
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
            <div className="text-sm text-gray-200">Exportando ZIP…</div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-400">
                {zipProgress.added ?? 0}/{zipProgress.total ?? 0}
                {zipProgress.skippedOffline ? ` · ${zipProgress.skippedOffline} offline` : ''}
                {zipProgress.skippedMissing ? ` · ${zipProgress.skippedMissing} não encontrado${zipProgress.skippedMissing > 1 ? 's' : ''}` : ''}
                {zipProgress.failed ? ` · ${zipProgress.failed} falha${zipProgress.failed > 1 ? 's' : ''}` : ''}
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

function App() {
  return (
    <MenuProvider>
      <TabsProvider>
        <CommandProvider>
          <AppContent />
        </CommandProvider>
      </TabsProvider>
    </MenuProvider>
  );
}

export default App;
