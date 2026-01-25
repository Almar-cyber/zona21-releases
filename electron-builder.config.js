module.exports = {
  appId: 'com.zona21.app',
  productName: 'Zona21',
  directories: {
    output: 'dist'
  },
  files: [
    'build/**/*',
    'node_modules/**/*',
    'electron/main/**/*',
    'electron/preload/**/*',
    'public/electron.js'
  ],
  mac: {
    category: 'public.app-category.photography',
    target: [
      {
        target: 'dmg',
        arch: ['arm64']
      },
      {
        target: 'zip',
        arch: ['arm64']
      }
    ],
    icon: 'assets/icon.icns',
    hardenedRuntime: false,
    gatekeeperAssess: false
  },
  publish: {
    provider: 'github',
    owner: 'alexiaolivei',  // Seu username no GitHub
    repo: 'zona21',        // Nome do repositório
    private: false,
    releaseType: 'release'
  },
  afterSign: false  // Desabilitar assinatura por enquanto
};
