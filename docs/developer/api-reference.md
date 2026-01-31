# API Reference - Zona21

**Version:** 0.4.9
**Last Updated:** January 31, 2026

## Overview

Complete reference for Zona21's IPC (Inter-Process Communication) API. All communication between the Electron renderer process (React frontend) and main process (Node.js backend) uses this API.

## Table of Contents

1. [Architecture](#architecture)
2. [API Categories](#api-categories)
3. [Type Definitions](#type-definitions)
4. [Assets API](#assets-api)
5. [Collections API](#collections-api)
6. [Volumes API](#volumes-api)
7. [Export API](#export-api)
8. [AI Features API](#ai-features-api)
9. [Instagram API](#instagram-api)
10. [Indexing API](#indexing-api)
11. [System API](#system-api)
12. [Events](#events)
13. [Error Handling](#error-handling)
14. [Security](#security)

---

## Architecture

### IPC Communication Pattern

```
┌──────────────────┐         IPC          ┌──────────────────┐
│                  │  ─────────────────►  │                  │
│  Renderer Process│                      │  Main Process    │
│  (React/UI)      │                      │  (Node.js)       │
│                  │  ◄─────────────────  │                  │
└──────────────────┘                      └──────────────────┘
     window.electronAPI                      ipcMain.handle()
```

### Access Pattern

**Renderer (React):**
```typescript
// Invoke IPC method
const assets = await window.electronAPI.getAssets(filters);

// Listen to events
const unsubscribe = window.electronAPI.onIndexProgress((progress) => {
  console.log(`Indexed ${progress.indexed}/${progress.total}`);
});
```

**Main Process:**
```typescript
// Handle IPC calls
ipcMain.handle('get-assets', async (event, filters) => {
  // Implementation
  return assets;
});

// Send events
mainWindow.webContents.send('index-progress', progress);
```

### Security Model

- **Context Isolation**: Enabled (renderer cannot access Node.js APIs directly)
- **Preload Script**: Exposes whitelist of APIs via `contextBridge`
- **Input Validation**: All inputs sanitized and validated
- **SQL Injection Prevention**: Parameterized queries only

---

## API Categories

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Assets** | 8 endpoints | Asset management (CRUD, filtering) |
| **Collections** | 6 endpoints | Collection management |
| **Volumes** | 4 endpoints | Volume/disk management |
| **Export** | 7 endpoints | Export operations (copy, move, zip) |
| **AI Features** | 6 endpoints | AI-powered features |
| **Instagram** | 10 endpoints | Instagram integration |
| **Indexing** | 5 endpoints | Directory indexing |
| **System** | 9 endpoints | System utilities, updates |

---

## Type Definitions

### Core Types

#### Asset

```typescript
interface Asset {
  id: string;                          // UUID
  volumeUuid: string;                  // Volume identifier
  relativePath: string;                // Path relative to volume root
  fileName: string;                    // File name with extension
  fileSize: number;                    // Bytes
  partialHash: string;                 // Hash for duplicate detection
  mediaType: 'video' | 'photo';

  // Dimensions
  width: number;                       // Pixels
  height: number;                      // Pixels
  createdAt: Date;                     // File creation date

  // Video metadata (null if photo)
  codec: string | null;                // e.g., 'h264', 'prores'
  container: string | null;            // e.g., 'mp4', 'mov'
  frameRate: number | null;            // FPS
  duration: number | null;             // Seconds
  timecodeStart: string | null;        // e.g., '01:00:00:00'
  audioChannels: number | null;        // e.g., 2, 6
  audioSampleRate: number | null;      // Hz

  // Photo metadata (null if video)
  cameraMake: string | null;           // e.g., 'Canon'
  cameraModel: string | null;          // e.g., 'EOS R5'
  lens: string | null;                 // e.g., 'RF 24-70mm F2.8'
  focalLength: number | null;          // mm
  aperture: number | null;             // f-stop
  shutterSpeed: string | null;         // e.g., '1/1000'
  iso: number | null;                  // e.g., 100, 3200
  gpsLatitude: number | null;          // Decimal degrees
  gpsLongitude: number | null;         // Decimal degrees
  orientation: number | null;          // EXIF orientation
  colorSpace: string | null;           // e.g., 'sRGB', 'AdobeRGB'

  // Marking & organization
  rating: number;                      // 0-5 stars
  colorLabel: string | null;           // e.g., 'red', 'green'
  flagged: boolean;                    // Pick flag
  rejected: boolean;                   // Reject flag
  markingStatus: MarkingStatus;        // 'unmarked' | 'approved' | 'favorite' | 'rejected'
  tags: string[];                      // AI-generated or manual tags
  notes: string;                       // User notes

  // Cache paths
  thumbnailPaths: string[];            // Thumbnail cache files
  waveformPath: string | null;         // Audio waveform (videos)
  proxyPath: string | null;            // Proxy file path
  fullResPreviewPath: string | null;   // Full-res preview cache

  // Status
  indexedAt: Date;                     // When indexed
  status: 'online' | 'offline' | 'missing';
}
```

#### MarkingStatus

```typescript
type MarkingStatus =
  | 'unmarked'   // Not marked
  | 'approved'   // Green check (A key)
  | 'favorite'   // Yellow star (F key)
  | 'rejected';  // Red X (D key)
```

#### Volume

```typescript
interface Volume {
  uuid: string;                        // Volume UUID
  label: string;                       // User-friendly name
  mountPoint: string | null;           // e.g., '/Volumes/External'
  type: 'local' | 'external' | 'network';
  lastMountedAt: Date;
  status: 'connected' | 'disconnected';
}
```

#### Collection

```typescript
interface Collection {
  id: string;                          // Collection ID
  projectId: string;                   // Project (currently 'default')
  name: string;                        // Display name
  type: 'manual' | 'smart';            // Manual or smart collection
  smartFilter: SmartFilter | null;     // Filter rules (smart only)
  assetIds: string[];                  // Asset IDs in collection
}
```

### Filter Types

#### AssetsPageFilter

```typescript
interface AssetsPageFilter {
  mediaType?: 'video' | 'photo' | null;
  fileExtension?: string | null;      // e.g., '.mp4', '.jpg'
  rating?: number;                     // Exact rating match
  flagged?: boolean;
  rejected?: boolean;
  markingStatus?: MarkingStatus;
  searchQuery?: string;                // Filename/tags search
  volumeUuid?: string;                 // Filter by volume
  collectionId?: string;               // Filter by collection
  tags?: string[];                     // Filter by tags
}
```

#### AssetUpdate

```typescript
interface AssetUpdate {
  rating?: number;
  flagged?: boolean;
  rejected?: boolean;
  markingStatus?: MarkingStatus;
  colorLabel?: string | null;
  tags?: string;                       // JSON string
  notes?: string;
}
```

---

## Assets API

### `getAssets(filters?)`

Get all assets with optional filtering.

**Request:**
```typescript
window.electronAPI.getAssets(filters?: AssetsPageFilter): Promise<Asset[]>
```

**Parameters:**
- `filters` (optional): Filter criteria (see AssetsPageFilter)

**Response:**
```typescript
Asset[]  // Array of assets
```

**Example:**
```typescript
// Get all approved photos
const approvedPhotos = await window.electronAPI.getAssets({
  mediaType: 'photo',
  markingStatus: 'approved'
});

// Get all videos from specific volume
const videos = await window.electronAPI.getAssets({
  mediaType: 'video',
  volumeUuid: 'vol-abc123'
});
```

---

### `getAssetsPage(filters, offset, limit)`

Get paginated assets (optimized for large libraries).

**Request:**
```typescript
window.electronAPI.getAssetsPage(
  filters: AssetsPageFilter,
  offset: number,
  limit: number
): Promise<Asset[]>
```

**Parameters:**
- `filters`: Filter criteria
- `offset`: Number of assets to skip
- `limit`: Maximum assets to return

**Response:**
```typescript
Asset[]  // Array of assets (max = limit)
```

**Example:**
```typescript
// Load first 100 assets
const page1 = await window.electronAPI.getAssetsPage({}, 0, 100);

// Load next 100 assets
const page2 = await window.electronAPI.getAssetsPage({}, 100, 100);

// Infinite scroll pattern
const loadMore = async (page: number, pageSize: number) => {
  return await window.electronAPI.getAssetsPage(
    currentFilters,
    page * pageSize,
    pageSize
  );
};
```

---

### `getAssetsByIds(assetIds)`

Get specific assets by their IDs.

**Request:**
```typescript
window.electronAPI.getAssetsByIds(assetIds: string[]): Promise<Asset[]>
```

**Parameters:**
- `assetIds`: Array of asset IDs (max 1000)

**Response:**
```typescript
Asset[]  // Assets in same order as input IDs
```

**Security:**
- Max 1000 IDs per call (prevents DoS)
- IDs validated against UUID format

**Example:**
```typescript
const selectedAssets = await window.electronAPI.getAssetsByIds([
  'asset-123',
  'asset-456',
  'asset-789'
]);
```

---

### `updateAsset(assetId, updates)`

Update asset metadata.

**Request:**
```typescript
window.electronAPI.updateAsset(
  assetId: string,
  updates: AssetUpdate
): Promise<{ success: boolean; error?: string }>
```

**Parameters:**
- `assetId`: Asset ID to update
- `updates`: Fields to update (partial)

**Response:**
```typescript
{
  success: boolean;
  error?: string;  // Error message if success = false
  code?: string;   // Error code if success = false
}
```

**Example:**
```typescript
// Mark as approved
await window.electronAPI.updateAsset('asset-123', {
  markingStatus: 'approved'
});

// Update rating and notes
await window.electronAPI.updateAsset('asset-456', {
  rating: 5,
  notes: 'Best shot of the day'
});

// Add tags
await window.electronAPI.updateAsset('asset-789', {
  tags: JSON.stringify(['landscape', 'sunset', 'beach'])
});
```

---

### `bulkUpdateMarking(assetIds, markingStatus)`

Bulk update marking status (optimized for large selections).

**Request:**
```typescript
window.electronAPI.bulkUpdateMarking(
  assetIds: string[],
  markingStatus: MarkingStatus
): Promise<{ success: boolean; updated: number }>
```

**Parameters:**
- `assetIds`: Array of asset IDs
- `markingStatus`: New marking status

**Response:**
```typescript
{
  success: boolean;
  updated: number;  // Number of assets updated
}
```

**Example:**
```typescript
// Approve selected assets
const result = await window.electronAPI.bulkUpdateMarking(
  selectedIds,
  'approved'
);
console.log(`Approved ${result.updated} assets`);
```

---

### `trashAssets(assetIds)`

Delete assets from library (moves to trash).

**Request:**
```typescript
window.electronAPI.trashAssets(
  assetIds: string[]
): Promise<{ success: boolean; error?: string }>
```

**Parameters:**
- `assetIds`: Array of asset IDs to delete (max 1000)

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Note:** This removes from database only. Original files remain untouched on disk.

**Example:**
```typescript
// Delete rejected assets
const result = await window.electronAPI.trashAssets(rejectedIds);
if (result.success) {
  console.log('Assets removed from library');
}
```

---

### `getThumbnail(assetId)`

Get thumbnail data URL for an asset.

**Request:**
```typescript
window.electronAPI.getThumbnail(assetId: string): Promise<string>
```

**Parameters:**
- `assetId`: Asset ID

**Response:**
```typescript
string  // Data URL (e.g., 'data:image/jpeg;base64,...')
```

**Example:**
```typescript
const dataUrl = await window.electronAPI.getThumbnail('asset-123');
imageElement.src = dataUrl;
```

---

### `getDuplicateGroups()`

Find duplicate or near-duplicate assets.

**Request:**
```typescript
window.electronAPI.getDuplicateGroups(): Promise<DuplicateGroup[]>
```

**Response:**
```typescript
interface DuplicateGroup {
  hash: string;          // Partial hash
  assetIds: string[];    // Asset IDs in group
  count: number;         // Number of duplicates
}
```

**Example:**
```typescript
const duplicates = await window.electronAPI.getDuplicateGroups();
duplicates.forEach(group => {
  console.log(`${group.count} duplicates with hash ${group.hash}`);
});
```

---

## Collections API

### `getCollections()`

Get all collections.

**Request:**
```typescript
window.electronAPI.getCollections(): Promise<Collection[]>
```

**Response:**
```typescript
Collection[]
```

**Example:**
```typescript
const collections = await window.electronAPI.getCollections();
console.log(`Found ${collections.length} collections`);
```

---

### `createCollection(name)`

Create a new collection.

**Request:**
```typescript
window.electronAPI.createCollection(
  name: string
): Promise<{ success: boolean; id?: string; name?: string; error?: string }>
```

**Parameters:**
- `name`: Collection name (trimmed, non-empty)

**Response:**
```typescript
{
  success: boolean;
  id?: string;         // New collection ID
  name?: string;       // Trimmed name
  error?: string;      // Error message if failed
}
```

**Example:**
```typescript
const result = await window.electronAPI.createCollection('Best of 2026');
if (result.success) {
  console.log(`Created collection: ${result.id}`);
}
```

---

### `renameCollection(collectionId, name)`

Rename a collection.

**Request:**
```typescript
window.electronAPI.renameCollection(
  collectionId: string,
  name: string
): Promise<{ success: boolean; error?: string }>
```

**Parameters:**
- `collectionId`: Collection ID
- `name`: New name

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example:**
```typescript
await window.electronAPI.renameCollection('coll-123', 'Portfolio 2026');
```

---

### `deleteCollection(collectionId)`

Delete a collection.

**Request:**
```typescript
window.electronAPI.deleteCollection(
  collectionId: string
): Promise<{ success: boolean; error?: string }>
```

**Parameters:**
- `collectionId`: Collection ID (cannot delete favorites collection)

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Note:** Assets are NOT deleted, only the collection.

**Example:**
```typescript
const result = await window.electronAPI.deleteCollection('coll-123');
if (!result.success) {
  console.error(result.error);
}
```

---

### `addAssetsToCollection(collectionId, assetIds)`

Add assets to a collection.

**Request:**
```typescript
window.electronAPI.addAssetsToCollection(
  collectionId: string,
  assetIds: string[]
): Promise<{ success: boolean; added: number; error?: string }>
```

**Parameters:**
- `collectionId`: Target collection ID
- `assetIds`: Array of asset IDs to add

**Response:**
```typescript
{
  success: boolean;
  added: number;      // Number of new assets added (duplicates ignored)
  error?: string;
}
```

**Example:**
```typescript
const result = await window.electronAPI.addAssetsToCollection(
  'coll-123',
  selectedIds
);
console.log(`Added ${result.added} assets`);
```

---

### `removeAssetsFromCollection(collectionId, assetIds)`

Remove assets from a collection.

**Request:**
```typescript
window.electronAPI.removeAssetsFromCollection(
  collectionId: string,
  assetIds: string[]
): Promise<{ success: boolean; removed: number; error?: string }>
```

**Parameters:**
- `collectionId`: Target collection ID
- `assetIds`: Array of asset IDs to remove

**Response:**
```typescript
{
  success: boolean;
  removed: number;    // Number of assets removed
  error?: string;
}
```

**Example:**
```typescript
await window.electronAPI.removeAssetsFromCollection('coll-123', [
  'asset-456'
]);
```

---

## Volumes API

### `getVolumes()`

Get all volumes (drives).

**Request:**
```typescript
window.electronAPI.getVolumes(): Promise<Volume[]>
```

**Response:**
```typescript
Volume[]
```

**Example:**
```typescript
const volumes = await window.electronAPI.getVolumes();
volumes.forEach(vol => {
  console.log(`${vol.label} (${vol.type}): ${vol.status}`);
});
```

---

### `ejectVolume(uuid)`

Eject a volume.

**Request:**
```typescript
window.electronAPI.ejectVolume(
  uuid: string
): Promise<{ success: boolean; error?: string }>
```

**Parameters:**
- `uuid`: Volume UUID

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example:**
```typescript
await window.electronAPI.ejectVolume('vol-external-123');
```

---

### `hideVolume(uuid)`

Hide a volume from UI.

**Request:**
```typescript
window.electronAPI.hideVolume(
  uuid: string
): Promise<{ success: boolean }>
```

**Parameters:**
- `uuid`: Volume UUID

**Response:**
```typescript
{ success: boolean }
```

---

### `renameVolume(uuid, label)`

Rename a volume.

**Request:**
```typescript
window.electronAPI.renameVolume(
  uuid: string,
  label: string
): Promise<{ success: boolean }>
```

**Parameters:**
- `uuid`: Volume UUID
- `label`: New label

**Response:**
```typescript
{ success: boolean }
```

---

## Export API

### `exportCopyAssets(payload)`

Export assets by copying to a destination folder.

**Request:**
```typescript
window.electronAPI.exportCopyAssets(
  payload: ExportCopyPayload
): Promise<{ success: boolean; error?: string }>
```

**Types:**
```typescript
interface ExportCopyPayload {
  assetIds: string[];
  destDir: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Events:** Emits `export-copy-progress` events during copy.

**Example:**
```typescript
// Start export
await window.electronAPI.exportCopyAssets({
  assetIds: selectedIds,
  destDir: '/Users/me/Desktop/Export'
});

// Listen to progress
window.electronAPI.onExportCopyProgress((progress) => {
  console.log(`${progress.current}/${progress.total}`);
});
```

---

### `exportZipAssets(payload)`

Export assets as a ZIP archive.

**Request:**
```typescript
window.electronAPI.exportZipAssets(
  payload: ExportZipPayload
): Promise<{ success: boolean; jobId?: string; error?: string }>
```

**Types:**
```typescript
interface ExportZipPayload {
  assetIds: string[];
  destPath: string;        // Full path to .zip file
  jobId?: string;          // Optional job ID
}
```

**Response:**
```typescript
{
  success: boolean;
  jobId?: string;          // Job ID for tracking
  error?: string;
}
```

**Events:** Emits `export-zip-progress` events during compression.

**Example:**
```typescript
const result = await window.electronAPI.exportZipAssets({
  assetIds: selectedIds,
  destPath: '/Users/me/Desktop/export.zip'
});

window.electronAPI.onExportZipProgress((progress) => {
  console.log(`Zipping: ${progress.current}/${progress.total}`);
  console.log(`${progress.percent}% complete`);
});
```

---

### `cancelExportZip(jobId)`

Cancel an ongoing ZIP export.

**Request:**
```typescript
window.electronAPI.cancelExportZip(jobId: string): Promise<void>
```

**Parameters:**
- `jobId`: Job ID from exportZipAssets response

---

### `planMoveAssets(payload)`

Plan a move operation (dry run, no actual move).

**Request:**
```typescript
window.electronAPI.planMoveAssets(
  payload: PlanMovePayload
): Promise<MovePlan>
```

**Types:**
```typescript
interface PlanMovePayload {
  assetIds: string[];
  destDir: string;
  pathPrefix?: string | null;
}

interface MovePlan {
  operations: MoveOperation[];
  conflicts: MoveConflict[];
}
```

**Response:** Plan with conflicts detected.

---

### `executeMoveAssets(payload)`

Execute a move operation.

**Request:**
```typescript
window.electronAPI.executeMoveAssets(
  payload: ExecuteMovePayload
): Promise<{ success: boolean; moved: number }>
```

**Types:**
```typescript
interface ExecuteMovePayload {
  assetIds: string[];
  destDir: string;
  pathPrefix?: string | null;
}
```

**Response:**
```typescript
{
  success: boolean;
  moved: number;      // Number of files moved
}
```

---

### `exportPremiere(assetIds)`

Export asset list for Adobe Premiere Pro.

**Request:**
```typescript
window.electronAPI.exportPremiere(
  assetIds: string[]
): Promise<{ success: boolean; path?: string }>
```

**Response:**
```typescript
{
  success: boolean;
  path?: string;      // Path to exported XML file
}
```

---

### `exportLightroom(assetIds)`

Export asset list for Adobe Lightroom.

**Request:**
```typescript
window.electronAPI.exportLightroom(
  assetIds: string[]
): Promise<{ success: boolean; path?: string }>
```

**Response:**
```typescript
{
  success: boolean;
  path?: string;      // Path to exported catalog file
}
```

---

## AI Features API

### `aiGetStatus()`

Get AI system status.

**Request:**
```typescript
window.electronAPI.aiGetStatus(): Promise<AIStatus>
```

**Response:**
```typescript
interface AIStatus {
  enabled: boolean;
  modelLoaded: boolean;
  processing: boolean;
  queueSize: number;
  processedCount: number;
}
```

**Example:**
```typescript
const status = await window.electronAPI.aiGetStatus();
if (status.enabled && status.modelLoaded) {
  console.log(`AI ready. Queue: ${status.queueSize}`);
}
```

---

### `aiGetSettings()`

Get AI feature settings.

**Request:**
```typescript
window.electronAPI.aiGetSettings(): Promise<AISettings>
```

**Response:**
```typescript
interface AISettings {
  enabled: boolean;
  autoTag: boolean;
  language: string;
  modelPath: string;
}
```

---

### `aiSetEnabled(enabled)`

Enable or disable AI features.

**Request:**
```typescript
window.electronAPI.aiSetEnabled(enabled: boolean): Promise<void>
```

**Parameters:**
- `enabled`: true to enable, false to disable

---

### `aiFindSimilar(assetId, limit?)`

Find visually similar assets.

**Request:**
```typescript
window.electronAPI.aiFindSimilar(
  assetId: string,
  limit?: number
): Promise<SimilarAsset[]>
```

**Parameters:**
- `assetId`: Reference asset ID
- `limit`: Max results (default: 10)

**Response:**
```typescript
interface SimilarAsset {
  assetId: string;
  similarity: number;  // 0.0 - 1.0 (1.0 = identical)
}
```

**Example:**
```typescript
const similar = await window.electronAPI.aiFindSimilar('asset-123', 20);
similar.forEach(item => {
  console.log(`${item.assetId}: ${(item.similarity * 100).toFixed(1)}%`);
});
```

---

### `aiSmartCull(options?)`

Get AI suggestions for best photos (burst detection + quality scoring).

**Request:**
```typescript
window.electronAPI.aiSmartCull(
  options?: SmartCullOptions
): Promise<SmartCullResult>
```

**Types:**
```typescript
interface SmartCullOptions {
  assetIds?: string[];       // Specific assets, or all if omitted
  timeThreshold?: number;    // Seconds between shots (default: 3)
  similarityThreshold?: number; // 0.0-1.0 (default: 0.85)
}

interface SmartCullResult {
  groups: CullGroup[];
  suggestions: string[];     // Asset IDs to keep
}

interface CullGroup {
  assetIds: string[];
  bestAssetId: string;       // AI-recommended best
  scores: Record<string, number>;  // Quality scores per asset
}
```

**Example:**
```typescript
const result = await window.electronAPI.aiSmartCull({
  timeThreshold: 2,           // 2 seconds
  similarityThreshold: 0.90   // 90% similar
});

console.log(`Found ${result.groups.length} burst groups`);
console.log(`AI suggests keeping ${result.suggestions.length} photos`);
```

---

### `aiSmartRename(assetId)`

Generate smart filename suggestion based on AI tags.

**Request:**
```typescript
window.electronAPI.aiSmartRename(
  assetId: string
): Promise<{ success: boolean; suggestion?: string }>
```

**Response:**
```typescript
{
  success: boolean;
  suggestion?: string;  // e.g., '2026-01-31_sunset_beach_001.jpg'
}
```

**Example:**
```typescript
const result = await window.electronAPI.aiSmartRename('asset-123');
console.log(`Suggested name: ${result.suggestion}`);
```

---

### `aiApplyRename(assetId, newName)`

Apply a rename (moves file on disk and updates database).

**Request:**
```typescript
window.electronAPI.aiApplyRename(
  assetId: string,
  newName: string
): Promise<{ success: boolean; error?: string }>
```

**Parameters:**
- `assetId`: Asset to rename
- `newName`: New filename (no path, just name + extension)

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

---

## Instagram API

### OAuth Flow

#### `instagramStartOAuth()`

Start Instagram OAuth 2.0 flow.

**Request:**
```typescript
window.electronAPI.instagramStartOAuth(): Promise<{ authUrl: string }>
```

**Response:**
```typescript
{
  authUrl: string;  // URL to open in browser
}
```

**Example:**
```typescript
const { authUrl } = await window.electronAPI.instagramStartOAuth();
// Opens browser to authUrl, user authorizes, callback handled automatically
```

---

#### `instagramOAuthCallback(code)`

Handle OAuth callback (internal use, called by OAuth redirect handler).

**Request:**
```typescript
window.electronAPI.instagramOAuthCallback(code: string): Promise<void>
```

---

#### `instagramGetToken(provider)`

Get stored access token.

**Request:**
```typescript
window.electronAPI.instagramGetToken(
  provider: string
): Promise<{ token: string | null }>
```

**Parameters:**
- `provider`: 'instagram'

**Response:**
```typescript
{
  token: string | null;  // null if not authenticated
}
```

---

#### `instagramRevokeToken(provider)`

Revoke access token (log out).

**Request:**
```typescript
window.electronAPI.instagramRevokeToken(provider: string): Promise<void>
```

---

#### `instagramRefreshToken()`

Refresh access token (60-day tokens).

**Request:**
```typescript
window.electronAPI.instagramRefreshToken(): Promise<{ success: boolean }>
```

---

### Posting & Scheduling

#### `instagramSchedulePost(options)`

Schedule an Instagram post.

**Request:**
```typescript
window.electronAPI.instagramSchedulePost(
  options: InstagramPostOptions
): Promise<{ success: boolean; postId?: string }>
```

**Types:**
```typescript
interface InstagramPostOptions {
  assetId: string;              // Asset to post
  caption: string;              // Post caption (max 2200 chars)
  scheduledTime?: Date | null;  // null = post immediately
}
```

**Response:**
```typescript
{
  success: boolean;
  postId?: string;              // Scheduled post ID
}
```

**Example:**
```typescript
const result = await window.electronAPI.instagramSchedulePost({
  assetId: 'asset-123',
  caption: 'Beautiful sunset 🌅 #photography',
  scheduledTime: new Date('2026-02-01T18:00:00Z')
});
```

---

#### `instagramGetScheduledPosts()`

Get all scheduled posts.

**Request:**
```typescript
window.electronAPI.instagramGetScheduledPosts(): Promise<InstagramPost[]>
```

**Response:**
```typescript
interface InstagramPost {
  id: string;
  assetId: string;
  caption: string;
  scheduledTime: Date;
  status: 'pending' | 'posted' | 'failed';
  createdAt: Date;
}
```

---

#### `instagramEditPost(postId, updates)`

Edit a scheduled post.

**Request:**
```typescript
window.electronAPI.instagramEditPost(
  postId: string,
  updates: Partial<InstagramPostOptions>
): Promise<{ success: boolean }>
```

---

#### `instagramCancelPost(postId)`

Cancel a scheduled post.

**Request:**
```typescript
window.electronAPI.instagramCancelPost(postId: string): Promise<void>
```

---

### Usage & Limits

#### `instagramGetUsageInfo()`

Get API usage information.

**Request:**
```typescript
window.electronAPI.instagramGetUsageInfo(): Promise<InstagramUsage>
```

**Response:**
```typescript
interface InstagramUsage {
  postsScheduled: number;     // Posts scheduled this month
  postsLimit: number;         // Monthly limit
  daysUntilReset: number;     // Days until limit resets
}
```

---

#### `instagramShouldShowUpgrade()`

Check if should show upgrade prompt (approaching limits).

**Request:**
```typescript
window.electronAPI.instagramShouldShowUpgrade(): Promise<boolean>
```

---

#### `instagramCanSchedule()`

Check if user can schedule more posts.

**Request:**
```typescript
window.electronAPI.instagramCanSchedule(): Promise<boolean>
```

---

## Indexing API

### `selectDirectory()`

Open directory picker dialog.

**Request:**
```typescript
window.electronAPI.selectDirectory(): Promise<string | null>
```

**Response:**
```typescript
string | null  // Selected directory path, or null if cancelled
```

**Example:**
```typescript
const dir = await window.electronAPI.selectDirectory();
if (dir) {
  await window.electronAPI.indexDirectory(dir);
}
```

---

### `indexDirectory(dirPath)`

Start indexing a directory.

**Request:**
```typescript
window.electronAPI.indexDirectory(dirPath: string): Promise<void>
```

**Parameters:**
- `dirPath`: Absolute path to directory

**Events:** Emits `index-progress` events during indexing.

**Example:**
```typescript
await window.electronAPI.indexDirectory('/Users/me/Photos');

window.electronAPI.onIndexProgress((progress) => {
  console.log(`${progress.indexed}/${progress.total}`);
  console.log(`Current: ${progress.currentFile}`);
});
```

---

### `indexPause()`

Pause ongoing indexing.

**Request:**
```typescript
window.electronAPI.indexPause(): Promise<void>
```

---

### `indexResume()`

Resume paused indexing.

**Request:**
```typescript
window.electronAPI.indexResume(): Promise<void>
```

---

### `indexCancel()`

Cancel indexing.

**Request:**
```typescript
window.electronAPI.indexCancel(): Promise<void>
```

---

### `indexStatus()`

Get current indexing status.

**Request:**
```typescript
window.electronAPI.indexStatus(): Promise<IndexProgress>
```

**Response:**
```typescript
interface IndexProgress {
  total: number;
  indexed: number;
  currentFile: string | null;
  status: 'idle' | 'scanning' | 'indexing' | 'completed' | 'paused' | 'cancelled' | 'error';
  isPaused?: boolean;
}
```

---

## System API

### `getTelemetryConsent()`

Get telemetry consent status.

**Request:**
```typescript
window.electronAPI.getTelemetryConsent(): Promise<boolean>
```

---

### `setTelemetryConsent(enabled)`

Set telemetry consent.

**Request:**
```typescript
window.electronAPI.setTelemetryConsent(enabled: boolean): Promise<void>
```

---

### `openExternal(url)`

Open URL in default browser.

**Request:**
```typescript
window.electronAPI.openExternal(url: string): Promise<void>
```

---

### `revealPath(path)`

Reveal file in Finder/Explorer.

**Request:**
```typescript
window.electronAPI.revealPath(path: string): Promise<void>
```

---

### `revealAsset(assetId)`

Reveal asset file in Finder/Explorer.

**Request:**
```typescript
window.electronAPI.revealAsset(assetId: string): Promise<void>
```

---

### `exportLogs()`

Export application logs.

**Request:**
```typescript
window.electronAPI.exportLogs(): Promise<{ success: boolean; path?: string }>
```

**Response:**
```typescript
{
  success: boolean;
  path?: string;  // Path to exported log file
}
```

---

### `getLogPath()`

Get log file location.

**Request:**
```typescript
window.electronAPI.getLogPath(): Promise<string>
```

**Response:**
```typescript
string  // Path to log directory
```

---

### `clearAppData()`

Clear all app data (reset to factory).

**Request:**
```typescript
window.electronAPI.clearAppData(): Promise<void>
```

**Warning:** This deletes the database, cache, and all settings.

---

### Update System

#### `getUpdateSettings()`

Get auto-update settings.

**Request:**
```typescript
window.electronAPI.getUpdateSettings(): Promise<UpdateSettings>
```

**Response:**
```typescript
interface UpdateSettings {
  autoCheck: boolean;
  autoDownload: boolean;
  autoInstall: boolean;
}
```

---

#### `setUpdateAutoCheck(enabled)`

Enable/disable auto-update checks.

**Request:**
```typescript
window.electronAPI.setUpdateAutoCheck(enabled: boolean): Promise<void>
```

---

#### `checkForUpdates()`

Manually check for updates.

**Request:**
```typescript
window.electronAPI.checkForUpdates(): Promise<UpdateInfo>
```

**Response:**
```typescript
interface UpdateInfo {
  available: boolean;
  version?: string;
  releaseNotes?: string;
}
```

---

#### `downloadUpdate()`

Download available update.

**Request:**
```typescript
window.electronAPI.downloadUpdate(): Promise<void>
```

**Events:** Emits `update-status` events during download.

---

#### `installUpdate()`

Install downloaded update and restart.

**Request:**
```typescript
window.electronAPI.installUpdate(): Promise<void>
```

---

## Events

Events are emitted from main process and listened to in renderer.

### `onIndexProgress(callback)`

Listen to indexing progress.

**Usage:**
```typescript
const unsubscribe = window.electronAPI.onIndexProgress((progress: IndexProgress) => {
  console.log(`${progress.indexed}/${progress.total}`);
});

// Later: unsubscribe
unsubscribe();
```

**Event Data:**
```typescript
interface IndexProgress {
  total: number;
  indexed: number;
  currentFile: string | null;
  status: 'idle' | 'scanning' | 'indexing' | 'completed' | 'paused' | 'cancelled' | 'error';
  isPaused?: boolean;
}
```

---

### `onExportCopyProgress(callback)`

Listen to export copy progress.

**Usage:**
```typescript
window.electronAPI.onExportCopyProgress((progress: CopyProgress) => {
  console.log(`Copying: ${progress.current}/${progress.total}`);
  if (progress.done) {
    console.log('Export complete');
  }
});
```

**Event Data:**
```typescript
interface CopyProgress {
  current: number;
  total: number;
  currentFile?: string;
  done?: boolean;
}
```

---

### `onExportZipProgress(callback)`

Listen to ZIP export progress.

**Usage:**
```typescript
window.electronAPI.onExportZipProgress((progress: ZipProgress) => {
  console.log(`${progress.percent}% complete`);
});
```

**Event Data:**
```typescript
interface ZipProgress {
  jobId: string;
  current: number;
  total: number;
  percent: number;
  done?: boolean;
}
```

---

### `onUpdateStatus(callback)`

Listen to update system status.

**Usage:**
```typescript
window.electronAPI.onUpdateStatus((status: UpdateStatusEvent) => {
  if (status.available) {
    console.log(`Update ${status.version} available`);
  }
});
```

**Event Data:**
```typescript
interface UpdateStatusEvent {
  available: boolean;
  version?: string;
  downloadProgress?: number;  // 0-100
  downloaded?: boolean;
  error?: string;
}
```

---

### `onInstagramPostsUpdated(callback)`

Listen to Instagram posts changes.

**Usage:**
```typescript
window.electronAPI.onInstagramPostsUpdated(() => {
  // Refresh scheduled posts list
  loadScheduledPosts();
});
```

---

### `onOAuthSuccess(callback)`

Listen to OAuth success events.

**Usage:**
```typescript
window.electronAPI.onOAuthSuccess((data: any) => {
  console.log('OAuth successful:', data);
});
```

---

## Error Handling

### Response Format

Most IPC handlers return a response with error information:

```typescript
{
  success: boolean;
  error?: string;       // User-friendly error message
  code?: string;        // Error code for programmatic handling
  details?: any;        // Additional error details (dev mode)
}
```

### Error Codes

Common error codes:

| Code | Description |
|------|-------------|
| `INVALID_INPUT` | Invalid input parameters |
| `NOT_FOUND` | Resource not found |
| `PERMISSION_DENIED` | No permission to access resource |
| `DATABASE_ERROR` | Database operation failed |
| `FILESYSTEM_ERROR` | File system operation failed |
| `NETWORK_ERROR` | Network request failed |
| `AI_ERROR` | AI processing failed |
| `VALIDATION_ERROR` | Input validation failed |

### Error Handling Pattern

```typescript
try {
  const result = await window.electronAPI.updateAsset('asset-123', updates);

  if (!result.success) {
    // Handle error
    switch (result.code) {
      case 'NOT_FOUND':
        showError('Asset not found');
        break;
      case 'DATABASE_ERROR':
        showError('Database error. Please try again.');
        break;
      default:
        showError(result.error || 'Unknown error');
    }
    return;
  }

  // Success
  showSuccess('Asset updated');
} catch (error) {
  // Unexpected error (IPC failure, etc.)
  console.error('IPC error:', error);
  showError('Communication error. Please restart the app.');
}
```

---

## Security

### Input Validation

All IPC handlers validate inputs:

**Asset IDs:**
- Must be valid UUIDs or database IDs
- Max 1000 IDs per batch operation
- Validated with `validateAssetIds()` helper

**File Paths:**
- Must be absolute paths
- No path traversal (`../`)
- Validated against allowed directories

**User Input:**
- Trimmed and sanitized
- Max length enforced
- HTML/script injection prevented

### SQL Injection Prevention

All database queries use parameterized statements:

```typescript
// ✅ SAFE (parameterized)
const stmt = db.prepare('SELECT * FROM assets WHERE id = ?');
const asset = stmt.get(assetId);

// ❌ NEVER DO THIS
const asset = db.prepare(`SELECT * FROM assets WHERE id = '${assetId}'`).get();
```

### Context Isolation

- Renderer process has NO direct access to Node.js APIs
- All communication through whitelisted `electronAPI` methods
- Preload script uses `contextBridge` to expose safe APIs

### Rate Limiting

Operations have implicit rate limits:

- Batch operations: Max 1000 items
- File operations: Throttled to prevent disk saturation
- API calls: No explicit limit (trust-based, local app)

---

## Best Practices

### 1. Error Handling

Always check `success` field:

```typescript
const result = await window.electronAPI.someOperation();
if (!result.success) {
  handleError(result.error, result.code);
  return;
}
// Proceed with result
```

### 2. Event Cleanup

Unsubscribe from events when component unmounts:

```typescript
useEffect(() => {
  const unsubscribe = window.electronAPI.onIndexProgress(handleProgress);
  return () => unsubscribe();  // Cleanup
}, []);
```

### 3. Batch Operations

Use bulk methods instead of loops:

```typescript
// ✅ GOOD (1 IPC call)
await window.electronAPI.bulkUpdateMarking(assetIds, 'approved');

// ❌ BAD (N IPC calls)
for (const id of assetIds) {
  await window.electronAPI.updateAsset(id, { markingStatus: 'approved' });
}
```

### 4. Pagination

Use paginated endpoints for large datasets:

```typescript
// ✅ GOOD (loads 100 at a time)
const loadPage = (page: number) => {
  return window.electronAPI.getAssetsPage(filters, page * 100, 100);
};

// ❌ BAD (loads everything)
const assets = await window.electronAPI.getAssets(filters);
```

### 5. Type Safety

Use TypeScript interfaces from `shared/types.ts`:

```typescript
import type { Asset, AssetUpdate } from '../shared/types';

const updateAsset = async (asset: Asset, updates: AssetUpdate) => {
  return await window.electronAPI.updateAsset(asset.id, updates);
};
```

---

## TypeScript Definitions

Complete type definitions are available in:
- `/src/shared/types.ts` - Shared types
- `/electron/main/ipc/types.ts` - IPC context types
- `/electron/preload/index.ts` - API definitions

To use types in your code:

```typescript
import type {
  Asset,
  Collection,
  Volume,
  AssetUpdate,
  AssetsPageFilter,
  MarkingStatus
} from '../shared/types';
```

---

## Related Documentation

- [Architecture Overview](./architecture.md) - System architecture
- [Development Setup](./setup.md) - Development environment
- [Performance Guide](./performance.md) - Optimization tips
- [AI Implementation](./ai-implementation.md) - AI features

---

**Last Updated:** January 31, 2026
**Version:** 0.4.9
**API Stability:** Stable (breaking changes will bump major version)
