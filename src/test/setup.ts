import { beforeAll, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// Mock Electron APIs for renderer tests
beforeAll(() => {
  // Mock window.electronAPI
  (global.window as any).electronAPI = {
    getVolumes: vi.fn().mockResolvedValue([]),
    getAssets: vi.fn().mockResolvedValue([]),
    getAssetsPage: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    getAssetsByIds: vi.fn().mockResolvedValue([]),
    updateAsset: vi.fn().mockResolvedValue({ success: true }),
    indexDirectory: vi.fn().mockResolvedValue({ success: true }),
    selectDirectory: vi.fn().mockResolvedValue(null),
    selectMoveDestination: vi.fn().mockResolvedValue(null),
    exportPremiere: vi.fn().mockResolvedValue({ success: true }),
    exportLightroom: vi.fn().mockResolvedValue({ success: true }),
    exportCopyAssets: vi.fn().mockResolvedValue({ success: true }),
    exportZipAssets: vi.fn().mockResolvedValue({ success: true }),
    trashAssets: vi.fn().mockResolvedValue({ success: true }),
    planMoveAssets: vi.fn().mockResolvedValue({ success: true }),
    executeMoveAssets: vi.fn().mockResolvedValue({ success: true }),
    removeAssetsFromCollection: vi.fn().mockResolvedValue({ success: true }),
    getCollections: vi.fn().mockResolvedValue([]),
    createCollection: vi.fn().mockResolvedValue({ success: true }),
    onIndexProgress: vi.fn().mockReturnValue(() => {}),
    onExportCopyProgress: vi.fn().mockReturnValue(() => {}),
    onExportZipProgress: vi.fn().mockReturnValue(() => {}),
    onUpdateStatus: vi.fn().mockReturnValue(() => {}),
    revealPath: vi.fn(),
    getTelemetryConsent: vi.fn().mockResolvedValue(null),
    setTelemetryConsent: vi.fn(),
  };

  // Mock window.electron for legacy code
  (global.window as any).electron = {
    ipcRenderer: {
      send: vi.fn(),
      on: vi.fn(),
      invoke: vi.fn(),
    },
  };

  // Mock localStorage
  const storage: Record<string, string> = {};
  (global.localStorage as any) = {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete storage[key]; }),
    clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); }),
  };

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
