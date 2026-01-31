# 🔧 Troubleshooting - Cloudflare R2

## ❌ Erro Atual
As credenciais não estão funcionando. Erro: `Unknown` ao chamar `GetCallerIdentity`

## 🔍 Verificação

### 1. Verifique as Credenciais
```bash
# Verificar configuração atual
aws configure list

# Deve mostrar:
# access_key : ****************XXXX (env)
# secret_key : ****************XXXX (env)
# region     : us-east-1
```

### 2. Teste Conexão
```bash
# Testar sem endpoint
aws s3 ls

# Se der erro, as credenciais estão incorretas
```

## 🛠️ Soluções

### Opção 1: Obter Novas Credenciais
1. Vá para: https://dash.cloudflare.com/
2. R2 Object Storage → Manage R2 API tokens
3. Delete o token antigo
4. Create new token:
   - Token name: `zona21-upload-v2`
   - Permissions: `Object Read & Write`
   - Bucket: `zona21`

### Opção 2: Verificar Formato
As credenciais devem ser:
- **Access Key ID**: 32 caracteres alfanuméricos
- **Secret Access Key**: 64 caracteres alfanuméricos

### Opção 3: Configurar Corretamente
```bash
# Limpar configuração anterior
aws configure --profile zona21 clear

# Configurar novo perfil
aws configure --profile zona21
# AWS Access Key ID: [cole aqui]
# AWS Secret Access Key: [cole aqui]
# Default region: us-east-1
# Default output format: json

# Usar o perfil
export AWS_PROFILE="zona21"
```

## 🚀 Upload Correto

Após configurar:
```bash
# Endpoint correto
export AWS_ENDPOINT_URL="https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev"

# Upload
aws s3 cp release/ s3://zona21/ --endpoint-url $AWS_ENDPOINT_URL --recursive
```

## 📱 Verificar no Browser

Após upload:
- https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/latest-mac.yml

## ⚠️ Dicas

- As credenciais R2 são diferentes das da AWS
- Verifique se não há espaços extras
- Copie e cole diretamente do dashboard Cloudflare
- O token precisa ter permissão no bucket específico
