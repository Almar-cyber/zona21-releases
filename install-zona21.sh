#!/bin/bash

# Zona21 - Script de Instalação Automática para macOS
# Versão: 1.0
# Compatibilidade: macOS 11+ (Big Sur e superior)

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs base (atualizar com URL real do R2)
BASE_URL="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21"

# Banner
echo ""
echo "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo "${BLUE}║                                       ║${NC}"
echo "${BLUE}║         ZONA21 INSTALLER              ║${NC}"
echo "${BLUE}║   Media Ingestion & Cataloging Tool   ║${NC}"
echo "${BLUE}║                                       ║${NC}"
echo "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Verificar se está rodando no macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "${RED}❌ Erro: Este script é apenas para macOS${NC}"
    exit 1
fi

# Detectar arquitetura
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    FILE="Zona21-latest-arm64.dmg"
    echo "${GREEN}✓${NC} Detectado: Apple Silicon (M1/M2/M3)"
elif [ "$ARCH" = "x86_64" ]; then
    FILE="Zona21-latest-x64.dmg"
    echo "${GREEN}✓${NC} Detectado: Intel x64"
else
    echo "${RED}❌ Arquitetura não suportada: $ARCH${NC}"
    exit 1
fi

# Verificar versão do macOS
OS_VERSION=$(sw_vers -productVersion)
MAJOR_VERSION=$(echo "$OS_VERSION" | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 11 ]; then
    echo "${RED}❌ Zona21 requer macOS 11 (Big Sur) ou superior${NC}"
    echo "${YELLOW}   Você está rodando macOS $OS_VERSION${NC}"
    exit 1
fi

echo "${GREEN}✓${NC} macOS $OS_VERSION compatível"
echo ""

# Verificar se já existe instalação
if [ -d "/Applications/Zona21.app" ]; then
    echo "${YELLOW}⚠️  Zona21 já está instalado em /Applications${NC}"
    read -p "Deseja reinstalar/atualizar? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "${BLUE}ℹ️  Instalação cancelada${NC}"
        exit 0
    fi
    echo "${YELLOW}→ Removendo versão antiga...${NC}"
    rm -rf /Applications/Zona21.app
fi

# Criar diretório temporário
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Download
echo ""
echo "${YELLOW}⏬ Baixando Zona21...${NC}"
echo "${BLUE}   URL: $BASE_URL/$FILE${NC}"

if ! curl -L -o Zona21.dmg "$BASE_URL/$FILE" --progress-bar; then
    echo ""
    echo "${RED}❌ Erro no download${NC}"
    echo "${YELLOW}   Verifique sua conexão com a internet${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

FILE_SIZE=$(du -h Zona21.dmg | cut -f1)
echo "${GREEN}✓${NC} Download completo ($FILE_SIZE)"

# Remover atributos de quarentena
echo ""
echo "${YELLOW}🔓 Removendo quarentena...${NC}"
xattr -cr Zona21.dmg
echo "${GREEN}✓${NC} Quarentena removida"

# Montar DMG
echo ""
echo "${YELLOW}💿 Montando DMG...${NC}"
if ! hdiutil attach Zona21.dmg -nobrowse -quiet; then
    echo "${RED}❌ Erro ao montar DMG${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

# Aguardar montagem
sleep 2

# Verificar se volume foi montado
if [ ! -d "/Volumes/Zona21" ]; then
    echo "${RED}❌ Erro: Volume Zona21 não encontrado${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

echo "${GREEN}✓${NC} DMG montado"

# Copiar para Applications
echo ""
echo "${YELLOW}📁 Instalando em /Applications...${NC}"
if ! cp -R /Volumes/Zona21/Zona21.app /Applications/; then
    echo "${RED}❌ Erro ao copiar para Applications${NC}"
    echo "${YELLOW}   Você pode precisar de permissões de administrador${NC}"
    hdiutil detach /Volumes/Zona21 -quiet 2>/dev/null
    rm -rf "$TMP_DIR"
    exit 1
fi

echo "${GREEN}✓${NC} App instalado"

# Remover quarentena do app
echo ""
echo "${YELLOW}🔓 Configurando permissões...${NC}"
xattr -cr /Applications/Zona21.app
echo "${GREEN}✓${NC} Permissões configuradas"

# Desmontar DMG
echo ""
echo "${YELLOW}💿 Desmontando DMG...${NC}"
hdiutil detach /Volumes/Zona21 -quiet
echo "${GREEN}✓${NC} DMG desmontado"

# Limpar arquivos temporários
rm -rf "$TMP_DIR"
echo "${GREEN}✓${NC} Arquivos temporários removidos"

# Sucesso!
echo ""
echo "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo "${GREEN}║                                       ║${NC}"
echo "${GREEN}║   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO ║${NC}"
echo "${GREEN}║                                       ║${NC}"
echo "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo "${BLUE}Zona21 foi instalado em:${NC} /Applications/Zona21.app"
echo ""
echo "${YELLOW}⚠️  IMPORTANTE - Primeira execução:${NC}"
echo ""
echo "   1. Vá em Applications (Cmd+Shift+A)"
echo "   2. Localize o app ${BLUE}Zona21${NC}"
echo "   3. ${YELLOW}Segure Control (Ctrl)${NC} e clique no app"
echo "   4. Selecione ${GREEN}'Abrir'${NC}"
echo "   5. Confirme clicando ${GREEN}'Abrir'${NC} novamente"
echo ""
echo "${BLUE}Ou execute via Terminal:${NC}"
echo "   ${GREEN}open /Applications/Zona21.app${NC}"
echo ""
echo "${BLUE}Próximas execuções:${NC}"
echo "   Clique normalmente no app (Launchpad ou Spotlight)"
echo ""
echo "${BLUE}Documentação:${NC} https://zona21.app/docs"
echo "${BLUE}Suporte:${NC} suporte@zona21.app"
echo ""

# Perguntar se quer abrir agora
read -p "Deseja abrir o Zona21 agora? (s/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo "${YELLOW}🚀 Abrindo Zona21...${NC}"
    sleep 1
    open /Applications/Zona21.app
    echo "${GREEN}✓${NC} App aberto!"
fi

echo ""
echo "${BLUE}Obrigado por usar Zona21! 🎉${NC}"
echo ""
