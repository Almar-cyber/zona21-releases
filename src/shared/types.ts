// Tipos compartilhados entre main e renderer

export type MediaType = 'video' | 'photo';

// Sistema de marcação
export type MarkingStatus = 'unmarked' | 'approved' | 'favorite' | 'rejected';

export interface Asset {
  id: string;
  volumeUuid: string;
  relativePath: string;
  fileName: string;
  fileSize: number;
  partialHash: string;
  mediaType: MediaType;
  
  // Metadados compartilhados
  width: number;
  height: number;
  createdAt: Date;
  
  // Metadados de vídeo (null se foto)
  codec: string | null;
  container: string | null;
  frameRate: number | null;
  duration: number | null;
  timecodeStart: string | null;
  audioChannels: number | null;
  audioSampleRate: number | null;
  
  // Metadados de foto / EXIF (null se vídeo)
  cameraMake: string | null;
  cameraModel: string | null;
  lens: string | null;
  focalLength: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  orientation: number | null;
  colorSpace: string | null;
  
  // Metadados de decisão
  rating: number;
  colorLabel: string | null;
  flagged: boolean;
  rejected: boolean;
  markingStatus: MarkingStatus;
  tags: string[];
  notes: string;
  
  // Cache
  thumbnailPaths: string[];
  waveformPath: string | null;
  proxyPath: string | null;
  fullResPreviewPath: string | null;
  
  // Estado
  indexedAt: Date;
  status: 'online' | 'offline' | 'missing';
}

export interface Volume {
  uuid: string;
  label: string;
  mountPoint: string | null;
  type: 'local' | 'external' | 'network';
  lastMountedAt: Date;
  status: 'connected' | 'disconnected';
}

export interface Collection {
  id: string;
  projectId: string;
  name: string;
  type: 'manual' | 'smart';
  smartFilter: SmartFilter | null;
  assetIds: string[];
}

export interface SmartFilter {
  conditions: FilterCondition[];
  operator: 'AND' | 'OR';
}

export interface FilterCondition {
  field: 
    | 'rating' | 'tags' | 'colorLabel' | 'flagged' | 'rejected'
    | 'mediaType' | 'resolution' | 'date' | 'fileName'
    | 'codec' | 'duration' | 'frameRate'
    | 'cameraMake' | 'cameraModel' | 'lens' | 'iso' | 'aperture' | 'focalLength';
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'between';
  value: any;
}

export interface Marker {
  id: string;
  assetId: string;
  timecode: number;
  name: string;
  color: string;
  notes: string;
}

export interface IngestJob {
  id: string;
  sourceVolume: string;
  destPath: string;
  files: IngestFile[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface IngestFile {
  sourcePath: string;
  destPath: string;
  fileSize: number;
  checksum: string | null;
  verified: boolean;
  status: 'pending' | 'copying' | 'verifying' | 'completed' | 'failed';
  error: string | null;
}

export interface IndexProgress {
  total: number;
  indexed: number;
  currentFile: string | null;
  status: 'idle' | 'scanning' | 'indexing' | 'completed' | 'paused' | 'cancelled' | 'error';
  isPaused?: boolean;
}

export interface ExportProgress {
  type: 'copy' | 'zip';
  current: number;
  total: number;
  currentFile?: string;
  bytesTransferred?: number;
  totalBytes?: number;
}

export interface UpdateStatus {
  available: boolean;
  version?: string;
  downloadProgress?: number;
}

export interface AssetFilter {
  mediaType?: 'video' | 'photo' | null;
  fileExtension?: string | null;
  rating?: number;
  flagged?: boolean;
  rejected?: boolean;
  searchQuery?: string;
  volumeUuid?: string;
}

export interface AssetUpdate {
  rating?: number;
  flagged?: boolean;
  rejected?: boolean;
  markingStatus?: MarkingStatus;
  colorLabel?: string | null;
  tags?: string;
  notes?: string;
}

// Tipos para payloads de IPC
export interface ExportCopyPayload {
  assetIds: string[];
  destDir: string;
}

export interface PlanMovePayload {
  assetIds: string[];
  destDir: string;
  pathPrefix?: string | null;
}

export interface ExecuteMovePayload {
  assetIds: string[];
  destDir: string;
  pathPrefix?: string | null;
}

export interface ExportZipPayload {
  assetIds: string[];
  destPath: string;
  jobId?: string;
}

export interface CopyProgress {
  current: number;
  total: number;
  currentFile?: string;
  done?: boolean;
}

export interface ZipProgress {
  jobId: string;
  percent: number;
  currentFile?: string;
  done?: boolean;
  error?: string;
  outputPath?: string;
}

export interface UpdateStatusEvent {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'download-progress' | 'downloaded' | 'error';
  version?: string;
  releaseName?: string;
  releaseNotes?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  message?: string;
}

export interface AssetsPageFilter {
  mediaType?: 'video' | 'photo';
  datePreset?: string;
  dateFrom?: string;
  dateTo?: string;
  groupByDate?: boolean;
  flagged?: boolean;
  markingStatus?: MarkingStatus | MarkingStatus[];
  volumeUuid?: string | null;
  pathPrefix?: string | null;
  collectionId?: string | null;
  searchQuery?: string;
}
