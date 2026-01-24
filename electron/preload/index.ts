import { contextBridge, ipcRenderer } from 'electron';

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
  getAssets: (filters?: any) => ipcRenderer.invoke('get-assets', filters),
  getAssetsPage: (filters: any, offset: number, limit: number) => ipcRenderer.invoke('get-assets-page', filters, offset, limit),
  getAssetsByIds: (assetIds: string[]) => ipcRenderer.invoke('get-assets-by-ids', assetIds),
  updateAsset: (assetId: string, updates: any) => ipcRenderer.invoke('update-asset', assetId, updates),
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
  exportCopyAssets: (payload: any) => ipcRenderer.invoke('export-copy-assets', payload),
  planMoveAssets: (payload: any) => ipcRenderer.invoke('plan-move-assets', payload),
  executeMoveAssets: (payload: any) => ipcRenderer.invoke('execute-move-assets', payload),
  trashAssets: (assetIds: string[]) => ipcRenderer.invoke('trash-assets', assetIds),
  exportPremiere: (assetIds: string[]) => ipcRenderer.invoke('export-premiere', assetIds),
  exportLightroom: (assetIds: string[]) => ipcRenderer.invoke('export-lightroom', assetIds),
  onIndexProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('index-progress', (_event, progress) => callback(progress));
  },
  onExportCopyProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('export-copy-progress', (_event, progress) => callback(progress));
  },
  exportZipAssets: (payload: any) => ipcRenderer.invoke('export-zip-assets', payload),
  cancelExportZip: (jobId: string) => ipcRenderer.invoke('cancel-export-zip', jobId),
  onExportZipProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('export-zip-progress', (_event, progress) => callback(progress));
  },
  onUpdateStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('update-status', (_event, status) => callback(status));
  },
  revealPath: (p: string) => ipcRenderer.invoke('reveal-path', p),
  revealAsset: (assetId: string) => ipcRenderer.invoke('reveal-asset', assetId)
});
