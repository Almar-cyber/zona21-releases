# MediaHub - Plano de Tasks

## Status Geral
- **Implementado (v0.1)**: Core funcional entregue + export/copy + bento/lasso + filtros por tags/data
- **Próximo foco (v0.2/v0.3)**: Polimento visual (UI/UX), acessibilidade, consistência, refinamento de layout

## Produção (macOS) - Status

- **Auto-update**: feed publicado no R2 com `latest-mac.yml` + artefatos
- **Binários nativos**: hardening para app empacotado (ffmpeg/ffprobe) com paths em `app.asar.unpacked`
- **Robustez**: indexação/thumbnails com fallback para não quebrar UI

---

## Sprint 1 - Core UX (Prioridade: P0)
**Objetivo**: Melhorar experiência visual e interação básica
**Estimativa**: 1-2 semanas

### Task 1.1: Hover com zoom suave em AssetCard
- [x] **Status**: Concluído (v0.1)
- **Arquivo**: `src/components/AssetCard.tsx`
- **Descrição**: Ao passar o mouse sobre um card, ele deve aumentar suavemente de tamanho (scale 1.05-1.1) com transição CSS
- **Implementação**:
  - Adicionar `onMouseEnter`/`onMouseLeave` handlers
  - CSS transition com `transform: scale()` e `z-index` elevado
  - Garantir que não quebre o layout do grid (usar `position: relative` + `z-index`)
- **Critério de aceite**: Card aumenta suavemente no hover sem afetar cards vizinhos

### Task 1.2: Autoplay de vídeo no hover (mudo)
- [x] **Status**: Concluído (v0.1)
- **Arquivo**: `src/components/AssetCard.tsx`
- **Descrição**: Vídeos devem começar a tocar automaticamente (mudo) quando o mouse passa por cima
- **Implementação**:
  - Detectar se asset é vídeo (`mediaType === 'video'`)
  - No hover, trocar thumbnail por `<video>` element com `autoPlay muted loop`
  - Usar `mediahubfile://` protocol para servir o vídeo
  - Preload apenas no hover para não sobrecarregar
- **Dependências**: Pode precisar de fallback se vídeo não carregar rápido
- **Critério de aceite**: Vídeo toca silenciosamente no hover, para ao sair

### Task 1.3: Botão "Selecionar todos os visíveis"
- [x] **Status**: Concluído (v0.1)
- **Arquivos**: `src/components/Toolbar.tsx`, `src/App.tsx`
- **Descrição**: Botão na toolbar para selecionar todos os assets atualmente visíveis no grid
- **Implementação**:
  - Adicionar botão "Select All" na Toolbar
  - Handler `onSelectAll` que pega todos os IDs dos assets filtrados
  - Adicionar todos ao `trayAssetIds` state
  - Atalho de teclado: `Cmd/Ctrl + A`
- **Critério de aceite**: Clique seleciona todos visíveis, aparecem na SelectionTray

### Task 1.4: Drag-and-drop para importar pastas
- [x] **Status**: Concluído (v0.1)
- **Arquivos**: `src/App.tsx`, `src/components/Library.tsx`
- **Descrição**: Permitir arrastar pastas do Finder/Explorer para importar
- **Implementação**:
  - Adicionar `onDragOver`, `onDrop` handlers na área da Library
  - Usar `dataTransfer.items` para obter paths das pastas
  - Chamar `window.electronAPI.indexDirectory()` com o path
  - Visual feedback: overlay "Drop to import" durante drag
- **Nota**: Electron precisa de `webPreferences.enableRemoteModule` ou IPC para acessar paths
- **Critério de aceite**: Arrastar pasta do sistema inicia indexação

---

## Sprint 2 - Organização (Prioridade: P1)
**Objetivo**: Melhorar organização e filtragem de assets
**Estimativa**: 1-2 semanas

### Task 2.1: Agrupamento visual por data na Library
- [x] **Status**: Concluído (v0.1)
- **Arquivos**: `src/components/Library.tsx`, `src/App.tsx`
- **Descrição**: Assets agrupados visualmente por data com headers separadores
- **Implementação**:
  - Ordenar assets por `createdAt` ou `captureDate`
  - Inserir "section headers" entre grupos (dia/mês)
  - Adaptar virtualização para suportar items de altura variável (headers vs cards)
  - Considerar usar `VariableSizeList` do react-window
- **Complexidade**: Alta (requer mudança na estrutura do grid)
- **Critério de aceite**: Assets aparecem agrupados com headers de data

### Task 2.2: Filtro por data (hoje/semana/mês/ano)
- [x] **Status**: Concluído (v0.1)
- **Arquivos**: `src/components/Toolbar.tsx`, `src/App.tsx`, `electron/main/index.ts`
- **Descrição**: Dropdown na toolbar para filtrar por período de tempo
- **Implementação**:
  - Adicionar dropdown: "All time", "Today", "This week", "This month", "This year"
  - Passar filtro de data para query SQL
  - Backend: `WHERE created_at >= ? AND created_at <= ?`
- **Critério de aceite**: Filtrar por período funciona corretamente

### Task 2.3: Filtro por tags na Toolbar
- [x] **Status**: Concluído (v0.1)
- **Arquivos**: `src/components/Toolbar.tsx`, `src/App.tsx`, `electron/main/index.ts`
- **Descrição**: Dropdown ou multi-select para filtrar por tags existentes
- **Implementação**:
  - Backend: Query para listar todas as tags únicas
  - Frontend: Dropdown/combobox com tags disponíveis
  - Filtro: `WHERE tags LIKE '%tag%'` ou usar FTS5
- **Critério de aceite**: Selecionar tag filtra assets que a possuem

### Task 2.4: Seleção por área (lasso/rubber band)
- [x] **Status**: Concluído (v0.1)
- **Arquivo**: `src/components/Library.tsx`
- **Descrição**: Arrastar o mouse para desenhar retângulo e selecionar múltiplos assets
- **Implementação**:
  - Detectar mousedown + drag na área do grid (não em cards)
  - Desenhar retângulo de seleção (div com border)
  - Calcular quais cards estão dentro do retângulo
  - Adicionar IDs à seleção
  - Suportar Shift para adicionar à seleção existente
- **Complexidade**: Média-Alta (cálculo de intersecção com grid virtualizado)
- **Critério de aceite**: Arrastar seleciona múltiplos assets visualmente

---

## Sprint 3 - Visualização (Prioridade: P1)
**Objetivo**: Melhorar visualização detalhada de mídia
**Estimativa**: 1-2 semanas

### Task 3.1: Player de vídeo inline no Viewer
- [x] **Status**: Concluído (v0.1)
- **Arquivo**: `src/components/Viewer.tsx`
- **Descrição**: Vídeos devem ter player completo com controles no painel lateral
- **Implementação**:
  - Substituir thumbnail por `<video>` element para vídeos
  - Adicionar controles nativos ou custom (play/pause, seek, volume, fullscreen)
  - Usar `mediahubfile://` protocol para streaming
  - Considerar streaming progressivo para arquivos grandes
- **Critério de aceite**: Vídeo toca com controles funcionais no viewer

### Task 3.2: Zoom 100% em fotos no Viewer
- [x] **Status**: Concluído (v0.1)
- **Arquivo**: `src/components/Viewer.tsx`
- **Descrição**: Fotos devem poder ser visualizadas em tamanho real (100%) com pan
- **Implementação**:
  - Carregar imagem full-res via `mediahubfile://` (já funciona para RAW)
  - Adicionar controles de zoom (fit, 100%, 200%)
  - Implementar pan (arrastar para mover quando zoomado)
  - Scroll do mouse para zoom in/out
  - Double-click para toggle entre fit e 100%
- **Critério de aceite**: Foto pode ser vista em 100% com pan funcional

### Task 3.3: Busca por date range
- [x] **Status**: Concluído (v0.1)
- **Arquivos**: `src/components/Toolbar.tsx`, `electron/main/index.ts`
- **Descrição**: Campo de busca avançada com seleção de intervalo de datas
- **Implementação**:
  - Adicionar date picker (início/fim) na toolbar ou modal
  - Query SQL com range: `WHERE created_at BETWEEN ? AND ?`
  - Combinar com outros filtros existentes
- **Critério de aceite**: Buscar por intervalo específico de datas funciona

---

## Sprint 4 - IA Features (Prioridade: P3 - Opcional)
**Objetivo**: Automação inteligente com IA
**Estimativa**: 2-4 semanas

### Task 4.1: Integração IA para auto-tagging
- [ ] **Status**: Pendente
- **Arquivos**: `electron/main/ai-service.ts` (novo), `electron/main/indexer.ts`
- **Descrição**: Usar IA para sugerir tags automaticamente baseado no conteúdo visual
- **Implementação**:
  - Integrar com Ollama (local) ou OpenAI Vision API
  - Durante indexação, enviar thumbnail para análise
  - Receber sugestões de tags (objetos, cenas, cores)
  - Salvar como `suggestedTags` no asset
  - UI para aceitar/rejeitar sugestões
- **Opções de IA**:
  - Ollama + LLaVA (local, gratuito, ~4GB VRAM)
  - OpenAI GPT-4 Vision (cloud, pago, mais preciso)
  - Google Gemini Vision (cloud, free tier generoso)
- **Complexidade**: Alta
- **Critério de aceite**: Tags são sugeridas automaticamente com boa precisão

### Task 4.2: Busca semântica básica
- [ ] **Status**: Pendente
- **Arquivos**: `electron/main/ai-service.ts`, `electron/main/index.ts`
- **Descrição**: Buscar por descrição natural ("fotos com cachorro na praia")
- **Implementação**:
  - Gerar embeddings das imagens (CLIP ou similar)
  - Armazenar embeddings no SQLite (como BLOB) ou vector DB
  - Ao buscar, gerar embedding da query e comparar similaridade
  - Retornar assets mais similares
- **Opções**:
  - Ollama + CLIP embeddings
  - OpenAI text-embedding + image analysis
  - sqlite-vss para busca vetorial
- **Complexidade**: Muito Alta
- **Critério de aceite**: Busca natural retorna resultados relevantes

---

## Tasks Adicionais (Backlog)

### P2 - Nice to Have
- [x] **Download/export de arquivos selecionados** (Copy/Export com opções + progresso)
- [x] **Download de pasta como ZIP** (Export ZIP com progresso + cancelamento)
- [ ] **Histórico de buscas**
- [x] **Bento grid (masonry layout)**
- [ ] **Edição de metadados (data/localização)**
- [ ] **Backup automático de configurações**
- [x] **Detecção de duplicatas** (modal + IPC)

### P3 - Futuro
- [ ] **Renomeação inteligente com IA**
- [ ] **Agrupamento por conteúdo visual**
- [ ] **Face detection e grouping**
- [ ] **Transcrição de áudio em vídeos**
- [ ] **Colaboração (compartilhar seleções)**

---

## Como Usar Este Plano

1. **Escolha uma task** do Sprint atual
2. **Marque como "Em progresso"** alterando `[ ]` para `[x]`
3. **Implemente** seguindo as instruções
4. **Teste** conforme critério de aceite
5. **Marque como concluída** e passe para próxima

### Comandos úteis
```bash
# Rodar app em desenvolvimento
npm run electron:dev

# Rodar testes
npm test

# Build para produção
npm run electron:build
```

---

*Última atualização: 2026-01-22*

*Addendo: 2026-01-23 (produção/auto-update)*

---

## Roadmap v0.2 (UX/Polish) - Prioridade Alta

1) Consistência visual (spacings/typography) e microinterações (hover/focus/active)
2) Barra de ações da seleção (SelectionTray): layout, estados vazios, tooltips, atalhos
3) Viewer: controles mais claros (zoom mode, playback), estados de loading e erro
4) Acessibilidade: foco visível, navegação por teclado completa, contraste
5) Preferências/Config: pasta padrão de export, comportamento de seleção, idioma

## Roadmap v0.3 (Refino e Robustez)

1) Melhorias de performance e memória em bibliotecas grandes
2) Cancelamento e retry em operações longas (index/export/copy)
3) Logs/diagnóstico para suporte (exportar logs)
4) Pacote de build/release (electron-builder) com checklist de QA

---

## Roadmap v0.1.1 (Hotfix Produção)

1) Checklist de release macOS (assinatura/notarização + smoke tests)
2) Logs/diagnóstico exportáveis (arquivo em `userData` + botão "Exportar logs")
3) UX de erros consistente (mensagens amigáveis; sem stack trace)
4) Guardrails em indexação (retry/cancel/relatório de falhas por arquivo)
