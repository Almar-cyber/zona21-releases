# Distribuição macOS sem Assinatura de Desenvolvedor

**Guia Completo para Distribuir Zona21 em macOS sem pagar Apple Developer ($99/ano)**

---

## 🎯 Objetivo

Permitir que usuários instalem o Zona21 em seus MacBooks sem:
- Pagar $99/ano pelo Apple Developer Program
- Ter avisos assustadores do macOS Gatekeeper
- Comprometer a segurança do sistema

---

## 🔒 Entendendo o Gatekeeper

### O que é?
O Gatekeeper é o sistema de segurança do macOS que verifica se apps são de desenvolvedores confiáveis.

### Por que bloqueia apps não assinados?
- Proteção contra malware
- Garantir que apps vêm de fontes conhecidas
- Rastrear desenvolvedores em caso de problemas

### Como funciona?
1. Usuário baixa app
2. macOS verifica assinatura digital
3. Se não assinado: mostra aviso ou bloqueia
4. Se assinado e notarizado: abre normalmente

---

## ✅ Solução: Distribuição Manual com Whitelist

### Vantagens
- ✅ **Grátis**: Sem custo recorrente
- ✅ **Rápido**: Funciona imediatamente
- ✅ **Controle total**: Você gerencia a distribuição
- ✅ **Seguro**: Usuário tem controle do que faz

### Desvantagens
- ❌ **Fricção**: Usuário precisa seguir passos manuais
- ❌ **Confiança**: Alguns usuários podem ter receio
- ❌ **Suporte**: Mais tickets de instalação

---

## 📦 Métodos de Distribuição

### Método 1: Instalação Manual Simples (Recomendado)

**Para o usuário**:

1. **Baixar o .dmg**
   ```
   https://zona21.app/download/Zona21-latest-arm64.dmg
   ```

2. **Abrir o .dmg**
   - Duplo clique no arquivo baixado
   - Uma janela aparece com o app

3. **Arrastar para Applications**
   - Arrastar ícone do Zona21 para pasta Applications

4. **Primeira execução**
   - Ir em Applications
   - **Ctrl+Clique** no app Zona21
   - Selecionar "Abrir"
   - Confirmar na janela que aparece
   - App abre normalmente

5. **Execuções seguintes**
   - Clicar normalmente no app
   - Auto-update funcionará sem problemas

**Tempo**: ~2 minutos
**Dificuldade**: Fácil (com instruções visuais)

---

### Método 2: Script Automático (Para Usuários Técnicos)

**Criar arquivo**: `install.sh`

```bash
#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${GREEN}🚀 Instalando Zona21...${NC}"

# Detectar arquitetura
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    FILE="Zona21-latest-arm64.dmg"
elif [ "$ARCH" = "x86_64" ]; then
    FILE="Zona21-latest-x64.dmg"
else
    echo "${RED}❌ Arquitetura não suportada: $ARCH${NC}"
    exit 1
fi

# Download
echo "${YELLOW}⏬ Baixando $FILE...${NC}"
curl -L -o ~/Downloads/Zona21.dmg \
  "https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/$FILE"

if [ $? -ne 0 ]; then
    echo "${RED}❌ Erro no download${NC}"
    exit 1
fi

# Remover atributos de quarentena
echo "${YELLOW}🔓 Removendo quarentena...${NC}"
xattr -cr ~/Downloads/Zona21.dmg

# Montar DMG
echo "${YELLOW}💿 Montando DMG...${NC}"
hdiutil attach ~/Downloads/Zona21.dmg -nobrowse -quiet

# Aguardar montagem
sleep 2

# Copiar para Applications (remove versão antiga se existir)
echo "${YELLOW}📁 Instalando em /Applications...${NC}"
if [ -d "/Applications/Zona21.app" ]; then
    echo "${YELLOW}⚠️  Removendo versão antiga...${NC}"
    rm -rf /Applications/Zona21.app
fi

cp -R /Volumes/Zona21/Zona21.app /Applications/

# Remover quarentena do app
xattr -cr /Applications/Zona21.app

# Desmontar DMG
echo "${YELLOW}💿 Desmontando DMG...${NC}"
hdiutil detach /Volumes/Zona21 -quiet

# Limpar download
rm ~/Downloads/Zona21.dmg

echo "${GREEN}✅ Zona21 instalado com sucesso!${NC}"
echo ""
echo "Você pode abrir o app agora:"
echo "  1. Ir em Applications"
echo "  2. Ctrl+Clique em Zona21"
echo "  3. Selecionar 'Abrir'"
echo ""
echo "Ou rodar no terminal:"
echo "  open /Applications/Zona21.app"
```

**Como usar**:
```bash
# Download do script
curl -o install.sh https://zona21.app/install.sh

# Dar permissão
chmod +x install.sh

# Executar
./install.sh
```

**Tempo**: ~30 segundos
**Dificuldade**: Média (requer Terminal)

---

### Método 3: Homebrew Cask (Futuro - v0.2.0)

**Vantagens**:
- Instalação com um comando
- Confiável para desenvolvedores
- Update automático via Homebrew

**Setup**:

1. **Criar tap privado**:
   ```bash
   mkdir -p homebrew-zona21/Casks
   cd homebrew-zona21
   git init
   ```

2. **Criar Cask**:
   ```ruby
   # Casks/zona21.rb
   cask "zona21" do
     version "0.1.0"
     sha256 "SHA256_DO_DMG"

     url "https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/Zona21-#{version}-arm64.dmg"
     name "Zona21"
     desc "Plataforma de ingestão e catalogação de mídia profissional"
     homepage "https://zona21.app"

     livecheck do
       url "https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/latest-mac.yml"
       strategy :electron_builder
     end

     app "Zona21.app"

     zap trash: [
       "~/Library/Application Support/Zona21",
       "~/Library/Preferences/com.zona21.app.plist",
       "~/Library/Logs/Zona21",
     ]
   end
   ```

3. **Publicar no GitHub**:
   ```bash
   git add .
   git commit -m "Add Zona21 cask"
   git remote add origin https://github.com/zona21/homebrew-zona21
   git push -u origin main
   ```

4. **Usuários instalam com**:
   ```bash
   brew tap zona21/zona21
   brew install --cask zona21
   ```

**Quando implementar**: Após v0.1.1, quando tiver usuários suficientes

---

## 🛠️ Implementação Técnica

### 1. Configurar electron-builder

**Arquivo**: `electron-builder.yml`

```yml
appId: com.zona21.app
productName: Zona21
copyright: Copyright © 2024-2026 Zona21 Team

directories:
  output: release
  buildResources: resources

files:
  - dist/**/*
  - dist-electron/**/*
  - node_modules/**/*

asarUnpack:
  - "**/*.node"
  - "**/node_modules/sharp/**/*"
  - "**/node_modules/@img/**/*"
  - "**/node_modules/@ffmpeg-installer/**/*"
  - "**/node_modules/@ffprobe-installer/**/*"
  - "**/node_modules/better-sqlite3/**/*"
  - "**/node_modules/exiftool-vendored/**/*"

mac:
  category: public.app-category.photography
  icon: resources/icon.icns
  hardenedRuntime: false  # Desabilitar para evitar problemas
  gatekeeperAssess: false # Desabilitar Gatekeeper check
  # NÃO incluir identity (sem assinatura)
  target:
    - target: dmg
      arch:
        - arm64
        - x64
    - target: zip
      arch:
        - arm64
        - x64

dmg:
  sign: false  # Não assinar DMG
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
  window:
    width: 540
    height: 380

publish:
  - provider: generic
    url: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/
    channel: latest
```

**Importante**:
- `sign: false` → Não tentar assinar
- `hardenedRuntime: false` → Evitar problemas de runtime
- `gatekeeperAssess: false` → Não verificar Gatekeeper

---

### 2. Build Commands

```bash
# Build para macOS (todas as arquiteturas)
npm run electron:build:mac

# Build apenas ARM64 (Apple Silicon)
npm run electron:build:mac:arm64

# Build apenas x64 (Intel)
npm run electron:build:mac:x64

# Publicar (upload para R2)
npm run electron:publish
```

**Saída esperada**:
```
release/
├── Zona21-0.1.0-arm64.dmg
├── Zona21-0.1.0-arm64-mac.zip
├── Zona21-0.1.0-x64.dmg
├── Zona21-0.1.0-x64-mac.zip
├── latest-mac.yml
└── builder-debug.yml
```

---

### 3. Upload para R2 (Cloudflare)

**Setup inicial**:

```bash
# Instalar Wrangler
npm install -g wrangler

# Login no Cloudflare
wrangler login

# Criar bucket (se não existir)
wrangler r2 bucket create zona21-releases
```

**Script de upload**:

```bash
#!/bin/bash
# upload-release.sh

VERSION="0.1.0"
BUCKET="zona21-releases"

echo "📤 Uploading Zona21 v$VERSION to R2..."

# Upload DMGs
wrangler r2 object put "$BUCKET/zona21/Zona21-$VERSION-arm64.dmg" \
  --file="release/Zona21-$VERSION-arm64.dmg" \
  --content-type="application/x-apple-diskimage"

wrangler r2 object put "$BUCKET/zona21/Zona21-$VERSION-x64.dmg" \
  --file="release/Zona21-$VERSION-x64.dmg" \
  --content-type="application/x-apple-diskimage"

# Upload ZIPs
wrangler r2 object put "$BUCKET/zona21/Zona21-$VERSION-arm64-mac.zip" \
  --file="release/Zona21-$VERSION-arm64-mac.zip" \
  --content-type="application/zip"

wrangler r2 object put "$BUCKET/zona21/Zona21-$VERSION-x64-mac.zip" \
  --file="release/Zona21-$VERSION-x64-mac.zip" \
  --content-type="application/zip"

# Upload latest-mac.yml (para auto-update)
wrangler r2 object put "$BUCKET/zona21/latest-mac.yml" \
  --file="release/latest-mac.yml" \
  --content-type="text/yaml"

# Criar links "latest"
wrangler r2 object put "$BUCKET/zona21/Zona21-latest-arm64.dmg" \
  --file="release/Zona21-$VERSION-arm64.dmg" \
  --content-type="application/x-apple-diskimage"

wrangler r2 object put "$BUCKET/zona21/Zona21-latest-x64.dmg" \
  --file="release/Zona21-$VERSION-x64.dmg" \
  --content-type="application/x-apple-diskimage"

echo "✅ Upload completo!"
echo "URL: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/"
```

---

## 📝 Documentação para Usuários

### INSTALLATION_GUIDE.md

```markdown
# Guia de Instalação - Zona21

## Requisitos do Sistema

- macOS 11 (Big Sur) ou superior
- 4GB de RAM (8GB recomendado)
- 500MB de espaço em disco
- Processador: Intel x64 ou Apple Silicon (M1/M2/M3)

## Instalação

### Método 1: Manual (Recomendado)

1. **Download**
   - Acesse: https://zona21.app/download
   - Clique em "Download para macOS"
   - Escolha sua arquitetura:
     - Apple Silicon (M1/M2/M3) → arm64
     - Intel → x64

2. **Instalação**
   - Abra o arquivo .dmg baixado
   - Arraste Zona21 para a pasta Applications
   - Feche a janela do instalador

3. **Primeira Execução**
   - Vá em Applications (Cmd+Shift+A)
   - Segure Ctrl e clique em Zona21
   - Selecione "Abrir"
   - Confirme clicando "Abrir" novamente
   - ✅ App abrirá normalmente

4. **Próximas Execuções**
   - Clique normalmente no app
   - Não precisa repetir o Ctrl+Clique

### Método 2: Terminal (Usuários Avançados)

```bash
curl -L https://zona21.app/install.sh | bash
```

## Troubleshooting

### "Zona21 não pode ser aberto"
**Solução**: Use Ctrl+Clique > Abrir na primeira execução

### "App danificado e deve ir para Lixeira"
**Solução**: Remova quarentena
```bash
xattr -cr /Applications/Zona21.app
```

### "Não tenho permissão para abrir"
**Solução**: Verifique permissões
```bash
sudo chown -R $(whoami) /Applications/Zona21.app
chmod -R 755 /Applications/Zona21.app
```

### App não aparece no Launchpad
**Solução**: Reset do Launchpad
```bash
defaults write com.apple.dock ResetLaunchPad -bool true
killall Dock
```

## Desinstalação

1. **Remover App**
   ```bash
   rm -rf /Applications/Zona21.app
   ```

2. **Remover Dados do Usuário** (opcional)
   ```bash
   rm -rf ~/Library/Application\ Support/Zona21
   rm -rf ~/Library/Preferences/com.zona21.app.plist
   rm -rf ~/Library/Logs/Zona21
   ```

## Suporte

- Email: suporte@zona21.app
- GitHub: https://github.com/zona21/zona21/issues
- Discord: https://discord.gg/zona21
```

---

## 🎥 Materiais de Suporte

### Vídeo Tutorial
**Duração**: 1-2 minutos
**Conteúdo**:
1. Mostrar download do site
2. Arrastar para Applications
3. Ctrl+Clique > Abrir
4. App funcionando

### Screenshots
1. Página de download
2. DMG aberto
3. Arrastar para Applications
4. Menu de contexto (Ctrl+Clique)
5. Dialog de confirmação
6. App aberto

### GIF Animado
- Processo completo em loop
- Para landing page

---

## 📊 Comparação: Com vs Sem Assinatura

| Aspecto | Sem Assinatura | Com Assinatura |
|---------|----------------|----------------|
| **Custo** | Grátis | $99/ano |
| **Setup** | Imediato | 1-2 dias |
| **Instalação** | 2 min (manual) | 30 seg (automático) |
| **Confiança** | Média | Alta |
| **Manutenção** | Documentação | Certificados anuais |
| **Mac App Store** | ❌ Não | ✅ Sim |
| **Auto-update** | ✅ Sim | ✅ Sim |
| **Fricção usuário** | Média | Baixa |

---

## 🎯 Quando Investir em Assinatura?

### Sinais para Investir:
- ✅ 50+ usuários ativos
- ✅ $500+ MRR (receita mensal)
- ✅ Feedback indicando fricção na instalação
- ✅ Parceria com empresa grande
- ✅ Expansão para Mac App Store

### Aguardar Se:
- ❌ Menos de 20 usuários
- ❌ MVP em validação
- ❌ Instalação manual não é blocker
- ❌ Foco em features, não distribuição

**Recomendação**: Aguardar até v0.2.0 ou v0.3.0

---

## ✅ Checklist de Release

### Antes do Build
- [ ] Versão atualizada em package.json
- [ ] Changelog atualizado
- [ ] Icons atualizados (resources/icon.icns)
- [ ] Tests passando
- [ ] Sem warnings críticos

### Build
- [ ] `npm run electron:build:mac` executa sem erros
- [ ] DMG e ZIP gerados corretamente
- [ ] latest-mac.yml criado

### Testes
- [ ] Instalar em macOS limpo (Intel)
- [ ] Instalar em macOS limpo (Apple Silicon)
- [ ] Testar auto-update
- [ ] Testar primeira execução (Ctrl+Clique)
- [ ] Testar execuções seguintes

### Upload
- [ ] Upload para R2
- [ ] URLs públicas funcionando
- [ ] Auto-update testado de versão anterior

### Documentação
- [ ] INSTALLATION_GUIDE.md atualizado
- [ ] Vídeo tutorial gravado
- [ ] Landing page atualizada
- [ ] Release notes publicadas

---

## 📚 Recursos Úteis

- [Electron Builder - macOS](https://www.electron.build/configuration/mac)
- [Gatekeeper Bypass Techniques](https://disable-gatekeeper.github.io/)
- [Homebrew Cask Cookbook](https://docs.brew.sh/Cask-Cookbook)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

---

**Última atualização**: 24 de Janeiro de 2026
**Versão do documento**: 1.0
