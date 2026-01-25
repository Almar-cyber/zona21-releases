#!/bin/bash

# Script para upload do release para o Cloudflare R2

set -e

VERSION="0.2.1"
BUCKET="zona21"
RELEASE_DIR="release"

echo "📦 Uploading Zona21 v$VERSION para Cloudflare R2..."

# Verificar se rclone está configurado
if ! rclone lsd zona21: 2>/dev/null; then
    echo "❌ rclone não está configurado para zona21"
    echo "Execute: rclone config create zona21 r2"
    exit 1
fi

# Upload dos arquivos principais
echo "📤 Uploading ZIP ARM64..."
rclone copy "$RELEASE_DIR/Zona21-$VERSION-arm64-mac.zip" "$BUCKET:zona21/" --progress

echo "📤 Uploading DMG ARM64..."
rclone copy "$RELEASE_DIR/Zona21-$VERSION-arm64.dmg" "$BUCKET:zona21/" --progress

echo "📤 Uploading ZIP x64..."
rclone copy "$RELEASE_DIR/Zona21-$VERSION-mac.zip" "$BUCKET:zona21/" --progress

echo "📤 Uploading DMG x64..."
rclone copy "$RELEASE_DIR/Zona21-$VERSION.dmg" "$BUCKET:zona21/" --progress

echo "📤 Uploading latest-mac.yml..."
rclone copy "$RELEASE_DIR/latest-mac.yml" "$BUCKET:zona21/" --progress

# Verificar upload
echo "✅ Verificando arquivos..."
rclone ls "$BUCKET:zona21/" | grep -E "(Zona21-$VERSION|latest-mac.yml)"

echo "🎉 Upload concluído com sucesso!"
echo "📋 URL do update: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/latest-mac.yml"
