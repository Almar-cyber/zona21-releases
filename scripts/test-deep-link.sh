#!/bin/bash

# Test Deep Link Registration for zona21://

echo "🔍 Testando registro do protocolo zona21://"
echo ""

# Test 1: Try to open deep link
echo "1. Testando abertura do deep link..."
open "zona21://oauth/callback?code=test123" 2>&1

if [ $? -eq 0 ]; then
  echo "   ✅ Deep link pode ser aberto"
else
  echo "   ❌ Falha ao abrir deep link"
  echo "   💡 Execute o app Zona21 primeiro para registrar o protocolo"
fi

echo ""

# Test 2: Check if protocol is registered in Launch Services
echo "2. Verificando registro no Launch Services..."
lsregister="/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister"

if [ -f "$lsregister" ]; then
  result=$($lsregister -dump | grep -i "zona21" | head -5)
  if [ -n "$result" ]; then
    echo "   ✅ Protocolo registrado no sistema:"
    echo "$result"
  else
    echo "   ⚠️  Protocolo não encontrado no Launch Services"
    echo "   💡 Execute o app Zona21 pelo menos uma vez"
  fi
else
  echo "   ⚠️  lsregister não encontrado (normal no macOS moderno)"
fi

echo ""
echo "3. Informações de Debug:"
echo "   App ID: 820805891006941"
echo "   Redirect URI: zona21://oauth/callback"
echo ""
echo "📋 Próximos Passos:"
echo "   1. Execute o Zona21"
echo "   2. Vá em https://developers.facebook.com/apps/820805891006941/"
echo "   3. Instagram Platform API > Configurações"
echo "   4. Adicione 'zona21://oauth/callback' em Valid OAuth Redirect URIs"
echo "   5. Salve e teste novamente"
echo ""
