# Troubleshooting Guide - Zona21

**Version:** 0.4.9
**Last Updated:** January 31, 2026

## Overview

Complete troubleshooting guide for Zona21. Find solutions to common problems, error messages, and performance issues.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Launch & Startup Problems](#launch--startup-problems)
3. [Performance Issues](#performance-issues)
4. [Import & Indexing Problems](#import--indexing-problems)
5. [Export Problems](#export-problems)
6. [AI Features Issues](#ai-features-issues)
7. [Instagram Integration Issues](#instagram-integration-issues)
8. [Database Problems](#database-problems)
9. [macOS-Specific Issues](#macos-specific-issues)
10. [Getting Help](#getting-help)

---

## Installation Issues

### "App is damaged and can't be opened"

**Symptom:** macOS shows error "Zona21.app is damaged and can't be opened. You should move it to the Trash."

**Cause:** macOS Gatekeeper protection (app not code-signed by Apple Developer)

**Solution 1: Right-Click Open (Easiest)**
1. **Right-click** (or Control+click) on Zona21.app
2. Select **"Open"** from context menu
3. Click **"Open"** in confirmation dialog
4. App will launch (only needed once)

**Solution 2: System Settings**
1. Go to **System Settings → Privacy & Security**
2. Scroll to **"Security"** section
3. Click **"Open Anyway"** next to Zona21 message
4. Try opening app again

**Solution 3: Terminal (xattr removal)**
```bash
xattr -d com.apple.quarantine /Applications/Zona21.app
```

**Note:** If `xattr` fails with "Operation not permitted", use Solution 1 or 2 instead.

**See also:**
- [Installation Guide](../getting-started/installation.md#security-prompt)
- Portuguese guide: [erro-damaged.md](../../i18n/pt-BR/docs/troubleshooting/erro-damaged.md)

---

### "Cannot be opened because the developer cannot be verified"

**Solution:**
Same as "App is damaged" error above. Use right-click method.

---

### DMG Won't Mount

**Symptoms:**
- "resource busy" error
- "image not recognized" error
- Mounting hangs indefinitely

**Solutions:**

**1. Force unmount existing:**
```bash
hdiutil detach /Volumes/Zona21* -force
```

**2. Verify DMG integrity:**
```bash
shasum -a 256 ~/Downloads/Zona21-0.4.9-arm64.dmg
```
Compare with checksum from [GitHub Releases](https://github.com/Almar-cyber/zona21/releases).

**3. Re-download:**
If checksum doesn't match, download file again (may be corrupted).

**4. Try different method:**
```bash
# Command-line mount
hdiutil attach ~/Downloads/Zona21-0.4.9-arm64.dmg
```

---

### Installation Stalls or Freezes

**Symptoms:**
- Drag-and-drop to Applications never completes
- Copy progress bar frozen

**Solutions:**

**1. Check disk space:**
```bash
df -h /Applications
```
Need at least 500MB free.

**2. Kill Finder:**
```bash
killall Finder
```
Then try copying again.

**3. Use Terminal copy:**
```bash
cp -R /Volumes/Zona21\ 0.4.9-arm64/Zona21.app /Applications/
```

---

### Wrong Architecture (Rosetta Warning)

**Symptom:** App runs but shows "Rosetta" in Activity Monitor, or performance is poor.

**Cause:** Downloaded Intel version instead of ARM64 version.

**Solution:**
1. Delete existing Zona21.app
2. Download correct ARM64 version: `Zona21-0.4.9-arm64-mac.zip`
3. Verify architecture after installing:
```bash
file /Applications/Zona21.app/Contents/MacOS/Zona21
```
Should show: `Mach-O 64-bit executable arm64`

---

## Launch & Startup Problems

### App Crashes Immediately on Launch

**Check Console Logs:**
```bash
log show --predicate 'process == "Zona21"' --last 5m --style compact
```

**Common Causes & Solutions:**

**1. Corrupted Database**
Symptom: Crash log shows "database disk image is malformed"

Solution:
```bash
# Backup first
cp ~/Library/Application\ Support/Zona21/zona21.db ~/zona21-backup.db

# Reset database
rm ~/Library/Application\ Support/Zona21/zona21.db

# Restart Zona21 (will create fresh database)
```

**2. Locked Database**
Symptom: Error "database is locked"

Solution:
```bash
# Kill any existing Zona21 processes
pkill -9 Zona21

# Remove lock files
rm ~/Library/Application\ Support/Zona21/*.db-shm
rm ~/Library/Application\ Support/Zona21/*.db-wal

# Launch Zona21
```

**3. Insufficient Permissions**
Symptom: "Permission denied" in logs

Solution:
```bash
# Check permissions
ls -la ~/Library/Application\ Support/Zona21/

# Fix if needed
chmod -R 755 ~/Library/Application\ Support/Zona21/
```

---

### Slow First Launch (5+ minutes)

**Expected:** First launch takes 1-5 minutes (AI model download ~350MB)

**Check download progress:**
```bash
# Monitor AI model download
watch -n 1 ls -lh ~/Library/Application\ Support/Zona21/cache/models/
```

**If stuck longer than 10 minutes:**

**1. Check internet connection**

**2. Check firewall settings:**
- Allow Zona21 in macOS Firewall
- Allow connections to Hugging Face CDN

**3. Manual model download:**
If auto-download fails, download manually from [model page](https://huggingface.co/google/vit-base-patch16-224) and place in:
```
~/Library/Application Support/Zona21/cache/models/
```

**4. Disable AI features temporarily:**
Hold `Shift` while launching (safe mode).

---

### Window Opens Off-Screen

**Symptom:** App launches but window not visible.

**Solution:**
```bash
# Reset window position
defaults delete com.zona21.app windowBounds

# Restart app
```

---

### Blank White Screen on Launch

**Causes:**
1. GPU/rendering issue
2. Corrupted cache
3. Extension/plugin conflict

**Solutions:**

**1. Reset cache:**
```bash
rm -rf ~/Library/Application\ Support/Zona21/cache/
```

**2. Force GPU rendering:**
```bash
# Launch with specific GPU
open /Applications/Zona21.app --args --force-high-performance-gpu
```

**3. Disable hardware acceleration:**
Edit `~/.zona21rc` (if exists) or launch with:
```bash
open /Applications/Zona21.app --args --disable-gpu
```

---

## Performance Issues

### Slow Grid Scrolling (Laggy)

**Symptoms:**
- Grid stutters when scrolling
- Thumbnails load slowly
- High CPU usage

**Solutions:**

**1. Reduce thumbnail size:**
- Press `Cmd+-` to decrease thumbnail size
- Smaller thumbnails = faster rendering

**2. Clear thumbnail cache:**
```bash
rm -rf ~/Library/Application\ Support/Zona21/cache/thumbnails/
```
Zona21 will regenerate optimized thumbnails.

**3. Check available RAM:**
```bash
vm_stat | head -10
```
If low memory, close other apps.

**4. Adjust performance settings:**
- Preferences → Performance → RAM Usage → Conservative

**5. Disable background AI processing:**
- Preferences → AI Features → Process only when idle

---

### High CPU Usage (100%+)

**Check what's using CPU:**
```bash
# In Activity Monitor, sort by CPU
open -a "Activity Monitor"
```

**Common causes:**

**1. Initial Indexing**
Expected during first import. CPU usage high until indexing completes.

**2. AI Processing**
AI tagging uses CPU. Check progress:
```bash
# Watch AI queue
tail -f ~/Library/Logs/Zona21/main.log | grep AI
```

**3. Background Thumbnail Generation**
Wait for completion or pause:
- Status bar shows progress
- Pause in Preferences → Performance

**4. External Drive Indexing**
Indexing from slow external drives can spike CPU. Use faster SSD if possible.

---

### High Memory Usage (8GB+)

**Symptoms:**
- System slow, swap heavy
- "Your system has run out of application memory" warning

**Solutions:**

**1. Adjust memory settings:**
- Preferences → Performance → RAM Usage → Conservative
- Reduces cache size and loaded assets

**2. Close other apps:**
- Quit Chrome, Slack, other memory-heavy apps

**3. Reduce concurrent operations:**
- Don't run multiple imports simultaneously
- Pause AI processing during heavy tasks

**4. Check for memory leaks:**
```bash
# Monitor Zona21 memory over time
top -pid $(pgrep Zona21) -stats pid,mem
```
If memory grows continuously, report bug with logs.

---

### App Freezes/Hangs

**Symptoms:**
- UI unresponsive
- Beachball/spinning wheel
- Can't click anything

**Immediate action:**
```bash
# Force quit
pkill -9 Zona21
```

**Restart in safe mode:**
Hold `Shift` while launching (disables plugins, AI, advanced features).

**Check logs for cause:**
```bash
tail -100 ~/Library/Logs/Zona21/main.log
```

**Common causes:**
- Database operation timeout (large libraries 50k+ assets)
- External drive disconnected mid-operation
- Corrupted file causing parser hang

---

## Import & Indexing Problems

### No Photos Appear After Import

**Symptoms:**
- Import completes successfully
- Grid shows "No assets found"
- Status bar shows "0 assets"

**Checklist:**

**1. Check filters:**
- Click filter dropdown → "Show All"
- Clear search box
- Reset marking filters

**2. Verify indexing completed:**
- Status bar should say "Indexed X assets"
- If status = "Paused", click Resume

**3. Check database:**
```bash
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db "SELECT COUNT(*) FROM assets;"
```
Should return number > 0 if assets were indexed.

**4. Check file permissions:**
```bash
ls -la /path/to/imported/folder
```
Ensure you have read permissions.

**5. Grant Files and Folders access:**
- System Settings → Privacy & Security → Files and Folders
- Enable Zona21 for target directory

---

### Import Very Slow (< 100 files/min)

**Expected speeds:**
- SSD: 500-1000 files/min
- External SSD: 300-500 files/min
- External HDD: 50-200 files/min
- Network drive: 10-100 files/min

**If slower than expected:**

**1. Check disk speed:**
```bash
# Test read speed
dd if=/path/to/imported/folder/largefile.jpg of=/dev/null bs=1m
```

**2. Disable antivirus scanning:**
- Exclude Zona21 from real-time scanning
- Exclude import folder from scanning

**3. Use local drive:**
- Copy files to local SSD first
- Then import from local
- Much faster than network/external

**4. Check CPU:**
- During import, CPU should be 50-100%
- If low, something is throttling

---

### Import Fails with "Permission Denied"

**Solution:**

**1. Grant Files and Folders access:**
- System Settings → Privacy & Security → Files and Folders
- Enable Zona21 for target location

**2. Grant Full Disk Access (if needed):**
- System Settings → Privacy & Security → Full Disk Access
- Add Zona21
- Restart app

**3. Check folder permissions:**
```bash
ls -la /path/to/folder
```
You need at least read (`r`) permission.

**4. For external drives:**
```bash
# Check if mounted read-only
mount | grep /Volumes
```
If "read-only", remount drive.

---

### Duplicate Files Imported

**Symptom:** Same photo appears multiple times in library.

**Causes:**
- Same file in multiple locations
- File copied/moved after indexing
- Symlinks to same file

**Solutions:**

**1. Find duplicates:**
- Tools → Find Duplicates
- Shows groups of identical files (by hash)

**2. Remove from library:**
- Select duplicates
- Press `Delete` key
- Removes from library (files stay on disk)

**3. Prevention:**
- Don't import overlapping folders
- Use Collections instead of copying files

---

### Indexing Gets Stuck at 99%

**Symptoms:**
- Progress bar stuck at 99%
- "Indexing..." status for 10+ minutes
- Last file shown doesn't change

**Causes:**
- Corrupted file causing parser hang
- Very large file (10GB+ video)
- External drive connection issue

**Solutions:**

**1. Wait 5 minutes:**
Large files can take time. Be patient.

**2. Cancel and retry:**
- Click "Cancel Indexing"
- Review last file shown (likely problematic)
- Move that file out of folder temporarily
- Re-import

**3. Check file:**
```bash
# Try opening the stuck file
open /path/to/stuck/file.jpg
```
If file won't open, it's corrupted.

---

## Export Problems

### Export Fails with "Permission Denied"

**Symptom:** Export starts but fails immediately with error.

**Solutions:**

**1. Check destination permissions:**
```bash
ls -la /path/to/export/destination
```
Need write (`w`) permission.

**2. For external drives:**
- Ensure drive mounted read-write
- Check drive not full:
```bash
df -h /Volumes/ExternalDrive
```

**3. Grant Files and Folders access:**
System Settings → Privacy & Security → Files and Folders → Zona21

---

### Export Extremely Slow

**Expected speeds:**
- Local SSD: 200-500 MB/s
- External SSD: 100-300 MB/s
- External HDD: 30-100 MB/s

**If much slower:**

**1. Check destination disk speed:**
```bash
# Test write speed
dd if=/dev/zero of=/Volumes/External/testfile bs=1m count=1024
rm /Volumes/External/testfile
```

**2. Use wired connection:**
- USB-C/Thunderbolt much faster than WiFi
- Avoid wireless network drives for large exports

**3. Check USB hub:**
- Connect directly to Mac, not through hub
- Some hubs limit bandwidth

---

### Exported Files Won't Open

**Symptoms:**
- Files export successfully
- But won't open in other apps
- File size = 0 bytes or very small

**Causes:**
- Source file offline (on disconnected drive)
- Export interrupted
- Disk full mid-export

**Solutions:**

**1. Verify source files:**
- Right-click asset → Reveal in Finder
- Check file opens normally

**2. Check export destination had space:**
```bash
df -h /path/to/export/destination
```

**3. Re-export with verification:**
Use export to ZIP (includes verification).

---

## AI Features Issues

### AI Features Not Working

**Symptoms:**
- No tags generated
- Find Similar returns no results
- Smart Culling unavailable

**Checklist:**

**1. Check AI enabled:**
- Preferences → AI Features → Enable AI

**2. Check model downloaded:**
```bash
ls -lh ~/Library/Application\ Support/Zona21/cache/models/
```
Should show `vit-base-patch16-224` folder (~350MB).

**3. Check AI status:**
Click AI icon in toolbar → Shows status

**4. Check logs:**
```bash
tail -50 ~/Library/Logs/Zona21/main.log | grep AI
```

**5. Re-download model:**
```bash
rm -rf ~/Library/Application\ Support/Zona21/cache/models/
```
Restart Zona21 (will re-download).

---

### AI Processing Very Slow

**Expected:** 1-3 seconds per photo (on Apple Silicon)

**If 10+ seconds per photo:**

**1. Check CPU throttling:**
- Thermal throttling (Mac too hot)
- Battery saver mode
- Background processes

**2. Adjust AI priority:**
- Preferences → AI Features → Processing Priority → High

**3. Process manually:**
- Select photos
- Right-click → "Process with AI"
- Faster than background processing

---

### Smart Culling Suggestions Wrong

**Symptoms:**
- AI suggests keeping blurry photos
- AI rejects best shots
- Suggestions don't make sense

**Explanation:**
AI uses quality metrics but isn't perfect. It can misjudge:
- Artistic blur (intentional)
- Creative composition (unusual framing)
- Low-light shots (high noise)

**Solutions:**

**1. Adjust thresholds:**
- Smart Culling → Settings
- Time threshold: 1-5 seconds (default 3)
- Similarity: 70-95% (default 85%)

**2. Review suggestions:**
- AI marks suggestions, you decide
- Use Compare mode to verify
- Press `1-4` to pick in Compare

**3. Manual cull first:**
- Remove obviously bad shots manually
- Then use AI on refined set

---

## Instagram Integration Issues

### "Failed to Connect to Instagram"

**Symptoms:**
- OAuth fails
- "Network error" message
- Can't authorize account

**Solutions:**

**1. Check account type:**
- Must be Business or Creator account
- Personal accounts NOT supported
- [Convert account](https://help.instagram.com/502981923235522)

**2. Check internet connection:**
- Need active connection for OAuth
- Try different network

**3. Check Facebook Page:**
- Business account must have linked Facebook Page
- Creator account: optional but recommended

**4. Clear OAuth cache:**
```bash
rm -rf ~/Library/Application\ Support/Zona21/oauth-cache/
```

**5. Retry OAuth:**
- Zona21 → Instagram → Connect
- Follow prompts carefully

---

### "Rate Limit Exceeded"

**Symptom:** Can't schedule more posts, error message shown.

**Cause:** Instagram Platform API limits:
- 25 posts per day
- 200 posts per month

**Solutions:**

**1. Wait for reset:**
- Daily limit resets every 24 hours
- Monthly limit resets on same day each month

**2. Check usage:**
- Zona21 → Instagram → Usage Info
- Shows remaining posts

**3. Prioritize posts:**
- Schedule most important first
- Remove low-priority scheduled posts

---

### Scheduled Post Never Posted

**Symptoms:**
- Post scheduled successfully
- Time passed, but not posted
- Status = "Failed"

**Common causes:**

**1. Token expired:**
- Instagram tokens expire after 60 days
- Refresh token: Instagram → Settings → Refresh Token

**2. File format unsupported:**
- Instagram requires JPEG or MP4
- HEIC, PNG converted automatically
- Check original file format

**3. Size/dimensions out of range:**
- Min: 320x320px
- Max: 1080x1350px (portrait)
- Resize if needed

**4. Caption too long:**
- Max 2200 characters
- Edit and re-schedule

---

## Database Problems

### "Database is Locked"

**Symptom:** Error when trying to import, update, or export.

**Cause:** Multiple processes accessing database simultaneously.

**Solution:**
```bash
# Kill all Zona21 processes
pkill -9 Zona21

# Remove lock files
rm ~/Library/Application\ Support/Zona21/*.db-shm
rm ~/Library/Application\ Support/Zona21/*.db-wal

# Launch Zona21
open /Applications/Zona21.app
```

---

### "Database Disk Image is Malformed"

**Symptom:** App crashes with database corruption error.

**Solution:**

**1. Try repair:**
```bash
cd ~/Library/Application\ Support/Zona21/
sqlite3 zona21.db "PRAGMA integrity_check;"
```

If errors shown:
```bash
sqlite3 zona21.db ".recover" | sqlite3 zona21-recovered.db
mv zona21.db zona21-corrupted-backup.db
mv zona21-recovered.db zona21.db
```

**2. Restore from backup:**
```bash
cp ~/Documents/Zona21\ Backups/zona21.db ~/Library/Application\ Support/Zona21/
```

**3. Start fresh (last resort):**
```bash
mv ~/Library/Application\ Support/Zona21/zona21.db ~/zona21-old.db
# Launch Zona21 (creates new database)
# Re-import your photos
```

**Important:** Marks and collections are lost if database can't be recovered. Original files are safe.

---

### Slow Database Performance (Large Libraries)

**Symptoms:**
- Filtering takes 5+ seconds
- Search very slow
- App laggy with 50k+ assets

**Solutions:**

**1. Vacuum database (monthly):**
```bash
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db "VACUUM;"
```
Optimizes database, frees space.

**2. Reindex:**
```bash
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db "REINDEX;"
```
Rebuilds search indexes.

**3. Analyze query plan:**
Enable debug mode (Preferences → Advanced → Verbose Logging) and check logs for slow queries.

---

## macOS-Specific Issues

### "better-sqlite3" Architecture Mismatch

**Symptom:** Error message about native module architecture.

**Solution:**
```bash
cd /Applications/Zona21.app/Contents/Resources/app/
npm rebuild better-sqlite3 --build-from-source
```

Or reinstall Zona21 (download correct architecture).

---

### Port 5174 Already in Use (Dev Mode)

**Symptom:** Dev server won't start, port conflict.

**Solution:**
```bash
# Kill process using port 5174
lsof -ti:5174 | xargs kill -9

# Or change port in vite.config.ts
```

---

### Kernel Panic / System Crash

**Very rare**, but if Mac crashes while using Zona21:

**1. Check crash logs:**
```bash
log show --predicate 'eventMessage contains "panic"' --last 1d
```

**2. Report to Apple:**
System crashes are usually hardware/driver issues, not app bugs.

**3. Check hardware:**
- Run Apple Diagnostics (hold `D` during startup)
- Check for drive errors

**4. Report bug:**
If reproducible, file issue with crash logs.

---

## Getting Help

### Before Reporting an Issue

**Gather Information:**

1. **Version:**
   - Zona21 → About → Copy version info

2. **System Info:**
   ```bash
   sw_vers
   system_profiler SPHardwareDataType | grep "Model\|Processor\|Memory"
   ```

3. **Logs:**
   ```bash
   # Export logs
   Zona21 → Help → Export Logs
   ```

4. **Screenshots:**
   - `Cmd+Shift+4` to capture relevant UI

5. **Steps to Reproduce:**
   - Write exact steps that cause the issue
   - Note any error messages

---

### Support Channels

**Documentation:**
- [User Guide](../user-guide/) - Feature documentation
- [FAQ](../getting-started/quick-start.md#common-questions) - Frequently asked questions

**Community:**
- [GitHub Issues](https://github.com/Almar-cyber/zona21/issues) - Bug reports
- [GitHub Discussions](https://github.com/Almar-cyber/zona21/discussions) - Questions, ideas

**Direct Contact:**
- Email: alexia01native@gmail.com

---

### Diagnostic Commands

**System health check:**
```bash
#!/bin/bash
echo "=== Zona21 Diagnostics ==="
echo ""
echo "App version:"
defaults read /Applications/Zona21.app/Contents/Info.plist CFBundleShortVersionString
echo ""
echo "macOS version:"
sw_vers
echo ""
echo "Database:"
ls -lh ~/Library/Application\ Support/Zona21/zona21.db
echo ""
echo "Cache size:"
du -sh ~/Library/Application\ Support/Zona21/cache/
echo ""
echo "Models:"
ls -lh ~/Library/Application\ Support/Zona21/cache/models/
echo ""
echo "Recent errors:"
tail -20 ~/Library/Logs/Zona21/main.log | grep -i "error\|warn"
```

---

### Safe Mode

Launch Zona21 in safe mode (disables plugins, AI, advanced features):

```bash
# Hold Shift while launching
open /Applications/Zona21.app

# Or via command line
open /Applications/Zona21.app --args --safe-mode
```

Use safe mode to:
- Troubleshoot crashes
- Bypass corrupted cache
- Isolate performance issues

---

### Factory Reset

**⚠️ WARNING:** Deletes all data (database, cache, settings). Original photos remain safe.

```bash
# Backup first (optional)
cp -R ~/Library/Application\ Support/Zona21/ ~/Zona21-Backup/

# Factory reset
rm -rf ~/Library/Application\ Support/Zona21/
rm -rf ~/Library/Caches/com.zona21.app/
rm -rf ~/Library/Preferences/com.zona21.app.plist
rm -rf ~/Library/Logs/Zona21/

# Launch Zona21 (fresh start)
```

---

## Quick Reference

### Common Error Messages

| Error | Solution |
|-------|----------|
| "App is damaged" | Right-click → Open |
| "Permission denied" | Grant Files and Folders access |
| "Database is locked" | `pkill -9 Zona21` and relaunch |
| "Cannot find module" | Reinstall app |
| "Out of memory" | Close other apps, adjust settings |
| "Network error" | Check internet connection |
| "Port 5174 in use" | `lsof -ti:5174 \| xargs kill -9` |

### Useful Commands

```bash
# Restart Zona21
pkill Zona21 && open /Applications/Zona21.app

# View logs
tail -f ~/Library/Logs/Zona21/main.log

# Check database
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db "PRAGMA integrity_check;"

# Clear cache
rm -rf ~/Library/Application\ Support/Zona21/cache/

# Reset preferences
defaults delete com.zona21.app

# Export diagnostic info
Zona21 → Help → Export Logs
```

---

## Related Documentation

- [Installation Guide](../getting-started/installation.md)
- [Quick Start Guide](../getting-started/quick-start.md)
- [Preferences Guide](../user-guide/preferences.md)
- [Performance Guide](../developer/performance.md)

---

**Can't find your issue?** [Open a GitHub Discussion](https://github.com/Almar-cyber/zona21/discussions) or [report a bug](https://github.com/Almar-cyber/zona21/issues).

---

**Last Updated:** January 31, 2026
**Version:** 0.4.9
