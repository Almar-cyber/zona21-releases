#!/bin/bash

# Upload simples usando curl (requer pre-signed URLs ou token)

set -e

VERSION="0.2.1"
RELEASE_DIR="release"
BASE_URL="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21"

echo "📦 Upload Zona21 v$VERSION"
echo "================================"

# Função para upload
upload_file() {
    local file=$1
    local url="$BASE_URL/$file"
    
    echo "📤 Uploading $file..."
    
    # Tentativa 1: PUT direto (pode falhar sem autenticação)
    if curl -X PUT "$url" --upload-file "$RELEASE_DIR/$file" -f -s > /dev/null 2>&1; then
        echo "✅ $file uploaded successfully"
        return 0
    fi
    
    # Tentativa 2: POST (se o servidor suportar)
    if curl -X POST "$url" --form "file=@$RELEASE_DIR/$file" -f -s > /dev/null 2>&1; then
        echo "✅ $file uploaded successfully"
        return 0
    fi
    
    echo "❌ Failed to upload $file"
    echo "   Você precisa configurar autenticação ou usar AWS CLI"
    return 1
}

# Upload dos arquivos
FILES=(
    "Zona21-$VERSION-arm64-mac.zip"
    "Zona21-$VERSION-arm64.dmg"
    "Zona21-$VERSION-mac.zip"
    "latest-mac.yml"
)

SUCCESS=0
for file in "${FILES[@]}"; do
    if upload_file "$file"; then
        SUCCESS=$((SUCCESS + 1))
    fi
done

echo ""
echo "📊 Resultado: $SUCCESS/${#FILES[@]} arquivos uploaded"

if [ $SUCCESS -eq ${#FILES[@]} ]; then
    echo "🎉 Todos os arquivos uploaded com sucesso!"
    echo ""
    echo "📋 Para testar o auto-update:"
    echo "1. Baixe e instale a versão 0.2.0"
    echo "2. Abra Preferences → Updates"
    echo "3. Clique 'Check for Updates'"
    echo ""
    echo "🔗 URL do update: $BASE_URL/latest-mac.yml"
else
    echo ""
    echo "⚠️ Upload falhou. Use AWS CLI:"
    echo ""
    echo "aws configure"
    echo "# AWS Access Key ID: [sua key]"
    echo "# AWS Secret Access Key: [seu secret]"
    echo "# Default region: us-east-1"
    echo ""
    echo "export AWS_ENDPOINT_URL=https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev"
    echo "aws s3 cp $RELEASE_DIR/ s3://zona21/ --endpoint-url \$AWS_ENDPOINT_URL --recursive"
fi
