import { vi } from 'vitest';

export const mockApp = {
  getPath: vi.fn((name: string) => `/mock/${name}`),
  getName: vi.fn(() => 'MockApp'),
  getVersion: vi.fn(() => '1.0.0'),
  on: vi.fn(),
  quit: vi.fn(),
  whenReady: vi.fn(() => Promise.resolve())
};

export const mockBrowserWindow = vi.fn(() => ({
  loadURL: vi.fn(),
  loadFile: vi.fn(),
  on: vi.fn(),
  webContents: {
    send: vi.fn(),
    openDevTools: vi.fn()
  },
  show: vi.fn(),
  close: vi.fn(),
  isDestroyed: vi.fn(() => false)
}));

export const mockIpcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  removeHandler: vi.fn(),
  removeAllListeners: vi.fn()
};

export const mockDialog = {
  showOpenDialog: vi.fn(() => Promise.resolve({ canceled: false, filePaths: [] })),
  showSaveDialog: vi.fn(() => Promise.resolve({ canceled: false, filePath: '' })),
  showMessageBox: vi.fn(() => Promise.resolve({ response: 0 }))
};

export const mockShell = {
  openExternal: vi.fn(() => Promise.resolve()),
  openPath: vi.fn(() => Promise.resolve(''))
};

export const createMockElectron = () => ({
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  ipcMain: mockIpcMain,
  dialog: mockDialog,
  shell: mockShell
});
