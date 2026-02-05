import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import Library from './components/Library.tsx';
import Sidebar from './components/Sidebar.tsx';
import { APP_VERSION } from './version';
import { TabsProvider, useTabs } from './contexts/TabsContext';
import { MenuProvider, useMenu } from './contexts/MenuContext';
import { CommandProvider, useCommands } from './contexts/CommandContext';
import TabBar from './components/TabBar';
import TabContainer from './components/TabContainer';
import SelectionTray from './components/SelectionTray.tsx';
import MoveModal from './components/MoveModal.tsx';
import DuplicatesModal from './components/DuplicatesModal.tsx';
import CopyModal from './components/CopyModal.tsx';
import ExportZipModal from './components/ExportZipModal.tsx';
import ToastHost, { type Toast } from './components/ToastHost.tsx';
import KeyboardHintsBar from './components/KeyboardHintsBar.tsx';
import LastOperationPanel from './components/LastOperationPanel.tsx';
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
import { ProductivityDashboard } from './components/ProductivityDashboard.tsx';
import { MilestoneNotificationEnhanced } from './components/MilestoneNotificationEnhanced.tsx';
import { SmartOnboarding } from './components/SmartOnboarding';
import CommandPalette from './components/CommandPalette.tsx';
import AssetContextMenu, { type AssetContextMenuPosition } from './components/AssetContextMenu.tsx';
import { useCommandPalette } from './hooks/useCommandPalette';
import { Asset } from './shared/types';
import { ipcInvoke } from './shared/ipcInvoke';
import { useProductivityStats } from './hooks/useProductivityStats';
import { useSuggestions } from './hooks/useSuggestions';
import { useSpatialNavigation } from './hooks/useSpatialNavigation';
import { useAssetPagination } from './hooks/useAssetPagination';
import { useAssetMarking } from './hooks/useAssetMarking';
import { useExportHandlers, LastOperation } from './hooks/useExportHandlers';
import { useMoveAssets } from './hooks/useMoveAssets';
import { useReviewModal } from './hooks/useReviewModal';
import { useIndexingProgress } from './hooks/useIndexingProgress';
import { createAppCommands } from './commands';

function AppContent() {
  // Context hooks
  const { openTab, activeTabId, getTab } = useTabs();
  const { toggleMenu } = useMenu();
  const { registerCommand, recentCommandIds } = useCommands();
  const activeTab = getTab(activeTabId);

  // Core state
  const assetsRef = useRef<Array<Asset | null>>([]);
  const [assetsVersion, setAssetsVersion] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [trayAssetIds, setTrayAssetIds] = useState<string[]>([]);
  const [trayAssets, setTrayAssets] = useState<Asset[]>([]);

  // UI state
  const [isDuplicatesOpen, setIsDuplicatesOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastOp, setLastOp] = useState<LastOperation | null>(null);
  const [collectionsRefreshToken, setCollectionsRefreshToken] = useState(0);
  const [selectedVolumeDisconnected, setSelectedVolumeDisconnected] = useState(false);
  const [isSelectedVolumeStatusLoading, setIsSelectedVolumeStatusLoading] = useState(false);
  const [, setHasAnyConnectedVolume] = useState<boolean | null>(null);
  const [, setIsVolumesStatusLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [, setTelemetryConsent] = useState<boolean | null>(null);
  const [showTelemetryPrompt, setShowTelemetryPrompt] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(() => {
    const saved = localStorage.getItem('zona21-show-keyboard-hints');
    return saved !== 'false';
  });

  // Growth features state
  const [isProductivityDashboardOpen, setIsProductivityDashboardOpen] = useState(false);
  const [isSmartOnboardingOpen, setIsSmartOnboardingOpen] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<any>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  // Asset context menu state
  const [assetContextMenu, setAssetContextMenu] = useState<{
    asset: Asset;
    position: AssetContextMenuPosition;
  } | null>(null);

  // Loading states
  const [showLoading, setShowLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Filters
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
    tags: undefined as string[] | undefined,
  });

  const lastVolumeUuidRef = useRef<string | null>(null);
  const filtersRef = useRef(filters);

  useEffect(() => {
    if (filters.volumeUuid) {
      lastVolumeUuidRef.current = filters.volumeUuid;
    }
  }, [filters.volumeUuid]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Productivity stats hook
  const productivityStats = useProductivityStats();

  // Toast helpers
  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, ...t }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Spatial navigation hook
  const { findVisualNeighborIndex } = useSpatialNavigation(assetsVersion);

  // Asset pagination hook
  const { resetAndLoad, ensureRangeLoaded } = useAssetPagination({
    assetsRef,
    setTotalCount,
    setAssetsVersion,
    setSelectedAsset,
    setSelectedIndex,
  });

  // Asset marking hook
  const { handleMarkAssets, handleClearMarking } = useAssetMarking({
    assetsRef,
    setAssetsVersion,
    selectedIndex,
    totalCount,
    setSelectedIndex,
    setTrayAssetIds,
    setSelectedAsset,
    pushToast,
    filtersRef,
    resetAndLoad,
    ensureRangeLoaded,
    productivityStats,
  });

  // Export handlers hook
  const {
    isCopyOpen, setIsCopyOpen, copyBusy, copyProgress, confirmCopy, handleTrayCopy,
    isZipOpen, setIsZipOpen, zipBusy, zipProgress, zipJobId, confirmZip, cancelZip, handleTrayExportZip,
    handleTrayExport,
  } = useExportHandlers({ trayAssetIds, pushToast, setLastOp });

  // Move assets hook
  const {
    isMoveOpen, setIsMoveOpen, moveDestinationMode, setMoveDestinationMode,
    moveDestinationDir, moveUnderstood, setMoveUnderstood,
    moveBusy, moveConflictsCount, handleMoveAssetsToFolder, closeMoveModal,
    pickMoveDestinationDialog, planMove, resolveMoveConflicts,
  } = useMoveAssets({
    trayAssetIds,
    setTrayAssetIds,
    setTrayAssets,
    filtersRef,
    resetAndLoad,
    pushToast,
  });

  // Review modal hook
  const {
    isReviewOpen, setIsReviewOpen, reviewAction, reviewAssets,
    handleOpenReview, handleReviewRemoveAsset, handleReviewConfirm,
  } = useReviewModal({
    trayAssetIds,
    setTrayAssetIds,
    setTrayAssets,
    pushToast,
    filtersRef,
    resetAndLoad,
    setIsZipOpen,
  });

  // Indexing progress hook
  const { isIndexing, indexProgress, indexStartTime, handleIndexDirectory, handleImportPaths } = useIndexingProgress({
    filtersRef,
    resetAndLoad,
    pushToast,
  });

  // Command palette hook
  const commandPalette = useCommandPalette({ activeContext: activeTabId });

  // Suggestions hook
  const { suggestions } = useSuggestions({
    onCompare: () => setIsDuplicatesOpen(true),
    onReview: () => {
      const rejectedAssets = assetsRef.current.filter((a) => a && a.markingStatus === 'rejected') as Asset[];
      handleOpenReview('delete', rejectedAssets);
    },
  });

  // Show suggestions as toasts
  useEffect(() => {
    if (suggestions.length > 0) {
      const suggestion = suggestions[0];
      pushToast({
        type: 'info',
        message: suggestion.message,
        actions: [{ label: suggestion.actionLabel, onClick: suggestion.action }],
        timeoutMs: 12000,
      });
    }
  }, [suggestions, pushToast]);

  // Offline library message
  const showOfflineLibraryMessage = useMemo(() => {
    if (selectedVolumeDisconnected) return true;
    if (totalCount <= 0) return false;
    const sample = assetsRef.current.filter(Boolean).slice(0, 80) as Asset[];
    if (sample.length === 0) return false;
    const hasAnyOnline = sample.some((a) => a.status === 'online');
    const hasAnyThumb = sample.some((a) => Array.isArray(a.thumbnailPaths) && a.thumbnailPaths.length > 0);
    if (!hasAnyOnline) return true;
    if (!hasAnyThumb) return true;
    return false;
  }, [selectedVolumeDisconnected, totalCount, assetsVersion]);

  // Volume status refresh
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
    const onFocus = () => void refreshVolumesStatus();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshVolumesStatus]);

  // Utility functions
  const revealPath = useCallback(async (p: string) => {
    const fn = (window.electronAPI as any)?.revealPath;
    if (typeof fn !== 'function') return;
    await (window.electronAPI as any).revealPath(p);
  }, []);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast({ type: 'success', message: 'Copiado para a área de transferência', timeoutMs: 2000 });
    } catch {
      pushToast({ type: 'error', message: 'Não foi possível copiar para a área de transferência' });
    }
  }, [pushToast]);

  // Telemetry consent
  useEffect(() => {
    const run = async () => {
      const fnGet = (window.electronAPI as any)?.getTelemetryConsent;
      if (typeof fnGet !== 'function') return;
      try {
        const consent = await (window.electronAPI as any).getTelemetryConsent();
        setTelemetryConsent(consent);
        setShowTelemetryPrompt(consent === null);
      } catch { /* ignore */ }
    };
    run();
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
    } catch { /* ignore */ }
    setTelemetryConsent(enabled);
    setShowTelemetryPrompt(false);
  }, []);

  // Onboarding checks
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(`zona21-onboarding-${APP_VERSION}`);
    const hasAnyVolume = localStorage.getItem('zona21-has-any-volume');
    if (!hasCompletedOnboarding && !hasAnyVolume) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const hasCompletedSmartOnboarding = localStorage.getItem('zona21-smart-onboarding-completed');
    const hasAnyPhotos = totalCount > 0;
    if (!hasCompletedSmartOnboarding && hasAnyPhotos && !showLoading) {
      const timer = setTimeout(() => setIsSmartOnboardingOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [totalCount, showLoading]);

  // Milestone achievements
  useEffect(() => {
    const unlockedMilestones = productivityStats.milestones.filter((m) => m.achieved);
    const shownMilestonesStr = localStorage.getItem('zona21-shown-milestones');
    const shownMilestones = shownMilestonesStr ? JSON.parse(shownMilestonesStr) : [];
    const newMilestone = unlockedMilestones.find((m) => !shownMilestones.includes(m.id));
    if (newMilestone && !currentMilestone) {
      setCurrentMilestone(newMilestone);
      const updatedShownMilestones = [...shownMilestones, newMilestone.id];
      localStorage.setItem('zona21-shown-milestones', JSON.stringify(updatedShownMilestones));
    }
  }, [productivityStats.milestones, currentMilestone]);

  // Event listeners
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

  useEffect(() => {
    const onRefreshAssets = () => {
      setAssetsVersion((v) => v + 1);
      resetAndLoad(filtersRef.current);
    };
    window.addEventListener('zona21-refresh-assets', onRefreshAssets);
    return () => window.removeEventListener('zona21-refresh-assets', onRefreshAssets);
  }, [resetAndLoad]);

  useEffect(() => {
    const onVolumesChanged = () => refreshVolumesStatus();
    window.addEventListener('zona21-volumes-changed', onVolumesChanged);
    return () => window.removeEventListener('zona21-volumes-changed', onVolumesChanged);
  }, [refreshVolumesStatus]);

  useEffect(() => {
    const onForceReload = () => {
      assetsRef.current = [];
      setTotalCount(0);
      setAssetsVersion((v) => v + 1);
      setTimeout(() => resetAndLoad(filtersRef.current), 100);
    };
    window.addEventListener('zona21-force-reload-assets', onForceReload);
    return () => window.removeEventListener('zona21-force-reload-assets', onForceReload);
  }, [resetAndLoad]);

  // Sidebar escape key
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

  // Compare mode handler
  const handleOpenCompare = useCallback((assets: Asset[]) => {
    if (assets.length < 2) {
      pushToast({ type: 'info', message: 'Selecione pelo menos 2 fotos para comparar' });
      return;
    }
    if (assets.length > 4) {
      pushToast({ type: 'info', message: 'Máximo de 4 fotos para comparação' });
      return;
    }
    openTab({ type: 'compare', title: `Comparar (${assets.length})`, icon: 'compare', closeable: true, data: { assets, layout: 2 } });
  }, [pushToast, openTab]);

  // Main keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable) return;

      if (e.key === '?') { e.preventDefault(); setIsShortcutsOpen(true); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); setIsPreferencesOpen(true); return; }
      if (e.shiftKey && e.key === 'P') { e.preventDefault(); setIsProductivityDashboardOpen(true); return; }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const ids = assetsRef.current.filter(Boolean).map((a) => (a as Asset).id);
        setTrayAssetIds((prev) => (prev.length > 0 && prev.length === ids.length) ? [] : ids);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && !e.shiftKey) {
        if (trayAssetIds.length >= 2 && trayAssetIds.length <= 4) {
          e.preventDefault();
          const assets = trayAssetIds.map((id) => assetsRef.current.find((a) => a?.id === id)).filter(Boolean) as Asset[];
          if (assets.length >= 2) handleOpenCompare(assets);
        }
        return;
      }


      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (trayAssetIds.length > 0) setTrayAssetIds([]);
        if (selectedAsset) { setSelectedAsset(null); setSelectedIndex(null); }
        return;
      }

      if (e.key === 'Enter' && selectedAsset) {
        e.preventDefault();
        openTab({
          type: 'viewer', title: selectedAsset.fileName, closeable: true,
          icon: selectedAsset.mediaType === 'video' ? 'videocam' : 'photo',
          data: { assetId: selectedAsset.id, asset: selectedAsset, zoom: 1, panX: 0, panY: 0, fitMode: 'fit' },
        });
        return;
      }

      const targetIds = trayAssetIds.length > 0 ? trayAssetIds : selectedAsset ? [selectedAsset.id] : [];
      const advance = e.shiftKey && targetIds.length === 1;

      if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (targetIds.length > 0) handleMarkAssets(targetIds, 'approve', advance, true);
        return;
      }
      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (targetIds.length > 0) handleMarkAssets(targetIds, 'reject', advance, true);
        return;
      }
      if (e.key.toLowerCase() === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (targetIds.length > 0) handleMarkAssets(targetIds, 'favorite', advance, true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (targetIds.length > 0) handleClearMarking(targetIds);
        return;
      }

      if (e.key === ' ' && selectedAsset) {
        e.preventDefault();
        if (selectedIndex !== null && selectedIndex + 1 < totalCount) {
          const nextIndex = selectedIndex + 1;
          setSelectedIndex(nextIndex);
          setTrayAssetIds([]);
          const maybe = assetsRef.current[nextIndex];
          if (maybe) setSelectedAsset(maybe);
          else ensureRangeLoaded(nextIndex, nextIndex, filtersRef.current);
          queueMicrotask(() => {
            document.querySelector(`[data-asset-index="${nextIndex}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          });
        }
        return;
      }

      if (!selectedAsset) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (selectedIndex === null) return;
        let nextIndex = selectedIndex;
        const dir = e.key === 'ArrowRight' ? 'right' : e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowUp' ? 'up' : 'down';
        const neighbor = findVisualNeighborIndex(dir, selectedIndex);
        if (neighbor !== null) nextIndex = neighbor;
        if (nextIndex !== selectedIndex) {
          setSelectedIndex(nextIndex);
          setTrayAssetIds([]);
          const maybe = assetsRef.current[nextIndex];
          if (maybe) setSelectedAsset(maybe);
          else ensureRangeLoaded(nextIndex, nextIndex, filtersRef.current);
          queueMicrotask(() => {
            document.querySelector(`[data-asset-index="${nextIndex}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          });
        }
      } else if (e.key === 'Escape') {
        setSelectedAsset(null);
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedAsset, selectedIndex, assetsVersion, totalCount, findVisualNeighborIndex, trayAssetIds, handleMarkAssets, handleClearMarking, handleOpenCompare, openTab, ensureRangeLoaded]);

  // Menu toggle shortcuts
  useEffect(() => {
    const handleMenuToggle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') { e.preventDefault(); toggleMenu(activeTabId as any, 'left'); }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); toggleMenu(activeTabId as any, 'right'); }
    };
    window.addEventListener('keydown', handleMenuToggle);
    return () => window.removeEventListener('keydown', handleMenuToggle);
  }, [activeTabId, toggleMenu]);

  // Asset context menu handlers
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

  // Keep selected asset in sync
  useEffect(() => {
    if (selectedIndex === null) return;
    const a = assetsRef.current[selectedIndex];
    if (a) setSelectedAsset(a);
  }, [selectedIndex, assetsVersion]);

  // Load tray assets by IDs
  useEffect(() => {
    const run = async () => {
      if (trayAssetIds.length === 0) { setTrayAssets([]); return; }
      try {
        const tray = await window.electronAPI.getAssetsByIds(trayAssetIds);
        const byId = new Map(tray.map((a) => [a.id, a]));
        setTrayAssets(trayAssetIds.map((id) => byId.get(id)).filter(Boolean) as Asset[]);
      } catch (error) {
        console.error('Error loading tray assets:', error);
      }
    };
    run();
  }, [trayAssetIds]);

  // Volume/folder/collection selection handlers
  const handleSelectVolume = (volumeUuid: string | null) => {
    assetsRef.current = [];
    setTotalCount(0);
    setAssetsVersion((v) => v + 1);
    setSelectedVolumeDisconnected(false);
    setIsSelectedVolumeStatusLoading(!!volumeUuid);
    if (volumeUuid) lastVolumeUuidRef.current = volumeUuid;
    setFilters((prev) => ({ ...prev, collectionId: null, flagged: undefined, markingStatus: undefined, volumeUuid, pathPrefix: null }));
    if (!volumeUuid) { setIsSelectedVolumeStatusLoading(false); return; }
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
      const volumeToUse = prev.volumeUuid || lastVolumeUuidRef.current;
      return { ...prev, collectionId: null, flagged: undefined, markingStatus: undefined, volumeUuid: volumeToUse, pathPrefix };
    });
  };

  const handleSelectCollection = (collectionId: string | null) => {
    if (collectionId === 'favorites') {
      setFilters((prev) => ({ ...prev, collectionId: null, flagged: true, markingStatus: undefined, volumeUuid: null, pathPrefix: null }));
      return;
    }
    if (collectionId === '__marking_favorites') {
      setFilters((prev) => ({ ...prev, collectionId: '__marking_favorites', flagged: undefined, markingStatus: ['favorite'], volumeUuid: null, pathPrefix: null }));
      return;
    }
    if (collectionId === '__marking_approved') {
      setFilters((prev) => ({ ...prev, collectionId: '__marking_approved', flagged: undefined, markingStatus: ['approved', 'favorite'], volumeUuid: null, pathPrefix: null }));
      return;
    }
    if (collectionId === '__marking_rejected') {
      setFilters((prev) => ({ ...prev, collectionId: '__marking_rejected', flagged: undefined, markingStatus: ['rejected'], volumeUuid: null, pathPrefix: null }));
      return;
    }
    setFilters((prev) => ({ ...prev, collectionId, flagged: undefined, markingStatus: undefined, volumeUuid: null, pathPrefix: null }));
  };

  // Tray handlers
  const toggleTrayAsset = useCallback((assetId: string) => {
    setTrayAssetIds((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]));
  }, []);

  const handleLassoSelect = useCallback((assetIds: string[], additive: boolean) => {
    const ids = (assetIds || []).map((s) => String(s)).filter(Boolean);
    if (ids.length === 0) return;
    setTrayAssetIds((prev) => {
      if (!additive) {
        queueMicrotask(() => pushToast({ type: 'info', message: `${ids.length} selecionado${ids.length > 1 ? 's' : ''}`, timeoutMs: 1800 }));
        return ids;
      }
      const set = new Set(prev);
      let addedCount = 0;
      for (const id of ids) { if (!set.has(id)) { set.add(id); addedCount++; } }
      queueMicrotask(() => pushToast({ type: 'info', message: `${addedCount} adicionado${addedCount > 1 ? 's' : ''} à seleção`, timeoutMs: 1800 }));
      return Array.from(set);
    });
  }, [pushToast]);

  const handleToggleSelection = useCallback((assetId: string, e: MouseEvent) => {
    e.stopPropagation();
    toggleTrayAsset(assetId);
  }, [toggleTrayAsset]);

  const handleAssetClickAtIndex = (asset: Asset, index: number, e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey) { toggleTrayAsset(asset.id); return; }
    setSelectedIndex(index);
    setSelectedAsset(asset);
    setTrayAssetIds([asset.id]);
  };

  const handleAssetDoubleClickAtIndex = (asset: Asset, index: number) => {
    setSelectedIndex(index);
    setSelectedAsset(asset);
    openTab({
      type: 'viewer', title: asset.fileName, closeable: true,
      icon: asset.mediaType === 'video' ? 'videocam' : 'photo',
      data: { assetId: asset.id, asset, zoom: 1, panX: 0, panY: 0, fitMode: 'fit' },
    });
  };

  const handleTrayRemove = (assetId: string) => setTrayAssetIds((prev) => prev.filter((id) => id !== assetId));
  const handleTrayClear = () => { setTrayAssetIds([]); setTrayAssets([]); };

  const handleTrayTrashSelected = async (assetIds: string[]) => {
    const ids = (assetIds || []).map((s) => String(s)).filter(Boolean);
    if (ids.length === 0) return;
    setConfirmDialog({
      isOpen: true, title: 'Mover para Lixeira',
      message: `Tem certeza que deseja mover ${ids.length} arquivo${ids.length === 1 ? '' : 's'} para a Lixeira?`,
      confirmLabel: 'Mover para Lixeira', variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await ipcInvoke<any>('App.trashAssets', window.electronAPI.trashAssets, ids);
          if (!res.success) { pushToast({ type: 'error', message: `Falha ao enviar para a lixeira: ${res.error || 'Erro desconhecido'}` }); return; }
          pushToast({ type: 'success', message: `${ids.length} arquivo${ids.length === 1 ? '' : 's'} enviado${ids.length === 1 ? '' : 's'} para a lixeira` });
          handleTrayClear();
          await resetAndLoad(filtersRef.current);
        } catch (error) {
          console.error('Error trashing selected assets:', error);
          pushToast({ type: 'error', message: 'Falha ao enviar para a lixeira. Tente novamente.' });
        }
      },
    });
  };

  const handleToggleMarked = useCallback(async (assetId: string) => {
    handleMarkAssets([assetId], 'approve');
  }, [handleMarkAssets]);

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
  }, [pushToast, resetAndLoad]);

  // Smart onboarding handlers
  const handleCompleteSmartOnboarding = useCallback(() => {
    localStorage.setItem('zona21-smart-onboarding-completed', 'true');
    setIsSmartOnboardingOpen(false);
    pushToast({ type: 'success', message: '🎉 Você está pronto! Aproveite o Zona21!', timeoutMs: 3000 });
  }, [pushToast]);

  const handleSkipSmartOnboarding = useCallback(() => {
    localStorage.setItem('zona21-smart-onboarding-completed', 'true');
    setIsSmartOnboardingOpen(false);
  }, []);

  // Register commands
  useEffect(() => {
    const commands = createAppCommands({
      selectedIndex, selectedAsset, totalCount, trayAssetIds, activeTabId,
      assetsRef, setSelectedIndex, setSelectedAsset, setTrayAssetIds,
      openTab, toggleMenu, handleMarkAssets, handleOpenCompare,
      handleTrayExport, handleTrayExportZip, setIsPreferencesOpen, setIsShortcutsOpen,
      setIsDuplicatesOpen, setIsProductivityDashboardOpen,
    });
    commands.forEach((cmd) => registerCommand(cmd));
  }, [selectedIndex, selectedAsset, totalCount, trayAssetIds, activeTabId, registerCommand, openTab, toggleMenu, handleMarkAssets, handleOpenCompare, handleTrayExport, handleTrayExportZip]);

  // Filter change effect
  useEffect(() => {
    resetAndLoad(filtersRef.current);
  }, [filters.mediaType, filters.datePreset, filters.dateFrom, filters.dateTo, filters.groupByDate, filters.flagged, filters.markingStatus, filters.volumeUuid, filters.pathPrefix, filters.collectionId, filters.tags, resetAndLoad]);

  // Volume status check
  useEffect(() => {
    const run = async () => {
      try {
        if (!filters.volumeUuid) { setSelectedVolumeDisconnected(false); setIsSelectedVolumeStatusLoading(false); return; }
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

  // Sidebar body overflow
  useEffect(() => {
    if (!isSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isSidebarOpen]);

  // Update status
  const [updateStatus, setUpdateStatus] = useState<any>(null);
  useEffect(() => {
    const unsubscribe = window.electronAPI.onUpdateStatus((status) => {
      setUpdateStatus(status);
      if (status.state === 'available') {
        pushToast({ type: 'info', message: `Atualização disponível: Nova versão ${status.version} disponível!`, timeoutMs: 5000 });
      }
    });
    return () => { try { unsubscribe?.(); } catch { /* ignore */ } };
  }, [pushToast]);

  const showUpdateBanner = updateStatus?.state === 'available' || updateStatus?.state === 'download-progress' || updateStatus?.state === 'downloaded';

  const trayAssetIdsSet = useMemo(() => new Set(trayAssetIds), [trayAssetIds]);
  const markedIdsRef = useRef<Set<string>>(new Set());
  const markedIds = useMemo(() => {
    const newSet = new Set<string>();
    for (const a of assetsRef.current) { if (a?.flagged) newSet.add(a.id); }
    if (newSet.size !== markedIdsRef.current.size) { markedIdsRef.current = newSet; return newSet; }
    for (const id of newSet) { if (!markedIdsRef.current.has(id)) { markedIdsRef.current = newSet; return newSet; } }
    return markedIdsRef.current;
  }, [assetsVersion]);

  return (
    <div className="flex flex-col h-screen text-white">
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} minDuration={2500} />}
      {showUpdateBanner && <UpdateBanner isVisible={true} downloadProgress={updateStatus?.state === 'download-progress' ? { percent: updateStatus.percent || 0, transferred: updateStatus.transferred || 0, total: updateStatus.total || 0 } : undefined} isDownloaded={updateStatus?.state === 'downloaded'} />}
      {!showLoading && showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <PreferencesModal isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)} />

      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} query={commandPalette.query} onQueryChange={commandPalette.setQuery} results={commandPalette.results} selectedIndex={commandPalette.selectedIndex} onSelectIndex={commandPalette.setSelectedIndex} onExecute={commandPalette.executeCommand} recentCommandIds={recentCommandIds} />

      {assetContextMenu && (
        <AssetContextMenu asset={assetContextMenu.asset} position={assetContextMenu.position} isInTray={trayAssetIdsSet.has(assetContextMenu.asset.id)} onClose={handleCloseAssetContextMenu}
          onOpenViewer={(asset) => openTab({ type: 'viewer', title: asset.fileName, closeable: true, icon: asset.mediaType === 'video' ? 'videocam' : 'photo', data: { assetId: asset.id, asset, zoom: 1, panX: 0, panY: 0, fitMode: 'fit' } })}
          onToggleSelection={(assetId) => { if (trayAssetIdsSet.has(assetId)) setTrayAssetIds((prev) => prev.filter((id) => id !== assetId)); else setTrayAssetIds((prev) => [...prev, assetId]); }}
          onMarkApprove={(assetId) => handleMarkAssets([assetId], 'approve')} onMarkFavorite={(assetId) => handleMarkAssets([assetId], 'favorite')} onMarkReject={(assetId) => handleMarkAssets([assetId], 'reject')}
          onExportXML={(ids) => { setTrayAssetIds(ids); handleTrayExport('premiere'); }} onExportXMP={(ids) => { setTrayAssetIds(ids); handleTrayExport('lightroom'); }}
          onExportZIP={(ids) => handleTrayExportZip(ids)} onAddToCollection={(ids) => { setTrayAssetIds(ids); setIsMoveOpen(true); }} onDelete={(ids) => handleTrayTrashSelected(ids)}
        />
      )}

      {showTelemetryPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="mh-popover w-full max-w-lg p-5">
            <div className="text-base font-semibold text-white">Diagnósticos (beta)</div>
            <div className="mt-2 text-sm text-gray-300">Você autoriza o envio de diagnósticos anônimos (erros e crashes) para melhorar o app durante o beta?</div>
            <div className="mt-2 text-xs text-gray-400">Não enviamos nomes ou caminhos de arquivos. Você pode desativar depois nas Configurações.</div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="mh-btn mh-btn-gray px-3 py-2 text-sm" onClick={() => void confirmTelemetryConsent(false)}>Agora não</button>
              <button type="button" className="mh-btn mh-btn-gray px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700" onClick={() => void confirmTelemetryConsent(true)}>Aceitar</button>
            </div>
          </div>
        </div>
      )}

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
      <IndexingOverlay progress={indexProgress} isVisible={isIndexing} />
      <LastOperationPanel op={lastOp} onDismiss={() => setLastOp(null)} onRevealPath={revealPath} onCopyText={copyText} />

      <TabBar homeControls={{ onOpenDuplicates: () => setIsDuplicatesOpen(true), filters, onFiltersChange: setFilters, isIndexing, indexProgress, indexStartTime, hasSelection: trayAssetIds.length > 0, onSelectAll: () => setTrayAssetIds(assetsRef.current.filter(Boolean).map((a) => (a as Asset).id)), onClearSelection: handleTrayClear, onOpenSidebar: () => setIsSidebarOpen(true), onToggleSidebarCollapse: () => setIsSidebarCollapsed((v) => !v), isSidebarCollapsed }} />
      <div className="h-12" />

      {isSidebarOpen && activeTab?.type !== 'viewer' && activeTab?.type !== 'compare' && (
        <div className="fixed inset-0 z-[80] sm:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Fechar barra lateral" onClick={() => setIsSidebarOpen(false)} />
          <Sidebar className="relative z-[81] h-full" onIndexDirectory={handleIndexDirectory} selectedVolumeUuid={filters.volumeUuid} selectedPathPrefix={filters.pathPrefix} onSelectVolume={handleSelectVolume} onSelectFolder={handleSelectFolder} onMoveAssetsToFolder={handleMoveAssetsToFolder} selectedCollectionId={filters.collectionId} onSelectCollection={handleSelectCollection} collectionsRefreshToken={collectionsRefreshToken} collapsed={false} onOpenPreferences={() => setIsPreferencesOpen(true)} />
        </div>
      )}

      <div className="flex flex-1 min-h-0 w-full">
        {activeTab?.type !== 'viewer' && activeTab?.type !== 'compare' && (
          <>
            <Sidebar className="hidden sm:flex" onIndexDirectory={handleIndexDirectory} selectedVolumeUuid={filters.volumeUuid} selectedPathPrefix={filters.pathPrefix} onSelectVolume={handleSelectVolume} onSelectFolder={handleSelectFolder} onMoveAssetsToFolder={handleMoveAssetsToFolder} selectedCollectionId={filters.flagged ? 'favorites' : filters.collectionId} onSelectCollection={handleSelectCollection} collectionsRefreshToken={collectionsRefreshToken} collapsed={isSidebarCollapsed} onOpenPreferences={() => setIsPreferencesOpen(true)} onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)} />
            <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
              <Sidebar className="flex w-full" onIndexDirectory={handleIndexDirectory} selectedVolumeUuid={filters.volumeUuid} selectedPathPrefix={filters.pathPrefix} onSelectVolume={handleSelectVolume} onSelectFolder={handleSelectFolder} onMoveAssetsToFolder={handleMoveAssetsToFolder} selectedCollectionId={filters.flagged ? 'favorites' : filters.collectionId} onSelectCollection={handleSelectCollection} collectionsRefreshToken={collectionsRefreshToken} collapsed={false} onOpenPreferences={() => setIsPreferencesOpen(true)} />
            </MobileSidebar>
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TabContainer renderHomeTab={() => (
            <div className="flex-1 flex flex-row overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {totalCount > 0 ? (
                  <AppErrorBoundary>
                    <Library assets={assetsRef.current} totalCount={totalCount} assetsVersion={assetsVersion} onRangeRendered={(startIndex, stopIndex) => ensureRangeLoaded(startIndex, stopIndex, filtersRef.current)} onAssetClick={handleAssetClickAtIndex} onAssetDoubleClick={handleAssetDoubleClickAtIndex} onImportPaths={handleImportPaths} onLassoSelect={handleLassoSelect} onToggleMarked={handleToggleMarked} markedIds={markedIds} onToggleSelection={handleToggleSelection} onAssetContextMenu={handleAssetContextMenu} selectedAssetId={selectedAsset?.id ?? null} trayAssetIds={trayAssetIdsSet} groupByDate={filters.groupByDate} viewerAsset={null} onIndexDirectory={handleIndexDirectory} emptyStateType={filters.flagged ? 'flagged' : filters.collectionId ? 'collection' : 'files'} />
                  </AppErrorBoundary>
                ) : isSelectedVolumeStatusLoading && filters.volumeUuid && !showOfflineLibraryMessage ? (
                  <div className="flex-1 flex items-center justify-center p-6"><div className="max-w-lg w-full rounded border border-gray-700 bg-gray-900/40 p-6"><div className="text-sm font-semibold text-gray-200">Verificando volume…</div><div className="mt-2 text-sm text-gray-400">Aguarde enquanto verificamos se o disco está conectado.</div></div></div>
                ) : showOfflineLibraryMessage ? (
                  <div className="flex-1 flex items-center justify-center p-6"><div className="max-w-lg w-full rounded border border-amber-700 bg-amber-900/20 p-6"><div className="text-sm font-semibold text-amber-100">Volume desconectado</div><div className="mt-2 text-sm text-amber-200/90">Você está navegando um volume que não está conectado. Conecte o disco novamente, ou volte para outra pasta/volume.</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="mh-btn mh-btn-gray px-3 py-2 text-sm" onClick={() => { handleSelectVolume(null); handleSelectFolder(null); handleSelectCollection(null); }}>Voltar</button></div></div></div>
                ) : (
                  <EmptyState type="volume" onAction={handleIndexDirectory} />
                )}
              </div>
            </div>
          )} />
        </div>
      </div>

      {activeTab?.type !== 'viewer' && (
        <SelectionTray selectedAssets={trayAssets} currentCollectionId={filters.collectionId} isBusy={copyBusy || zipBusy || moveBusy} onRemoveFromSelection={handleTrayRemove} onClearSelection={handleTrayClear} onCopySelected={handleTrayCopy} onTrashSelected={handleTrayTrashSelected} onExportSelected={handleTrayExport} onExportZipSelected={handleTrayExportZip} onOpenReview={handleOpenReview} onRemoveFromCollection={handleRemoveFromCollection} onOpenCompare={handleOpenCompare} />
      )}

      <CopyModal isOpen={isCopyOpen} assets={trayAssets} isBusy={copyBusy} onClose={() => { if (copyBusy) return; setIsCopyOpen(false); }} onConfirm={confirmCopy} />
      <ExportZipModal isOpen={isZipOpen} assets={trayAssets} isBusy={zipBusy} onClose={() => { if (zipBusy) return; setIsZipOpen(false); }} onConfirm={confirmZip} />
      <DuplicatesModal isOpen={isDuplicatesOpen} onClose={() => setIsDuplicatesOpen(false)} onSelectGroup={handleSelectDuplicatesGroup} />

      <ConfirmDialog isOpen={confirmDialog?.isOpen ?? false} title={confirmDialog?.title ?? ''} message={confirmDialog?.message ?? ''} confirmLabel={confirmDialog?.confirmLabel} variant={confirmDialog?.variant} onConfirm={() => confirmDialog?.onConfirm?.()} onCancel={() => setConfirmDialog(null)} />
      <ReviewModal isOpen={isReviewOpen} assets={reviewAssets} action={reviewAction || 'delete'} onClose={() => setIsReviewOpen(false)} onConfirm={handleReviewConfirm} onRemoveAsset={handleReviewRemoveAsset} />

      <ProductivityDashboard isOpen={isProductivityDashboardOpen} onClose={() => setIsProductivityDashboardOpen(false)} />
      {currentMilestone && <MilestoneNotificationEnhanced milestone={currentMilestone} onClose={() => setCurrentMilestone(null)} />}
      <KeyboardHintsBar visible={showKeyboardHints} onDismiss={() => { setShowKeyboardHints(false); localStorage.setItem('zona21-show-keyboard-hints', 'false'); }} />
      <SmartOnboarding isOpen={isSmartOnboardingOpen} onComplete={handleCompleteSmartOnboarding} onSkip={handleSkipSmartOnboarding} />
      <MilestoneNotification />

      {copyProgress && (copyBusy || copyProgress.status === 'started' || copyProgress.status === 'progress') && (
        <div className="fixed inset-x-0 bottom-16 z-[60] mx-auto w-full max-w-xl rounded bg-gray-800/95 p-3 shadow-2xl">
          <div className="flex items-center justify-between"><div className="text-sm text-gray-200">Copiando…</div><div className="text-xs text-gray-400">{copyProgress.copied ?? 0}/{copyProgress.total ?? 0}{copyProgress.skipped ? ` · ${copyProgress.skipped} ignorado${copyProgress.skipped > 1 ? 's' : ''}` : ''}{copyProgress.skippedOffline ? ` · ${copyProgress.skippedOffline} offline` : ''}{copyProgress.skippedMissing ? ` · ${copyProgress.skippedMissing} não encontrado${copyProgress.skippedMissing > 1 ? 's' : ''}` : ''}{copyProgress.failed ? ` · ${copyProgress.failed} falha${copyProgress.failed > 1 ? 's' : ''}` : ''}</div></div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-700"><div className="h-full bg-sky-500 transition-all" style={{ width: copyProgress.total > 0 ? `${Math.min(100, ((copyProgress.copied ?? 0) + (copyProgress.skipped ?? 0) + (copyProgress.failed ?? 0)) / copyProgress.total * 100)}%` : '0%' }} /></div>
        </div>
      )}

      {zipProgress && (zipBusy || zipProgress.status === 'started' || zipProgress.status === 'progress') && (
        <div className="fixed inset-x-0 bottom-28 z-[60] mx-auto w-full max-w-xl rounded bg-gray-800/95 p-3 shadow-2xl">
          <div className="flex items-center justify-between"><div className="text-sm text-gray-200">Exportando ZIP…</div><div className="flex items-center gap-3"><div className="text-xs text-gray-400">{zipProgress.added ?? 0}/{zipProgress.total ?? 0}{zipProgress.skippedOffline ? ` · ${zipProgress.skippedOffline} offline` : ''}{zipProgress.skippedMissing ? ` · ${zipProgress.skippedMissing} não encontrado${zipProgress.skippedMissing > 1 ? 's' : ''}` : ''}{zipProgress.failed ? ` · ${zipProgress.failed} falha${zipProgress.failed > 1 ? 's' : ''}` : ''}</div><button type="button" onClick={cancelZip} disabled={!zipJobId} className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50">Cancelar</button></div></div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-700"><div className="h-full bg-emerald-500 transition-all" style={{ width: zipProgress.total > 0 ? `${Math.min(100, ((zipProgress.added ?? 0) + (zipProgress.failed ?? 0)) / zipProgress.total * 100)}%` : '0%' }} /></div>
        </div>
      )}

      <MoveModal isOpen={isMoveOpen} assets={trayAssets} currentVolumeUuid={filters.volumeUuid} currentPathPrefix={filters.pathPrefix} destinationDir={moveDestinationDir} destinationMode={moveDestinationMode} conflictsCount={moveConflictsCount} isBusy={moveBusy} understood={moveUnderstood} onUnderstoodChange={setMoveUnderstood} onDestinationModeChange={(m) => setMoveDestinationMode(m)} onPickDestinationDialog={pickMoveDestinationDialog} onClose={closeMoveModal} onConfirm={planMove} onResolveConflicts={resolveMoveConflicts} />
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
