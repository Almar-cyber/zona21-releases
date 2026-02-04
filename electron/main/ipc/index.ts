import { setupCollectionHandlers } from './collections';
import { setupAssetHandlers } from './assets';
import { setupVolumeHandlers } from './volumes';
import { setupExportHandlers } from './export';

export function registerIpcHandlers() {
  // Assets module
  setupAssetHandlers();

  // Collections module (normalized DB)
  setupCollectionHandlers();

  // Volumes module
  setupVolumeHandlers();

  // Export module
  setupExportHandlers();
}

export { getCollectionAssetIds } from './collections';
export { mapAssetRow } from './assets';
export { setVolumeManager } from './volumes';
export { setMainWindow, exportZipJobs } from './export';
