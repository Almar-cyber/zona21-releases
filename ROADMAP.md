# 🗺️ Roadmap - Zona21

## 📋 Visão Geral

O Zona21 é uma plataforma profissional de gerenciamento de mídia (foto/vídeo) para macOS. Este documento traça o plano de desenvolvimento para v1.0.

---

## 🎯 Status Atual (v0.5.0)

### ✅ Funcionalidades Completas

| Categoria | Features |
|-----------|----------|
| **Importação** | Indexação em massa, múltiplos volumes, File Watcher |
| **Visualização** | Grid Masonry, Fullscreen Viewer, Virtual Scrolling |
| **Seleção** | Lasso, Range, Multi-select, Selection Tray |
| **Edição** | Quick Edit, Video Trim, Batch Edit, Ratings, Color Labels |
| **Organização** | Coleções, Tags, Smart Collections, Duplicatas |
| **Exportação** | ZIP, Lightroom XMP, Premiere XML |
| **IA** | Smart Culling, Auto-tagging (290+ categorias), Face Detection |
| **UX** | Command Palette, Keyboard Shortcuts, Tabs System |

### 📊 Métricas

| Métrica | Valor |
|---------|-------|
| **Bundle** | 32MB (ZIP), 411MB instalado |
| **Startup** | <3.5s cold, <1.2s warm |
| **Performance** | 1000 arquivos/min indexação |
| **Memória** | 250MB idle, ~450MB com 10k assets |
| **Plataforma** | macOS arm64 |

---

## 🚀 Caminho para v1.0

### v0.5.x - Estabilização ✅ (Fev 2026)

#### ✅ Concluído
- [x] Remover Instagram (foco em core features)
- [x] Grid Masonry sem buracos (CSS Columns)
- [x] Resolver TODOs críticos (refresh após edição)
- [x] Sistema de eventos (zona21-toast, zona21-refresh-assets)
- [x] Refatorar App.tsx (2551 → 957 linhas, -62%)
- [x] Sincronizar documentação (README, CHANGELOG)
- [x] E2E tests com Playwright (34 testes)

#### 📦 Arquitetura Refatorada
- `useAssetMarking` - Sistema de marcação
- `useAssetPagination` - Paginação e lazy loading
- `useSpatialNavigation` - Navegação por teclado
- `useExportHandlers` - Handlers de exportação
- `useMoveAssets` - Lógica de mover arquivos
- `useReviewModal` - Modal de revisão
- `useIndexingProgress` - Progresso de indexação
- `createAppCommands` - Comandos do Command Palette

### v0.6.x - Qualidade 🔄 (Fev-Mar 2026)

#### Testes
- [x] E2E tests com Playwright (34 testes)
- [x] Component tests para UI principal (63 testes)
- [ ] Integration tests para IPC handlers
- [ ] Stress test com 10k+ assets

#### Performance
- [ ] Lazy loading de imagens otimizado
- [ ] WebP para thumbnails
- [ ] Database query optimization
- [ ] Memory profiling

### v0.7.x - Multiplataforma (Mar 2026)

#### Windows
- [ ] Build MSIX para Windows Store
- [ ] Build NSIS para auto-update
- [ ] Testes de compatibilidade
- [ ] Ajustes de path handling

#### Linux
- [ ] Build AppImage
- [ ] Testes em Ubuntu 22.04+
- [ ] Testes em Fedora 38+

### v0.8.x - Polish (Mar-Abr 2026)

#### UX
- [ ] Animações e transições suaves
- [ ] Loading states completos
- [ ] Error messages amigáveis
- [ ] Empty states ilustrados

#### Accessibility
- [ ] WCAG AA compliance
- [ ] ARIA labels completos
- [ ] Keyboard navigation 100%
- [ ] Screen reader support

### v0.9.x - Release Candidate (Abr 2026)

#### QA Final
- [ ] Beta testing com 100+ usuários
- [ ] Bug fixes críticos
- [ ] Performance final tuning
- [ ] Documentation review

---

## 🎯 v1.0.0 - Production Ready (Mai 2026)

### Requisitos para Release

#### Obrigatórios
- ✅ Core features estáveis
- ⬜ Multiplataforma (macOS, Windows, Linux)
- ⬜ Testes >80% cobertura
- ⬜ Documentação completa
- ⬜ Performance dentro dos targets

#### Desejáveis
- ⬜ Windows Store publicado
- ⬜ macOS App Store (consideração)
- ⬜ Onboarding video
- ⬜ Landing page final

---

## 🔮 Post-v1.0 (Backlog)

### Features para Considerar

| Feature | Prioridade | Notas |
|---------|------------|-------|
| Instagram Integration | Alta | Reimplementar após v1.0 |
| Mobile Companion | Média | iOS/Android para preview |
| Cloud Sync | Média | Sincronização entre dispositivos |
| Plugin System | Baixa | API para extensões |
| Video Editing Avançado | Baixa | Transcoding, efeitos |
| HDR/3D Support | Baixa | Formatos especiais |

### Infraestrutura

- [ ] Telemetry opt-in (Sentry)
- [ ] Analytics dashboard
- [ ] Crash reporting
- [ ] Feature flags

---

## 📅 Timeline Estimada

```
v0.5.0 ████████░░░░░░░░ Estabilização   (✅ completo)
v0.6.0 ░░░░░░░░████░░░░ Qualidade       (🔄 em progresso)
v0.7.0 ░░░░░░░░░░░░████ Multiplataforma (+4 sem)
v0.8.0 ░░░░░░░░░░░░░░██ Polish          (+6 sem)
v0.9.0 ░░░░░░░░░░░░░░░█ RC              (+8 sem)
v1.0.0 ░░░░░░░░░░░░░░░█ Release         (+10 sem)
       ──────────────────────────────────────
       Fev        Mar        Abr        Mai
```

---

## 📈 Progresso de Testes

| Tipo | Quantidade | Cobertura |
|------|------------|-----------|
| Unit tests | 12 arquivos | ~45% |
| E2E tests | 34 testes | UI principal |
| Component tests | 63 testes (7 arquivos) | Componentes core |
| Integration tests | 0 | Pendente |

**Componentes testados:**
- EmptyState, ToastHost, Kbd, Tooltip, ConfirmDialog
- LoadingSkeleton, SelectionTray

**Total: 157 testes**

**Meta v1.0:** >80% cobertura total

---

*Última atualização: 05 Fevereiro 2026*
