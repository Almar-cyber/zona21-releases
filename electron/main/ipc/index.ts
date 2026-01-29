import { setupCollectionHandlers } from './collections';
import { setupAssetHandlers } from './assets';
import { setupVolumeHandlers } from './volumes';
import { setupExportHandlers } from './export';
import { setupInstagramOAuthHandlers } from './instagram-oauth';
import { setupInstagramPostsHandlers } from './instagram-posts';

export function registerIpcHandlers() {
  // Assets module
  setupAssetHandlers();

  // Collections module (normalized DB)
  setupCollectionHandlers();

  // Volumes module
  setupVolumeHandlers();

  // Export module
  setupExportHandlers();

  // Instagram OAuth module
  setupInstagramOAuthHandlers();

  // Instagram Posts module
  setupInstagramPostsHandlers();
}

export { getCollectionAssetIds } from './collections';
export { mapAssetRow } from './assets';
export { setVolumeManager } from './volumes';
export { setMainWindow, exportZipJobs } from './export';
