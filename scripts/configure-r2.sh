#!/bin/bash

# Configure R2 credentials - Substitua com suas credenciais

# ===== SUBSTITUA ESTAS LINHAS =====
AWS_ACCESS_KEY_ID="SUA_ACCESS_KEY_AQUI"
AWS_SECRET_ACCESS_KEY="SEU_SECRET_KEY_AQUI"
# ================================

# Configurar AWS CLI
echo "⚙️ Configurando AWS CLI..."
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set default.region us-east-1
aws configure set default.output json

echo "✅ Configurado!"
echo ""

# Testar conexão
ENDPOINT="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev"
echo "🧪 Testando conexão..."

if aws s3 ls s3://zona21 --endpoint-url "$ENDPOINT" >/dev/null 2>&1; then
    echo "✅ Bucket existe!"
else
    echo "📦 Criando bucket..."
    aws s3 mb s3://zona21 --endpoint-url "$ENDPOINT"
fi

echo ""
echo "🚀 Pronto para upload!"
echo ""
echo "Execute para upload:"
echo "./scripts/upload-release.sh"
