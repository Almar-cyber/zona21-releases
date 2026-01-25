import { Asset, Volume, IndexProgress } from '../shared/types';

declare global {
  interface Window {
    electronAPI: {
      getTelemetryConsent: () => Promise<boolean | null>;
      setTelemetryConsent: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
      getUpdateSettings: () => Promise<{ autoCheck: boolean; feedUrl: string; status: any }>;
      setUpdateAutoCheck: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
      checkForUpdates: () => Promise<{ success: boolean; result?: any; error?: string }>;
      downloadUpdate: () => Promise<{ success: boolean; result?: any; error?: string }>;
      installUpdate: () => Promise<{ success: boolean; error?: string }>;
      selectDirectory: () => Promise<string | null>;
      selectMoveDestination: () => Promise<string | null>;
      indexDirectory: (dirPath: string) => Promise<{ success: boolean; count?: number; error?: string }>;
      getAssets: (filters?: any) => Promise<Asset[]>;
      getAssetsPage: (filters: any, offset: number, limit: number) => Promise<{ items: Asset[]; total: number }>;
      getAssetsByIds: (assetIds: string[]) => Promise<Asset[]>;
      updateAsset: (assetId: string, updates: any) => Promise<{ success: boolean }>;
      getVolumes: () => Promise<Volume[]>;
      ejectVolume: (uuid: string) => Promise<{ success: boolean; error?: string }>;
      hideVolume: (uuid: string) => Promise<{ success: boolean; error?: string }>;
      renameVolume: (uuid: string, label: string) => Promise<{ success: boolean; error?: string }>;
      getFolderChildren: (
        volumeUuid: string | null,
        parentPath: string | null
      ) => Promise<Array<{ name: string; path: string; assetCount: number }>>;
      getCollections: () => Promise<Array<{ id: string; name: string; type: string; count: number }>>;
      createCollection: (name: string) => Promise<{ success: boolean; id?: string; name?: string; error?: string }>;
      renameCollection: (collectionId: string, name: string) => Promise<{ success: boolean; id?: string; name?: string; error?: string }>;
      deleteCollection: (collectionId: string) => Promise<{ success: boolean; id?: string; error?: string }>;
      addAssetsToCollection: (collectionId: string, assetIds: string[]) => Promise<{ success: boolean; count?: number; error?: string }>;
      removeAssetsFromCollection: (
        collectionId: string,
        assetIds: string[]
      ) => Promise<{ success: boolean; count?: number; removed?: number; error?: string }>;
      getThumbnail: (assetId: string) => Promise<string | null>;
      getDuplicateGroups: () => Promise<
        Array<{
          partialHash: string;
          fileSize: number;
          count: number;
          assetIds: string[];
          samples: Array<{ id: string; fileName: string; relativePath: string }>;
        }>
      >;
      exportCopyAssets: (payload: any) => Promise<{
        success: boolean;
        canceled?: boolean;
        destinationDir?: string;
        copied?: number;
        failed?: number;
        skipped?: number;
        skippedMissing?: number;
        skippedOffline?: number;
        results?: Array<{ assetId: string; sourcePath?: string; destPath?: string; success: boolean; error?: string }>;
        error?: string;
      }>;
      planMoveAssets: (payload: any) => Promise<{ success: boolean; canceled?: boolean; destinationDir?: string; conflictsCount?: number; error?: string }>;
      executeMoveAssets: (payload: any) => Promise<{
        success: boolean;
        canceled?: boolean;
        moved?: number;
        failed?: number;
        results?: Array<{ assetId: string; sourcePath?: string; destPath?: string; success: boolean; error?: string }>;
        error?: string;
      }>;
      trashAssets: (assetIds: string[]) => Promise<{
        success: boolean;
        trashed?: number;
        failed?: number;
        results?: Array<{ assetId: string; sourcePath?: string; success: boolean; error?: string }>;
        error?: string;
      }>;
      exportPremiere: (assetIds: string[]) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>;
      exportLightroom: (assetIds: string[]) => Promise<{ success: boolean; count?: number; error?: string }>;
      onIndexProgress: (callback: (progress: IndexProgress) => void) => void;
      onExportCopyProgress: (callback: (progress: any) => void) => void;
      exportZipAssets: (payload: any) => Promise<{ success: boolean; canceled?: boolean; jobId?: string; path?: string; added?: number; failed?: number; skippedMissing?: number; skippedOffline?: number; error?: string }>;
      cancelExportZip: (jobId: string) => Promise<{ success: boolean; error?: string }>;
      onExportZipProgress: (callback: (progress: any) => void) => void;
      onUpdateStatus: (callback: (status: any) => void) => void;
      revealPath: (p: string) => Promise<{ success: boolean; error?: string }>;
      revealAsset: (assetId: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      exportLogs: () => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>;
      getLogPath: () => Promise<{ path: string }>;
      getCullingStats: () => Promise<{ totalCount: number; flaggedCount: number }>;
      clearAppData: () => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export {};
