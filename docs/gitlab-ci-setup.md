# GitLab CI Setup - Build Windows/Linux Gratuito

Este guia explica como configurar o GitLab CI para builds de Windows e Linux gratuitos, mantendo builds macOS locais.

## 🎯 Benefícios

- **400 minutos/mês grátis** no GitLab (vs. 2000 min no GitHub que você não tem)
- **Builds Windows e Linux** sem custo
- **Auto-update funciona igual** - publica no GitHub Releases
- **macOS local** - você tem Mac, build é rápido e grátis

## 📋 Setup (5 minutos)

### 1. Criar conta no GitLab

1. Acesse https://gitlab.com/users/sign_up
2. Crie conta gratuita
3. Confirme email

### 2. Criar projeto e espelhar do GitHub

```bash
# No GitLab, crie um novo projeto
# Settings → Repository → Mirroring repositories

# Configurar mirror do GitHub
Mirror direction: Pull
Git repository URL: https://github.com/Almar-cyber/zona21.git
Mirror only protected branches: No
Authentication: Password
Password: [seu GitHub Personal Access Token]
```

Ou criar projeto direto:

```bash
# Importar do GitHub
New Project → Import Project → GitHub
Selecionar: zona21
```

### 3. Adicionar variável de ambiente

No GitLab:
```
Settings → CI/CD → Variables → Add variable

Key: GH_PAT_RELEASES
Value: [seu GitHub Personal Access Token]
Protected: Yes
Masked: Yes
```

### 4. Ativar CI/CD

```
Settings → CI/CD → Runners
Ensure: "Enable shared runners for this project" está ON
```

### 5. Testar

```bash
# Push uma tag (vai triggar o CI)
git tag v0.4.9-test
git push origin v0.4.9-test

# Verificar no GitLab: Build → Pipelines
```

## 🚀 Workflow de Release

### Método Automatizado (Recomendado)

```bash
# Dar permissão de execução
chmod +x scripts/release.sh

# Rodar script de release
./scripts/release.sh 0.4.9
```

O script faz:
1. ✅ Atualiza versão
2. ✅ Build macOS (local, rápido)
3. ✅ Commit e tag
4. ✅ Push (triggera GitLab CI)
5. ✅ Upload macOS para GitHub Releases (draft)

Depois:
6. ⏳ Aguardar GitLab CI buildar Windows/Linux (~15 min)
7. ✅ Publicar release draft no GitHub

### Método Manual

```bash
# 1. Build macOS local
npm run electron:build:mac:all

# 2. Tag e push
git tag v0.4.9
git push origin v0.4.9

# 3. Aguardar GitLab CI (~15 min)
# Verifica: https://gitlab.com/seu-usuario/zona21/-/pipelines

# 4. Download artifacts do GitLab e upload manual no GitHub
gh release create v0.4.9 \
  --repo Almar-cyber/zona21-releases \
  release/*.dmg \
  release/*.AppImage \
  release/*.exe
```

## 📊 Comparação

| Aspecto | GitHub Actions (atual) | GitLab CI (proposto) |
|---------|----------------------|---------------------|
| **Custo** | ❌ Billing bloqueado | ✅ Grátis (400 min/mês) |
| **macOS** | ⚠️ Precisa Actions | ✅ Local (grátis) |
| **Windows** | ❌ Bloqueado | ✅ GitLab CI |
| **Linux** | ❌ Bloqueado | ✅ GitLab CI |
| **Auto-update** | ✅ Funciona | ✅ Funciona igual |
| **Setup** | ✅ Já configurado | ⚠️ 5 min setup |

## 🔧 Troubleshooting

### Pipeline falha com "No runner available"

**Solução:**
```
Settings → CI/CD → Runners
Enable "Enable shared runners for this project"
```

### Erro "GH_PAT_RELEASES not set"

**Solução:**
```
Settings → CI/CD → Variables
Add: GH_PAT_RELEASES = [seu token]
```

### Build macOS local demora muito

**Solução:**
```bash
# Build só arm64 (mais rápido)
npm run electron:build:mac:arm64

# Ou desabilitar sourcemap
# vite.config.ts: sourcemap: false
```

## 📝 Notas

- GitLab CI roda em Docker (Linux)
- Windows build usa Wine (cross-compile)
- Arquivos ficam em `release/` localmente
- Auto-update busca do `zona21-releases` (GitHub)
- GitLab CI pode buildar PRs também (grátis!)

## 🎉 Vantagens do Setup Híbrido

1. **Sem custo mensal** - GitLab Free é suficiente
2. **Builds macOS rápidos** - local no seu Mac
3. **Automação completa** - script de release
4. **Flexível** - pode rodar só GitLab ou só local
5. **Auto-update funciona** - publica no GitHub Releases normalmente
