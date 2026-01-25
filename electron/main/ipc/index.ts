import { setupCollectionHandlers } from './collections';

export function registerIpcHandlers() {
  // Collections module (normalized DB)
  setupCollectionHandlers();
  
  console.log('[IPC] Collection handlers registered (using normalized DB)');
}

export { getCollectionAssetIds } from './collections';
