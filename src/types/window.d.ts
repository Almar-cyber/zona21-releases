import { Asset, AssetLight, Volume, IndexProgress, VideoTrimProgress, AssetsPageFilter, AssetUpdate, ExportCopyPayload, PlanMovePayload, ExecuteMovePayload, CopyProgress, ZipProgress, UpdateStatusEvent } from '../shared/types';

interface WindowConfig {
  platform: string;
  titleBarStyle: string;
  trafficLightPosition: { x: number; y: number };
  hasTrafficLights: boolean;
  isFullScreen: boolean;
}

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
      getAssets: (filters?: AssetsPageFilter) => Promise<Asset[]>;
      getAssetsPage: (filters: AssetsPageFilter, offset: number, limit: number) => Promise<{ items: Asset[]; total: number }>;
      getAssetsPageCursor: (filters: AssetsPageFilter, cursor: { createdAt: number; id: string } | null, limit: number) => Promise<{ items: Asset[]; nextCursor: { createdAt: number; id: string } | null; total?: number }>;
      getAssetsPageLight: (filters: AssetsPageFilter, offset: number, limit: number) => Promise<{ items: AssetLight[]; total: number }>;
      getAssetsByIds: (assetIds: string[]) => Promise<Asset[]>;
      updateAsset: (assetId: string, updates: AssetUpdate) => Promise<{ success: boolean }>;
      getVolumes: () => Promise<Volume[]>;
      ejectVolume: (uuid: string) => Promise<{ success: boolean; error?: string }>;
      hideVolume: (uuid: string) => Promise<{ success: boolean; error?: string }>;
      renameVolume: (uuid: string, label: string) => Promise<{ success: boolean; error?: string }>;
      getFolderChildren: (
        volumeUuid: string | null,
        parentPath: string | null
      ) => Promise<Array<{ name: string; path: string; assetCount: number }>>;
      getCollections: () => Promise<Array<{ id: string; name: string; type: string; count: number; targetCount: number }>>;
      createCollection: (name: string, targetCount?: number) => Promise<{ success: boolean; id?: string; name?: string; error?: string }>;
      updateCollectionTarget: (collectionId: string, targetCount: number) => Promise<{ success: boolean; error?: string }>;
      renameCollection: (collectionId: string, name: string) => Promise<{ success: boolean; id?: string; name?: string; error?: string }>;
      deleteCollection: (collectionId: string) => Promise<{ success: boolean; id?: string; error?: string }>;
      addAssetsToCollection: (collectionId: string, assetIds: string[]) => Promise<{ success: boolean; count?: number; error?: string }>;
      removeAssetsFromCollection: (
        collectionId: string,
        assetIds: string[]
      ) => Promise<{ success: boolean; count?: number; removed?: number; error?: string }>;
      getUnassignedCount: () => Promise<{ count: number }>;
      getAssignedAssetIds: () => Promise<string[]>;
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
      exportCopyAssets: (payload: ExportCopyPayload) => Promise<{
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
      planMoveAssets: (payload: PlanMovePayload) => Promise<{ success: boolean; canceled?: boolean; destinationDir?: string; conflictsCount?: number; error?: string }>;
      executeMoveAssets: (payload: ExecuteMovePayload) => Promise<{
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
      onExportCopyProgress: (callback: (progress: CopyProgress) => void) => () => void;
      exportCollectionFolder: (collectionId: string) => Promise<{ success: boolean; canceled?: boolean; destinationDir?: string; collectionName?: string; copied?: number; failed?: number; skippedMissing?: number; error?: string }>;
      exportZipAssets: (payload: { assetIds: string[]; preserveFolders?: boolean }) => Promise<{ success: boolean; canceled?: boolean; jobId?: string; path?: string; added?: number; failed?: number; skippedMissing?: number; skippedOffline?: number; error?: string }>;
      cancelExportZip: (jobId: string) => Promise<{ success: boolean; error?: string }>;
      onExportZipProgress: (callback: (progress: ZipProgress) => void) => () => void;
      onUpdateStatus: (callback: (status: UpdateStatusEvent) => void) => () => void;
      revealPath: (p: string) => Promise<{ success: boolean; error?: string }>;
      revealAsset: (assetId: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      exportLogs: () => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>;
      getLogPath: () => Promise<{ path: string }>;
      getCullingStats: () => Promise<{ totalCount: number; flaggedCount: number }>;
      clearAppData: () => Promise<{ success: boolean; error?: string }>;
      getSmartSuggestions: () => Promise<{ rejectedCount: number; similarClusters: number }>;
      getDefaultExportPath: () => Promise<string | null>;
      setDefaultExportPath: (exportPath: string | null) => Promise<{ success: boolean; error?: string }>;
      getAllTags: () => Promise<Array<{ tag: string; count: number }>>;
      getMarkingCounts: () => Promise<{ approved: number; rejected: number; favorites: number }>;
      bulkUpdateMarking: (assetIds: string[], markingStatus: string) => Promise<{ success: boolean; updated?: number; error?: string }>;

      // Quick Edit
      quickEditApply: (assetId: string, operations: any, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      quickEditCropPreset: (assetId: string, presetName: string, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      quickEditRotateCW: (assetId: string, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      quickEditRotateCCW: (assetId: string, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      quickEditFlipH: (assetId: string, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      quickEditFlipV: (assetId: string, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      quickEditResizeInstagram: (assetId: string, preset: string, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      quickEditBatchApply: (assetIds: string[], operations: any) => Promise<Array<{ assetId: string; success: boolean; outputPath?: string; error?: string }>>;
      quickEditBatchCropPreset: (assetIds: string[], presetName: string) => Promise<Array<{ assetId: string; success: boolean; outputPath?: string; error?: string }>>;
      quickEditBatchRotateCW: (assetIds: string[]) => Promise<Array<{ assetId: string; success: boolean; outputPath?: string; error?: string }>>;
      quickEditBatchResize: (assetIds: string[], preset: string) => Promise<Array<{ assetId: string; success: boolean; outputPath?: string; error?: string }>>;

      // Video Trim
      checkFfmpegAvailable: () => Promise<{ available: boolean; error?: string }>;
      videoTrimGetMetadata: (assetId: string) => Promise<{ success: boolean; duration?: number; width?: number; height?: number; fps?: number; codec?: string; error?: string }>;
      videoTrimTrim: (assetId: string, options: any, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      videoTrimTrimReencode: (assetId: string, options: any, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      videoTrimGenerateThumbnails: (assetId: string, count?: number) => Promise<{ success: boolean; thumbnails?: string[]; error?: string }>;
      videoTrimExtractAudio: (assetId: string, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      videoTrimExtractTrimmedAudio: (assetId: string, options: any, outputPath?: string) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      onVideoTrimProgress: (callback: (progress: VideoTrimProgress) => void) => () => void;
      copyTrimmedToOriginalFolder: (assetId: string, trimmedPath: string) => Promise<{ success: boolean; filePath?: string; filename?: string; error?: string }>;
      replaceTrimmedOriginal: (assetId: string, trimmedPath: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;

      // Panoramic/360 Editing
      panoramicReframeVideo: (assetId: string, options: any) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      panoramicGetMetadata: (assetId: string) => Promise<{ success: boolean; is360?: boolean; projection?: string; metadata?: any; error?: string }>;
      panoramicStabilize: (assetId: string, options: any) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      panoramicReframePhoto: (assetId: string, options: any) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      panoramicAdjustPhotoOrientation: (assetId: string, yaw: number, pitch: number, roll: number) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
      panoramicLinkLRV: (lrvAssetId: string) => Promise<{ success: boolean; masterAssetId?: string; error?: string }>;
      panoramicApplyLRVEdits: (lrvAssetId: string, masterAssetId: string, operations: any[]) => Promise<{ success: boolean; outputPath?: string; error?: string }>;

      // Native theme
      getNativeTheme: () => Promise<boolean>;
      setNativeTheme: (source: 'dark' | 'light' | 'system') => Promise<{ success: boolean }>;
      onNativeThemeChange: (callback: (isDark: boolean) => void) => () => void;

      // Window configuration
      getWindowConfig: () => Promise<WindowConfig | null>;
    };
  }
}

export {};
