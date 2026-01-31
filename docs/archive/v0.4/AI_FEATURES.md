# Funcionalidades de IA - Zona21 v0.4+

## Visão Geral

A Zona21 implementa processamento de IA **100% local** (on-device) usando Transformers.js com modelo ViT (Vision Transformer). Isso garante:

- **Zero custo** de API por imagem
- **Privacidade total** - fotos nunca saem do computador
- **Funcionamento offline**

## Funcionalidades Implementadas

### 1. Auto-tagging (Classificação Automática)

Cada foto é automaticamente classificada usando o modelo ViT (google/vit-base-patch16-224).

**Categorias detectadas (tags em português):**
- **Período do dia** (via EXIF): amanhecer, manhã, meio-dia, tarde, entardecer, anoitecer, noite
- **Paisagens**: praia, lago, penhasco, vale, montanha, vulcão, costa, floresta, selva, jardim, parque, campo, plantação, deserto, neve
- **Urbano**: cidade, rua, praça, calçadão, ponte, viaduto, casa, igreja, mesquita, castelo, palácio, arranha-céu
- **Natureza**: cachoeira, rio, oceano, céu, nuvens, aurora, arco-íris
- **Animais**: cachorro, gato, pássaro, papagaio, pato, ganso, cisne, peixe, tartaruga, borboleta, abelha, aranha, lagarto, cobra, jacaré, elefante, zebra, girafa, hipopótamo, rinoceronte, urso, gorila, macaco, leão, tigre, leopardo
- **Comida e bebida**: pizza, hambúrguer, sanduíche, taco, burrito, sorvete, bolo, chocolate, café, vinho, cerveja, fruta, vegetais
- **Veículos**: carro, caminhão, moto, bicicleta, ônibus, trem, avião, helicóptero, barco, veleiro, lancha
- **Objetos**: livro, cadeira, mesa, sofá, cama, computador, telefone, câmera, relógio, óculos, bolsa, mochila, guitarra, piano, violino, microfone, tênis, bota, sandália

**API IPC:**
- As tags são automaticamente adicionadas ao campo `tags` do asset

### 2. Similaridade de Imagens

Encontre fotos visualmente similares a uma foto de referência usando embeddings ViT.

**API IPC:**
```typescript
// Encontrar similares
const results = await window.electronAPI.aiFindSimilar(assetId, limit);
// Retorna: { success: boolean, results: Array<{ assetId: string, score: number }> }
```

### 3. Smart Culling

Detecta grupos de fotos em sequência (burst mode) e sugere a melhor de cada grupo.

**Critérios de scoring:**
- Sharpness (nitidez da imagem)
- Posição no burst (evita extremos com motion blur)
- Centralidade temporal

**API IPC:**
```typescript
const result = await window.electronAPI.aiSmartCull({
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

### 4. Smart Rename

Gera nomes significativos para arquivos baseado em data e tags.

**Formato:** `YYYY-MM-DD_tag1_tag2_tag3_001.ext`

**Exemplo:** `IMG_001.jpg` → `2024-01-20_praia_entardecer_001.jpg`

**API IPC:**
```typescript
// Sugestão para um asset
const result = await window.electronAPI.aiSmartRename(assetId);
// Retorna: { success: boolean, suggestedName: string }

// Aplicar rename
await window.electronAPI.aiApplyRename(assetId, newName);
```

### 5. Status de Processamento

**API IPC:**
```typescript
const status = await window.electronAPI.aiGetStatus();
// Retorna: { total: number, processed: number, pending: number, withEmbeddings: number }
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
│                    │  │    ViT    │  │   │
│                    │  └───────────┘  │   │
│                    └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Performance

- **Modelo ViT**: ~350MB (download na primeira execução, cacheado depois)
- **Análise por Imagem**: ~1-3s (CPU)
- **Memória Adicional**: ~200-400MB quando ativo

## Banco de Dados

### Tabela: assets (colunas de IA)
- `ai_embedding` BLOB - Vetor de características ViT (768 floats)
- `ai_processed_at` INTEGER - Timestamp do processamento
- `tags` TEXT - Tags geradas automaticamente (JSON array)
