# 🚀 Comando de Uma Linha para Upload

## 📋 Cole este comando no terminal (substitua as credenciais):

```bash
# Substitua SUA_ACCESS_KEY e SEU_SECRET_KEY abaixo:
export AWS_ACCESS_KEY_ID="SUA_ACCESS_KEY" && \
export AWS_SECRET_ACCESS_KEY="SEU_SECRET_KEY" && \
export AWS_ENDPOINT_URL="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev" && \
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID" && \
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY" && \
aws configure set default.region us-east-1 && \
aws configure set default.output json && \
echo "📦 Criando bucket..." && \
aws s3 mb s3://zona21 --endpoint-url "$AWS_ENDPOINT_URL" 2>/dev/null || true && \
echo "📤 Uploading arquivos..." && \
aws s3 cp release/Zona21-0.2.1-arm64-mac.zip s3://zona21/ --endpoint-url "$AWS_ENDPOINT_URL" && \
aws s3 cp release/Zona21-0.2.1-arm64.dmg s3://zona21/ --endpoint-url "$AWS_ENDPOINT_URL" && \
aws s3 cp release/Zona21-0.2.1-mac.zip s3://zona21/ --endpoint-url "$AWS_ENDPOINT_URL" && \
aws s3 cp release/latest-mac.yml s3://zona21/ --endpoint-url "$AWS_ENDPOINT_URL" && \
echo "✅ Upload completo!" && \
echo "🔗 URL: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/latest-mac.yml"
```

## 📝 Instruções:

1. **Copie o comando acima**
2. **Substitua** `SUA_ACCESS_KEY` pelo seu Access Key ID
3. **Substitua** `SEU_SECRET_KEY` pelo seu Secret Access Key
4. **Cole** no terminal e pressione Enter

## 🔍 Verificar Upload:

```bash
export AWS_ENDPOINT_URL="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev"
aws s3 ls s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL
```

## ⚠️ Importante:

- Mantenha as credenciais seguras
- O comando cria o bucket se não existir
- Upload todos os arquivos necessários para auto-update
