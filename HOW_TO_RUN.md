# Como Rodar o MediaHub MVP

## ✅ Pré-requisitos Instalados

- ✅ Node.js 20.19.6
- ✅ FFmpeg 8.0.1
- ✅ ExifTool 13.44
- ✅ Todas as dependências npm

## 🚀 Rodar a Aplicação

### Opção 1: Modo Desenvolvimento (Recomendado)

```bash
cd /Users/alexiaolivei/CascadeProjects/zona21

# Garantir que está usando Node.js 20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Rodar em modo dev
npm run electron:dev
```

Isso irá:
1. Iniciar o servidor Vite (React) na porta 5173
2. Abrir a janela do Electron automaticamente
3. Hot reload habilitado (mudanças no código recarregam automaticamente)

### Opção 2: Build e Executar

```bash
npm run electron:build:mac:arm64
```

## 📋 Funcionalidades Disponíveis no MVP

### 1. Indexação de Mídia
- Clique em **"+ Add Folder"** na sidebar
- Atualmente configurado para indexar `/Users/alexiaolivei/Pictures`
- Para mudar o diretório, edite `src/App.tsx` linha 42

### 2. Visualização de Assets
- Grid virtualizado com thumbnails
- Scroll fluido mesmo com milhares de arquivos
- Clique em qualquer asset para abrir o Viewer

### 3. Sistema de Decisões
- **Ratings**: Clique nas estrelas (1-5)
- **Flag**: Botão 🚩 para marcar favoritos
- **Reject**: Botão ❌ para rejeitar
- **Notes**: Campo de texto para anotações

### 4. Filtros
- **Media Type**: Filtrar por foto ou vídeo
- **Rating**: Filtrar por rating mínimo
- **Flagged**: Mostrar apenas flagged
- **Search**: Busca full-text em nomes e notas

### 5. Viewer (Painel Lateral)
- Metadados completos (EXIF para fotos, codec info para vídeos)
- Edição de ratings, flags, notes
- Informações de arquivo

## 🎯 Fluxo de Uso Típico

1. **Primeira vez**: Clique em "Add Folder" para indexar seus arquivos
2. **Aguarde**: Barra de progresso mostra indexação em tempo real
3. **Navegue**: Scroll pelo grid de thumbnails
4. **Selecione**: Clique em assets para ver detalhes
5. **Decida**: Use ratings, flags e notes para organizar
6. **Filtre**: Use toolbar para encontrar o que precisa

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "gyp ERR! build error"
```bash
npm rebuild
```

### Thumbnails não aparecem
- **Em desenvolvimento**: verifique se FFmpeg/ExifTool estão no PATH (`which ffmpeg`, `which exiftool`)
- **Em produção (app empacotado)**: FFmpeg/FFprobe são bundled no app; o problema costuma ser cache/arquivos corrompidos
- Verifique permissões da pasta cache: `~/Library/Application Support/Zona21/cache`

### Aplicação não abre
- Verifique se porta 5173 está livre: `lsof -i :5173`
- Verifique logs no terminal

## 📁 Estrutura de Arquivos Criados

```
~/Library/Application Support/Zona21/
├── zona21.db          # Database SQLite
├── zona21.db-wal      # Write-Ahead Log
├── zona21.db-shm      # Shared Memory
└── cache/               # Thumbnails e previews
    ├── {asset-id}_thumb.jpg
    └── ...
```

## 🔧 Desenvolvimento

### Arquivos Principais

- `electron/main/index.ts` - Processo principal do Electron
- `electron/main/indexer.ts` - Serviço de indexação
- `electron/main/database.ts` - Gerenciamento do SQLite
- `src/App.tsx` - Componente raiz React
- `src/components/` - Componentes UI

### Adicionar Nova Funcionalidade

1. Backend: Adicionar IPC handler em `electron/main/index.ts`
2. Frontend: Chamar via `window.electronAPI.{funcao}`
3. Tipos: Atualizar `src/shared/types.ts` se necessário

## 🎨 Customização

### Mudar Diretório de Indexação

Edite `src/App.tsx`:
```typescript
const handleIndexDirectory = async () => {
  const result = await window.electronAPI.indexDirectory('/seu/caminho/aqui');
  // ...
};
```

### Adicionar Atalhos de Teclado

Adicione event listeners em `src/App.tsx`:
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === '1') handleRating(1);
    // ...
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

## 📊 Performance

### Testado com:
- ✅ 1.000 arquivos: Fluido
- ✅ 5.000 arquivos: Scroll 60fps
- ⚠️ 10.000+ arquivos: Pode ter lag inicial na indexação

### Otimizações Implementadas:
- Grid virtualizado (react-window)
- Thumbnails em cache persistente
- Indexação paralela com workers
- Database com índices otimizados

## 🚧 Próximos Passos (Pós-MVP)

- [ ] Implementar exports (XML para Premiere/Resolve, XMP para Lightroom)
- [ ] Adicionar atalhos de teclado completos
- [ ] Implementar Smart Collections
- [ ] Adicionar Ingest de cartões SD
- [ ] Suporte a mais formatos RAW
- [ ] Detecção de duplicatas
- [ ] Compare view (lado a lado)

## 📝 Notas

- Os erros de lint do TailwindCSS são normais e não afetam o funcionamento
- A aplicação é 100% local-first, nenhum dado sai do seu computador
- O database SQLite pode ser acessado diretamente com qualquer cliente SQLite
