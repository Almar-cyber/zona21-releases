#!/bin/bash

# Script para criar release no GitHub

echo "🚀 GitHub Release - Zona21"
echo "========================="
echo ""

# Verificar se está logado no GitHub CLI
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ Não está logado no GitHub CLI"
    echo "Execute: gh auth login"
    exit 1
fi

# Build do app
echo "📦 Building app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build falhou"
    exit 1
fi

# Criar release
echo "📤 Creating GitHub Release..."
gh release create v0.2.1 \
    --title "Zona21 v0.2.1" \
    --notes "## 🎉 Zona21 v0.2.1

### ✨ Novidades:
- 🔄 Auto-update automático via GitHub Releases
- 📱 Menu responsivo (não cobre mais a sidebar)
- 🎨 UI melhorada com loading states e empty states
- 🐛 Correções de bugs e melhorias de performance

### 📦 Downloads:
- **macOS Apple Silicon**: Zona21-0.2.1-arm64.dmg
- **macOS Universal**: Zona21-0.2.1-mac.zip

### 🚀 Como instalar:
1. Baixe o DMG
2. Clique com botão direito → Abrir
3. Arraste para Applications

---
**Auto-update está ativo! O app buscará atualizações automaticamente.**" \
    --latest \
    dist/*.dmg \
    dist/*.zip

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Release criado com sucesso!"
    echo "🔗 Verifique em: https://github.com/alexiaolivei/zona21/releases/latest"
    echo ""
    echo "📋 URLs de download:"
    echo "DMG: https://github.com/alexiaolivei/zona21/releases/latest/download/Zona21-0.2.1-arm64.dmg"
    echo "ZIP: https://github.com/alexiaolivei/zona21/releases/latest/download/Zona21-0.2.1-mac.zip"
else
    echo "❌ Falha ao criar release"
    exit 1
fi
