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
  getAssetsPageCursor: (filters: AssetsPageFilter, cursor: { createdAt: number; id: string } | null, limit: number) => ipcRenderer.invoke('get-assets-page-cursor', filters, cursor, limit),
  getAssetsPageLight: (filters: AssetsPageFilter, offset: number, limit: number) => ipcRenderer.invoke('get-assets-page-light', filters, offset, limit),
  getAssetsByIds: (assetIds: string[]) => ipcRenderer.invoke('get-assets-by-ids', assetIds),
  updateAsset: (assetId: string, updates: AssetUpdate) => ipcRenderer.invoke('update-asset', assetId, updates),

  // Quick Edit
  quickEditApply: (assetId: string, operations: any, outputPath?: string) => ipcRenderer.invoke('quick-edit-apply', assetId, operations, outputPath),
  quickEditCropPreset: (assetId: string, presetName: string, outputPath?: string) => ipcRenderer.invoke('quick-edit-crop-preset', assetId, presetName, outputPath),
  quickEditRotateCW: (assetId: string, outputPath?: string) => ipcRenderer.invoke('quick-edit-rotate-cw', assetId, outputPath),
  quickEditRotateCCW: (assetId: string, outputPath?: string) => ipcRenderer.invoke('quick-edit-rotate-ccw', assetId, outputPath),
  quickEditFlipH: (assetId: string, outputPath?: string) => ipcRenderer.invoke('quick-edit-flip-h', assetId, outputPath),
  quickEditFlipV: (assetId: string, outputPath?: string) => ipcRenderer.invoke('quick-edit-flip-v', assetId, outputPath),
  quickEditResizeInstagram: (assetId: string, presetName: string, outputPath?: string) => ipcRenderer.invoke('quick-edit-resize-instagram', assetId, presetName, outputPath),
  quickEditBatchApply: (assetIds: string[], operations: any) => ipcRenderer.invoke('quick-edit-batch-apply', assetIds, operations),
  quickEditBatchCropPreset: (assetIds: string[], presetName: string) => ipcRenderer.invoke('quick-edit-batch-crop-preset', assetIds, presetName),
  quickEditBatchResize: (assetIds: string[], presetName: string) => ipcRenderer.invoke('quick-edit-batch-resize', assetIds, presetName),
  quickEditBatchRotateCW: (assetIds: string[]) => ipcRenderer.invoke('quick-edit-batch-rotate-cw', assetIds),

  // Video Trim
  videoTrimGetMetadata: (assetId: string) => ipcRenderer.invoke('video-trim-get-metadata', assetId),
  videoTrimTrim: (assetId: string, options: any, outputPath?: string) => ipcRenderer.invoke('video-trim-trim', assetId, options, outputPath),
  videoTrimTrimReencode: (assetId: string, options: any, outputPath?: string) => ipcRenderer.invoke('video-trim-trim-reencode', assetId, options, outputPath),
  videoTrimExtractAudio: (assetId: string, outputPath?: string) => ipcRenderer.invoke('video-trim-extract-audio', assetId, outputPath),
  videoTrimExtractTrimmedAudio: (assetId: string, options: any, outputPath?: string) => ipcRenderer.invoke('video-trim-extract-trimmed-audio', assetId, options, outputPath),

  // Panoramic/360 Editing
  panoramicReframeVideo: (assetId: string, options: any) => ipcRenderer.invoke('panoramic-reframe-video', assetId, options),
  panoramicGetMetadata: (assetId: string) => ipcRenderer.invoke('panoramic-get-metadata', assetId),
  panoramicStabilize: (assetId: string, options: any) => ipcRenderer.invoke('panoramic-stabilize', assetId, options),
  panoramicReframePhoto: (assetId: string, options: any) => ipcRenderer.invoke('panoramic-reframe-photo', assetId, options),
  panoramicAdjustPhotoOrientation: (assetId: string, yaw: number, pitch: number, roll: number) => ipcRenderer.invoke('panoramic-adjust-photo-orientation', assetId, yaw, pitch, roll),
  panoramicLinkLRV: (lrvAssetId: string) => ipcRenderer.invoke('panoramic-link-lrv', lrvAssetId),
  panoramicApplyLRVEdits: (lrvAssetId: string, masterAssetId: string, operations: any[]) => ipcRenderer.invoke('panoramic-apply-lrv-edits', lrvAssetId, masterAssetId, operations),

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

  // Window configuration
  getWindowConfig: () => ipcRenderer.invoke('get-window-config')
});
