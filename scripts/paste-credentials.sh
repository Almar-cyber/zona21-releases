#!/bin/bash

# Cole suas credenciais R2 aqui
# =========================
# 1. Substitua SUA_ACCESS_KEY pelo seu Access Key ID
# 2. Substitua SEU_SECRET_KEY pelo seu Secret Access Key
# 3. Execute este script

# ===== EDITE AS LINHAS ABAIXO =====
export AWS_ACCESS_KEY_ID="SUA_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="SEU_SECRET_KEY"
# =================================

echo "🔧 Configurando credenciais R2..."
echo ""

# Verificar se as credenciais foram substituídas
if [[ "$AWS_ACCESS_KEY_ID" == "SUA_ACCESS_KEY" ]]; then
    echo "❌ Por favor, edite este script e substitua as credenciais!"
    echo "   Abra: nano scripts/paste-credentials.sh"
    exit 1
fi

# Configurar AWS CLI
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set default.region us-east-1
aws configure set default.output json

echo "✅ AWS CLI configurada!"
echo ""

# Endpoint
export AWS_ENDPOINT_URL="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev"

# Testar conexão
echo "🧪 Testando conexão com R2..."
if aws s3 ls s3://zona21 --endpoint-url "$AWS_ENDPOINT_URL" >/dev/null 2>&1; then
    echo "✅ Bucket 'zona21' encontrado!"
else
    echo "📦 Criando bucket 'zona21'..."
    aws s3 mb s3://zona21 --endpoint-url "$AWS_ENDPOINT_URL" || echo "⚠️ Bucket pode já existir ou sem permissão"
fi

echo ""
echo "🚀 Fazendo upload dos arquivos..."
echo ""

# Upload dos arquivos
FILES=(
    "Zona21-0.2.1-arm64-mac.zip"
    "Zona21-0.2.1-arm64.dmg"
    "Zona21-0.2.1-mac.zip"
    "latest-mac.yml"
)

for file in "${FILES[@]}"; do
    echo "📤 Uploading $file..."
    if aws s3 cp "release/$file" "s3://zona21/$file" --endpoint-url "$AWS_ENDPOINT_URL"; then
        echo "✅ $file uploaded!"
    else
        echo "❌ Falha no upload de $file"
    fi
done

echo ""
echo "🎉 Upload completo!"
echo ""
echo "📋 Verificar arquivos:"
echo "aws s3 ls s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL"
echo ""
echo "🔗 URL do update:"
echo "https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/latest-mac.yml"
