# Guia de Instalação - Zona21

> **Current Version**: v0.4.9 | **Last Updated**: January 30, 2026

## 📋 Requisitos do Sistema

### Mínimos
- **SO**: macOS 10.12 (Sierra) ou superior
- **Processador**: Intel x64 ou Apple Silicon (M1/M2/M3)
- **Memória**: 8GB RAM
- **Armazenamento**: 500MB disponível + espaço para mídia
- **Node.js**: 20.x (para desenvolvimento)

### Recomendados
- **Memória**: 16GB+ RAM (para bibliotecas >50k arquivos)
- **Armazenamento**: SSD com 100GB+ livre
- **Resolução**: 1920x1080 ou superior

## 🚀 Instalação

### Opção 1: Download Direto (Produção)

1. Baixe a versão mais recente (v0.4.9):
   - [Zona21-0.4.9-arm64.dmg](https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.4.9-arm64.dmg) (Apple Silicon - M1/M2/M3)
   - [Zona21-0.4.9.dmg](https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.4.9.dmg) (Intel x64)

2. Abra o arquivo DMG
3. Arraste o Zona21 para Applications
4. Execute o app (pode precisar permitir nas Preferences)

### Opção 2: Código Fonte (Desenvolvimento)

```bash
# Clonar repositório
git clone https://github.com/Almar-cyber/zona21.git
cd zona21

# Garantir Node.js 20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Instalar dependências
npm install

# Rebuild dependências nativas (se necessário)
npx electron-rebuild

# Rodar em desenvolvimento
npm run electron:dev
```

## ⚙️ Configuração Inicial

### 1. Permissões do macOS

Ao executar pela primeira vez, conceda as permissões necessárias:

- **Acesso a Pastas**: Permita acesso a Pictures, Documents e outros volumes
- **Segurança**: Em "Security & Privacy", permita app de desenvolvedor não identificado

### 2. Configurações Recomendadas

- **Cache de Thumbnails**: 50GB (padrão)
- **Auto-update**: Ativado
- **Telemetria**: Opcional

## 🔧 Build a Partir do Fonte

### Build Completo

```bash
# Build para todas as arquiteturas
npm run build

# Arquivos gerados em ./release/
```

### Build Específico

```bash
# macOS ARM64 (Apple Silicon)
npm run electron:build:mac:arm64

# macOS Intel
npm run electron:build:mac:x64

# Windows (não testado)
npm run electron:build:win
```

## 🐛 Solução de Problemas

### Erro: "app is damaged"

```bash
# Remover quarentena do macOS
xattr -d com.apple.quarantine /Applications/Zona21.app
```

### Erro: Porta 5174 em uso

```bash
# Matar processo na porta
lsof -ti:5174 | xargs kill -9

# Ou usar porta diferente
VITE_DEV_SERVER_URL=http://localhost:5175 npm run electron:dev
```

### Erro: Architecture Mismatch

```bash
# Rebuild dependências nativas
npx electron-rebuild

# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
npx electron-rebuild
```

### Performance Lenta

1. Verifique espaço em disco (>10GB livre)
2. Aumente cache de thumbnails nas Preferences
3. Use SSD para armazenamento de mídia
4. Feche outros aplicativos pesados

## 📁 Estrutura de Arquivos

```
~/Library/Application Support/Zona21/
├── database.sqlite        # Banco de dados principal
├── cache/                 # Thumbnails e previews
├── logs/                  # Logs da aplicação
└── update-settings.json   # Config de auto-update

~/Pictures/Zona21/         # Padrão para importação
```

## 🔄 Atualizações

O Zona21 verifica automaticamente por atualizações:

1. Menu Preferences → Updates
2. Toggle "Auto-check for updates"
3. Clique "Check for Updates" para verificação manual
4. Updates baixados automaticamente
5. "Install" para aplicar atualização

## 📊 Performance

### Métricas Esperadas

- **Startup**: <3 segundos
- **Import**: 1000 arquivos/min
- **Thumbnail generation**: 50 thumbs/min
- **Search**: <500ms para 100k itens

### Otimizações

- Use exFSS/APFS para volumes externos
- Mantenha 20% de espaço livre no disco
- Desative indexação de pastas desnecessárias

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/Almar-cyber/zona21/issues)
- **Logs**: Help → Export Logs para reportar problemas
- **FAQ**: Ver [Wiki](https://github.com/Almar-cyber/zona21/wiki)

---

**Versão**: 0.2.0  
**Atualizado**: Janeiro 2024
