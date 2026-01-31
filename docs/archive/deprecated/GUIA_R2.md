# 🔑 Guia: Obter Credenciais Cloudflare R2

## 📋 Passo a Passo

### 1. Acessar Dashboard Cloudflare
1. Vá para: https://dash.cloudflare.com/
2. Faça login com sua conta

### 2. Navegar até R2
1. No menu lateral → **R2 Object Storage**
2. Se não tiver bucket, crie um:
   - Click "Create bucket"
   - Nome: `zona21`
   - Location: Escolha a mais próxima

### 3. Criar API Token
1. Em R2 → **Manage R2 API tokens**
2. Click **Create API token**
3. Configurações:
   - Token name: `zona21-upload`
   - Permissions: **Object Read & Write**
   - Bucket: `zona21` (ou deixe em branco para todos)
   - TTL: Deixe padrão

### 4. Salvar Credenciais
Anote as duas informações:
- **Access Key ID**: 32 caracteres (ex: `abc123def456...`)
- **Secret Access Key**: 64 caracteres (ex: `xyz789uvw012...`)

### 5. Usar no Script
Depois de obter as credenciais:

```bash
# Execute o script
./scripts/setup-r2.sh

# Ou configure manualmente:
aws configure
# AWS Access Key ID: [cole aqui]
# AWS Secret Access Key: [cole aqui]
# Default region: us-east-1
# Default output format: json
```

## 🚀 Comandos Rápidos

### Configurar Manualmente
```bash
export AWS_ACCESS_KEY_ID="SEU_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="SEU_SECRET_KEY"
export AWS_DEFAULT_REGION=us-east-1
```

### Upload dos Arquivos
```bash
export AWS_ENDPOINT_URL="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev"

# Upload todos os arquivos
aws s3 cp release/ s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL --recursive

# Verificar upload
aws s3 ls s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL
```

## 🔍 Verificar no Navegador

Após upload, verifique:
- https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/latest-mac.yml

## ⚠️ Importante

- Mantenha as credenciais seguras!
- Não compartilhe o Secret Access Key
- O token tem permissões de leitura/escrita

---

**Precisa de ajuda?** Verifique a documentação: https://developers.cloudflare.com/r2/
