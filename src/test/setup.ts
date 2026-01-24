import { beforeAll, afterEach, vi } from 'vitest';

// Mock Electron APIs for renderer tests
beforeAll(() => {
  // Mock window.electron API
  (global.window as any).electron = {
    ipcRenderer: {
      send: vi.fn(),
      on: vi.fn(),
      invoke: vi.fn()
    }
  };
});

afterEach(() => {
  vi.clearAllMocks();
});
