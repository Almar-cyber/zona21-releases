# AI Features - Smart Culling & Organization

**Version:** 0.4.9+
**Last Updated:** January 30, 2026

## Overview

Zona21 includes powerful AI features that run **100% locally** on your device. No internet required, no cloud processing, complete privacy.

### Key Benefits

- **Zero Cost:** No API fees, process unlimited photos
- **Privacy:** Photos never leave your computer
- **Offline:** Works without internet connection
- **Fast:** Optimized models running on your hardware

### Powered By

- **Technology:** Transformers.js with ViT (Vision Transformer)
- **Model:** google/vit-base-patch16-224
- **Processing:** On-device (CPU/GPU)

---

## Features

### 1. Auto-Tagging

Every photo is automatically analyzed and tagged with relevant content descriptors. Tags are generated in Portuguese and appear in the asset's metadata.

#### Categories Detected

**Time of Day** (from EXIF data):
- amanhecer, manhã, meio-dia, tarde, entardecer, anoitecer, noite

**Landscapes:**
- praia, lago, penhasco, vale, montanha, vulcão, costa, floresta, selva, jardim, parque, campo, plantação, deserto, neve

**Urban:**
- cidade, rua, praça, calçadão, ponte, viaduto, casa, igreja, mesquita, castelo, palácio, arranha-céu

**Nature:**
- cachoeira, rio, oceano, céu, nuvens, aurora, arco-íris

**Animals:**
- cachorro, gato, pássaro, papagaio, pato, ganso, cisne, peixe, tartaruga, borboleta, abelha, aranha, lagarto, cobra, jacaré, elefante, zebra, girafa, hipopótamo, rinoceronte, urso, gorila, macaco, leão, tigre, leopardo

**Food & Drink:**
- pizza, hambúrguer, sanduíche, taco, burrito, sorvete, bolo, chocolate, café, vinho, cerveja, fruta, vegetais

**Vehicles:**
- carro, caminhão, moto, bicicleta, ônibus, trem, avião, helicóptero, barco, veleiro, lancha

**Objects:**
- livro, cadeira, mesa, sofá, cama, computador, telefone, câmera, relógio, óculos, bolsa, mochila, guitarra, piano, violão, microfone, tênis, bota, sandália

#### How It Works

1. Import photos into Zona21
2. AI automatically analyzes each photo in the background
3. Tags appear in asset metadata
4. Use tags for search and organization

### 2. Image Similarity

Find photos that look visually similar to a reference photo using AI-generated embeddings.

#### Use Cases

- **Find duplicates:** Locate near-identical shots
- **Find variations:** Discover similar compositions
- **Group sessions:** Cluster photos from same shoot
- **Explore alternatives:** Find photos with similar aesthetics

#### How It Works

1. Select a photo as reference
2. Request similar images (via API - UI coming soon)
3. Get ranked list of visually similar photos
4. Results scored by similarity (0.0 - 1.0)

### 3. Smart Culling

Automatically identify burst sequences and suggest the best photo from each group.

#### Scoring Criteria

- **Sharpness:** Prioritizes in-focus images
- **Position in burst:** Avoids first/last frames (often have motion blur)
- **Temporal centrality:** Prefers middle frames in sequence

#### How It Works

1. AI detects photo bursts (photos taken within seconds)
2. Analyzes each photo for technical quality
3. Compares visual similarity within group
4. Suggests best photo based on scoring algorithm

#### Parameters

- **Time threshold:** Max time between photos (default: 3 seconds)
- **Similarity threshold:** How similar photos must be (default: 0.85)
- **Volume/Path filters:** Limit to specific folders

### 4. Smart Rename

Generate meaningful filenames based on photo content and date.

#### Format

```
YYYY-MM-DD_tag1_tag2_tag3_001.ext
```

#### Examples

- `IMG_001.jpg` → `2024-01-20_praia_entardecer_001.jpg`
- `DSC_0042.jpg` → `2024-06-15_montanha_neve_paisagem_042.jpg`
- `photo.jpg` → `2024-12-25_festa_familia_001.jpg`

#### How It Works

1. Extracts date from EXIF metadata
2. Uses top 3 AI-generated tags
3. Preserves numeric sequence
4. Maintains original file extension
5. Suggests new filename (no automatic rename)

---

## Performance

### Processing Speed

- **Analysis per photo:** 1-3 seconds (CPU)
- **First launch:** ~5 minutes (model download)
- **Subsequent launches:** Instant (models cached)

### Resource Usage

- **Model size:** ~350MB (one-time download)
- **Additional RAM:** 200-400MB when active
- **Cache location:** `~/Library/Application Support/Zona21/cache/` (macOS)

### Optimization

- **Background processing:** AI runs in worker thread (non-blocking)
- **Low priority:** Doesn't interfere with browsing/editing
- **Batch processing:** Processes multiple photos efficiently
- **Smart scheduling:** Scans for new photos every 60 seconds

---

## Usage

### Checking AI Status

View processing progress in preferences or via console:

```javascript
const status = await window.electronAPI.aiGetStatus();
// Returns: {
//   total: 1000,        // Total photos
//   processed: 850,     // Already analyzed
//   pending: 150,       // Waiting in queue
//   withEmbeddings: 850 // Photos with AI data
// }
```

### Viewing Auto-Tags

Tags appear automatically in asset metadata after processing:

1. Select a photo
2. View metadata panel (right sidebar)
3. Check "Tags" field
4. Tags are searchable via search bar

### Finding Similar Photos

*Note: UI feature coming soon. Currently available via API:*

```javascript
const results = await window.electronAPI.aiFindSimilar(assetId, 10);
// Returns: {
//   success: true,
//   results: [
//     { assetId: "abc123", score: 0.95 },
//     { assetId: "def456", score: 0.89 },
//     ...
//   ]
// }
```

### Smart Culling Suggestions

*Note: UI feature coming soon. Currently available via API:*

```javascript
const result = await window.electronAPI.aiSmartCull({
  timeThresholdMs: 3000,
  similarityThreshold: 0.85
});
// Returns: {
//   success: true,
//   groups: [
//     {
//       id: "burst_1",
//       assetIds: ["photo1", "photo2", "photo3"],
//       suggestedBestId: "photo2",
//       scores: [
//         { assetId: "photo1", score: 0.72, reason: "slight blur" },
//         { assetId: "photo2", score: 0.95, reason: "sharp, centered" },
//         { assetId: "photo3", score: 0.68, reason: "motion blur" }
//       ]
//     }
//   ]
// }
```

### Smart Rename

*Note: UI feature coming soon. Currently available via API:*

```javascript
// Get suggestion
const result = await window.electronAPI.aiSmartRename(assetId);
// Returns: { success: true, suggestedName: "2024-01-20_praia_entardecer_001.jpg" }

// Apply rename
await window.electronAPI.aiApplyRename(assetId, newName);
```

---

## Privacy & Security

### Data Processing

- **100% Local:** All AI processing happens on your device
- **No Internet Required:** Works completely offline
- **No Cloud Upload:** Photos never sent to external servers
- **No Tracking:** AI doesn't phone home or send telemetry

### Data Storage

AI-generated data stored locally in SQLite database:

- **Embeddings:** Mathematical vectors (not viewable images)
- **Tags:** Plain text labels
- **Metadata:** Processing timestamps

### Model Security

- **Source:** Official HuggingFace model hub
- **Verification:** Models downloaded via secure HTTPS
- **Cache:** Stored in user data directory (OS-protected)

---

## Troubleshooting

### AI Not Processing Photos

**Check status:**
1. Open DevTools (View → Toggle Developer Tools)
2. Look for `[AI Manager]` logs
3. Check for errors or "disabled" status

**Common solutions:**
- Restart app to retry model download
- Check disk space (need ~500MB free for models)
- Verify cache directory exists and is writable

### Slow Processing

**Expected:** 1-3 seconds per photo on modern hardware

**If slower:**
- Close other heavy applications
- Check if computer is in power-saving mode
- Verify SSD has adequate free space
- Consider enabling GPU acceleration (future feature)

### Missing Tags

**Possible causes:**
- Photo still in processing queue (check status)
- Photo type not supported (only photos, not videos)
- AI disabled due to error (check logs)

**Solutions:**
- Wait for processing to complete
- Manually trigger rescan via preferences
- Check DevTools console for errors

### Model Download Failed

**Error:** "Failed to download AI models"

**Solutions:**
1. Check internet connection
2. Check firewall settings (allow Zona21)
3. Manually delete cache and retry:
   ```bash
   rm -rf ~/Library/Application\ Support/Zona21/cache/models
   ```
4. Restart Zona21

---

## Future Features

### Planned (v0.6.0+)

- [ ] **Face Detection:** Identify and cluster people
- [ ] **Face Recognition:** Name people and auto-tag
- [ ] **Semantic Search:** Search by natural language ("dog in park")
- [ ] **Advanced Clustering:** Group similar photos automatically
- [ ] **Quality Scoring:** Rate photo quality (exposure, composition)
- [ ] **Duplicate Detection:** Find exact and near-duplicates
- [ ] **UI Integration:** Visual smart culling interface
- [ ] **Batch Operations:** Apply AI actions to multiple photos

### Under Consideration

- [ ] GPU Acceleration (Metal, CUDA, DirectML)
- [ ] Custom Model Training (user-specific tags)
- [ ] Color Grading Suggestions
- [ ] Composition Analysis
- [ ] Subject Detection (identify main subject)

---

## FAQ

**Q: Does AI cost extra?**
A: No. AI features are free and included with Zona21.

**Q: Do I need internet?**
A: Only for first-time model download (~350MB). After that, fully offline.

**Q: Can I disable AI?**
A: Not yet, but it's low-impact. Will add preference in future update.

**Q: What languages are supported for tags?**
A: Currently Portuguese. English and other languages planned.

**Q: Can I add custom tags?**
A: AI tags are auto-generated. You can add manual tags separately.

**Q: Is AI processing mandatory?**
A: Yes, but it's low-priority background processing that won't slow down your workflow.

**Q: How accurate are AI tags?**
A: Generally 85-95% accurate for common subjects. Less accurate for abstract/artistic photos.

---

## Related Documentation

- [Performance Guide](../developer/performance.md)
- [AI Implementation (Developers)](../developer/ai-implementation.md)
- [Configuration Guide](./preferences.md)

---

**Last Updated:** January 30, 2026
**Version:** 0.4.9+
**Model:** google/vit-base-patch16-224
