import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

export default defineConfig({
  server: {
    port: 5174,
    strictPort: true,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/dist-electron/**',
        '**/out/**',
        '**/build/**',
        '**/.cache/**',
        '**/cache/**',
        '**/coverage/**',
        '**/*.log'
      ]
    }
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main/index.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['better-sqlite3', 'fluent-ffmpeg', 'sharp', 'exiftool-vendored', 'electron-updater'],
              output: {
                format: 'cjs'
              }
            }
          }
        }
      },
      {
        entry: 'electron/preload/index.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload'
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './electron/main'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  }
})
