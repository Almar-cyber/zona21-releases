# Instruções de Instalação - MediaHub

## Problema Atual

Node.js v25.3.0 é muito recente e tem incompatibilidades com módulos nativos como `better-sqlite3` e `sharp`.

## Solução: Usar Node.js v20 (LTS)

### Opção 1: Usar NVM (Recomendado)

Se você tem NVM instalado:

```bash
cd /Users/alexiaolivei/CascadeProjects/zona21

# Instalar e usar Node.js 20
nvm install 20
nvm use 20

# Verificar versão
node -v  # Deve mostrar v20.x.x

# Instalar dependências
npm install
```

### Opção 2: Instalar Node.js 20 via Homebrew

```bash
# Desinstalar Node.js atual
brew uninstall node

# Instalar Node.js 20 LTS
brew install node@20

# Adicionar ao PATH
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verificar versão
node -v  # Deve mostrar v20.x.x

# Instalar dependências
cd /Users/alexiaolivei/CascadeProjects/zona21
npm install
```

### Opção 3: Usar Docker (Alternativa)

Se preferir isolar o ambiente:

```bash
cd /Users/alexiaolivei/CascadeProjects/zona21

# Criar Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine
RUN apk add --no-cache python3 make g++ ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "electron:dev"]
EOF

# Build e run
docker build -t mediahub .
docker run -v $(pwd):/app -p 5174:5174 mediahub
```

## Dependências do Sistema

Além do Node.js, você precisa de:

### FFmpeg (Obrigatório)

```bash
brew install ffmpeg
```

### ExifTool (Obrigatório para fotos)

```bash
brew install exiftool
```

## Após Instalar Node.js 20

```bash
cd /Users/alexiaolivei/CascadeProjects/mediahub

# Limpar cache npm (se necessário)
npm cache clean --force

# Remover node_modules se existir
rm -rf node_modules package-lock.json

# Instalar dependências
npm install

# Se houver erros com módulos nativos, rebuild
npm rebuild

# Testar
npm run electron:dev
```

## Nota importante: dependências nativas (Electron)

Este projeto usa módulos nativos (ex: `better-sqlite3`). O `postinstall` já está configurado para rodar:

```bash
electron-builder install-app-deps
```

Se você trocar a versão do Electron, ou se o app quebrar com erro de arquitetura, rode o comando acima manualmente.

## Verificação de Instalação

Após instalação bem-sucedida, verifique:

```bash
# Node.js versão correta
node -v  # Deve ser v20.x.x

# FFmpeg instalado
ffmpeg -version

# ExifTool instalado
exiftool -ver

# Dependências instaladas
ls node_modules | grep -E "(better-sqlite3|sharp|electron)"
```

## Troubleshooting

### Erro: "gyp ERR! build error"

Instale ferramentas de build:
```bash
xcode-select --install
```

### Erro: "sharp" não compila

```bash
npm install --platform=darwin --arch=arm64 sharp
```

### Erro: "better-sqlite3" não compila

```bash
npx electron-builder install-app-deps
```

## Próximos Passos Após Instalação

1. Verificar que `npm run electron:dev` funciona
2. Criar componentes React (ver `IMPLEMENTATION_STATUS.md`)
3. Testar indexação com arquivos de exemplo
