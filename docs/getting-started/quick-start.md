# Quick Start Guide - Zona21

**Version:** 0.4.9
**Last Updated:** January 30, 2026
**Time Required:** 5-10 minutes

## Welcome to Zona21! 🎉

This guide will get you from zero to organizing your first photos in under 10 minutes.

## What You'll Learn

1. [Install Zona21](#installation)
2. [Import your first photos](#importing-photos)
3. [Navigate and browse](#navigation-basics)
4. [Mark and organize photos](#marking-photos)
5. [Export selected photos](#exporting-photos)
6. [Next steps](#next-steps)

---

## Installation

### macOS (Apple Silicon)

1. **Download** Zona21-0.4.9-arm64.dmg (176MB)
   - [Download from GitHub Releases](https://github.com/Almar-cyber/zona21/releases)

2. **Mount the DMG**
   - Double-click the downloaded file
   - DMG will mount automatically

3. **Install**
   - Drag Zona21.app to Applications folder
   - Wait for copy to complete

4. **First Launch**
   - Open Applications folder
   - Right-click Zona21.app → Open (first time only)
   - Click "Open" when macOS asks for confirmation

**Troubleshooting:** If you see "App is damaged", see [macOS Security Issues](../troubleshooting/README.md#app-is-damaged-and-cant-be-opened).

### System Requirements

- **macOS:** 10.12 Sierra or later
- **Processor:** Apple Silicon (M1/M2/M3) or Intel x64
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 500MB for app + space for your media library
- **Display:** 1280x720 minimum resolution

---

## Importing Photos

### Your First Import

1. **Launch Zona21**
   - You'll see the welcome screen

2. **Import a Folder**
   - Click "Import Photos" or press `Cmd+I`
   - Navigate to a folder with photos
   - Select folder and click "Choose"

3. **Wait for Indexing**
   - Zona21 scans and generates thumbnails
   - Progress shown in bottom status bar
   - **Speed:** ~1000 files/minute on SSD

4. **View Your Library**
   - Photos appear in grid view
   - Thumbnails load progressively

**Pro Tip:** Start with a small folder (50-100 photos) to learn the workflow before importing your entire library.

### Supported Formats

**Photos:**
- JPEG, PNG, HEIC, WebP
- RAW formats: CR2, NEF, ARW (Canon, Nikon, Sony)
- TIFF, BMP, GIF

**Videos:**
- MP4, MOV, AVI, MKV
- HEVC (H.265), H.264

---

## Navigation Basics

### Understanding the Interface

```
┌─────────────────────────────────────────────┐
│  Toolbar (Top)                              │  ← Filters, Search, Actions
├─────────────────────────────────────────────┤
│  Grid View                                  │  ← Your photos
│  [📷] [📷] [📷] [📷] [📷] [📷] [📷] [📷]      │
│  [📷] [📷] [📷] [📷] [📷] [📷] [📷] [📷]      │
├─────────────────────────────────────────────┤
│  Status Bar (Bottom)                        │  ← Counts, Selection info
└─────────────────────────────────────────────┘
```

### Keyboard Navigation

**Essential Shortcuts:**
- `Arrow Keys`: Navigate between photos
- `Space`: View photo full-screen
- `Esc`: Exit full-screen viewer
- `Cmd+A`: Select all
- `Cmd+D`: Deselect all

**Grid Size:**
- `Cmd++`: Increase thumbnail size
- `Cmd+-`: Decrease thumbnail size
- `Cmd+0`: Reset to default size

### Mouse Navigation

- **Click**: Select single photo
- **Cmd+Click**: Add to selection
- **Shift+Click**: Select range
- **Double-Click**: Open in viewer

---

## Marking Photos

### The Marking System

Zona21 uses a three-tier system to help you quickly organize photos:

| Mark | Icon | Shortcut | Meaning |
|------|------|----------|---------|
| **Favorite** | ⭐ Yellow Star | `F` | Best of the best |
| **Approved** | ✅ Green Check | `A` | Keepers |
| **Rejected** | ❌ Red X | `D` | Delete later |

### Quick Marking Workflow

**Step 1: Navigate**
- Use arrow keys to move through photos
- Or click to select

**Step 2: Mark**
- Press `F` for favorite (yellow star)
- Press `A` for approved (green check)
- Press `D` for rejected (red X)
- Press `U` to unmark

**Step 3: Review**
- Bottom status bar shows counts
- Example: "47 assets | 12 approved | 3 favorites | 8 rejected"

### Advanced Marking

**Batch Marking:**
1. Select multiple photos (Cmd+Click or Shift+Click)
2. Press `A`, `F`, or `D`
3. All selected photos marked at once

**Filter by Mark:**
- Click filter dropdown in toolbar
- Select "Approved Only", "Favorites Only", etc.
- Grid shows only filtered photos

**Collections:**
1. Select photos
2. Right-click → "Add to Collection"
3. Name your collection (e.g., "Best of 2026")
4. Access later from sidebar

---

## Exporting Photos

### Basic Export

1. **Select Photos to Export**
   - Mark as Approved (`A`) or Favorite (`F`)
   - Or manually select with Cmd+Click

2. **Open Export Dialog**
   - Press `Cmd+E` or click "Export" button
   - Export dialog appears

3. **Choose Settings**
   - **Destination:** Click "Choose Folder"
   - **Format:** JPEG, PNG, or Original
   - **Quality:** High (recommended), Maximum, or Medium
   - **Resize:** Original size or custom dimensions

4. **Export**
   - Click "Export" button
   - Progress shown in status bar
   - Notification when complete

### Export Presets

**Instagram Ready:**
- Format: JPEG
- Quality: High
- Resize: 1080x1080 (square) or 1080x1350 (portrait)

**Full Quality:**
- Format: Original
- Quality: Maximum
- Resize: None

**Web Optimized:**
- Format: JPEG
- Quality: Medium
- Resize: 1920px wide

### Export Tips

**✅ Do:**
- Export to a separate folder (not your original photos)
- Name folders clearly (e.g., "2026-01-30-Export")
- Keep originals untouched

**❌ Don't:**
- Export back to the same folder as originals
- Delete originals before verifying exports
- Export everything (mark first, then export)

---

## Next Steps

### You've Completed the Basics! 🎉

You now know how to:
- ✅ Import photos into Zona21
- ✅ Navigate with keyboard and mouse
- ✅ Mark photos (Approved, Favorite, Rejected)
- ✅ Export selected photos

### Level Up Your Workflow

**Essential Features:**
1. **Compare Mode** - Compare 2-4 similar photos side-by-side
   - Select photos → Press `C`
   - Use `1-4` keys to choose best

2. **Smart Culling** - Let AI suggest best photos from bursts
   - Tools → Smart Culling
   - Review AI suggestions
   - Accept or reject recommendations

3. **Collections** - Organize photos into projects
   - Select photos → Right-click → "Add to Collection"
   - Name collection (e.g., "Portfolio 2026")
   - Access from sidebar

**Power User Features:**
1. **Keyboard Shortcuts** - Learn all shortcuts
   - See [KEYBOARD_SHORTCUTS.md](../../KEYBOARD_SHORTCUTS.md)
   - Practice with arrow keys + A/F/D

2. **AI Features** - Auto-tagging and smart rename
   - Photos tagged automatically in background
   - View tags in metadata panel
   - Search by tags

3. **Instagram Integration** - Schedule posts directly
   - Click Instagram button in toolbar
   - Connect your Business/Creator account
   - Schedule posts with captions

### Learning Resources

**Documentation:**
- [User Guide](../user-guide/) - Complete feature documentation
- [Keyboard Shortcuts](../../KEYBOARD_SHORTCUTS.md) - All shortcuts
- [AI Features](../user-guide/ai-features.md) - AI capabilities
- [Troubleshooting](../troubleshooting/) - Common issues

**Video Tutorials:**
- Quick Start (5 min) - Coming soon
- Advanced Workflow (15 min) - Coming soon
- Instagram Integration (10 min) - Coming soon

**Community:**
- [GitHub Discussions](https://github.com/Almar-cyber/zona21/discussions) - Ask questions
- [GitHub Issues](https://github.com/Almar-cyber/zona21/issues) - Report bugs

---

## Common Questions

**Q: Can I use Zona21 with my existing Lightroom library?**
A: Yes! Zona21 reads folders directly. Point it to your Lightroom-managed folders.

**Q: Does Zona21 modify my original photos?**
A: No. Zona21 never modifies originals. All edits are non-destructive and stored in the database.

**Q: How do I delete photos?**
A: Mark as Rejected (`D`), filter to show only rejected, select all, then press `Delete` key.

**Q: What happens to my data if I uninstall Zona21?**
A: Your photos remain untouched. Zona21's database is in `~/Library/Application Support/Zona21/`. Back up this folder to preserve marks and collections.

**Q: Can I use Zona21 on multiple computers?**
A: Yes, but libraries are local. Cloud sync is planned for future releases.

**Q: Is there a mobile app?**
A: Not yet. Mobile companion app is planned for 2026 Q4.

---

## Troubleshooting First Use

### App Won't Open

**"App is damaged":**
```bash
xattr -d com.apple.quarantine /Applications/Zona21.app
```
See: [macOS Security Fix](../troubleshooting/README.md#app-is-damaged-and-cant-be-opened)

### No Photos Appearing

**Check:**
1. Folder contains supported formats (JPEG, PNG, RAW)
2. You have read permissions for the folder
3. Indexing completed (check status bar)

**Fix:**
- Try smaller folder first
- Check Console for errors (View → Toggle Developer Tools)

### Slow Performance

**First-time:**
- AI model download (~350MB, one-time)
- Initial thumbnail generation takes time
- Patience on first launch

**Always slow:**
- Close other heavy apps
- Check available RAM (Activity Monitor)
- Reduce thumbnail size (`Cmd+-`)

### Import Failed

**Common causes:**
- No read permissions
- External drive disconnected
- Network drive timeout

**Fix:**
- Check folder permissions (Get Info)
- Ensure drives are mounted
- Try local folder first

---

## Ready to Organize!

You're now ready to start organizing your photo library with Zona21.

**Quick Recap:**
1. Import photos (`Cmd+I`)
2. Navigate (arrow keys)
3. Mark keepers (`A` or `F`)
4. Mark rejects (`D`)
5. Export selected (`Cmd+E`)

**Remember:** Start small, practice the workflow, then scale up to your full library.

Happy organizing! 📸

---

**Questions?** Check [User Guide](../user-guide/) or [GitHub Discussions](https://github.com/Almar-cyber/zona21/discussions)

**Issues?** See [Troubleshooting](../troubleshooting/) or report on [GitHub Issues](https://github.com/Almar-cyber/zona21/issues)

---

**Last Updated:** January 30, 2026
**Version:** 0.4.9
**Estimated Reading Time:** 10 minutes
