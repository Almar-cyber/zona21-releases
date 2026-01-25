#!/bin/bash

# Script de configuração do Cloudflare R2

echo "🔧 Configuração Cloudflare R2 - Zona21"
echo "======================================"
echo ""

# Endpoint do R2
ENDPOINT="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev"

echo "📋 Informações necessárias:"
echo "1. Acesse: https://dash.cloudflare.com/"
echo "2. Vá para: R2 Object Storage → Create R2 API Token"
echo "3. Salve as credenciais abaixo"
echo ""

# Coletar credenciais
echo -n "AWS Access Key ID: "
read -s AWS_ACCESS_KEY_ID
echo ""
echo -n "AWS Secret Access Key: "
read -s AWS_SECRET_ACCESS_KEY
echo ""
echo ""

# Configurar AWS CLI
echo "⚙️ Configurando AWS CLI..."
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set default.region us-east-1
aws configure set default.output json

echo "✅ AWS CLI configurado!"
echo ""

# Testar conexão
echo "🧪 Testando conexão com R2..."
export AWS_ENDPOINT_URL="$ENDPOINT"

if aws s3 ls s3://zona21 --endpoint-url "$AWS_ENDPOINT_URL" >/dev/null 2>&1; then
    echo "✅ Conexão bem-sucedida!"
else
    echo "⚠️ Bucket 'zona21' não encontrado ou sem permissão"
    echo "   Criando bucket..."
    aws s3 mb s3://zona21 --endpoint-url "$AWS_ENDPOINT_URL" || echo "❌ Falha ao criar bucket"
fi

echo ""
echo "🚀 Pronto para upload!"
echo ""
echo "Para fazer upload dos arquivos, execute:"
echo "./scripts/upload-release.sh"
echo ""
echo "Ou manualmente:"
echo "export AWS_ENDPOINT_URL=$ENDPOINT"
echo "aws s3 cp release/ s3://zona21/ --endpoint-url \$AWS_ENDPOINT_URL --recursive"
