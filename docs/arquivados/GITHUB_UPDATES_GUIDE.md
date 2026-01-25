# 🚀 Auto-Update com GitHub Releases - Guia Completo

## ✅ Configuração Concluída

Já configurei o Zona21 para usar GitHub Releases para auto-update!

## 📋 O que foi feito:

### 1. **Configuração do electron-builder**
- ✅ Adicionado ao package.json
- ✅ Configurado para GitHub Releases
- ✅ Build para macOS (ARM64)

### 2. **Código do Updater**
- ✅ Atualizado para GitHub
- ✅ Banner com progresso mantido
- ✅ Feed URL: GitHub Releases

### 3. **Scripts de Release**
- ✅ Script automático (`scripts/github-release.sh`)
- ✅ Build e publish em um comando

## 🚀 Como Usar

### Primeiro Release:

1. **Instalar GitHub CLI** (se não tiver):
   ```bash
   brew install gh
   gh auth login
   ```

2. **Fazer o build e release**:
   ```bash
   chmod +x scripts/github-release.sh
   ./scripts/github-release.sh
   ```

3. **Pronto!** O release será criado com:
   - DMG (129MB)
   - ZIP (142MB)
   - Notas de lançamento

### URLs de Download:

Após o release, os downloads serão:
- **DMG**: https://github.com/alexiaolivei/zona21/releases/latest/download/Zona21-0.2.1-arm64.dmg
- **ZIP**: https://github.com/alexiaolivei/zona21/releases/latest/download/Zona21-0.2.1-mac.zip

## 🔄 Teste do Auto-Update

### Para testar:

1. **Instale uma versão antiga** (v0.2.0)
2. **Abra o app**
3. **Banner aparece**: "🔔 Atualização disponível!"
4. **Clique em "Atualizar agora"**
5. **Vai baixar automaticamente** do GitHub
6. **Instala e reinicia** ✅

## 📱 Para Testers

Envie estas instruções:

### Download Direto:
```
1. Baixe: https://github.com/alexiaolivei/zona21/releases/latest/download/Zona21-0.2.1-arm64.dmg
2. Botão direito → Abrir
3. Arraste para Applications
```

### Auto-Update:
```
1. Instale a v0.2.0
2. Abra o app
3. Banner aparece com opção de atualizar
4. Siga o fluxo automático
```

## 🎯 Vantagens do GitHub Releases

### ✅ Benefícios:
- **Sem limite de tamanho** (diferente do R2)
- **Downloads rápidos** (CDN do GitHub)
- **Versionamento automático**
- **Notas de lançamento**
- **Estatísticas de download**
- **Grátis e ilimitado**

### 📊 URLs Sempre Funcionam:
- `/latest` - Última versão
- `/download/nome-do-arquivo` - Download direto
- API para check de updates

## 🛠️ Comandos Úteis

```bash
# Build apenas (sem publicar)
npm run electron:build:mac:arm64

# Build e publicar
npm run electron:publish

# Script completo
./scripts/github-release.sh
```

## 📝 Próximos Passos

1. **Testar localmente**:
   ```bash
   npm run electron:dev
   ```

2. **Criar release**:
   ```bash
   ./scripts/github-release.sh
   ```

3. **Testar update** com versão anterior

---

**O auto-update com GitHub está 100% configurado!** 🎉

Basta criar o primeiro release e tudo funcionará automaticamente!
