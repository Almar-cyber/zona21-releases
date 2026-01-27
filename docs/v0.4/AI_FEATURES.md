# Funcionalidades de IA - Zona21 v0.4+

## Visão Geral

A Zona21 implementa processamento de IA **100% local** (on-device) usando Transformers.js com modelos CLIP e DETR. Isso garante:

- **Zero custo** de API por imagem
- **Privacidade total** - fotos nunca saem do computador
- **Funcionamento offline**

## Funcionalidades Implementadas

### 1. Auto-tagging (Classificação Automática)

Cada foto é automaticamente classificada em categorias usando o modelo CLIP.

**Categorias detectadas:**
- **Período do dia**: morning, afternoon, evening, night, sunset, sunrise, golden hour, blue hour
- **Ambiente**: indoor, outdoor
- **Paisagens**: landscape, nature, beach, mountain, forest, desert, snow, water, sky, clouds
- **Urbano**: city, street, architecture, building
- **Pessoas**: portrait, selfie, group photo, people
- **Animais**: animal, dog, cat, bird, wildlife
- **Eventos**: party, wedding, birthday, graduation, concert, sports, travel, vacation
- **Objetos**: food, drink, car, vehicle, flower, plant
- **Estilo**: macro, aerial, underwater, black and white, studio

**API IPC:**
- As tags são automaticamente adicionadas ao campo `tags` do asset

### 2. Busca Semântica

Busque fotos por descrição em linguagem natural usando embeddings CLIP.

**Exemplos de busca:**
- "dog playing in the beach"
- "sunset over mountains"
- "birthday party with children"

**API IPC:**
```typescript
// Busca semântica
const results = await window.electron.invoke('ai-semantic-search', query, limit);
// Retorna: { success: boolean, results: Array<{ assetId: string, score: number }> }
```

### 3. Similaridade de Imagens

Encontre fotos visualmente similares a uma foto de referência.

**API IPC:**
```typescript
// Encontrar similares
const results = await window.electron.invoke('ai-find-similar', assetId, limit);
// Retorna: { success: boolean, results: Array<{ assetId: string, score: number }> }
```

### 4. Detecção de Faces/Pessoas

Detecta automaticamente pessoas nas fotos usando o modelo DETR.

**Dados armazenados:**
- Bounding box (x, y, width, height)
- Confidence score
- ID da pessoa (para clustering futuro)

**API IPC:**
```typescript
// Faces de um asset
const result = await window.electron.invoke('ai-get-faces', assetId);
// Retorna: { success: boolean, faces: Array<{ x, y, width, height, confidence, person_id }> }

// Assets com faces
const result = await window.electron.invoke('ai-get-assets-with-faces', limit);
// Retorna: { success: boolean, assets: Array<{ id, file_name, face_count }> }

// Pessoas (clusters)
const result = await window.electron.invoke('ai-get-people');
// Retorna: { success: boolean, people: Array<{ id, name, face_count }> }

// Nomear pessoa
await window.electron.invoke('ai-name-person', personId, name);
```

### 5. Smart Culling

Detecta grupos de fotos em sequência (burst mode) e sugere a melhor de cada grupo.

**Critérios de scoring:**
- Quantidade de faces detectadas
- Posição no burst (evita extremos com motion blur)
- Centralidade temporal

**API IPC:**
```typescript
const result = await window.electron.invoke('ai-smart-cull', {
  timeThresholdMs: 3000,      // Intervalo máximo entre fotos do burst
  similarityThreshold: 0.85,   // Threshold de similaridade
  volumeUuid: 'optional',      // Filtrar por volume
  pathPrefix: 'optional'       // Filtrar por pasta
});
// Retorna: {
//   success: boolean,
//   groups: Array<{
//     id: string,
//     assetIds: string[],
//     suggestedBestId: string,
//     scores: Array<{ assetId, score, reason }>
//   }>
// }
```

### 6. Smart Rename

Gera nomes significativos para arquivos baseado em data e tags.

**Formato:** `YYYY-MM-DD_tag1_tag2_tag3_001.ext`

**Exemplo:** `IMG_001.jpg` → `2024-01-20_beach_sunset_vacation_001.jpg`

**API IPC:**
```typescript
// Sugestão para um asset
const result = await window.electron.invoke('ai-smart-rename', assetId);
// Retorna: { success: boolean, suggestedName: string }

// Sugestão para múltiplos (com numeração sequencial)
const results = await window.electron.invoke('ai-smart-rename-batch', assetIds);
// Retorna: Array<{ assetId, suggestedName }>

// Aplicar rename
await window.electron.invoke('ai-apply-rename', assetId, newName);
```

### 7. Status de Processamento

**API IPC:**
```typescript
const status = await window.electron.invoke('ai-get-status');
// Retorna: { total: number, processed: number, pending: number }
```

## Arquitetura

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
├─────────────────────────────────────────┤
│  ┌────────────────┐  ┌───────────────┐  │
│  │ Indexer Manager│──│  AI Manager   │  │
│  └────────┬───────┘  └───────┬───────┘  │
│           │                   │          │
│           │  New Assets       │ Queue    │
│           └──────────────────→│          │
│                               │          │
│                    ┌──────────▼──────┐   │
│                    │   AI Worker     │   │
│                    │  (Worker Thread)│   │
│                    │                 │   │
│                    │  ┌───────────┐  │   │
│                    │  │   CLIP    │  │   │
│                    │  │   DETR    │  │   │
│                    │  └───────────┘  │   │
│                    └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Performance

- **Tamanho do AI Worker**: ~3KB (modelos são externos)
- **Download de Modelos**: ~500MB (primeira execução, cacheado depois)
- **Análise por Imagem**: ~2-5s (CPU) / ~0.5-1s (GPU)
- **Memória Adicional**: ~200-500MB quando ativo

## Banco de Dados

### Tabela: assets (colunas de IA)
- `ai_embedding` BLOB - Vetor de características CLIP (512 floats)
- `ai_processed_at` INTEGER - Timestamp do processamento

### Tabela: faces
- `id` TEXT PRIMARY KEY
- `asset_id` TEXT - FK para assets
- `bbox_x`, `bbox_y`, `bbox_width`, `bbox_height` REAL - Bounding box
- `confidence` REAL - Score de confiança
- `embedding` BLOB - Embedding facial (futuro)
- `person_id` TEXT - FK para people

### Tabela: people
- `id` TEXT PRIMARY KEY
- `name` TEXT - Nome da pessoa (definido pelo usuário)
- `face_count` INTEGER - Quantidade de faces no cluster
