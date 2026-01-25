#!/bin/bash

# Configurar acesso público R2 via Dashboard Cloudflare

echo "🔧 Configurando Acesso Público - R2"
echo "==================================="
echo ""
echo "1. Acesse: https://dash.cloudflare.com/"
echo "2. Vá para: R2 Object Storage"
echo "3. Selecione o bucket: zona21"
echo "4. Clique em 'Settings'"
echo "5. Procure por: 'Public URL'"
echo "6. Ative: 'Allow public access'"
echo "7. Salve as alterações"
echo ""
echo "📋 URLs após configuração:"
echo "DMG: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/zona21/Zona21-0.2.0.dmg"
echo "YAML: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/zona21/latest-mac.yml"
echo ""
echo "⏳ Após configurar, espere 1-2 minutos para propagar"
echo ""

# Testar se as URLs estão acessíveis
echo "🧪 Testando URLs atuais..."
echo ""

# Testar YAML (pequeno)
echo "Testando latest-mac.yml..."
if curl -s -f https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/zona21/latest-mac.yml > /dev/null; then
    echo "✅ latest-mac.yml acessível"
else
    echo "❌ latest-mac.yml não acessível"
fi

# Testar DMG (grande)
echo "Testando Zona21-0.2.0.dmg (primeiros 1MB)..."
if curl -s -f -r 0-1048576 https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/zona21/Zona21-0.2.0.dmg > /dev/null; then
    echo "✅ DMG acessível"
else
    echo "❌ DMG não acessível"
fi

echo ""
echo "📝 Se os arquivos ainda não estiverem acessíveis:"
echo "1. Verifique se 'Public URL' está ativo no dashboard"
echo "2. Aguarde mais tempo para propagação"
echo "3. Limpe o cache: curl -H 'Cache-Control: no-cache' <url>"
