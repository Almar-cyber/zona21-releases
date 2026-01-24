# MediaHub - Quick Start Guide

## ✅ Status: Aplicação Funcionando!

A aplicação está rodando com sucesso. Alguns ajustes finais foram aplicados.

## 🚀 Como Rodar

```bash
cd /Users/alexiaolivei/CascadeProjects/zona21

# Garantir Node.js 20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Rodar aplicação
npm run electron:dev
```

A janela do Electron deve abrir automaticamente.

## ⚠️ Problemas Conhecidos e Soluções

### 1. Tela em branco (porta do Vite ocupada por outro projeto)

**Causa**: outro projeto pode estar usando a porta do Vite.

**Solução**:
- O Zona21 roda em **porta fixa 5174**.
- Se você tiver outro Vite rodando em 5174, encerre-o ou mude a porta do outro projeto.

### 2. Erro de Permissão no macOS

**Sintoma**: 
```
Error: EPERM: operation not permitted, scandir '/Users/alexiaolivei/Pictures/Photos Library.photoslibrary'
```

**Causa**: O macOS protege a biblioteca do Photos.app

**Solução**: 
1. Não indexe a pasta `/Users/alexiaolivei/Pictures` diretamente
2. Crie uma pasta de teste: `mkdir ~/MediaHubTest`
3. Copie algumas fotos/vídeos para lá
4. Edite `src/App.tsx` linha 42:
```typescript
const handleIndexDirectory = async () => {
  const result = await window.electronAPI.indexDirectory('/Users/alexiaolivei/MediaHubTest');
  // ...
};
```

### 3. macOS: "is damaged and can’t be opened" (testers)

Isso geralmente é Gatekeeper/quarantine em builds não notarizados.

**Como destravar** (no Mac do tester, depois de copiar para Applications):

```bash
sudo xattr -rd com.apple.quarantine "/Applications/Zona21.app"
```

Depois abra o app normalmente.

### 4. Erro SQL "no such column: online"

**Status**: ✅ Corrigido

Query SQL foi corrigida para usar aspas simples em vez de duplas.

## 📁 Estrutura de Teste Recomendada

```bash
# Criar pasta de teste
mkdir -p ~/MediaHubTest/photos
mkdir -p ~/MediaHubTest/videos

# Copiar alguns arquivos de exemplo
cp ~/Downloads/*.jpg ~/MediaHubTest/photos/
cp ~/Downloads/*.mp4 ~/MediaHubTest/videos/
```

## 🎯 Fluxo de Teste

1. **Abrir aplicação**: `npm run electron:dev`
2. **Aguardar**: Janela do Electron abre (pode levar 10-15 segundos)
3. **Verificar UI**: Deve ver sidebar, toolbar, e área vazia
4. **Clicar "Add Folder"**: Inicia indexação
5. **Aguardar indexação**: Barra de progresso aparece
6. **Ver resultados**: Grid de thumbnails aparece
7. **Clicar em asset**: Painel lateral abre com detalhes
8. **Testar decisões**: Ratings, flags, notes

## 🐛 Debug

### Ver Logs do Electron

Os logs aparecem no terminal onde você rodou `npm run electron:dev`.

### Ver Logs do Renderer (React)

1. DevTools abre automaticamente
2. Ou pressione `Cmd+Option+I`
3. Vá para Console tab

### Verificar Database

```bash
# Localização do database
ls -la ~/Library/Application\ Support/Zona21/

# Abrir com SQLite
sqlite3 ~/Library/Application\ Support/Zona21/zona21.db

# Ver tabelas
.tables

# Ver assets
SELECT COUNT(*) FROM assets;
SELECT * FROM assets LIMIT 5;
```

### Limpar Cache e Recomeçar

```bash
# Parar aplicação (Ctrl+C no terminal)

# Remover database e cache
rm -rf ~/Library/Application\ Support/Zona21/

# Rodar novamente
npm run electron:dev
```

## ✨ Funcionalidades Disponíveis

### Indexação
- ✅ Scan recursivo de pastas
- ✅ Detecção automática de foto vs vídeo
- ✅ Extração de metadados (EXIF, codec info)
- ✅ Geração de thumbnails
- ✅ Progress bar em tempo real

### Visualização
- ✅ Grid virtualizado (performance com 10k+ assets)
- ✅ Thumbnails persistentes
- ✅ Informações básicas (nome, resolução, duração)

### Decisões
- ✅ Ratings (1-5 estrelas)
- ✅ Flags (marcar favoritos)
- ✅ Reject (marcar para exclusão)
- ✅ Notes (anotações livres)

### Filtros
- ✅ Por tipo de mídia (foto/vídeo)
- ✅ Por rating mínimo
- ✅ Por flagged
- ✅ Busca por texto

### Viewer
- ✅ Painel lateral com detalhes completos
- ✅ Metadados técnicos (EXIF para fotos, codec para vídeos)
- ✅ Edição inline de ratings, flags, notes
- ✅ Informações de arquivo

## 🚧 Próximas Implementações

- [x] Export para Premiere/Resolve (XML)
- [x] Export para Lightroom (XMP sidecar)
- [x] Atalhos de teclado (1-5 para ratings, P para flag, etc)
- [x] Compare view (lado a lado)
- [x] Selection Tray (seleção persistente para ações em massa)
- [x] Organization Panel (drag-and-drop para organizar sem sair da visão)
- [ ] Smart Collections
- [ ] Detecção de duplicatas
- [ ] Suporte a mais formatos RAW
- [ ] Ingest de cartões SD com verificação

## 📊 Performance Testada

- ✅ 100 arquivos: Instantâneo
- ✅ 1.000 arquivos: Fluido
- ⚠️ 5.000+ arquivos: Indexação pode levar alguns minutos

## 💡 Dicas

1. **Primeira indexação é lenta**: Thumbnails são gerados uma vez e depois ficam em cache
2. **Use pastas pequenas para testar**: Comece com 10-20 arquivos
3. **Permissões do macOS**: Se pedir permissão para acessar pastas, conceda
4. **DevTools sempre aberto**: Útil para ver erros em tempo real

## 🎉 Sucesso!

Se você conseguiu:
- ✅ Abrir a aplicação
- ✅ Ver a UI (sidebar + toolbar + grid)
- ✅ Indexar alguns arquivos
- ✅ Ver thumbnails
- ✅ Clicar em um asset e ver detalhes

**Parabéns! O MVP está funcionando!** 🚀
