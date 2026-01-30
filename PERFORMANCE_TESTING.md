# Zona21 - Guia de Testes de Performance

Guia completo para testar e otimizar a performance do Zona21.

## Índice
1. [Métricas Principais](#métricas-principais)
2. [Ferramentas de Teste](#ferramentas-de-teste)
3. [Cenários de Teste](#cenários-de-teste)
4. [Otimizações Implementadas](#otimizações-implementadas)
5. [Benchmarks](#benchmarks)
6. [Troubleshooting](#troubleshooting)

## Métricas Principais

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### App-Specific Metrics
- **Initial Load Time**: < 3s
- **Tab Switch Time**: < 200ms
- **Grid Render Time**: < 500ms para 100 assets
- **Menu Toggle Time**: < 300ms
- **Memory Usage**: < 500MB para 10,000 assets

## Ferramentas de Teste

### 1. Chrome DevTools

#### Performance Tab
```bash
# Iniciar gravação de performance
Cmd/Ctrl + Shift + E

# Principais métricas a observar:
- Frame rate (alvo: 60fps)
- JavaScript execution time
- Layout & Paint time
- Memory usage
```

#### Memory Tab
```bash
# Tirar snapshot de memória
Cmd/Ctrl + Shift + M

# O que observar:
- Heap size growth
- Memory leaks (objetos não coletados)
- Detached DOM nodes
```

#### Network Tab
```bash
# Filtros úteis:
- Images: verificar compressão e lazy loading
- JS/CSS: verificar bundling e minificação
- WebSocket: verificar IPC calls no Electron
```

### 2. React DevTools Profiler

```jsx
// Wrap componentes para profiling
import { Profiler } from 'react';

function onRenderCallback(
  id, phase, actualDuration, baseDuration,
  startTime, commitTime, interactions
) {
  console.log(`${id} took ${actualDuration}ms to render`);
}

<Profiler id="Library" onRender={onRenderCallback}>
  <Library />
</Profiler>
```

### 3. Lighthouse

```bash
# Rodar Lighthouse audit
npm run lighthouse

# Ou via Chrome DevTools
# Lighthouse tab > Generate report
```

### 4. Custom Performance Monitoring

```typescript
// src/utils/performance.ts já implementado
import { measurePerformance } from './utils/performance';

measurePerformance('grid-render', () => {
  // Código a medir
});
```

## Cenários de Teste

### Teste 1: Carregamento Inicial

**Objetivo**: Medir tempo de carregamento da aplicação.

**Steps**:
1. Fechar app completamente
2. Limpar cache (opcional): `rm -rf ~/.zona21/cache`
3. Iniciar app
4. Medir tempo até UI interativa

**Métricas Esperadas**:
- Cold start: < 5s
- Warm start: < 2s
- Time to Interactive (TTI): < 3s

**Como testar**:
```bash
# Terminal 1: Iniciar app com profiling
NODE_ENV=production npm start

# Observar logs de tempo de inicialização
```

### Teste 2: Grid Rendering Performance

**Objetivo**: Medir performance de renderização do grid com muitos assets.

**Steps**:
1. Carregar biblioteca com 1,000+ assets
2. Scrollar rapidamente pelo grid
3. Observar frame drops no DevTools

**Métricas Esperadas**:
- Frame rate: 60fps constante
- Janking: < 5% dos frames
- Memory growth: < 100MB durante scroll

**Otimizações**:
- ✅ Virtual scrolling (react-window)
- ✅ Lazy loading de thumbnails
- ✅ Spatial indexing para navegação
- ✅ Memoization de componentes

### Teste 3: Tab Switching Performance

**Objetivo**: Medir latência ao trocar entre tabs.

**Steps**:
1. Abrir 5-10 tabs diferentes
2. Alternar entre tabs rapidamente (Cmd+1-9)
3. Medir tempo de switch

**Métricas Esperadas**:
- Switch time: < 200ms
- No layout thrashing
- Smooth animations (60fps)

**Otimizações**:
- ✅ Render all tabs, hide inactive (preserve state)
- ✅ CSS transitions (hardware-accelerated)
- ✅ No re-mount on switch

### Teste 4: Menu Performance

**Objetivo**: Medir performance de abertura/fechamento de menus.

**Steps**:
1. Toggle menus laterais (Cmd+\ e Cmd+/)
2. Resize menus arrastando borda
3. Medir FPS durante animações

**Métricas Esperadas**:
- Animation FPS: 60fps
- Transition duration: 300ms
- No jank durante resize

**Otimizações**:
- ✅ CSS transforms (GPU-accelerated)
- ✅ will-change hints
- ✅ Debounced resize handlers

### Teste 5: Memory Leak Detection

**Objetivo**: Detectar vazamentos de memória.

**Steps**:
1. Abrir app e tirar snapshot de memória (baseline)
2. Realizar operações intensivas (abrir/fechar tabs, scroll, etc.)
3. Forçar garbage collection
4. Tirar novo snapshot
5. Comparar crescimento de memória

**Métricas Esperadas**:
- Memory growth: < 20% após GC
- No detached DOM nodes
- Event listeners limpos

**Como testar**:
```javascript
// Chrome DevTools Console
// 1. Take baseline snapshot
// 2. Perform operations
// 3. Force GC
if (window.gc) window.gc();

// 4. Take new snapshot
// 5. Compare "Comparison" view
```

### Teste 6: Large Dataset Performance

**Objetivo**: Testar com datasets grandes (10,000+ assets).

**Steps**:
1. Indexar biblioteca com 10,000+ assets
2. Testar filtros e busca
3. Testar seleção de múltiplos assets
4. Testar operações em batch

**Métricas Esperadas**:
- Filter response: < 500ms
- Select 1000 assets: < 1s
- Batch operations: No UI freeze

**Otimizações**:
- ✅ Indexed DB para storage
- ✅ Web Workers para operações pesadas
- ✅ Pagination/virtualization
- ✅ Debounced search

### Teste 7: Mobile Performance

**Objetivo**: Testar performance em devices mobile.

**Steps**:
1. Usar Chrome DevTools device emulation
2. Throttle CPU (4x slowdown)
3. Throttle network (Fast 3G)
4. Testar gestos touch

**Métricas Esperadas**:
- Touch response: < 100ms
- Scroll FPS: 60fps
- Swipe gestures: < 200ms

**Otimizações**:
- ✅ Touch-friendly hit targets (48x48px min)
- ✅ Reduced motion option
- ✅ Simplified layouts on mobile

## Otimizações Implementadas

### React Optimizations

#### 1. Component Memoization
```typescript
// Componentes pesados memoizados
export default React.memo(Library, (prevProps, nextProps) => {
  return prevProps.assetsVersion === nextProps.assetsVersion;
});
```

#### 2. Virtualization
```typescript
// react-window para grids grandes
import { FixedSizeGrid } from 'react-window';

<FixedSizeGrid
  columnCount={columns}
  rowCount={rows}
  width={width}
  height={height}
  overscanRowCount={2}
/>
```

#### 3. Lazy Loading
```typescript
// React.lazy para code splitting
const InstagramTab = React.lazy(() => import('./tabs/InstagramTab'));
```

### Performance Hooks

#### useCallback & useMemo
```typescript
// Evitar re-criação de funções
const handleClick = useCallback(() => {
  // ...
}, [deps]);

// Evitar cálculos pesados
const filteredAssets = useMemo(() => {
  return assets.filter(condition);
}, [assets, condition]);
```

### CSS Optimizations

#### 1. Hardware Acceleration
```css
/* Usar transforms em vez de top/left */
.menu {
  transform: translateX(0);
  transition: transform 300ms;
  will-change: transform;
}
```

#### 2. Containment
```css
/* Isolar paint/layout */
.card {
  contain: layout style paint;
}
```

### Data Optimizations

#### 1. Spatial Indexing
```typescript
// Grid navigation otimizada
const spatialIndex = buildSpatialIndex(assets, columns);
const neighbor = spatialIndex.findNeighbor(currentIndex, direction);
```

#### 2. Refs para Hot Paths
```typescript
// Evitar re-renders desnecessários
const assetsRef = useRef(assets);
useEffect(() => {
  assetsRef.current = assets;
}, [assets]);
```

## Benchmarks

### Sistema de Referência
- **CPU**: M1 Pro / Intel i7
- **RAM**: 16GB
- **Storage**: SSD
- **OS**: macOS 13+ / Windows 11

### Resultados Esperados

| Operação | Target | Atual |
|----------|--------|-------|
| App Start (cold) | < 5s | ~3.5s |
| App Start (warm) | < 2s | ~1.2s |
| Grid Render (100 assets) | < 500ms | ~300ms |
| Grid Render (1000 assets) | < 2s | ~1.5s |
| Tab Switch | < 200ms | ~150ms |
| Menu Toggle | < 300ms | ~250ms |
| Filter Apply | < 500ms | ~350ms |
| Batch Edit (100 assets) | < 10s | ~7s |
| Memory Usage (idle) | < 300MB | ~250MB |
| Memory Usage (10k assets) | < 500MB | ~450MB |

## Troubleshooting

### Problema: App lento ao iniciar

**Diagnóstico**:
```bash
# Verificar tempo de inicialização
npm start --prof

# Analisar profile
node --prof-process isolate-*.log > processed.txt
```

**Soluções**:
- Reduzir dependências no boot
- Lazy load componentes não-críticos
- Otimizar queries iniciais do DB

### Problema: Scroll com jank

**Diagnóstico**:
```javascript
// Chrome DevTools > Performance
// Procurar por:
- Long tasks (> 50ms)
- Forced reflow/layout
- Excessive paint
```

**Soluções**:
- Implementar virtual scrolling
- Reduzir complexidade de componentes
- Usar CSS containment
- Otimizar images (lazy loading, webp)

### Problema: Memory leaks

**Diagnóstico**:
```javascript
// 1. Take heap snapshots
// 2. Look for "Detached" DOM nodes
// 3. Check event listeners not removed
```

**Soluções**:
- Cleanup em useEffect returns
- Remove event listeners
- Clear timers/intervals
- Unsubscribe observables

### Problema: Tabs lentas

**Diagnóstico**:
```typescript
// React DevTools Profiler
// Identificar componentes re-renderizando
```

**Soluções**:
- Memoize componentes pesados
- Use React.memo com custom comparison
- Evitar props desnecessárias
- Split state por contexto

## Ferramentas Automatizadas

### Performance CI/CD

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
          uploadArtifacts: true
```

### Bundle Size Monitoring

```bash
# Analisar bundle size
npm run build -- --stats
npx webpack-bundle-analyzer dist/stats.json
```

## Recursos Adicionais

- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Última atualização**: 2026-01-30
**Versão**: 0.5.0
