import { Asset } from '../shared/types';
import { Command } from '../contexts/CommandContext';

interface AppCommandsContext {
  selectedIndex: number | null;
  selectedAsset: Asset | null;
  totalCount: number;
  trayAssetIds: string[];
  activeTabId: string;
  assetsRef: React.MutableRefObject<Array<Asset | null>>;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedAsset: React.Dispatch<React.SetStateAction<Asset | null>>;
  setTrayAssetIds: React.Dispatch<React.SetStateAction<string[]>>;
  openTab: (tab: any) => void;
  toggleMenu: (tabType: any, side: 'left' | 'right') => void;
  handleMarkAssets: (ids: string[], action: 'approve' | 'reject' | 'favorite') => void;
  handleOpenCompare: (assets: Asset[]) => void;
  handleTrayExport: (type: 'premiere' | 'lightroom') => Promise<void>;
  handleTrayExportZip: (ids: string[]) => void;
  setIsPreferencesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDuplicatesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsProductivityDashboardOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function createAppCommands(ctx: AppCommandsContext): Command[] {
  const {
    selectedIndex,
    selectedAsset,
    totalCount,
    trayAssetIds,
    activeTabId,
    assetsRef,
    setSelectedIndex,
    setSelectedAsset,
    setTrayAssetIds,
    openTab,
    toggleMenu,
    handleMarkAssets,
    handleOpenCompare,
    handleTrayExport,
    handleTrayExportZip,
    setIsPreferencesOpen,
    setIsShortcutsOpen,
    setIsDuplicatesOpen,
    setIsProductivityDashboardOpen,
  } = ctx;

  return [
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
        const targetIds = trayAssetIds.length > 0 ? trayAssetIds : selectedAsset ? [selectedAsset.id] : [];
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
        const targetIds = trayAssetIds.length > 0 ? trayAssetIds : selectedAsset ? [selectedAsset.id] : [];
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
        const targetIds = trayAssetIds.length > 0 ? trayAssetIds : selectedAsset ? [selectedAsset.id] : [];
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
          const assets = trayAssetIds.map((id) => assetsRef.current.find((a) => a?.id === id)).filter(Boolean) as Asset[];
          if (assets.length >= 2) handleOpenCompare(assets);
        }
      },
      isEnabled: () => trayAssetIds.length >= 2 && trayAssetIds.length <= 4,
      keywords: ['compare', 'comparar', 'lado a lado'],
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
}
