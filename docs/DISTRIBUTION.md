# Guia de Distribuição - Zona21

## 📦 Overview

Este guia cobre o processo de distribuição do Zona21 para macOS, incluindo builds, assinatura e publicação.

## 🏗️ Processo de Build

### Configuração do electron-builder

```yaml
# electron-builder.yml
appId: com.zona21.app
productName: Zona21
directories:
  output: release
  buildResources: resources

compression: maximum

files:
  - dist/**/*
  - dist-electron/**/*
  - "!**/*.md"
  - "!**/test/**/*"
  - "!**/node_modules/**/*"

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
  target:
    - target: dmg
      arch:
        - arm64
        - x64
    - target: zip
      arch:
        - arm64
        - x64

publish:
  - provider: generic
    url: https://pub-70e1e2d44ca241cf887c010efd7936bf.r2.dev/zona21/
    channel: latest
```

### Comandos de Build

```bash
# Build completo (todas arquiteturas)
npm run build

# Apenas macOS ARM64
npm run electron:build:mac:arm64

# Apenas macOS Intel
npm run electron:build:mac:x64

# Build sem publicação
npm run build -- --publish=never
```

## 📋 Arquivos Gerados

Após o build, os seguintes arquivos são criados em `./release/`:

```
release/
├── Zona21-0.2.0-arm64.dmg         # Instalador ARM64
├── Zona21-0.2.0-arm64.dmg.blockmap
├── Zona21-0.2.0-arm64-mac.zip     # ZIP ARM64
├── Zona21-0.2.0-arm64-mac.zip.blockmap
├── Zona21-0.2.0.dmg               # Instalador Intel
├── Zona21-0.2.0.dmg.blockmap
├── Zona21-0.2.0-mac.zip           # ZIP Intel
├── Zona21-0.2.0-mac.zip.blockmap
├── latest-mac.yml                 # Metadados para auto-update
├── mac-arm64/                     # App descompactado ARM64
└── mac/                           # App descompactado Intel
```

## 🍎 Distribuição macOS

### Opção 1: Sem Assinatura (Gratuita)

**Pros:**
- Sem custo anual ($99/ano)
- Processo simples

**Contras:**
- Alerta de segurança ao abrir
- Gatekeeper bloqueia por padrão
- Não pode ser distribuído na App Store

**Passos:**

1. **Build sem assinatura**
   ```bash
   npm run electron:build:mac:arm64
   ```

2. **Distribuição direta**
   - Upload do DMG/ZIP para servidor
   - Instruir usuários a clicar direito → Abrir
   - Ou usar comando:
     ```bash
     xattr -d com.apple.quarantine Zona21.app
     ```

3. **Notarização (Opcional)**
   - Usar serviço de notarização terceiro
   - Ex: Gumroad, Paddle, etc.

### Opção 2: Com Assinatura de Desenvolvedor ($99/ano)

**Pros:**
- Sem alertas de segurança
- Auto-update funciona nativamente
- Pode ser distribuído na App Store

**Contras:**
- Custo anual
- Processo de configuração inicial

**Configuração:**

1. **Certificado Developer ID**
   ```bash
   # Gerar CSR no Keychain Access
   # Upload para developer.apple.com
   # Download e instalar certificado
   ```

2. **Configurar electron-builder**
   ```yaml
   mac:
     identity: "Developer ID Application: SEU NOME (TEAM_ID)"
     hardenedRuntime: true
     gatekeeperAssess: false
   ```

3. **Notarização automática**
   ```yaml
   afterSign: "scripts/notarize.js"
   ```

   ```javascript
   // scripts/notarize.js
   const { notarize } = require('electron-notarize');

   exports.default = async function notarizing(context) {
     const { electronPlatformName, appOutDir } = context;
     if (electronPlatformName !== 'darwin') return;
     
     const appName = context.packager.appInfo.productFilename;
     
     return await notarize({
       appBundleId: 'com.zona21.app',
       appPath: `${appOutDir}/${appName}.app`,
       appleId: 'seu@email.com',
       appleIdPassword: '@keychain:AC_PASSWORD',
       teamId: 'SEU_TEAM_ID'
     });
   };
   ```

## ☁️ Publicação na Cloudflare R2

### Configuração do Bucket

```bash
# Instalar rclone
brew install rclone

# Configurar R2
rclone config create zona21 r2
# Account ID: xxx
# Access Key ID: xxx
# Secret Access Key: xxx
# Endpoint: https://xxx.r2.cloudflarestorage.com
```

### Upload dos Arquivos

```bash
# Upload dos builds
rclone copy release/Zona21-0.2.0-arm64.dmg zona21:zona21/
rclone copy release/Zona21-0.2.0-arm64-mac.zip zona21:zona21/
rclone copy release/Zona21-0.2.0.dmg zona21:zona21/
rclone copy release/Zona21-0.2.0-mac.zip zona21:zona21/
rclone copy release/latest-mac.yml zona21:zona21/

# Configurar público
rclone backend zona21:zona21 set public true
```

### Script de Publicação

```bash
#!/bin/bash
# scripts/publish.sh

VERSION=$(node -p "require('./package.json').version")
BUCKET="zona21"

echo "Publishing version $VERSION..."

# Upload builds
rclone copy release/Zona21-$VERSION-arm64.dmg $BUCKET:zona21/
rclone copy release/Zona21-$VERSION-arm64-mac.zip $BUCKET:zona21/
rclone copy release/Zona21-$VERSION.dmg $BUCKET:zona21/
rclone copy release/Zona21-$VERSION-mac.zip $BUCKET:zona21/
rclone copy release/latest-mac.yml $BUCKET:zona21/

# Invalidar cache
rclone backend $BUCKET:zona21 invalidate

echo "Published successfully!"
```

## 🔄 Auto-Update

### Configuração do Servidor

O servidor precisa servir os arquivos:
- `latest-mac.yml` - Metadados da versão
- `Zona21-x.y.z-arch.dmg/zip` - Binários

### Estrutura do YAML

```yaml
# latest-mac.yml
version: 0.2.0
files:
  - url: Zona21-0.2.0-arm64-mac.zip
    sha512: HASH_DO_ARQUIVO
    size: TAMANHO_EM_BYTES
  - url: Zona21-0.2.0-mac.zip
    sha512: HASH_DO_ARQUIVO
    size: TAMANHO_EM_BYTES
  - url: Zona21-0.2.0-arm64.dmg
    sha512: HASH_DO_ARQUIVO
    size: TAMANHO_EM_BYTES
  - url: Zona21-0.2.0.dmg
    sha512: HASH_DO_ARQUIVO
    size: TAMANHO_EM_BYTES
path: Zona21-0.2.0.dmg
sha512: HASH_DO_ARQUIVO
releaseNotes: |
  - Correção de bugs
  - Melhorias de performance
```

### Geração do SHA512

```bash
# Gerar hash para cada arquivo
shasum -a 512 release/Zona21-0.2.0-arm64-mac.zip
```

## 📊 Estratégias de Distribuição

### 1. Direta (GitHub Releases)

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            release/*.dmg
            release/*.zip
```

### 2. Auto-hospedado

- Servidor próprio (nginx/Apache)
- Cloudflare R2 (recomendado)
- AWS S3
- DigitalOcean Spaces

### 3. Plataformas de Distribuição

- **Gumroad**: Processamento de pagamento + distribuição
- **Paddle**: Similar ao Gumroad
- **FastSpring**: Enterprise
- **App Store**: Requer assinatura + sandbox

## 📈 Analytics e Telemetria

### Implementação

```typescript
// telemetry.ts
export async function reportInstall(version: string) {
  await fetch('https://api.zona21.com/telemetry', {
    method: 'POST',
    body: JSON.stringify({
      event: 'install',
      version,
      platform: process.platform,
      arch: process.arch
    })
  });
}
```

### Métricas

- Downloads por versão
- Ativações diárias
- Uso de features
- Crash reports

## 🔐 Segurança

### Best Practices

1. **Assinatura de código**
   - Sempre assinar builds de produção
   - Manter certificados seguros

2. **Checksums**
   - Publicar hashes SHA256
   - Verificar integridade no download

3. **HTTPS**
   - Forçar HTTPS no servidor
   - HSTS headers

4. **Rate Limiting**
   - Limitar downloads por IP
   - Prevenir DDoS

## 🚀 CI/CD

### GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build -- --publish=never
      - uses: actions/upload-artifact@v4
        with:
          name: builds
          path: release/
```

## 📝 Checklist de Release

- [ ] Atualizar versão em package.json
- [ ] Atualizar CHANGELOG.md
- [ ] Build para todas arquiteturas
- [ ] Testar instalação limpa
- [ ] Verificar auto-update
- [ ] Upload para servidor
- [ ] Publicar GitHub Release
- [ ] Atualizar website
- [ ] Anunciar atualização

---

**Nota**: Esta documentação é atualizada regularmente. Verifique a versão mais recente no repositório.
