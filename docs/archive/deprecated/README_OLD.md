# MediaHub

Plataforma de ingestão, catalogação e seleção de mídia para fotógrafos e videomakers.

## Status

- **App**: Zona21 (Electron)
- **Versão atual**: v0.1.0
- **Auto-update (macOS)**: habilitado via feed genérico (R2)

## Setup

```bash
npm install
npm run electron:dev
```

## Build (macOS)

```bash
# Apple Silicon
npm run electron:build:mac:arm64
```

Os artefatos ficam em `release/`.

## Auto-update (macOS)

- **Feed URL**: `https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/`
- O build gera `release/latest-mac.yml` + `.zip/.dmg`.
- Para publicar uma versão, faça upload destes arquivos para o R2 no path `zona21/`.

## Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Desktop**: Electron
- **Database**: SQLite (better-sqlite3)
- **Media Processing**: FFmpeg, sharp, libraw
- **State**: Zustand + React Query

## Estrutura

```
mediahub/
├── electron/
│   ├── main/           # Processo principal do Electron
│   └── preload/        # Preload scripts
├── src/
│   ├── components/     # Componentes React
│   ├── services/       # Lógica de negócio
│   ├── stores/         # Zustand stores
│   └── types/          # TypeScript types
└── package.json
```

## Features MVP

- ✅ Indexação de pastas (foto + vídeo)
- ✅ Preview rápido com thumbnails persistentes
- ✅ Ratings, flags, tags, notes
- ✅ Smart Collections
- ✅ Export para Premiere, Resolve, Lightroom
- ✅ Ingest com checksum

## Atualizações recentes (Jan/2026)

- ✅ Correção de produção: app empacotado não depende de ffmpeg/ffprobe do sistema
- ✅ Correção de produção: paths de binários resolvidos via `app.asar.unpacked`
- ✅ Robustez: indexação e geração de thumbnails com fallback (não quebra UI em falhas)
- ✅ Auto-update: `latest-mac.yml` publicado no R2 (evita erro 404 no updater)
