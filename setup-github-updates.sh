#!/bin/bash

# Script para configurar auto-update com GitHub Releases

echo "🚀 Configurando Auto-Update com GitHub Releases"
echo "=============================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
GITHUB_OWNER="seu-usuario"  # ALTERAR para seu username
GITHUB_REPO="zona21"        # ALTERAR se necessário
GITHUB_TOKEN="seu-token"    # ALTERAR para seu token

echo -e "${YELLOW}⚠️  Antes de continuar, você precisa:${NC}"
echo "1. Criar um Personal Access Token no GitHub"
echo "2. Dar permissão 'repo' ao token"
echo "3. Alterar as variáveis acima (GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN)"
echo ""
read -p "Pressione ENTER após configurar..."

# Atualizar package.json para usar electron-builder
echo ""
echo "📦 Configurando package.json..."
npm install electron-builder --save-dev

# Criar configuração do electron-builder
cat > electron-builder.config.js << 'EOF'
module.exports = {
  appId: 'com.zona21.app',
  productName: 'Zona21',
  directories: {
    output: 'dist'
  },
  files: [
    'build/**/*',
    'node_modules/**/*',
    'electron/main/**/*',
    'electron/preload/**/*',
    'public/electron.js'
  ],
  mac: {
    category: 'public.app-category.photography',
    target: [
      {
        target: 'dmg',
        arch: ['arm64', 'x64']
      },
      {
        target: 'zip',
        arch: ['arm64', 'x64']
      }
    ],
    icon: 'assets/icon.icns'
  },
  publish: {
    provider: 'github',
    owner: 'seu-usuario',  // ALTERAR
    repo: 'zona21',       // ALTERAR
    private: false,
    releaseType: 'release'
  }
};
EOF

# Atualizar package.json
echo ""
echo "📝 Atualizando package.json..."
npm pkg set scripts.build="npm run build:frontend && npm run build:electron"
npm pkg set scripts.build:frontend="vite build"
npm pkg set scripts.build:electron="electron-builder --mac --publish always"
npm pkg set scripts.dist="npm run build:electron"

# Instalar dependências
echo ""
echo "📥 Instalando dependências..."
npm install --save-dev electron-builder

# Criar script de release
cat > scripts/release.sh << 'EOF'
#!/bin/bash

echo "🚀 Criando Release no GitHub"
echo "==========================="

# Build e publish
npm run dist

echo ""
echo "✅ Release criado com sucesso!"
echo "📋 Check no GitHub: Releases"
EOF

chmod +x scripts/release.sh

# Atualizar código do update para GitHub
echo ""
echo "🔧 Atualizando código do updater..."
cat > electron/updater-github.js << 'EOF'
const { autoUpdater } = require('electron-updater');
const { app, dialog } = require('electron');

// Configurar para GitHub Releases
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'seu-usuario',  // ALTERAR
  repo: 'zona21',        // ALTERAR
  private: false
});

autoUpdater.checkForUpdatesAndNotify();

module.exports = { autoUpdater };
EOF

echo ""
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "1. Altere GITHUB_OWNER, GITHUB_REPO e GITHUB_TOKEN nos arquivos"
echo "2. Execute: npm run dist"
echo "3. O app será buildado e publicado no GitHub"
echo ""
echo "🔗 URLs de download serão:"
echo "   https://github.com/seu-usuario/zona21/releases/latest"
echo ""
