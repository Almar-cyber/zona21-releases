#!/bin/bash
set -e

# Zona21 Release Script - macOS arm64 only
# Build local e rápido focado em desenvolvimento até v1.0

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Uso: ./scripts/release-mac.sh <versão>"
  echo "Exemplo: ./scripts/release-mac.sh 0.5.0"
  exit 1
fi

echo "🚀 Iniciando release macOS v$VERSION"
echo ""

# 1. Atualizar versão no package.json
echo "📝 Atualizando versão para $VERSION..."
npm version $VERSION --no-git-tag-version

# 2. Build macOS arm64 (rápido, só sua arquitetura)
echo ""
echo "🍎 Building macOS arm64..."
npm run electron:build:mac:arm64

# 3. Commit e tag
echo ""
echo "📦 Criando commit e tag v$VERSION..."
git add package.json package-lock.json
git commit -m "chore(release): v$VERSION

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git tag -a "v$VERSION" -m "Release v$VERSION"

# 4. Push
echo ""
echo "⬆️  Fazendo push para GitHub..."
git push origin main
git push origin "v$VERSION"

echo ""
echo "✅ Release v$VERSION concluída!"
echo ""
echo "📦 Build disponível em:"
echo "   release/Zona21-$VERSION-arm64.dmg"
echo ""
echo "🎯 Foco na v1.0 - Windows/Linux depois!"
