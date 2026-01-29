# Smart Culling Sidebar - Documentação

## 📋 Visão Geral

O **Smart Culling Sidebar** é uma funcionalidade implementada no Zona21 que expõe insights da IA durante o processo de culling de fotos. O sidebar aparece no Viewer e mostra informações sobre qualidade, tags detectadas e fotos similares.

## 🎯 Objetivo

Implementar a feature #3 do Roadmap (Sprint 2 - RICE 37):
- Expor o valor da IA que já existe no sistema
- Ajudar o usuário a tomar decisões baseadas em dados objetivos
- Reduzir tempo de indecisão durante o culling

## 🚀 Funcionalidades Implementadas

### 1. Indicadores de Qualidade

Baseados nos dados disponíveis no sistema:

- **Tags IA**: Mostra quantas tags foram detectadas pela IA
- **Possíveis Problemas**: Detecta tags relacionadas a qualidade (blur, escuro, etc.)
- **Qualidade do Arquivo**: Baseia-se no tamanho do arquivo (MB)
  - \> 5 MB = Boa qualidade (verde)
  - 2-5 MB = Média qualidade (amarelo)
  - < 2 MB = Baixa qualidade (laranja)
- **Resolução**: Mostra megapixels da foto
  - \> 12 MP = Boa qualidade (verde)
  - ≤ 12 MP = Média qualidade (amarelo)

### 2. Tags Detectadas

Mostra todas as tags geradas automaticamente pelo modelo ViT:
- Objetos detectados (cachorro, gato, carro, etc.)
- Cenários (praia, cidade, montanha, etc.)
- Período do dia (manhã, tarde, noite, etc.)
- Tradução automática para português

### 3. Fotos Similares

Busca e exibe até 6 fotos similares usando:
- **Algoritmo**: Distância cosseno entre embeddings ViT (768 dimensões)
- **Visualização**: Thumbnails com score de similaridade
- **Score Color-Coded**:
  - Verde (< 75%): Fotos diferentes
  - Amarelo (75-90%): Fotos similares
  - Vermelho (> 90%): Possíveis duplicatas
- **Warning**: Alerta visual para fotos muito similares (> 90%)

### 4. Ações Rápidas

Botões para:
- **Aprovar**: Marca foto como aprovada (TODO: integrar com sistema de rating)
- **Rejeitar**: Marca foto como rejeitada (TODO: integrar com sistema de reject)

### 5. Interface e Usabilidade

- **Toggle Button**: Botão no header do Viewer (ícone de estrela)
  - Ativo (roxo) quando sidebar está visível
  - Inativo (cinza) quando sidebar está oculto
- **Keyboard Shortcut**: Tecla `S` para toggle rápido
  - Funciona apenas quando não está em input/textarea
  - Apenas para fotos (não vídeos)
- **Responsive**: Sidebar de 320px (w-80) com scroll interno
- **Loading States**: Indicador de carregamento para fotos similares

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/components/SmartCullingSidebar.tsx`** (319 linhas)
   - Componente principal do sidebar
   - Lógica de qualidade, tags e similares
   - Interface com hook useAI

### Arquivos Modificados

2. **`src/components/Viewer.tsx`**
   - Adicionado import do SmartCullingSidebar
   - Adicionado estado `isSidebarVisible`
   - Implementado keyboard shortcut (tecla S)
   - Adicionado botão de toggle no header
   - Renderizado do SmartCullingSidebar

## 🔧 Tecnologias Utilizadas

- **React** (hooks: useState, useEffect, useCallback)
- **TypeScript** (tipagem estrita)
- **Tailwind CSS** (estilização)
- **ViT (Vision Transformer)** (modelo de IA já existente)
- **Hook useAI** (interface com backend Electron)

## 🎨 Design System

Seguindo o design system do Zona21:
- **Glassmorphism**: `bg-gray-900/95 backdrop-blur-xl`
- **Cores Temáticas**:
  - Roxo: `text-purple-400` (IA/inteligência)
  - Verde: `text-green-400` (qualidade boa)
  - Amarelo: `text-yellow-400` (atenção/médio)
  - Vermelho: `text-red-400` (alerta/problema)
- **Bordas**: `border-gray-700`
- **Transições**: `transition-colors`

## 📊 APIs Utilizadas

### useAI Hook

```typescript
const { findSimilar } = useAI();

// Buscar fotos similares
const results = await findSimilar(assetId, limit);
// Retorna: SimilarityResult[] = [{ assetId: string, score: number }]
```

### Asset Type

```typescript
interface Asset {
  id: string;
  fileName: string;
  mediaType: 'photo' | 'video';
  tags: string[];
  fileSize: number;
  width: number;
  height: number;
  // ... outros campos
}
```

## 🚧 Features Futuras (Preparadas)

O sidebar já exibe uma seção "Em breve" com features planejadas:
- ✅ Detecção de foco (focus detection)
- ✅ Análise de exposição (exposure analysis)
- ✅ Detecção facial e olhos fechados (face detection)
- ✅ Score de composição (composition score)

**Nota**: A infraestrutura para face detection já existe no banco (tabela `faces`), mas o detector ainda não foi implementado.

## 🎯 Métricas de Sucesso (Target)

Conforme roadmap original:
- ↑ Confiança nas rejeições
- ↑ Uso do Smart Culling (user entende o valor)
- ↓ Tempo de indecisão (dados claros = decisão rápida)

## 🧪 Como Testar

### Pré-requisitos
1. Build do app: `npm run electron:build:mac:arm64`
2. Fotos processadas pela IA (com tags e embeddings)

### Testes Manuais

1. **Abrir Viewer**:
   - Clicar em uma foto na grid
   - Viewer abre à direita

2. **Abrir Smart Culling Sidebar**:
   - Clicar no botão de estrela no header
   - OU pressionar tecla `S`
   - Sidebar aparece à direita do Viewer

3. **Verificar Indicadores**:
   - Tags detectadas aparecem
   - Qualidade baseada em tamanho/resolução
   - Fotos similares carregam

4. **Testar Interações**:
   - Hover em thumbnails para ver score
   - Clicar em Aprovar/Rejeitar (mostra toast)
   - Pressionar `S` para fechar sidebar

5. **Casos Edge**:
   - Foto sem tags (não mostra seção)
   - Foto sem similares (mostra mensagem)
   - Vídeo (não mostra botão de toggle)

## 📝 Notas de Implementação

### Por que não implementar Quality Scores completos ainda?

Decidimos usar **proxies de qualidade** (tamanho de arquivo, resolução, tags) ao invés de implementar detecção de foco/exposição agora porque:

1. **Foco no MVP**: Expor o valor da IA existente primeiro
2. **Evitar conflito**: Outro agente está trabalhando em features prioritárias
3. **Iteração futura**: Quality scores completos virão no Sprint 3

### Estrutura de Dados

Os dados já disponíveis no banco:
- `ai_embedding`: BLOB (3KB por foto, 768 floats)
- `ai_processed_at`: INTEGER (timestamp)
- `tags`: JSON array (ex: ["praia", "tarde", "pôr-do-sol"])

### Performance

- **Similaridade**: O(n) onde n = número de assets com embeddings
- **Cache**: Resultados são carregados uma vez por asset
- **Lazy loading**: Similares só carregam quando sidebar abre

## 🐛 Issues Conhecidos

Nenhum issue conhecido no momento. TypeScript passa sem erros.

## 🔄 Próximos Passos

1. **Integração com Rating System**:
   - Conectar botões Aprovar/Rejeitar ao sistema de rating
   - Atualizar badge de status na grid

2. **Click em Thumbnail Similar**:
   - Permitir clicar em thumbnail para navegar para essa foto

3. **Quality Scores Completos** (Sprint 3):
   - Implementar detecção de foco (Laplacian variance)
   - Implementar análise de exposição (histograma)
   - Implementar face detection (MediaPipe ou face-api.js)
   - Implementar score de composição (regra dos terços)

4. **Analytics**:
   - Track quantos usuários usam o sidebar
   - Track tempo médio com sidebar aberto
   - Track cliques em Aprovar/Rejeitar

## 📚 Referências

- [Roadmap Priorizado](./roadmap-priorizado-ux.md) - Sprint 2, Feature #3
- [Growth.design Principles](https://growth.design) - Aha Moment, Data-driven decisions
- [Vision Transformer (ViT)](https://huggingface.co/google/vit-base-patch16-224) - Modelo usado

---

**Status**: ✅ Implementado e funcional
**Sprint**: Sprint 2 (Semana 3-4)
**RICE Score**: 37
**Esforço Estimado**: 3 dias
**Esforço Real**: ~4 horas
**Data**: 2026-01-29
