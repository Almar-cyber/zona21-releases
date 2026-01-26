import { setupCollectionHandlers } from './collections';
import { setupAssetHandlers } from './assets';
import { setupVolumeHandlers } from './volumes';

export function registerIpcHandlers() {
  // Assets module
  setupAssetHandlers();
  
  // Collections module (normalized DB)
  setupCollectionHandlers();
  
  // Volumes module
  setupVolumeHandlers();
}

export { getCollectionAssetIds } from './collections';
export { mapAssetRow } from './assets';
export { setVolumeManager } from './volumes';
