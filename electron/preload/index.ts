import { contextBridge, ipcRenderer } from 'electron';
import type { 
  AssetsPageFilter, 
  AssetUpdate, 
  ExportCopyPayload, 
  PlanMovePayload, 
  ExecuteMovePayload, 
  ExportZipPayload,
  IndexProgress,
  CopyProgress,
  ZipProgress,
  UpdateStatusEvent
} from '../../src/shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  getTelemetryConsent: () => ipcRenderer.invoke('get-telemetry-consent'),
  setTelemetryConsent: (enabled: boolean) => ipcRenderer.invoke('set-telemetry-consent', enabled),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getUpdateSettings: () => ipcRenderer.invoke('get-update-settings'),
  setUpdateAutoCheck: (enabled: boolean) => ipcRenderer.invoke('set-update-auto-check', enabled),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectMoveDestination: () => ipcRenderer.invoke('select-move-destination'),
  indexDirectory: (dirPath: string) => ipcRenderer.invoke('index-directory', dirPath),
  indexPause: () => ipcRenderer.invoke('index-pause'),
  indexResume: () => ipcRenderer.invoke('index-resume'),
  indexCancel: () => ipcRenderer.invoke('index-cancel'),
  indexStatus: () => ipcRenderer.invoke('index-status'),
  getAssets: (filters?: AssetsPageFilter) => ipcRenderer.invoke('get-assets', filters),
  getAssetsPage: (filters: AssetsPageFilter, offset: number, limit: number) => ipcRenderer.invoke('get-assets-page', filters, offset, limit),
  getAssetsByIds: (assetIds: string[]) => ipcRenderer.invoke('get-assets-by-ids', assetIds),
  updateAsset: (assetId: string, updates: AssetUpdate) => ipcRenderer.invoke('update-asset', assetId, updates),
  getVolumes: () => ipcRenderer.invoke('get-volumes'),
  ejectVolume: (uuid: string) => ipcRenderer.invoke('eject-volume', uuid),
  hideVolume: (uuid: string) => ipcRenderer.invoke('hide-volume', uuid),
  renameVolume: (uuid: string, label: string) => ipcRenderer.invoke('rename-volume', uuid, label),
  getFolderChildren: (volumeUuid: string | null, parentPath: string | null) => ipcRenderer.invoke('get-folder-children', volumeUuid, parentPath),
  getCollections: () => ipcRenderer.invoke('get-collections'),
  createCollection: (name: string) => ipcRenderer.invoke('create-collection', name),
  renameCollection: (collectionId: string, name: string) => ipcRenderer.invoke('rename-collection', collectionId, name),
  deleteCollection: (collectionId: string) => ipcRenderer.invoke('delete-collection', collectionId),
  addAssetsToCollection: (collectionId: string, assetIds: string[]) => ipcRenderer.invoke('add-assets-to-collection', collectionId, assetIds),
  removeAssetsFromCollection: (collectionId: string, assetIds: string[]) => ipcRenderer.invoke('remove-assets-from-collection', collectionId, assetIds),
  getThumbnail: (assetId: string) => ipcRenderer.invoke('get-thumbnail', assetId),
  getDuplicateGroups: () => ipcRenderer.invoke('get-duplicate-groups'),
  exportCopyAssets: (payload: ExportCopyPayload) => ipcRenderer.invoke('export-copy-assets', payload),
  planMoveAssets: (payload: PlanMovePayload) => ipcRenderer.invoke('plan-move-assets', payload),
  executeMoveAssets: (payload: ExecuteMovePayload) => ipcRenderer.invoke('execute-move-assets', payload),
  trashAssets: (assetIds: string[]) => ipcRenderer.invoke('trash-assets', assetIds),
  exportPremiere: (assetIds: string[]) => ipcRenderer.invoke('export-premiere', assetIds),
  exportLightroom: (assetIds: string[]) => ipcRenderer.invoke('export-lightroom', assetIds),
  onIndexProgress: (callback: (progress: IndexProgress) => void) => {
    const listener = (_event: unknown, progress: IndexProgress) => callback(progress);
    ipcRenderer.on('index-progress', listener);
    return () => ipcRenderer.removeListener('index-progress', listener);
  },
  onExportCopyProgress: (callback: (progress: CopyProgress) => void) => {
    const listener = (_event: unknown, progress: CopyProgress) => callback(progress);
    ipcRenderer.on('export-copy-progress', listener);
    return () => ipcRenderer.removeListener('export-copy-progress', listener);
  },
  exportZipAssets: (payload: ExportZipPayload) => ipcRenderer.invoke('export-zip-assets', payload),
  cancelExportZip: (jobId: string) => ipcRenderer.invoke('cancel-export-zip', jobId),
  onExportZipProgress: (callback: (progress: ZipProgress) => void) => {
    const listener = (_event: unknown, progress: ZipProgress) => callback(progress);
    ipcRenderer.on('export-zip-progress', listener);
    return () => ipcRenderer.removeListener('export-zip-progress', listener);
  },
  onUpdateStatus: (callback: (status: UpdateStatusEvent) => void) => {
    const listener = (_event: unknown, status: UpdateStatusEvent) => callback(status);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },
  revealPath: (p: string) => ipcRenderer.invoke('reveal-path', p),
  revealAsset: (assetId: string) => ipcRenderer.invoke('reveal-asset', assetId),
  exportLogs: () => ipcRenderer.invoke('export-logs'),
  getLogPath: () => ipcRenderer.invoke('get-log-path'),
  getCullingStats: () => ipcRenderer.invoke('get-culling-stats'),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),
  clearAppData: () => ipcRenderer.invoke('clear-app-data'),
  getDefaultExportPath: () => ipcRenderer.invoke('get-default-export-path'),
  setDefaultExportPath: (exportPath: string | null) => ipcRenderer.invoke('set-default-export-path', exportPath),
  getSmartSuggestions: () => ipcRenderer.invoke('get-smart-suggestions'),
  // Marking system
  getMarkingCounts: () => ipcRenderer.invoke('get-marking-counts'),
  bulkUpdateMarking: (assetIds: string[], markingStatus: string) => ipcRenderer.invoke('bulk-update-marking', assetIds, markingStatus),

  // AI features
  aiGetStatus: () => ipcRenderer.invoke('ai-get-status'),
  aiGetSettings: () => ipcRenderer.invoke('ai-get-settings'),
  aiSetEnabled: (enabled: boolean) => ipcRenderer.invoke('ai-set-enabled', enabled),
  aiFindSimilar: (assetId: string, limit?: number) => ipcRenderer.invoke('ai-find-similar', assetId, limit),
  aiSmartCull: (options?: any) => ipcRenderer.invoke('ai-smart-cull', options),
  aiSmartRename: (assetId: string) => ipcRenderer.invoke('ai-smart-rename', assetId),
  aiApplyRename: (assetId: string, newName: string) => ipcRenderer.invoke('ai-apply-rename', assetId, newName),

  // Instagram OAuth
  instagramStartOAuth: () => ipcRenderer.invoke('instagram-start-oauth'),
  instagramOAuthCallback: (code: string) => ipcRenderer.invoke('instagram-oauth-callback', code),
  instagramGetToken: (provider: string) => ipcRenderer.invoke('instagram-get-token', provider),
  instagramRevokeToken: (provider: string) => ipcRenderer.invoke('instagram-revoke-token', provider),
  instagramRefreshToken: () => ipcRenderer.invoke('instagram-refresh-token'),

  // Instagram Posts & Scheduling
  instagramSchedulePost: (options: any) => ipcRenderer.invoke('instagram-schedule-post', options),
  instagramGetScheduledPosts: () => ipcRenderer.invoke('instagram-get-scheduled-posts'),
  instagramEditPost: (postId: string, updates: any) => ipcRenderer.invoke('instagram-edit-post', postId, updates),
  instagramCancelPost: (postId: string) => ipcRenderer.invoke('instagram-cancel-post', postId),
  instagramGetUsageInfo: () => ipcRenderer.invoke('instagram-get-usage-info'),
  instagramShouldShowUpgrade: () => ipcRenderer.invoke('instagram-should-show-upgrade'),
  instagramCanSchedule: () => ipcRenderer.invoke('instagram-can-schedule'),

  // Instagram Events
  onInstagramPostsUpdated: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('instagram-posts-updated', listener);
    return () => ipcRenderer.removeListener('instagram-posts-updated', listener);
  },
  onOAuthSuccess: (callback: (data: any) => void) => {
    const listener = (_event: unknown, data: any) => callback(data);
    ipcRenderer.on('oauth-success', listener);
    return () => ipcRenderer.removeListener('oauth-success', listener);
  }
});
