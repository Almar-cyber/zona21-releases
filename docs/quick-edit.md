# Quick Edit - Documentação

## 📋 Visão Geral

O **Quick Edit** é uma funcionalidade de edição básica não-destrutiva implementada no Zona21 que permite ao usuário fazer edições simples em fotos sem sair do app ou abrir editores externos como Lightroom ou Photoshop.

## 🎯 Objetivo

Implementar a feature #4 do Roadmap (Sprint 2 - RICE 38):
- Remover dependência de apps externos para edições simples
- Manter workflow dentro do Zona21
- Preparar fotos para Instagram e redes sociais rapidamente
- Preservar originais (edições não-destrutivas)

## 🚀 Funcionalidades Implementadas

### 1. Rotação (Rotate)

Rotacionar fotos em incrementos de 90°:
- **Rotate 90° CW** (Clockwise / Horário)
- **Rotate 90° CCW** (Counter-Clockwise / Anti-horário)

### 2. Espelhamento (Flip)

Espelhar fotos horizontal ou verticalmente:
- **Flip Horizontal**: Espelha da esquerda para direita
- **Flip Vertical**: Espelha de cima para baixo

### 3. Crop com Aspect Ratio Presets

Cortar fotos com proporções predefinidas:

**Presets Instagram:**
- Instagram Square: 1:1 (1080×1080)
- Instagram Portrait: 4:5 (1080×1350)
- Instagram Story: 9:16 (1080×1920)
- Instagram Landscape: 1.91:1 (1080×566)

**Presets Comuns:**
- 16:9 Landscape: 1920×1080
- 4:3 Standard: 1600×1200
- 3:2 Classic: 1800×1200
- 21:9 Ultrawide: 2560×1097

**Lógica de Crop:**
- Crop centralizado automaticamente
- Calcula dimensões ideais para manter aspect ratio
- Preview das dimensões antes de aplicar

### 4. Resize (Redimensionamento)

Redimensionar fotos para formatos otimizados do Instagram:
- Mantém aspect ratio
- Usa algoritmo de fit 'cover' (preenche todo o espaço)
- Ideal para preparar fotos para publicação

### 5. Interface e Usabilidade

- **Panel Lateral**: Abre à esquerda do Viewer (320px)
- **Toggle Button**: Botão no header do Viewer (ícone de lápis)
- **Keyboard Shortcut**: Tecla **`E`** para abrir/fechar
- **Operações Rápidas**: Botões grandes e claros para cada operação
- **Feedback Visual**: Toast notifications para cada ação
- **Loading States**: Botões desabilitados durante processamento
- **Non-destructive**: Original sempre preservado

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`electron/main/quick-edit.ts`** (365 linhas)
   - Serviço backend para processamento de imagens
   - Usa Sharp para operações
   - Classe QuickEditService com métodos para cada operação
   - Presets de aspect ratio
   - Lógica de cálculo de crop

2. **`src/hooks/useQuickEdit.ts`** (325 linhas)
   - Hook React para interface com backend
   - Métodos para cada operação (rotate, flip, crop, resize)
   - Estado de processamento (loading)
   - Tratamento de erros
   - Cálculo de crop no frontend

3. **`src/components/QuickEditPanel.tsx`** (375 linhas)
   - Componente UI do painel de edição
   - Seções organizadas: Rotate, Flip, Crop, Resize
   - Seleção de presets com preview
   - Botões de ação (aplicar/cancelar)
   - Estados de edição (crop mode, resize mode)

### Arquivos Modificados

4. **`electron/main/index.ts`**
   - Adicionado import do quick-edit
   - Inicialização do QuickEditService no app ready
   - 7 IPC handlers para operações de Quick Edit:
     - `quick-edit-apply`: Operações gerais
     - `quick-edit-crop-preset`: Crop com preset
     - `quick-edit-rotate-cw`: Rotacionar 90° horário
     - `quick-edit-rotate-ccw`: Rotacionar 90° anti-horário
     - `quick-edit-flip-h`: Espelhar horizontal
     - `quick-edit-flip-v`: Espelhar vertical
     - `quick-edit-resize-instagram`: Resize para Instagram

5. **`src/components/Viewer.tsx`**
   - Adicionado import do QuickEditPanel
   - Adicionado estado `isQuickEditVisible`
   - Implementado keyboard shortcut (tecla E)
   - Adicionado botão de toggle no header
   - Renderizado do QuickEditPanel

## 🔧 Tecnologias Utilizadas

### Backend
- **Sharp** (v0.33.1): Biblioteca de processamento de imagens
  - Crop: `extract()`
  - Rotate: `rotate()`
  - Flip: `flop()` / `flip()`
  - Resize: `resize()`
- **Node.js fs**: Manipulação de arquivos
- **Path**: Manipulação de caminhos

### Frontend
- **React** (hooks: useState, useCallback)
- **TypeScript** (tipagem estrita)
- **Tailwind CSS** (estilização)
- **IPC** (comunicação Electron)

## 🎨 Design System

Seguindo o design system do Zona21:
- **Glassmorphism**: `bg-gray-900/95 backdrop-blur-xl`
- **Cores Temáticas**:
  - Azul: `text-blue-400` / `bg-blue-600` (edição)
  - Verde: `bg-green-600` (aplicar/confirmar)
  - Roxo: `bg-purple-600` (Instagram/social)
  - Cinza: `bg-gray-800` (cancelar/secundário)
- **Bordas**: `border-gray-700`
- **Transições**: `transition-colors`
- **Espaçamento**: Sistema consistente (p-4, gap-2, space-y-3)

## 📊 Arquitetura

```
Frontend (React)
    ↓
useQuickEdit Hook
    ↓
IPC (Electron)
    ↓
IPC Handlers (main/index.ts)
    ↓
QuickEditService (quick-edit.ts)
    ↓
Sharp (Image Processing)
    ↓
File System (Temp Directory)
```

### Fluxo de Operação

1. **User Interaction**: Usuário clica em "Rotate 90° CW"
2. **Hook Call**: `rotateClockwise(assetId)` é chamado
3. **IPC Message**: `window.electronAPI.quickEditRotateCW(assetId)`
4. **Handler**: `ipcMain.handle('quick-edit-rotate-cw', ...)`
5. **Service**: `quickEditService.rotateClockwise(assetId)`
6. **Sharp Processing**:
   - Carrega imagem do asset
   - Aplica `rotate(90)`
   - Salva em arquivo temporário
7. **Response**: Retorna path do arquivo editado
8. **UI Update**: Toast notification + callback `onEditComplete`

## 🗂️ Estrutura de Dados

### QuickEditOperation

```typescript
interface QuickEditOperation {
  crop?: CropOptions;
  rotate?: RotateOptions;
  flip?: FlipOptions;
  resize?: ResizeOptions;
}
```

### CropOptions

```typescript
interface CropOptions {
  left: number;    // Pixels from left
  top: number;     // Pixels from top
  width: number;   // Crop width in pixels
  height: number;  // Crop height in pixels
}
```

### AspectRatioPreset

```typescript
interface AspectRatioPreset {
  name: string;      // "Instagram Square"
  ratio: number;     // 1 (width/height)
  width: number;     // 1080
  height: number;    // 1080
}
```

## 🚀 Como Usar

### Abrir Quick Edit

1. Abrir uma foto no Viewer
2. Clicar no botão de lápis no header OU pressionar tecla `E`
3. Painel abre à esquerda

### Rotacionar

1. Clicar em "90° CW" ou "90° CCW"
2. Imagem é processada imediatamente
3. Toast mostra confirmação

### Espelhar

1. Clicar em "Horizontal" ou "Vertical"
2. Imagem é espelhada imediatamente
3. Toast mostra confirmação

### Crop

1. Clicar em "Escolher Aspect Ratio"
2. Selecionar preset da lista
3. Ver preview das dimensões
4. Clicar em "Aplicar Crop"
5. Toast mostra confirmação

### Resize

1. Clicar em "Escolher Preset Instagram"
2. Selecionar preset (Square, Portrait, Story, Landscape)
3. Clicar em "Aplicar Resize"
4. Toast mostra confirmação

### Fechar Quick Edit

1. Clicar no X no header do painel
2. OU pressionar tecla `E` novamente

## 📝 Arquivos Temporários

Arquivos editados são salvos em:
```
~/.userData/zona21/cache/quick-edit/
```

**Formato do nome:**
```
{nome-original}_edited_{timestamp}.{ext}
```

**Exemplo:**
```
IMG_1234_edited_1706560123456.jpg
```

**Cleanup automático:**
- Arquivos com mais de 24 horas são deletados automaticamente
- Método: `quickEditService.cleanupTempFiles()`

## 🧪 Como Testar

### Pré-requisitos
1. Build do app: `npm run electron:build:mac:arm64`
2. Fotos indexadas no banco

### Testes Manuais

**1. Teste de Rotação:**
- Abrir foto no Viewer
- Pressionar `E` para abrir Quick Edit
- Clicar "90° CW" várias vezes
- Verificar rotação correta
- Tentar "90° CCW"

**2. Teste de Flip:**
- Clicar "Horizontal"
- Verificar espelhamento
- Clicar "Vertical"
- Verificar espelhamento

**3. Teste de Crop:**
- Clicar "Escolher Aspect Ratio"
- Selecionar "Instagram Square"
- Ver preview (deve mostrar 1080×1080)
- Clicar "Aplicar Crop"
- Verificar toast de sucesso

**4. Teste de Resize:**
- Clicar "Escolher Preset Instagram"
- Selecionar "Instagram Portrait"
- Clicar "Aplicar Resize"
- Verificar toast

**5. Teste de Keyboard:**
- Pressionar `E` para abrir/fechar panel
- Verificar que não funciona em inputs

**6. Teste de Loading:**
- Aplicar operação em foto grande
- Verificar que botões ficam disabled
- Verificar texto "Processando..."

## 🐛 Issues Conhecidos

Nenhum issue conhecido no momento.

## 🔄 Próximos Passos

### Melhorias Planejadas (Post v1.0)

1. **Canvas Crop Tool**:
   - Arrastar área de crop manualmente
   - Ajustar handles para redimensionar
   - Preview em tempo real

2. **Ajustes de Imagem**:
   - Brightness (brilho)
   - Contrast (contraste)
   - Saturation (saturação)
   - Sliders com preview

3. **Histórico de Edições**:
   - Undo/Redo
   - Lista de operações aplicadas
   - Reverter para original

4. **Batch Edit** (Sprint 3):
   - Aplicar mesma edição em múltiplas fotos
   - Preview grid
   - Progress bar

5. **Salvar como Nova Foto**:
   - Opção para adicionar arquivo editado à biblioteca
   - Manter vínculo com original
   - Metadata preservado

6. **Presets Customizados**:
   - Criar aspect ratios personalizados
   - Salvar no LocalStorage
   - Compartilhar presets

7. **Export Direto**:
   - Aplicar edit + export em uma ação
   - Opção de formato (JPG, PNG, TIFF)
   - Opção de qualidade

## 📊 Métricas de Sucesso (Target)

Conforme roadmap original:
- ↑ 40% fotos exportadas prontas para uso
- ↓ Aberturas de apps externos
- ↑ Retenção (menos saída para outros apps)
- ↑ Velocidade de workflow (crop+resize em <10s)

## 🎯 Growth Principles Aplicados

### 1. Zero Context Switching ✅
User não precisa sair do Zona21 para fazer edições básicas

### 2. Smart Defaults ✅
Presets Instagram otimizados para uso imediato

### 3. Non-destructive ✅
Original sempre preservado = segurança e confiança

### 4. Fast Workflow ✅
Operações rápidas (rotate/flip) em 1 clique

### 5. Social Ready ✅
Fotos prontas para Instagram sem ferramentas externas

## 🤝 Compatibilidade

O código está **100% compatível** com outras features porque:
- Componente isolado (novo painel)
- Integração mínima no Viewer
- Usa Sharp que já está instalado
- Arquivos temporários em diretório separado
- Sem modificações em core logic

## 📚 Referências

- [Roadmap Priorizado](./roadmap-priorizado-ux.md) - Sprint 2, Feature #4
- [Sharp Documentation](https://sharp.pixelplumbing.com/) - Image processing library
- [Growth.design Principles](https://growth.design) - Zero friction, Smart defaults

---

**Status**: ✅ Implementado e funcional
**Sprint**: Sprint 2 (Semana 3-4)
**RICE Score**: 38
**Esforço Estimado**: 5 dias
**Esforço Real**: ~6 horas
**Data**: 2026-01-29
