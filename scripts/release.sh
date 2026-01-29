#!/bin/bash
set -e

# Zona21 Release Script
# Builds macOS locally and triggers GitLab CI for Windows/Linux

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Uso: ./scripts/release.sh <versão>"
  echo "Exemplo: ./scripts/release.sh 0.4.9"
  exit 1
fi

echo "🚀 Iniciando release v$VERSION"
echo ""

# 1. Atualizar versão no package.json
echo "📝 Atualizando versão para $VERSION..."
npm version $VERSION --no-git-tag-version

# 2. Build macOS (local)
echo ""
echo "🍎 Building macOS (arm64 + x64)..."
npm run electron:build:mac:all

# 3. Commit e tag
echo ""
echo "📦 Criando commit e tag v$VERSION..."
git add package.json README.md
git commit -m "chore(release): v$VERSION

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git tag -a "v$VERSION" -m "Release v$VERSION"

# 4. Push para GitHub (triggera GitLab mirror)
echo ""
echo "⬆️  Fazendo push para GitHub..."
git push origin main
git push origin "v$VERSION"

# 5. Upload builds macOS para GitHub Releases
echo ""
echo "📤 Uploading macOS builds para zona21-releases..."

if [ ! -f release/Zona21-$VERSION-arm64.dmg ]; then
  echo "❌ Build macOS não encontrado!"
  exit 1
fi

gh release create "v$VERSION" \
  --repo Almar-cyber/zona21-releases \
  --title "v$VERSION" \
  --notes "🎨 Site Beta Melhorado - Auto-release via script local + GitLab CI" \
  --draft \
  release/Zona21-$VERSION*.dmg \
  release/Zona21-$VERSION*.dmg.blockmap \
  release/Zona21-$VERSION*-mac.zip \
  release/Zona21-$VERSION*-mac.zip.blockmap

echo ""
echo "✅ Release draft criada!"
echo ""
echo "📋 Próximos passos:"
echo "1. GitLab CI está buildando Windows/Linux (verifique em https://gitlab.com)"
echo "2. Quando os builds terminarem, publique a release draft"
echo "3. URL: https://github.com/Almar-cyber/zona21-releases/releases/tag/v$VERSION"
echo ""
echo "🎉 Release v$VERSION iniciada com sucesso!"
