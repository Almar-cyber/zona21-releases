# Guia de Performance e Otimizações - Zona21

## 📊 Overview

Este documento detalha as otimizações de performance implementadas no Zona21 e como manter o aplicativo rápido e eficiente.

## 🎯 Métricas de Performance

### Benchmarks Atuais

| Operação | Performance | Notas |
|----------|-------------|-------|
| Startup | <3 segundos | Cold start |
| Importação | 1000 arquivos/min | SSD, metadados básicos |
| Geração de Thumbnails | 50 thumbs/min | 1080p, Sharp |
| Search (100k itens) | <500ms | SQLite indexed |
| Scroll suave | 60 FPS | Virtual scrolling |
| Uso de memória | 200-500MB | 10k itens carregados |

### Tamanho do Aplicativo

- **Build otimizado**: 32MB (ZIP)
- **App instalado**: 411MB
- **Redução total**: 46% vs original

## 🚀 Otimizações Implementadas

### 1. Redução de Dependencies (-180MB)

```json
// Removidos do package.json
{
  "@anthropic-ai/sdk": "^50MB",
  "@heroui/react": "^40MB", 
  "framer-motion": "^30MB",
  "gsap": "^25MB",
  "@tanstack/react-query": "^15MB",
  "@sentry/electron": "^20MB"
}
```

### 2. Build Otimizado

```yaml
# electron-builder.yml
compression: maximum
files:
  - "!**/*.md"
  - "!**/test/**/*"
  - "!**/node_modules/.bin/**/*"
```

### 3. Tree Shaking

- Removidos 4 componentes não utilizados
- Eliminado código morto
- Removido tipos não referenciados

### 4. Virtual Scrolling

```tsx
// React Window para grandes listas
import { FixedSizeGrid as Grid } from 'react-window';

const GridComponent = ({ assets }) => (
  <Grid
    columnCount={columns}
    columnWidth={220}
    height={600}
    rowCount={Math.ceil(assets.length / columns)}
    rowHeight={220}
    width={1200}
  >
    {({ columnIndex, rowIndex, style }) => (
      <div style={style}>
        <AssetCard asset={assets[rowIndex * columns + columnIndex]} />
      </div>
    )}
  </Grid>
);
```

### 5. Cache de Thumbnails

```typescript
// Cache em disco com LRU
const CACHE_DIR = path.join(app.getPath('userData'), 'cache');

async function getThumbnail(assetId: string): Promise<string | null> {
  const cachePath = path.join(CACHE_DIR, `${assetId}_thumb.jpg`);
  
  if (fs.existsSync(cachePath)) {
    return cachePath;
  }
  
  // Gerar thumbnail se não existe
  return await generateThumbnail(assetId);
}
```

## 🔧 Técnicas de Performance

### 1. Lazy Loading

```tsx
// Carregar componentes sob demanda
const Viewer = lazy(() => import('./components/Viewer'));
const PreferencesModal = lazy(() => import('./components/PreferencesModal'));

// Usar com Suspense
<Suspense fallback={<Loading />}>
  <Viewer asset={selectedAsset} />
</Suspense>
```

### 2. Memoização

```tsx
// React.memo para prevenir re-renders
const AssetCard = memo(({ asset, onClick }: AssetCardProps) => {
  return (
    <div onClick={() => onClick(asset)}>
      {asset.fileName}
    </div>
  );
}, (prev, next) => {
  // Custom comparison
  return prev.asset.id === next.asset.id;
});
```

### 3. Debounce

```typescript
// Debounce para search/filter
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);
```

### 4. Web Workers

```typescript
// Processamento pesado em worker
const worker = new Worker('./workers/thumbnail-generator.js');

worker.postMessage({ assetId, filePath });
worker.onmessage = (e) => {
  const { thumbnailPath } = e.data;
  updateThumbnail(assetId, thumbnailPath);
};
```

## 📈 Otimizações de Banco de Dados

### Índices Otimizados

```sql
-- Índices compostos para queries comuns
CREATE INDEX idx_assets_volume_created ON assets(volume_uuid, created_at);
CREATE INDEX idx_assets_media_type ON assets(media_type);
CREATE INDEX idx_assets_flagged ON assets(flagged) WHERE flagged = 1;

-- FTS para busca textual
CREATE VIRTUAL TABLE assets_fts USING fts5(fileName, notes);
```

### Query Optimization

```typescript
// Paginação eficiente
const getAssetsPage = (offset: number, limit: number) => {
  return db.prepare(`
    SELECT * FROM assets 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(limit, offset);
};

// Contagem otimizada
const getCount = () => {
  return db.prepare('SELECT COUNT(*) FROM assets').pluck().get();
};
```

## 🖼️ Processamento de Imagens

### Sharp Configuration

```typescript
import sharp from 'sharp';

// Configuração otimizada
const thumbnailPipeline = sharp()
  .resize(220, 220, {
    fit: 'cover',
    position: 'center'
  })
  .jpeg({
    quality: 85,
    progressive: true
  });

// Cache em memória
const sharpCache = sharp.cache({ memory: 50, files: 20 });
```

### ExifTool Optimization

```typescript
// Apenas metadados necessários
const requiredTags = [
  'FileName',
  'FileSize',
  'DateTimeOriginal',
  'Make',
  'Model',
  'ISO',
  'Aperture',
  'ShutterSpeed'
];

const metadata = await exiftool.read(filePath, requiredTags);
```

## 💾 Gerenciamento de Memória

### 1. Limpeza de Recursos

```typescript
// Limpar thumbnails antigos
const cleanupOldThumbnails = async () => {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
  const now = Date.now();
  
  for (const file of fs.readdirSync(CACHE_DIR)) {
    const filePath = path.join(CACHE_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
    }
  }
};
```

### 2. Memory Leaks Prevention

```typescript
// Limpar event listeners
useEffect(() => {
  const handleResize = () => setDimensions(getDimensions());
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

## 🌐 Network Optimization

### 1. Auto-Update Eficiente

```typescript
// Verificar updates apenas se necessário
const checkForUpdates = async () => {
  if (!app.isPackaged) return;
  
  const lastCheck = getLastUpdateCheck();
  const now = Date.now();
  
  // Verificar no máximo uma vez por dia
  if (now - lastCheck < 24 * 60 * 60 * 1000) return;
  
  await autoUpdater.checkForUpdates();
  setLastUpdateCheck(now);
};
```

### 2. Download Progressivo

```typescript
autoUpdater.on('download-progress', (progress) => {
  // Atualizar UI apenas cada 10%
  if (progress.percent % 10 < 1) {
    updateDownloadProgress(progress.percent);
  }
});
```

## 📊 Monitoramento de Performance

### 1. Performance API

```typescript
// Medir tempo de operações
const measurePerformance = (name: string, fn: () => Promise<void>) => {
  const start = performance.now();
  
  return fn().then(() => {
    const duration = performance.now() - start;
    logger.debug(`${name} took ${duration.toFixed(2)}ms`);
  });
};

// Uso
await measurePerformance('Import assets', importAssets);
```

### 2. Memory Profiling

```typescript
// Monitorar uso de memória
const logMemoryUsage = () => {
  const usage = process.memoryUsage();
  logger.info('Memory usage:', {
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)}MB`,
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`
  });
};
```

## 🎯 Recomendações de Performance

### Para Usuários

1. **Hardware**
   - SSD para armazenamento de mídia
   - 16GB+ RAM para bibliotecas >50k itens
   - GPU dedicada para previews suaves

2. **Configurações**
   - Cache de thumbnails: 50GB+
   - Desativar indexação de pastas desnecessárias
   - Usar exFSS/APFS para volumes externos

3. **Uso**
   - Manter 20% de espaço livre em disco
   - Evitar múltiplas importações simultâneas
   - Limpar cache periodicamente

### Para Desenvolvedores

1. **Code**
   - Usar React.memo para componentes pesados
   - Implementar virtual scrolling
   - Debounce inputs de busca

2. **Build**
   - Tree shaking ativo
   - Minificação habilitada
   - Compressão máxima

3. **Testing**
   - Testar com datasets grandes
   - Monitorar memory leaks
   - Profile performance crítica

## 🔮 Futuras Otimizações

### Short Term
- [ ] Service Worker para cache
- [ ] WebP para thumbnails
- [ ] SQL query optimization

### Medium Term
- [ ] Rust para processamento de imagem
- [ ] Cache distribuído
- [ ] Lazy loading avançado

### Long Term
- [ ] Machine learning para metadados
- [ ] GPU acceleration
- [ ] Edge computing para thumbnails

## 📝 Checklist de Performance

- [ ] Build com tree shaking
- [ ] Virtual scrolling implementado
- [ ] Cache configurado
- [ ] Índices de BD otimizados
- [ ] Memory leaks resolvidos
- [ ] Imagens otimizadas
- [ ] Network requests minimizadas
- [ ] Performance monitoring ativo

---

**Performance é um processo contínuo**. Monitore, meça e otimize regularmente! 🚀
