# Installation Guide - Zona21

**Version:** 0.4.9
**Last Updated:** January 30, 2026
**Platforms:** macOS (ARM64 / Apple Silicon)

## Overview

Complete installation guide for Zona21, including system requirements, download instructions, installation steps, and troubleshooting.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Download](#download)
3. [Installation](#installation)
4. [First Launch](#first-launch)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Uninstallation](#uninstallation)

---

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | macOS 10.12 Sierra or later |
| **Processor** | Apple Silicon (M1/M2/M3) or Intel x64 |
| **RAM** | 8GB |
| **Storage** | 500MB for app + library space |
| **Display** | 1280x720 resolution |

### Recommended Specifications

| Component | Recommendation |
|-----------|----------------|
| **Operating System** | macOS 13 Ventura or later |
| **Processor** | Apple Silicon (M1 Pro/Max, M2/M3) |
| **RAM** | 16GB or more |
| **Storage** | SSD with 50GB+ free space |
| **Display** | 1920x1080 or higher |

### Optimal Performance

For libraries with 10,000+ photos:
- **RAM:** 16GB+
- **Storage:** Fast SSD (NVMe recommended)
- **Processor:** M1 Pro or better
- **GPU:** Dedicated (for AI features)

---

## Download

### Official Release (v0.4.9)

**macOS ARM64 (Apple Silicon - Recommended):**
- File: `Zona21-0.4.9-arm64.dmg`
- Size: 176MB
- SHA256: `[checksum]`
- [Download from GitHub Releases](https://github.com/Almar-cyber/zona21/releases/tag/v0.4.9)

**macOS Intel x64 (Coming Soon):**
- Available in v1.0.0
- Expected: October 2026

**Windows (Coming Soon):**
- Available in v1.0.0
- Expected: October 2026

**Linux (Coming Soon):**
- Available in v1.0.0
- Expected: October 2026

### Download Verification

**Verify file integrity:**
```bash
shasum -a 256 ~/Downloads/Zona21-0.4.9-arm64.dmg
```

Compare output with official checksum from GitHub release notes.

### Beta Releases

**Early Access:**
- Available to beta testers
- Check [GitHub Releases](https://github.com/Almar-cyber/zona21/releases)
- Look for "Pre-release" tag

---

## Installation

### Step-by-Step Installation

#### 1. Download DMG

Download `Zona21-0.4.9-arm64.dmg` from GitHub Releases.

**Location:** Downloads folder (`~/Downloads/`)

#### 2. Mount DMG

**Option A: Double-Click**
- Double-click the DMG file
- DMG mounts automatically
- Finder window opens

**Option B: Terminal**
```bash
hdiutil attach ~/Downloads/Zona21-0.4.9-arm64.dmg
```

#### 3. Install Application

**Drag and Drop:**
1. Drag `Zona21.app` to `Applications` folder shortcut
2. Wait for copy to complete (10-30 seconds)
3. Eject DMG (drag to trash or Cmd+E)

**Terminal Installation:**
```bash
cp -R /Volumes/Zona21\ 0.4.9-arm64/Zona21.app /Applications/
hdiutil detach /Volumes/Zona21\ 0.4.9-arm64
```

#### 4. Verify Installation

**Check Applications folder:**
```bash
ls -la /Applications/Zona21.app
```

**Expected output:**
```
drwxr-xr-x  3 user  admin  96 Jan 29 21:03 /Applications/Zona21.app
```

---

## First Launch

### Initial Setup

#### 1. Open Application

**First Time (Security Required):**
1. Open Finder → Applications
2. **Right-click** `Zona21.app`
3. Select "Open" from menu
4. Click "Open" in security dialog

**Why Right-Click?**
- macOS Gatekeeper requires explicit confirmation for unsigned apps
- Only needed on first launch
- Subsequent launches: double-click normally

**Alternative: Terminal**
```bash
open /Applications/Zona21.app
```

#### 2. Security Prompt

**If you see:**
```
"Zona21.app" cannot be opened because it is from an unidentified developer.
```

**Solution:**
1. System Settings → Privacy & Security
2. Scroll to "Security" section
3. Click "Open Anyway" next to Zona21
4. Confirm in popup

**Or use terminal:**
```bash
xattr -d com.apple.quarantine /Applications/Zona21.app
```

#### 3. First Launch Tasks

**Automatic:**
- Database initialization
- Preferences creation
- Cache directory setup
- AI model download (~350MB, background)

**Expected duration:** 1-5 minutes

**User data location:**
- macOS: `~/Library/Application Support/Zona21/`
- Database: `zona21.db`
- Cache: `cache/` folder
- Models: `cache/models/` folder

#### 4. Permissions

**Zona21 will request:**

**✅ Files and Folders Access**
- Required to read your photos
- Grant when prompted
- Can be managed in: System Settings → Privacy & Security → Files and Folders

**✅ Full Disk Access (Optional)**
- For indexing system-wide libraries
- Only if you store photos in protected locations
- System Settings → Privacy & Security → Full Disk Access

**❌ Not Required:**
- Camera access
- Microphone access
- Location services
- Contacts

---

## Verification

### Verify Installation Success

#### 1. Check App Version

**Menu Bar:**
- Zona21 → About Zona21
- Verify version shows: `0.4.9`

**Terminal:**
```bash
defaults read /Applications/Zona21.app/Contents/Info.plist CFBundleShortVersionString
```

**Expected output:** `0.4.9`

#### 2. Check Database

```bash
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db "SELECT name FROM sqlite_master WHERE type='table';"
```

**Expected:** List of tables (assets, volumes, collections, etc.)

#### 3. Test Basic Functions

**Import Test:**
1. Create test folder with 5-10 photos
2. Zona21 → File → Import (`Cmd+I`)
3. Select test folder
4. Verify photos appear in grid

**Navigation Test:**
1. Use arrow keys to navigate
2. Press `Space` to view full-screen
3. Press `Esc` to exit viewer

**Marking Test:**
1. Select a photo
2. Press `A` (approved), `F` (favorite), or `D` (rejected)
3. Verify badge appears on thumbnail

---

## Troubleshooting

### Common Installation Issues

#### Issue: "App is damaged and can't be opened"

**Cause:** macOS Gatekeeper quarantine attribute

**Solution:**
```bash
xattr -d com.apple.quarantine /Applications/Zona21.app
```

**Detailed guide:** [Troubleshooting Guide](../troubleshooting/README.md#app-is-damaged-and-cant-be-opened)

#### Issue: "Cannot be opened because it is from an unidentified developer"

**Solution 1: GUI**
1. System Settings → Privacy & Security
2. Scroll to Security section
3. Click "Open Anyway"

**Solution 2: Terminal**
```bash
spctl --add /Applications/Zona21.app
```

#### Issue: DMG Won't Mount

**Symptoms:**
- "resource busy" error
- "image not recognized" error
- Mounting hangs

**Solutions:**

**1. Force unmount existing:**
```bash
hdiutil detach /Volumes/Zona21* -force
```

**2. Verify DMG integrity:**
```bash
hdiutil verify ~/Downloads/Zona21-0.4.9-arm64.dmg
```

**3. Re-download if corrupted**

#### Issue: App Crashes on Launch

**Check Console logs:**
```bash
log show --predicate 'process == "Zona21"' --last 5m
```

**Common causes:**
1. Corrupted preferences
2. Database locked by another process
3. Insufficient permissions

**Solutions:**

**Reset preferences:**
```bash
defaults delete com.zona21.app
rm -rf ~/Library/Application\ Support/Zona21/
```

**Kill existing processes:**
```bash
pkill -9 Zona21
```

#### Issue: Slow First Launch

**Expected:** 1-5 minutes (AI model download)

**If longer than 10 minutes:**
1. Check internet connection
2. Check firewall settings
3. Check Console for errors

**Monitor download:**
```bash
ls -lh ~/Library/Application\ Support/Zona21/cache/models/
```

#### Issue: Permission Denied

**Symptoms:**
- Can't import from certain folders
- "Permission denied" errors
- Missing photos in library

**Solutions:**

**1. Grant Files and Folders access:**
- System Settings → Privacy & Security → Files and Folders
- Enable Zona21 for desired locations

**2. Check folder permissions:**
```bash
ls -la /path/to/your/photos
```

**3. Grant Full Disk Access (if needed):**
- System Settings → Privacy & Security → Full Disk Access
- Add Zona21

---

## Uninstallation

### Complete Removal

#### 1. Quit Zona21

```bash
pkill Zona21
```

#### 2. Remove Application

```bash
rm -rf /Applications/Zona21.app
```

#### 3. Remove User Data (Optional)

**⚠️ Warning:** This deletes your library database, marks, collections, and all app data.

```bash
rm -rf ~/Library/Application\ Support/Zona21/
rm -rf ~/Library/Caches/com.zona21.app/
rm -rf ~/Library/Preferences/com.zona21.app.plist
rm -rf ~/Library/Logs/Zona21/
```

#### 4. Verify Removal

```bash
find ~ -name "*zona21*" -o -name "*Zona21*" 2>/dev/null
```

**Expected:** No results

### Keep Your Data

If you want to reinstall later:

**Backup first:**
```bash
cp -R ~/Library/Application\ Support/Zona21/ ~/Zona21-Backup/
```

**Only remove app:**
```bash
rm -rf /Applications/Zona21.app
```

**Restore after reinstall:**
```bash
cp -R ~/Zona21-Backup/ ~/Library/Application\ Support/Zona21/
```

---

## Advanced Installation

### Custom Installation Location

**Not recommended**, but possible:

```bash
cp -R /Volumes/Zona21\ 0.4.9-arm64/Zona21.app ~/CustomApps/
```

**Update launch path:**
```bash
open ~/CustomApps/Zona21.app
```

### Network Installation

For IT administrators deploying to multiple Macs:

**1. Create disk image:**
```bash
hdiutil create -volname "Zona21" -srcfolder /Applications/Zona21.app -ov -format UDZO Zona21-Deploy.dmg
```

**2. Deploy via script:**
```bash
#!/bin/bash
hdiutil attach Zona21-Deploy.dmg
cp -R /Volumes/Zona21/Zona21.app /Applications/
hdiutil detach /Volumes/Zona21
```

### Silent Installation

```bash
#!/bin/bash
# Silent install script
hdiutil attach -quiet -nobrowse ~/Downloads/Zona21-0.4.9-arm64.dmg
cp -R /Volumes/Zona21\ 0.4.9-arm64/Zona21.app /Applications/
hdiutil detach -quiet /Volumes/Zona21\ 0.4.9-arm64
xattr -d com.apple.quarantine /Applications/Zona21.app
open /Applications/Zona21.app
```

---

## Update Installation

### Upgrading from v0.4.8 to v0.4.9

**Automatic (Recommended):**
1. Open Zona21
2. Update notification appears
3. Click "Download and Install"
4. App restarts automatically

**Manual:**
1. Download v0.4.9 DMG
2. Quit Zona21
3. Replace existing app in Applications
4. Launch new version

**Data Migration:**
- Automatic (no action needed)
- Database schema updates on first launch
- Settings and collections preserved

**Backup First (Optional but Recommended):**
```bash
cp ~/Library/Application\ Support/Zona21/zona21.db ~/zona21-backup.db
```

---

## Multiple Versions

### Running Multiple Versions

**Rename apps:**
```bash
mv /Applications/Zona21.app /Applications/Zona21-v0.4.9.app
```

**⚠️ Warning:** Both versions share same database. Data conflicts possible.

**Better: Use separate user data:**
```bash
# Launch with custom data directory (future feature)
```

---

## Platform-Specific Notes

### Apple Silicon (M1/M2/M3)

**Native ARM64 build:**
- Optimized for Apple Silicon
- Better performance and battery life
- Rosetta not required

**Verify architecture:**
```bash
file /Applications/Zona21.app/Contents/MacOS/Zona21
```

**Expected:** `Mach-O 64-bit executable arm64`

### Intel Macs

**Status:** Coming in v1.0.0

**Workaround (not recommended):**
- Use ARM64 build with Rosetta 2
- Slower performance
- Higher battery usage

---

## Post-Installation

### Recommended Next Steps

1. **Import test folder** - Verify everything works
2. **Configure preferences** - Set thumbnail size, cache location
3. **Learn keyboard shortcuts** - See [KEYBOARD_SHORTCUTS.md](../user-guide/KEYBOARD_SHORTCUTS.md)
4. **Read Quick Start** - [quick-start.md](./quick-start.md)

### Optional Configuration

**Set default import location:**
- Preferences → Importing → Default Import Path

**Configure cache:**
- Preferences → Performance → Cache Location
- Recommended: 50GB+ free space

**Enable AI features:**
- Preferences → AI → Enable Auto-Tagging
- First-time: ~350MB model download

---

## Getting Help

### Support Resources

- **Troubleshooting:** [docs/troubleshooting/](../troubleshooting/)
- **GitHub Issues:** [zona21/issues](https://github.com/Almar-cyber/zona21/issues)
- **GitHub Discussions:** [zona21/discussions](https://github.com/Almar-cyber/zona21/discussions)
- **Email:** alexia01native@gmail.com

### Reporting Installation Issues

**Include in bug report:**
1. macOS version (`sw_vers`)
2. Processor type (Apple Silicon / Intel)
3. Installation method used
4. Error messages (screenshots)
5. Console logs (`log show --predicate 'process == "Zona21"'`)

---

**Last Updated:** January 30, 2026
**Version:** 0.4.9
**Platform:** macOS ARM64
