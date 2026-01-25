import { BrowserWindow } from 'electron';
import { IndexerService } from '../indexer';
import { VolumeManager } from '../volume-manager';

export interface IpcContext {
  mainWindow: BrowserWindow | null;
  indexerService: IndexerService;
  volumeManager: VolumeManager;
  getMainWindow: () => BrowserWindow | null;
}
