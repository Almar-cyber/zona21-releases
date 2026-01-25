# 🔧 Configurar Acesso Público no Cloudflare R2

## ⚠️ Problema Atual
Os arquivos estão no R2 mas não acessíveis publicamente (404).

## 📋 Solução - Dashboard Cloudflare

### Passo 1: Acessar Dashboard
1. Vá para: https://dash.cloudflare.com/
2. Faça login

### Passo 2: Navegar até R2
1. No menu lateral → **R2 Object Storage**
2. Selecione o bucket: **zona21**

### Passo 3: Configurar Public URL
1. Clique na aba **Settings**
2. Procure por: **"Public URL"**
3. Ative a opção: **"Allow public access"**
4. Clique em **Save**

### Passo 4: Verificar Domínio
Após ativar, anote o domínio público:
- Deve ser algo como: `https://pub-xxxx.r2.dev`

## 🧪 Testar Após Configurar

1. **Espere 2-3 minutos** para propagar
2. Teste no navegador:
   ```
   https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/test.txt
   ```
3. Se funcionar, teste o DMG:
   ```
   https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.1-arm64.dmg
   ```

## 📱 Links Corretos (após configurar)

- **v0.2.1 DMG**: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.1-arm64.dmg
- **v0.2.0 DMG**: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-0.2.0.dmg
- **latest-mac.yml**: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/latest-mac.yml

## ⚠️ Importante

- Sem ativar "Public URL", ninguém consegue baixar
- A configuração está no bucket, não nos arquivos
- Depois de ativar, todos os arquivos ficam públicos

## 🚀 Alternativa Enquanto Configura

Use servidor local para testes:
```bash
# Na pasta release
python3 -m http.server 8080
# Acesse: http://localhost:8080/Zona21-0.2.1-arm64.dmg
```

---

**Precisa configurar Public URL no dashboard Cloudflare para os downloads funcionarem!**
