#!/bin/bash

# Script de instalação automática - Zona21
# Uso: curl -sSL https://seu-dominio.com/install.sh | bash

set -e

echo "🚀 Instalando Zona21..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Verificar se está no macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "Este script é apenas para macOS"
    exit 1
fi

# Download da versão mais recente
VERSION="0.2.1"
DMG_URL="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-${VERSION}.dmg"
DMG_PATH="$HOME/Downloads/Zona21-${VERSION}.dmg"
APP_PATH="/Applications/Zona21.app"

echo "📥 Baixando Zona21 v${VERSION}..."
if curl -L -o "$DMG_PATH" "$DMG_URL"; then
    print_success "Download concluído"
else
    print_error "Falha no download"
    exit 1
fi

# Remover quarentena
echo ""
echo "🔓 Removendo quarentena..."
if sudo xattr -rd com.apple.quarantine "$DMG_PATH" 2>/dev/null; then
    print_success "Quarentena removida"
else
    print_warning "Não foi possível remover quarentena (mas pode funcionar assim mesmo)"
fi

# Montar DMG
echo ""
echo "📂 Montando DMG..."
MOUNT_DIR=$(hdiutil attach "$DMG_PATH" | grep "/Volumes" | awk '{print $3}')

if [[ -z "$MOUNT_DIR" ]]; then
    print_error "Falha ao montar DMG"
    exit 1
fi

print_success "DMG montado em $MOUNT_DIR"

# Copiar app
echo ""
echo "📋 Copiando para Applications..."
if [[ -d "$APP_PATH" ]]; then
    echo "Removendo versão anterior..."
    rm -rf "$APP_PATH"
fi

if cp -R "$MOUNT_DIR/Zona21.app" "/Applications/"; then
    print_success "Zona21 instalado em /Applications"
else
    print_error "Falha ao copiar app"
    hdiutil detach "$MOUNT_DIR" >/dev/null 2>&1
    exit 1
fi

# Desmontar DMG
echo ""
echo "📁 Limpando..."
hdiutil detach "$MOUNT_DIR" >/dev/null 2>&1
rm "$DMG_PATH"

print_success "Instalação concluída!"

# Abrir app
echo ""
echo "🎉 Abrindo Zona21..."
open "$APP_PATH"

echo ""
print_success "Zona21 está pronto para usar!"
echo ""
echo "📖 Dicas:"
echo "   • Cmd + , abre Preferences"
echo "   • Help → Export Logs para problemas"
echo "   • O app buscará atualizações automaticamente"
echo ""
