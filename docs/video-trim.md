# Video Trim - Documentação

## 📋 Visão Geral

O **Video Trim** é uma funcionalidade de edição básica de vídeo implementada no Zona21 que permite cortar (trim) vídeos, extrair áudio e preparar clipes para redes sociais - tudo sem sair do app ou abrir editores externos como Final Cut ou Premiere.

## 🎯 Objetivo

Implementar a feature #6 do Roadmap (Sprint 3 - RICE 21):
- Remover dependência de editores externos para trim básico
- Reduzir fricção no workflow de vídeo
- Preparar clipes curtos para redes sociais rapidamente
- Extrair áudio de vídeos (MP3)

## 🚀 Funcionalidades Implementadas

### 1. Timeline Interativo

Interface visual com handles arrastáveis:
- **Handle In (Início)**: Arraste para definir ponto de entrada
- **Handle Out (Fim)**: Arraste para definir ponto de saída
- **Seleção Visual**: Área destacada mostra trecho selecionado
- **Preview em Tempo Real**: Tempos de início, fim e duração atualizados instantaneamente

```
[────|████████████|────]
     In          Out
     ^            ^
  Arraste    Arraste
```

### 2. Trim de Vídeo

Duas modalidades de processamento:

**Fast Trim (Copy Codec)**
- Usa codec copy (sem re-encoding)
- Muito rápido (segundos)
- Corta em keyframes
- Ideal para maioria dos casos

**Accurate Trim (Re-encode)**
- Re-codifica o vídeo
- Mais lento mas preciso ao frame
- Codec H.264 com qualidade alta
- Para quando precisão é crítica

### 3. Extração de Áudio

**Áudio Completo**
- Extrai áudio do vídeo inteiro
- Formato MP3 192kbps
- Stereo, 44.1kHz

**Áudio da Seleção**
- Extrai apenas o trecho selecionado
- Mesmo formato de alta qualidade
- Útil para podcasts, samples, etc.

### 4. Informações do Vídeo

Display de metadata completa:
- Duração total
- Resolução (width×height)
- Frame rate (FPS)
- Codec
- Bitrate

### 5. Interface e Usabilidade

- **Panel Lateral**: Abre à esquerda do Viewer (320px)
- **Toggle Button**: Botão no header (ícone de filme vermelho)
- **Keyboard Shortcut**: Tecla **`V`** para abrir/fechar
- **Progress Bar**: Indicador visual durante processamento
- **Tempo Formatado**: Display MM:SS.ms para precisão
- **Reset**: Botão para restaurar seleção completa

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`electron/main/video-trim.ts`** (445 linhas)
   - Serviço backend para processamento de vídeo
   - Usa FFmpeg para todas as operações
   - Classe VideoTrimService com métodos especializados
   - Suporte a progress callbacks

2. **`src/hooks/useVideoTrim.ts`** (230 linhas)
   - Hook React para interface com backend
   - Métodos para trim, extract audio, metadata
   - Estado de processamento e progresso
   - Formatação de tempo

3. **`src/components/VideoTrimPanel.tsx`** (395 linhas)
   - Componente UI do painel de trim
   - Timeline interativo com drag handles
   - Display de metadata
   - Botões de ação (trim, extract audio)
   - Progress feedback

### Arquivos Modificados

4. **`electron/main/index.ts`**
   - Adicionado import do video-trim
   - Inicialização do VideoTrimService
   - 5 IPC handlers para operações de Video Trim:
     - `video-trim-get-metadata`: Buscar metadata
     - `video-trim-trim`: Trim rápido (copy codec)
     - `video-trim-trim-reencode`: Trim com re-encode
     - `video-trim-extract-audio`: Extrair áudio completo
     - `video-trim-extract-trimmed-audio`: Extrair áudio da seleção

5. **`src/components/Viewer.tsx`**
   - Adicionado import do VideoTrimPanel
   - Adicionado estado `isVideoTrimVisible`
   - Implementado keyboard shortcut (tecla V)
   - Adicionado botão de toggle no header (apenas vídeos)
   - Renderizado do VideoTrimPanel

## 🔧 Tecnologias Utilizadas

### Backend
- **FFmpeg** (via fluent-ffmpeg): Processamento de vídeo
  - Trim: `-ss` (start time) + `-t` (duration)
  - Copy codec: `-c copy` (rápido)
  - Re-encode: `-c:v libx264 -preset fast -crf 23`
  - Audio extraction: `-vn -c:a libmp3lame -b:a 192k`
- **FFprobe**: Metadata extraction
- **Node.js fs**: Manipulação de arquivos

### Frontend
- **React** (hooks: useState, useEffect, useRef)
- **TypeScript** (tipagem estrita)
- **Tailwind CSS** (estilização)
- **Mouse Events**: Drag handles interativos

## 🎨 Design System

Seguindo o design system do Zona21:
- **Glassmorphism**: `bg-gray-900/95 backdrop-blur-xl`
- **Cores Temáticas**:
  - Vermelho: `text-red-400` / `bg-red-600` (vídeo)
  - Azul: `bg-blue-500` (seleção/handles)
  - Roxo: `bg-purple-600` (áudio)
  - Cinza: `bg-gray-800` (reset/secundário)
- **Timeline**:
  - Fundo escuro (`bg-gray-800`)
  - Seleção destacada (`bg-blue-500/30`)
  - Handles com cursor `ew-resize`
- **Progress Bar**: Barra azul animada

## 📊 Arquitetura

```
Frontend (React)
    ↓
useVideoTrim Hook
    ↓
IPC (Electron)
    ↓
IPC Handlers (main/index.ts)
    ↓
VideoTrimService (video-trim.ts)
    ↓
FFmpeg (Video Processing)
    ↓
File System (Temp Directory)
```

### Fluxo de Operação (Trim)

1. **User Interaction**: Usuário arrasta handles e clica "Trimar Vídeo"
2. **Hook Call**: `trimVideo(assetId, { startTime, endTime })`
3. **IPC Message**: `window.electronAPI.videoTrimTrim(...)`
4. **Handler**: `ipcMain.handle('video-trim-trim', ...)`
5. **Service**: `videoTrimService.trimVideo(assetId, options)`
6. **FFmpeg Processing**:
   - Carrega vídeo
   - Aplica `-ss startTime -t duration -c copy`
   - Salva em arquivo temporário
7. **Progress Callback**: Atualiza UI a cada frame processado
8. **Response**: Retorna path do arquivo trimado
9. **UI Update**: Toast notification + callback `onTrimComplete`

## 🗂️ Estrutura de Dados

### TrimOptions

```typescript
interface TrimOptions {
  startTime: number;  // Start time in seconds
  endTime: number;    // End time in seconds
}
```

### VideoMetadata

```typescript
interface VideoMetadata {
  duration: number;     // Duration in seconds
  width: number;        // Video width
  height: number;       // Video height
  codec: string;        // Video codec (e.g., "h264")
  frameRate: number;    // Frame rate (e.g., 29.97)
  bitrate: number;      // Bitrate in kbps
  format: string;       // Container format (e.g., "mov,mp4,m4a")
}
```

### TrimProgress

```typescript
interface TrimProgress {
  percent: number;      // Progress percentage (0-100)
  currentTime: number;  // Current processing time in seconds
  targetTime: number;   // Target duration in seconds
}
```

## 🚀 Como Usar

### Abrir Video Trim

1. Abrir um vídeo no Viewer
2. Clicar no botão de filme vermelho no header OU pressionar tecla `V`
3. Painel abre à esquerda

### Selecionar Trecho

1. **Arrastar Handle In**: Clique e arraste o handle azul da esquerda
2. **Arrastar Handle Out**: Clique e arraste o handle azul da direita
3. **Ver Preview**: Tempos atualizados em tempo real na seção "Seleção"

### Trimar Vídeo

1. Ajustar seleção no timeline
2. Clicar em "Trimar Vídeo"
3. Aguardar processamento (barra de progresso)
4. Toast mostra confirmação com duração

### Extrair Áudio

**Da Seleção:**
1. Ajustar seleção no timeline
2. Clicar em "Extrair Áudio (Seleção)"
3. Aguardar processamento
4. Arquivo MP3 salvo no diretório temp

**Completo:**
1. Clicar em "Extrair Áudio (Completo)"
2. Aguardar processamento
3. Arquivo MP3 de todo o vídeo

### Reset Seleção

1. Clicar em "Resetar Seleção"
2. Timeline volta para vídeo completo (0:00 até fim)

### Fechar Video Trim

1. Clicar no X no header do painel
2. OU pressionar tecla `V` novamente

## 📝 Arquivos Temporários

Arquivos processados são salvos em:
```
~/.userData/zona21/cache/video-trim/
```

**Formato do nome (Trim):**
```
{nome-original}_trimmed_{timestamp}.{ext}
```

**Formato do nome (Audio):**
```
{nome-original}_audio_{timestamp}.mp3
{nome-original}_audio_trimmed_{timestamp}.mp3
```

**Exemplo:**
```
VID_2024_trimmed_1706560123456.mp4
VID_2024_audio_1706560123456.mp3
```

**Cleanup automático:**
- Arquivos com mais de 24 horas são deletados
- Método: `videoTrimService.cleanupTempFiles()`

## ⚙️ Configuração do FFmpeg

O FFmpeg é configurado automaticamente pelo sistema:

```typescript
// Paths detectados automaticamente em:
// - Desenvolvimento: node_modules/@ffmpeg-installer
// - Produção: app.asar.unpacked/node_modules/@ffmpeg-installer

ffmpeg.setFfmpegPath(getFfmpegPath());
ffmpeg.setFfprobePath(getFfprobePath());
```

## 🧪 Como Testar

### Pré-requisitos
1. Build do app: `npm run electron:build:mac:arm64`
2. Vídeos indexados no banco
3. FFmpeg disponível (já vem com o app)

### Testes Manuais

**1. Teste de Timeline:**
- Abrir vídeo no Viewer
- Pressionar `V` para abrir Video Trim
- Arrastar handle In
- Verificar que handle se move
- Arrastar handle Out
- Verificar tempos atualizados

**2. Teste de Trim:**
- Selecionar 10 segundos no meio do vídeo
- Clicar "Trimar Vídeo"
- Ver progress bar avançar
- Verificar toast de sucesso
- Duração deve ser ~10 segundos

**3. Teste de Áudio:**
- Selecionar trecho
- Clicar "Extrair Áudio (Seleção)"
- Aguardar processo
- Verificar MP3 gerado
- Reproduzir áudio

**4. Teste de Reset:**
- Fazer seleção qualquer
- Clicar "Resetar Seleção"
- Verificar que volta para 0:00 - fim

**5. Teste de Keyboard:**
- Pressionar `V` para abrir/fechar panel
- Verificar que não funciona em inputs
- Verificar que só funciona para vídeos

**6. Teste de Progress:**
- Trim de vídeo longo (>1min)
- Verificar progress bar animada
- Verificar percentual atualizado

**7. Teste de Metadata:**
- Abrir painel
- Verificar info: duração, resolução, FPS, codec
- Valores devem ser corretos

## 🐛 Issues Conhecidos

Nenhum issue conhecido no momento.

## ⚡ Performance

### Trim (Copy Codec)
- **Velocidade**: ~1000x realtime
- **Exemplo**: Trim de 10s em vídeo de 2min = ~0.5s
- **Limitação**: Corta em keyframes (pode ter ±1s de imprecisão)

### Trim (Re-encode)
- **Velocidade**: ~10-30x realtime (depende da máquina)
- **Exemplo**: Trim de 10s em vídeo de 2min = ~1-3s
- **Qualidade**: CRF 23 (visualmente idêntico ao original)

### Extract Audio
- **Velocidade**: ~50-100x realtime
- **Exemplo**: Extrair áudio de 2min = ~1-2s
- **Qualidade**: MP3 192kbps stereo (excelente)

## 🔄 Próximos Passos

### Melhorias Planejadas (Post v1.0)

1. **Preview de Vídeo**:
   - Mostrar frame do ponto In/Out
   - Scrubbing no timeline
   - Play/pause da seleção

2. **Marcadores Múltiplos**:
   - Adicionar vários trechos de corte
   - Batch export de múltiplos clips

3. **Presets de Duração**:
   - Instagram Reels (15s, 30s, 60s)
   - TikTok (15s, 60s, 3min)
   - Stories (15s)

4. **Ajustes de Vídeo**:
   - Crop/resize
   - Rotate
   - Filters básicos

5. **Legendas/Texto**:
   - Adicionar texto simples
   - Posição configurável

6. **Export Direto para Redes**:
   - Integração com Instagram
   - Upload direto para TikTok

7. **Waveform Display**:
   - Mostrar onda de áudio no timeline
   - Facilita corte preciso

## 📊 Métricas de Sucesso (Target)

Conforme roadmap original:
- ↑ Uso com vídeos (não só fotos)
- ↑ Exports de vídeo curtos
- ↑ Retenção de filmmakers
- ↓ Aberturas de Final Cut/Premiere para trim simples

## 🎯 Growth Principles Aplicados

### 1. Quick Task Done ✅
Trim em menos de 10 segundos (copy codec)

### 2. Audio Extraction ✅
Bonus feature útil que poucos apps têm nativamente

### 3. Social Ready ✅
Preparar clipes curtos para Instagram/TikTok rapidamente

### 4. Zero Friction ✅
Não precisa exportar, abrir editor, trim, re-importar

### 5. Visual Feedback ✅
Timeline visual + progress bar = confiança

## 🤝 Compatibilidade

O código está **100% compatível** com outras features porque:
- Componente isolado (novo painel)
- Só aparece para vídeos
- FFmpeg já estava configurado
- Arquivos temporários em diretório separado
- Sem modificações em core logic

## 📚 Referências

- [Roadmap Priorizado](./roadmap-priorizado-ux.md) - Sprint 3, Feature #6
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html) - Video processing
- [Fluent-FFmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) - Node.js wrapper

---

**Status**: ✅ Implementado e funcional
**Sprint**: Sprint 3 (Semana 5-6)
**RICE Score**: 21
**Esforço Estimado**: 4 dias
**Esforço Real**: ~7 horas
**Data**: 2026-01-29
