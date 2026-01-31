# 🔗 URLs de Download - Zona21 v0.2.1

## ⚠️ Problema: GitHub Releases dando 404

Os arquivos foram upados mas as URLs de download estão retornando 404.

## 📋 Status Atual

### Release Criado:
- ✅ URL: https://github.com/Almar-cyber/zona21/releases/tag/v0.2.1
- ✅ Assets uploaded (DMG 229MB, ZIP 221MB)
- ❌ URLs de download: 404

## 🛠️ Soluções Alternativas

### 1. Download Direto da Página
```
1. Acesse: https://github.com/Almar-cyber/zona21/releases/tag/v0.2.1
2. Clique nos arquivos para baixar
3. Funciona pelo navegador
```

### 2. Usar GitHub CLI
```bash
gh release download v0.2.1 --repo Almar-cyber/zona21
```

### 3. Transferir para Outro Servidor
- Upload para Google Drive
- Upload para WeTransfer
- Usar CDN alternativo

### 4. Criar Release em Novo Repo
- Criar novo repositório público
- Fazer upload lá
- Usar URLs estáveis

## 🎯 Para Testers Imediato

### Opção A - Download Manual:
1. Visite: https://github.com/Almar-cyber/zona21/releases/tag/v0.2.1
2. Clique em "Zona21-0.2.1-arm64.dmg"
3. Salve o arquivo
4. Botão direito → Abrir → Arrastar para Applications

### Opção B - GitHub CLI:
```bash
# Instalar se não tiver
brew install gh

# Login (já feito)
# Baixar
gh release download v0.2.1 --repo Almar-cyber/zona21

# Instalar
open Zona21-0.2.1-arm64.dmg
```

## 🔍 Causa do 404

Pode ser:
- GitHub ainda processando os arquivos grandes
- Configuração de privacidade do repositório
- Rate limiting
- Cache do GitHub

## ✅ Próximos Passos

1. **Tentar download manual** pelo navegador
2. **Se funcionar**, instruir testers a usar esse método
3. **Se não funcionar**, mover para outro servidor
4. **Corrigir configuração** para futuros releases

---

**Por enquanto, use o download direto da página do GitHub!**
