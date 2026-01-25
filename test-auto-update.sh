#!/bin/bash

# Script para testar o fluxo completo de auto-update

echo "🧪 Teste Auto-Update - Zona21"
echo "============================="
echo ""

# 1. Verificar se o servidor está acessível
echo "1️⃣ Verificando servidor..."
echo ""

# Testar YAML
echo "📄 Testando latest-mac.yml..."
if curl -s -f https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/zona21/latest-mac.yml > /dev/null; then
    echo "✅ latest-mac.yml acessível"
    echo "📋 Conteúdo:"
    curl -s https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/zona21/latest-mac.yml | head -5
    echo ""
else
    echo "❌ latest-mac.yml NÃO acessível"
    echo "   Configure 'Public URL' no dashboard Cloudflare"
    exit 1
fi

# Testar DMG
echo "💿 Testando DMG (primeiros 1MB)..."
if curl -s -f -r 0-1048576 https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/zona21/Zona21-0.2.0.dmg > /dev/null; then
    echo "✅ DMG acessível"
else
    echo "❌ DMG NÃO acessível"
    echo "   Configure 'Public URL' no dashboard Cloudflare"
    exit 1
fi

echo ""
echo "2️⃣ Build e Teste"
echo ""

# Build
echo "🔨 Fazendo build..."
if npm run build; then
    echo "✅ Build concluído"
else
    echo "❌ Build falhou"
    exit 1
fi

echo ""
echo "3️⃣ Instruções de Teste Manual"
echo ""

echo "📋 Para testar o auto-update:"
echo ""
echo "1. Instale a versão 0.2.0:"
echo "   open release/Zona21-0.2.0.dmg"
echo ""
echo "2. Abra o Zona21 0.2.0"
echo ""
echo "3. O banner deve aparecer no topo:"
echo "   '🔔 Atualização disponível!'"
echo ""
echo "4. Clique em 'Atualizar agora'"
echo ""
echo "5. Deve abrir Preferences → Updates"
echo ""
echo "6. Clique 'Check for Updates'"
echo ""
echo "7. Deve detectar v0.2.1"
echo ""
echo "8. Clique 'Download'"
echo "   - Banner muda para 'Baixando atualização...'"
echo "   - Barra de progresso aparece"
echo ""
echo "9. Após download:"
echo "   - Botão muda para 'Install'"
echo "   - Clique para instalar"
echo ""
echo "🔍 Logs para verificar:"
echo "   Help → Export Logs"
echo "   Procurar por: 'update', 'download', 'progress'"
echo ""

echo "✅ Teste automático concluído!"
echo "📝 Siga as instruções acima para teste manual"
