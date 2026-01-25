# 🧪 Teste Auto-Update - Instruções

## ⚠️ Problema Atual
Os arquivos da 0.2.0 foram upados mas não estão acessíveis publicamente. O bucket R2 precisa ser configurado para acesso público.

## 🔄 Solução Temporária - Teste Local

### Opção 1: Usar Servidor Local
```bash
# 1. Iniciar servidor local na pasta release
cd release
python3 -m http.server 8080

# 2. Modificar o feed URL no app (temporariamente)
# No electron/main/index.ts, procure por:
# const updateFeedUrl = 'https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/'
# Mude para:
# const updateFeedUrl = 'http://localhost:8080/'

# 3. Build e teste
npm run build
```

### Opção 2: Instalar Diretamente a 0.2.0
```bash
# Usar o arquivo local
open release/Zona21-0.2.0.dmg

# Instalar normalmente
# Arrastar para Applications
```

### Opção 3: Simular Update
1. Instale a 0.2.0 do arquivo local
2. Abra o app
3. Vá para: Help → Export Logs
4. Procure por "update" para ver se há erros

## 🔧 Configurar Bucket R2 para Acesso Público

### No Dashboard Cloudflare:
1. R2 Object Storage → zona21
2. Settings → Public URL
3. Enable: "Allow public access"
4. Salvar

### Ou via Terraform/CLI:
```bash
# Habilitar acesso público
aws s3api put-public-access-block \
  --bucket zona21 \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
  --endpoint-url https://b4257b955a0413396137f782a8093e8a.r2.cloudflarestorage.com

# Adicionar policy pública
aws s3api put-bucket-policy \
  --bucket zona21 \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::zona21/*"
      }
    ]
  }' \
  --endpoint-url https://b4257b955a0413396137f782a8093e8a.r2.cloudflarestorage.com
```

## 📋 Verificar Configuração

Após configurar:
```bash
# Testar acesso público
curl -I https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.0.dmg

# Deve retornar 200 OK
```

## 🎯 Fluxo de Teste Completo

1. **Configurar bucket** para acesso público
2. **Verificar URLs** estão acessíveis
3. **Instalar 0.2.0**:
   ```bash
   curl -L -o Zona21-0.2.0.dmg "https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.0.dmg"
   open Zona21-0.2.0.dmg
   ```
4. **Abrir app** e ir em Preferences → Updates
5. **Check for Updates** - deve detectar 0.2.1
6. **Download e Install** - fluxo completo

## 📱 Logs para Verificar

```bash
# Help → Export Logs
# Procurar por:
# - "Checking for update"
# - "Update available"
# - "Download progress"
# - "Update downloaded"
# - "Installing update"
```

---

**Enquanto isso:** Você pode testar as correções de UI usando a versão 0.2.1 direto!
