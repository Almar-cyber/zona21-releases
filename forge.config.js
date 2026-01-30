const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: './build/icon',
    executableName: 'zona21',
    appBundleId: 'com.zona21.app',
    extraResource: [
      // Add any extra resources here if needed
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './build/icon.icns',
        name: 'Zona21',
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'electron/main/index.ts',
            config: 'vite.main.config.js',
          },
          {
            entry: 'electron/preload/index.ts',
            config: 'vite.preload.config.js',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.config.ts',
          },
        ],
      },
    },
  ],
};
