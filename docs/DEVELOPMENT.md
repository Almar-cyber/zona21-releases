# Guia de Desenvolvimento - Zona21

## 🏗️ Arquitetura do Projeto

### Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Electron 28 + Node.js 20
- **Banco**: SQLite3 com better-sqlite3
- **UI**: Tailwind CSS + Componentes customizados
- **Build**: electron-builder

### Estrutura de Pastas

```
zona21/
├── src/                    # Frontend React
│   ├── components/         # Componentes UI
│   │   ├── AssetCard.tsx
│   │   ├── Library.tsx
│   │   ├── Viewer.tsx
│   │   └── ...
│   ├── shared/            # Código compartilhado
│   │   ├── types.ts
│   │   ├── ipcInvoke.ts
│   │   └── logger.ts
│   ├── App.tsx            # App principal
│   └── index.css          # Estilos globais
├── electron/              # Backend Electron
│   ├── main/              # Processo principal
│   │   ├── index.ts       # Main entry
│   │   ├── db.ts          # Database layer
│   │   ├── indexer.ts     # Indexação de arquivos
│   │   └── ...
│   ├── preload/           # Preload scripts
│   │   └── index.ts
│   └── builder.yml        # Config de build
├── docs/                  # Documentação
└── tests/                 # Testes (Vitest)
```

## 🚀 Setup de Desenvolvimento

### Pré-requisitos

```bash
# Node.js 20 (usar nvm se necessário)
nvm install 20
nvm use 20

# Verificar versão
node --version  # v20.x.x
npm --version   # 10.x.x
```

### Passos

```bash
# 1. Clonar
git clone https://github.com/Almar-cyber/zona21.git
cd zona21

# 2. Instalar dependências
npm install

# 3. Rebuild nativas (importante!)
npx electron-rebuild

# 4. Rodar dev server
npm run electron:dev
```

### Variáveis de Ambiente

```bash
# .env.local (opcional)
VITE_DEV_SERVER_URL=http://localhost:5174
NODE_OPTIONS=--max-old-space-size=4096
```

## 🔧 Scripts Disponíveis

```json
{
  "electron:dev": "NODE_OPTIONS=--max-old-space-size=4096 vite --port 5174 --strictPort",
  "electron:build:mac:arm64": "npm run build && electron-builder --mac --arm64",
  "electron:build:mac:x64": "npm run build && electron-builder --mac --x64",
  "build": "tsc && vite build && electron-builder",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "lint": "eslint src --ext .ts,.tsx",
  "type-check": "tsc --noEmit"
}
```

## 📦 Principais Dependencies

### Produção

```json
{
  "react": "^18.2.0",
  "electron": "^28.3.3",
  "better-sqlite3": "^11.10.0",
  "sharp": "^0.33.5",
  "fluent-ffmpeg": "^2.1.2",
  "exiftool-vendored": "^27.4.0",
  "electron-updater": "^6.3.9"
}
```

### Desenvolvimento

```json
{
  "@types/react": "^18.2.0",
  "vite": "^5.4.21",
  "typescript": "^5.6.3",
  "tailwindcss": "^3.4.0",
  "vitest": "^2.1.8",
  "electron-builder": "^24.13.3"
}
```

## 🎯 Padrões de Código

### TypeScript

- Strict mode ativado
- Interfaces para tipos complexos
- Preferir `type` sobre `interface` para objetos simples

```typescript
// Bom ✅
type Asset = {
  id: string;
  fileName: string;
  fileSize: number;
  mediaType: 'video' | 'photo';
};

// Evitar ❌
interface IAsset {
  id: string;
  fileName: string;
}
```

### React

- Functional components com hooks
- Props com TypeScript interfaces
- Memoização para performance

```tsx
interface AssetCardProps {
  asset: Asset;
  onClick: (asset: Asset) => void;
}

const AssetCard = memo(({ asset, onClick }: AssetCardProps) => {
  return <div onClick={() => onClick(asset)}>{asset.fileName}</div>;
});
```

### CSS/Tailwind

- Classes utilitárias do Tailwind
- Variáveis CSS para tokens de design
- Mobile-first responsive

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
  <div className="mh-card hover:shadow-lg transition-shadow">
    <MaterialIcon name="photo" className="text-2xl" />
  </div>
</div>
```

## 🔄 Fluxo de Dados

### IPC (Inter-Process Communication)

```typescript
// Main process (electron/main/index.ts)
ipcMain.handle('get-assets', async () => {
  const db = getDatabase();
  return db.prepare('SELECT * FROM assets').all();
});

// Preload (electron/preload/index.ts)
contextBridge.exposeInMainWorld('electronAPI', {
  getAssets: () => ipcRenderer.invoke('get-assets')
});

// Renderer (src/App.tsx)
const assets = await window.electronAPI.getAssets();
```

### Estado Global

- Sem Redux/Context (simples demais)
- Estado local nos componentes
- IPC para dados persistentes

## 🧪 Testes

### Unit Tests (Vitest)

```typescript
// tests/components/AssetCard.test.tsx
import { render, screen } from '@testing-library/react';
import { AssetCard } from '../AssetCard';

test('renders asset file name', () => {
  const asset = { id: '1', fileName: 'test.jpg' };
  render(<AssetCard asset={asset} onClick={vi.fn()} />);
  expect(screen.getByText('test.jpg')).toBeInTheDocument();
});
```

### Testes Manuais

1. Importação de volume grande (>1000 arquivos)
2. Performance com 50k+ itens
3. Memória em uso prolongado
4. Update automático

## 🐛 Debug

### Renderer Process

- DevTools F12
- React DevTools
- Redux DevTools (se usar)

### Main Process

```bash
# Debug com VS Code
# Launch configuration:
{
  "type": "node",
  "request": "launch",
  "name": "Debug Main",
  "program": "${workspaceFolder}/dist-electron/main/index.js",
  "env": { "NODE_ENV": "development" }
}
```

### Logs

```typescript
// Usar logger compartilhado
import { logger } from '../shared/logger';

logger.info('Processing asset', { assetId });
logger.error('Failed to import', { error });
```

## 📦 Build e Distribuição

### Development Build

```bash
npm run build
# Gera em ./release/
```

### Release Process

1. Atualizar versão em `package.json`
2. Commit: `chore: bump version to 0.2.1`
3. Tag: `git tag v0.2.1`
4. Build: `npm run build`
5. Upload para Cloudflare R2
6. Publicar `latest-mac.yml`

### Assinatura (Opcional)

```yaml
# electron-builder.yml
mac:
  identity: "Developer ID Application: NAME"
  hardenedRuntime: true
  gatekeeperAssess: false
```

## 🚀 Performance

### Otimizações Implementadas

- Virtual scrolling (react-window)
- Lazy loading de thumbnails
- Debounce em search/filter
- SQLite indexes otimizados
- Image cache em disco

### Monitoramento

```typescript
// Performance metrics
const perf = performance.now();
// ... operação
logger.debug('Operation took', performance.now() - perf, 'ms');
```

## 🔮 Roadmap de Dev

### Short Term
- [ ] Code splitting por feature
- [ ] Service Worker para cache
- [ ] Web Workers para thumbnails

### Medium Term
- [ ] Plugin system
- [ ] Custom themes
- [ ] API REST para remote access

### Long Term
- [ ] Cloud sync
- [ ] ML para auto-tagging
- [ ] Real-time collaboration

## 📚 Recursos

- [Electron Docs](https://electronjs.org/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

---

Happy coding! 🚀
