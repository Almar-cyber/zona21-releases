# Preferences & Configuration - Zona21

**Version:** 0.4.9
**Last Updated:** January 30, 2026

## Overview

Complete guide to Zona21's preferences and configuration options. Customize the app to match your workflow and optimize performance.

## Table of Contents

1. [Accessing Preferences](#accessing-preferences)
2. [General Settings](#general-settings)
3. [Appearance](#appearance)
4. [Performance](#performance)
5. [Importing](#importing)
6. [Exporting](#exporting)
7. [AI Features](#ai-features)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Advanced Settings](#advanced-settings)
10. [Reset & Troubleshooting](#reset--troubleshooting)

---

## Accessing Preferences

### Opening Preferences

**Menu:**
- Zona21 → Preferences (or Settings)

**Keyboard:**
- `Cmd+,` (comma)

**First Time:**
- Preferences window opens automatically after installation
- Configure basic settings before first use

---

## General Settings

### Application

**Auto-Update**
- **Enabled (Recommended):** Check for updates automatically
- **Download:** Background download when available
- **Install:** Prompt to install or install on quit
- **Channel:** Stable / Beta

**Default:** Enabled, Stable channel

**Startup Behavior**
- [ ] Open last library on startup
- [ ] Remember window position and size
- [ ] Start in fullscreen mode

**Default:** Open last library ✓, Remember position ✓

**Language**
- Interface language: English (Portuguese coming soon)
- Date format: System default
- Number format: System default

### Library Management

**Default Library**
- **Location:** Path to main library database
- **Create New:** Start fresh library
- **Switch:** Choose different library
- **Recent:** List of recently opened libraries

**Default:** `~/Library/Application Support/Zona21/zona21.db`

**Library Backup**
- [ ] Auto-backup daily
- Backup location: `~/Documents/Zona21 Backups/`
- Keep backups: Last 7 days

**Recommended:** Enable auto-backup

---

## Appearance

### Theme

**Color Scheme**
- **Dark Mode:** Primary theme (current)
- **Light Mode:** Coming in v0.5.0
- **System:** Follow macOS appearance (future)

**Default:** Dark Mode

### Grid View

**Thumbnail Size**
- Extra Small: 120px
- Small: 160px
- **Medium: 200px (Default)**
- Large: 240px
- Extra Large: 300px

**Shortcuts:** `Cmd++` / `Cmd+-` to adjust

**Thumbnail Quality**
- Low: Faster, lower quality
- **Medium: Balanced (Default)**
- High: Slower, better quality

**Columns**
- Auto: Based on window width
- Fixed: 3, 4, 5, 6, 8, 10 columns

**Default:** Auto

**Display Options**
- [ ] Show filename below thumbnail
- [ ] Show file type badge
- [ ] Show duration badge (videos)
- [ ] Show resolution info

**Default:** Type badge ✓, Duration badge ✓

### Badges & Indicators

**Mark Badges**
- Approved: Green check (✓)
- Favorite: Yellow star (⭐)
- Rejected: Red X (✗)
- Position: Top-right corner
- Size: Small / Medium / Large

**Status Indicators**
- AI processed: Blue sparkle
- Dirty (unsaved): Orange dot
- In collection: Purple folder icon

### Typography

**Font Size**
- UI Scale: 90% / 100% / 110% / 120%
- Metadata text: Small / Medium / Large

**Default:** 100%, Medium

---

## Performance

### Caching

**Thumbnail Cache**
- **Location:** `~/Library/Application Support/Zona21/cache/`
- **Size Limit:** 50GB (default), 10GB - 500GB
- **Clear Cache:** Button to delete all cached thumbnails

**Behavior**
- [ ] Cache full-size previews
- [ ] Preload adjacent thumbnails
- [ ] Generate thumbnails in background

**Default:** Background generation ✓

**AI Model Cache**
- Location: `~/Library/Application Support/Zona21/cache/models/`
- Size: ~350MB (ViT model)
- Clear: Delete and re-download models

### Memory Management

**RAM Usage**
- Conservative: < 500MB (default)
- Balanced: < 1GB
- Aggressive: < 2GB (fastest)

**Virtual Scrolling**
- Rows to render: 3 above/below (default)
- 1-5 rows (adjust for performance)

**Unload Behavior**
- Unload thumbnails after: 60 seconds idle
- Keep in memory: 1000 / 2000 / 5000 assets

### Processing Priority

**Background Tasks**
- Low: Don't slow down UI
- **Normal: Balanced (Default)**
- High: Faster processing, may affect UI

**AI Processing**
- Queue size: 100 assets
- Processing speed: 1-3 seconds per photo
- [ ] Process only when idle

---

## Importing

### Default Settings

**Import Location**
- Default path: ~/Pictures/
- Remember last used: ✓
- Ask every time: ☐

**File Handling**
- [ ] Copy files to library (not recommended)
- [ ] Move files to library (not recommended)
- [✓] Reference in place (default, safe)

**Duplicate Handling**
- Skip duplicates: ✓
- Warn on duplicates: ☐
- Import all: ☐

### File Types

**Photos**
- [✓] JPEG, PNG, HEIC, WebP
- [✓] RAW (CR2, NEF, ARW, RAF, ORF)
- [✓] TIFF, BMP, GIF

**Videos**
- [✓] MP4, MOV, AVI, MKV
- [✓] HEVC (H.265), H.264
- [ ] Other formats (experimental)

**Exclude**
- Hidden files (starting with .)
- System files
- Thumbnails folder (_thumbs, .thumbnails)

### Metadata

**EXIF Reading**
- [✓] Read all EXIF data
- [✓] Extract GPS coordinates
- [✓] Parse camera settings
- [ ] Read custom XMP tags

**Auto-Actions on Import**
- [ ] Auto-tag with AI
- [ ] Auto-rotate based on EXIF
- [ ] Generate thumbnails immediately
- [ ] Add to collection

---

## Exporting

### Default Export Settings

**Format**
- JPEG (default)
- PNG
- TIFF
- Original format

**Quality**
- Maximum: 100%, largest file
- **High: 90% (Default)**
- Medium: 75%
- Low: 60%, smallest file

**Naming**
- Keep original filename
- Sequential: Photo_001, Photo_002
- Smart rename: [Date]_[Tags]_[Seq]
- Custom pattern: %%Y-%%m-%%d_%%f

### Resize Options

**Presets**
- Original size (no resize)
- Instagram Square: 1080x1080
- Instagram Portrait: 1080x1350
- Instagram Story: 1080x1920
- Web: 1920px wide
- 4K: 3840x2160
- Thumbnail: 512x512
- Custom: Specify width x height

**Fit Mode**
- Cover: Fill area, crop if needed
- Contain: Fit inside, no crop
- Exact: Force exact size, may distort

### Metadata Export

**Include in Export**
- [✓] EXIF data
- [✓] Copyright information
- [ ] AI-generated tags
- [ ] Zona21 marks and ratings

**Strip Metadata**
- [ ] Remove all EXIF
- [ ] Remove GPS coordinates only
- [ ] Remove camera info only

### Destination

**Default Folder**
- ~/Pictures/Zona21 Exports/
- Ask every time
- Remember last used

**Folder Structure**
- Flat: All files in one folder
- By date: YYYY/MM/DD/ subfolders
- By collection: [Collection Name]/ subfolders

---

## AI Features

### Auto-Tagging

**Enable AI**
- [✓] Enable automatic tagging
- [✓] Process new imports automatically
- [ ] Re-process existing library

**Processing**
- When: On import / Manual only / Background
- Priority: Low / Normal / High
- Batch size: 10 / 50 / 100 assets at once

**Default:** On import, Low priority

### Tag Categories

**Enable Categories**
- [✓] Time of day
- [✓] Landscapes
- [✓] Urban scenes
- [✓] Nature
- [✓] Animals
- [✓] Food & drink
- [✓] Vehicles
- [✓] Objects

**Language**
- Portuguese (default)
- English (coming soon)

### Smart Features

**Smart Culling**
- [ ] Auto-suggest best photos from bursts
- Time threshold: 3 seconds (1-10 seconds)
- Similarity threshold: 85% (70-95%)

**Smart Rename**
- Pattern: [Date]_[Tag1]_[Tag2]_[Seq]
- Max tags: 3 (1-5)
- Tag separator: underscore / hyphen / space

**Face Detection**
- Status: Coming in v0.6.0
- [ ] Enable face detection
- [ ] Cluster similar faces

### Model Management

**Current Model**
- Name: google/vit-base-patch16-224
- Size: ~350MB
- Version: Latest
- Location: `~/Library/Application Support/Zona21/cache/models/`

**Actions**
- Update Model: Check for updates
- Clear and Re-download: Delete and redownload
- Disable AI: Turn off all AI features

---

## Keyboard Shortcuts

### Customization

**Status:** Coming in v0.5.0

Currently shortcuts are fixed. See [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) for complete list.

**Planned Customization:**
- Rebind any shortcut
- Create custom shortcuts
- Import/export shortcut profiles
- Reset to defaults

### Current Shortcuts

**Global**
- New Tab: `Cmd+T`
- Close Tab: `Cmd+W`
- Import: `Cmd+I`
- Export: `Cmd+E`
- Preferences: `Cmd+,`

**Marking**
- Approved: `A`
- Favorite: `F`
- Rejected: `D`
- Unmark: `U`

**Navigation**
- Arrow Keys: Navigate grid
- Space: Full-screen viewer
- Escape: Exit viewer

**See Full List:** [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md)

---

## Advanced Settings

### Database

**Location**
- Path: `~/Library/Application Support/Zona21/zona21.db`
- Size: Varies (depends on library size)
- Format: SQLite 3

**Maintenance**
- Vacuum: Optimize database (monthly recommended)
- Reindex: Rebuild search indexes
- Verify: Check database integrity

**Backup**
- Manual backup: Export .db file
- Restore: Replace .db file, restart app

### Debug Mode

**Enable Debug**
- [ ] Show Developer Tools on startup
- [ ] Verbose logging
- [ ] Performance metrics overlay

**Log Location**
- macOS: `~/Library/Logs/Zona21/`
- Log level: Error / Warning / Info / Debug

**Console Access**
- View → Toggle Developer Tools
- Or press: `Cmd+Option+I`

### Network

**Proxy Settings**
- System: Use system proxy (default)
- Manual: HTTP/HTTPS proxy configuration
- None: Direct connection

**Updates**
- Update server: GitHub Releases (default)
- Check frequency: Daily / Weekly / Never

---

## Reset & Troubleshooting

### Reset Options

**Reset Preferences**
- Keeps: Library, photos, marks, collections
- Resets: UI settings, window positions, preferences
- Command:
```bash
defaults delete com.zona21.app
```

**Reset Cache**
- Deletes: Thumbnails, AI models
- Keeps: Everything else
- Frees: ~5-50GB disk space
- Command:
```bash
rm -rf ~/Library/Application\ Support/Zona21/cache/
```

**Reset Library**
- ⚠️ **Warning:** Deletes marks, collections, all metadata
- Keeps: Original photos (untouched)
- Command:
```bash
rm ~/Library/Application\ Support/Zona21/zona21.db
```

**Factory Reset**
- ⚠️ **Warning:** Deletes ALL Zona21 data
- Returns app to first-launch state
- Backup first if needed
- Command:
```bash
rm -rf ~/Library/Application\ Support/Zona21/
```

### Troubleshooting Tools

**Built-in Diagnostics**
- Help → Run Diagnostics
- Checks: Database, cache, permissions, disk space
- Exports: Diagnostic report

**Safe Mode**
- Launch with: Hold `Shift` during startup
- Disables: Plugins, AI, advanced features
- Use when: App crashes or won't start

**Repair Database**
- Help → Repair Library Database
- Fixes: Corrupted entries, orphaned records
- Backup: Automatic before repair

---

## Configuration Files

### Location

All configuration stored in:
```
~/Library/Application Support/Zona21/
├── zona21.db              # Main database
├── preferences.json       # App preferences (future)
├── cache/                 # Thumbnails and temporary files
│   ├── thumbnails/
│   └── models/            # AI models
└── logs/                  # Application logs
```

### Manual Editing

**Not Recommended:** Use Preferences UI instead

**If Necessary:**
1. Quit Zona21 completely
2. Edit configuration files
3. Verify JSON syntax (if applicable)
4. Restart Zona21

**Backup First:**
```bash
cp -R ~/Library/Application\ Support/Zona21/ ~/Zona21-Backup/
```

---

## Best Practices

### Recommended Settings

**For Performance:**
- Thumbnail size: Medium
- Cache limit: 50GB+
- RAM usage: Balanced
- Background processing: Low priority

**For Quality:**
- Thumbnail quality: High
- Export quality: High or Maximum
- Include metadata: ✓

**For Photographers:**
- Import: Reference in place
- Export naming: Smart rename
- AI auto-tagging: Enabled
- Auto-backup: Enabled

**For Large Libraries (10k+ photos):**
- Conservative RAM usage
- Aggressive caching
- Background AI processing
- Regular database maintenance

### Security & Privacy

**Recommended:**
- [ ] Don't include GPS in exports (if sharing online)
- [ ] Regular backups of library
- [✓] AI processing local (already default)
- [✓] No cloud uploads (already default)

---

## Related Documentation

- [Quick Start Guide](../getting-started/quick-start.md)
- [Keyboard Shortcuts](./KEYBOARD_SHORTCUTS.md)
- [AI Features Guide](./ai-features.md)
- [Performance Guide](../developer/performance.md)

---

**Last Updated:** January 30, 2026
**Version:** 0.4.9
