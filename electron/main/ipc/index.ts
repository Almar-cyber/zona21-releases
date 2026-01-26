import { setupCollectionHandlers } from './collections';
import { setupAssetHandlers } from './assets';

export function registerIpcHandlers() {
  // Assets module
  setupAssetHandlers();
  
  // Collections module (normalized DB)
  setupCollectionHandlers();
}

export { getCollectionAssetIds } from './collections';
export { mapAssetRow } from './assets';
