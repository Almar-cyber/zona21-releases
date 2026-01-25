# 🔍 Verificação de Endpoint R2

## 🚨 Problema Identificado

O `latest-mac.yml` funciona mas os DMG/ZIP dão 404.

## 🔍 Diagnóstico

### 1. Arquivos que funcionam:
- ✅ latest-mac.yml (959 bytes)
- ❌ test.txt (5 bytes)
- ❌ DMG/ZIP (100MB+)

### 2. Possíveis Causas:

#### A) Limite de tamanho do R2 Free
- R2 free tier pode ter limite de 1MB por arquivo público
- Arquivos grandes funcionam via signed URLs mas não publicamente

#### B) Configuração de CORS
- Pode haver bloqueio para certos tipos de arquivo

#### C) Cache do Cloudflare
- Pode estar servindo página de erro antiga

## 🛠️ Soluções

### Opção 1: Usar Signed URLs (Recomendado)
```javascript
// Gerar URLs temporárias no backend
const url = await s3.getSignedUrl('getObject', {
  Bucket: 'zona21',
  Key: 'Zona21-0.2.1-arm64.dmg',
  Expires: 3600 // 1 hora
});
```

### Opção 2: Dividir arquivos grandes
- Dividir DMG em partes de 10MB
- Juntar no cliente

### Opção 3: Usar CDN externo
- Upload para GitHub Releases
- Usar JSdelivr ou similar

### Opção 4: Mudar para ZIP menor
- Comprimir melhor o app
- Reduzir para < 50MB

## 🧪 Teste Imediato

1. **Verificar se é limite de tamanho**:
   - Criar arquivo de 2MB e testar
   - Criar arquivo de 10MB e testar

2. **Testar com headers especiais**:
   ```bash
   curl -H "Cache-Control: no-cache" https://pub-.../zona21/Zona21-0.2.1-arm64.dmg
   ```

## 📋 Próximos Passos

1. Confirmar limite de tamanho do R2
2. Implementar solução de signed URLs
3. Ou usar alternativa de CDN

---

**Parece que o R2 tem limite para arquivos grandes no plano gratuito!**
