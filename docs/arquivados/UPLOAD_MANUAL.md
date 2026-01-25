# 📤 Upload Manual para Cloudflare R2

## 🔧 Configuração Necessária

### 1. Obter Credenciais R2

Acesse o dashboard Cloudflare:
1. Cloudflare Dashboard → R2 Object Storage
2. Create R2 Bucket (se não existir)
3. Manage R2 API Tokens → Create API Token
4. Salvar: Access Key ID e Secret Access Key

### 2. Configurar AWS CLI

```bash
# Instalar AWS CLI
brew install awscli

# Configurar credenciais
aws configure
# AWS Access Key ID: [sua access key]
# AWS Secret Access Key: [sua secret key]
# Default region: us-east-1
# Default output format: json
```

### 3. Upload dos Arquivos

```bash
# Configurar endpoint do R2
export AWS_ENDPOINT_URL=https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev

# Upload dos arquivos
aws s3 cp release/Zona21-0.2.1-arm64-mac.zip s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL
aws s3 cp release/Zona21-0.2.1-arm64.dmg s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL
aws s3 cp release/Zona21-0.2.1-mac.zip s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL
aws s3 cp release/Zona21-0.2.1.dmg s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL
aws s3 cp release/latest-mac.yml s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL

# Listar arquivos para confirmar
aws s3 ls s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL
```

## 🧪 Testar Auto-Update

### 1. Instalar Versão Antiga
```bash
# Baixar 0.2.0
curl -L -o Zona21-0.2.0-arm64.dmg "https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.0-arm64.dmg"

# Instalar
open Zona21-0.2.0-arm64.dmg
```

### 2. Verificar Update
1. Abrir Zona21 0.2.0
2. Menu → Preferences → Updates
3. Clicar "Check for Updates"
4. Deve detectar 0.2.1

### 3. Logs
```bash
# Help → Export Logs
# Procurar por "update" nos logs
```

## 📝 Arquivos Necessários

### latest-mac.yml
```yaml
version: 0.2.1
files:
  - url: Zona21-0.2.1-arm64-mac.zip
    sha512: [HASH_DO_ARQUIVO]
    size: [TAMANHO]
  # ... outros arquivos
path: Zona21-0.2.1-arm64-mac.zip
sha512: [HASH_DO_ARQUIVO]
releaseDate: '2026-01-25T17:45:00.000Z'
```

### Gerar Hashes
```bash
cd release
shasum -a 512 Zona21-0.2.1-arm64-mac.zip
```

## 🚀 Alternativas

### Opção 1: rclone com S3
```bash
rclone config create zona21 s3
# Provider: Other
# Endpoint: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev
# Access key: [sua key]
# Secret key: [seu secret]
# Region: us-east-1

rclone copy release/ zona21:zona21/
```

### Opção 2: Cyberduck
- GUI para S3/R2
- Arrastar e soltar arquivos
- Configurar com credenciais R2

### Opção 3: Cloudflare Pages
- Usar Functions para upload
- Formulário web para upload
- Automatizar processo

---

**Importante**: O auto-update só funciona se o `latest-mac.yml` estiver correto e acessível!
