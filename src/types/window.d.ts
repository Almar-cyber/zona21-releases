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
      indexPause: () => Promise<{ success: boolean }>;
      indexResume: () => Promise<{ success: boolean }>;
      indexCancel: () => Promise<{ success: boolean }>;
      indexStatus: () => Promise<{ isRunning: boolean; isPaused: boolean }>;
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
      onIndexProgress: (callback: (progress: IndexProgress) => void) => () => void;
      onExportCopyProgress: (callback: (progress: any) => void) => () => void;
      exportZipAssets: (payload: any) => Promise<{ success: boolean; canceled?: boolean; jobId?: string; path?: string; added?: number; failed?: number; skippedMissing?: number; skippedOffline?: number; error?: string }>;
      cancelExportZip: (jobId: string) => Promise<{ success: boolean; error?: string }>;
      onExportZipProgress: (callback: (progress: any) => void) => () => void;
      onUpdateStatus: (callback: (status: any) => void) => () => void;
      revealPath: (p: string) => Promise<{ success: boolean; error?: string }>;
      revealAsset: (assetId: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      exportLogs: () => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>;
      getLogPath: () => Promise<{ path: string }>;
      getCullingStats: () => Promise<{ totalCount: number; flaggedCount: number }>;
      clearAppData: () => Promise<{ success: boolean; error?: string }>;
      getSmartSuggestions: () => Promise<{ instagramReady: number; rejectedCount: number; similarClusters: number }>;
      getDefaultExportPath: () => Promise<string | null>;
      setDefaultExportPath: (exportPath: string | null) => Promise<{ success: boolean; error?: string }>;
      getAllTags: () => Promise<string[]>;
      getMarkingCounts: () => Promise<{ approved: number; rejected: number; favorites: number }>;
      bulkUpdateMarking: (assetIds: string[], markingStatus: string) => Promise<{ success: boolean; updated?: number; error?: string }>;

      // AI features
      aiGetStatus: () => Promise<{ enabled: boolean; configured: boolean; error?: string }>;
      aiGetSettings: () => Promise<any>;
      aiSetEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
      aiFindSimilar: (assetId: string, limit?: number) => Promise<any[]>;
      aiSmartCull: (options?: any) => Promise<any>;
      aiSmartRename: (assetId: string) => Promise<{ success: boolean; suggestion?: string; error?: string }>;
      aiApplyRename: (assetId: string, newName: string) => Promise<{ success: boolean; error?: string }>;

      // Instagram OAuth
      instagramStartOAuth: () => Promise<{ success: boolean; error?: string }>;
      instagramOAuthCallback: (code: string) => Promise<{ success: boolean; error?: string }>;
      instagramGetToken: (provider: string) => Promise<any>;
      instagramRevokeToken: (provider: string) => Promise<{ success: boolean; error?: string }>;
      instagramRefreshToken: () => Promise<{ success: boolean; error?: string }>;

      // Instagram Posts & Scheduling
      instagramSchedulePost: (options: any) => Promise<{ success: boolean; postId?: string; error?: string }>;
      instagramGetScheduledPosts: () => Promise<any[]>;
      instagramEditPost: (postId: string, updates: any) => Promise<{ success: boolean; error?: string }>;
      instagramCancelPost: (postId: string) => Promise<{ success: boolean; error?: string }>;
      instagramGetUsageInfo: () => Promise<{ postsScheduled: number; postsPublished: number; limit: number; canSchedule: boolean }>;
      instagramShouldShowUpgrade: () => Promise<boolean>;
      instagramCanSchedule: () => Promise<boolean>;

      // Instagram Events
      onInstagramPostsUpdated: (callback: () => void) => () => void;
      onOAuthSuccess: (callback: (data: any) => void) => () => void;
    };
  }
}

export {};
