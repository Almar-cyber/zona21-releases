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
        // Main process entry
        entry: 'electron/main/index.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            lib: {
              entry: 'electron/main/index.ts',
              formats: ['cjs']
            },
            commonjsOptions: {
              ignoreDynamicRequires: false
            },
            rollupOptions: {
              external: ['electron', 'better-sqlite3', 'fluent-ffmpeg', 'sharp', 'exiftool-vendored', 'electron-updater', 'onnxruntime-node', '@xenova/transformers'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].js'
              }
            }
          }
        }
      },
      {
        // Workers
        entry: {
          'indexer-worker': 'electron/main/indexer-worker.ts',
          'ai-worker': 'electron/main/ai-worker.ts'
        },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: (id) => {
                // Externalize electron and all native modules
                return id === 'electron' ||
                       id === 'better-sqlite3' ||
                       id === 'fluent-ffmpeg' ||
                       id === 'sharp' ||
                       id === 'exiftool-vendored' ||
                       id === 'electron-updater' ||
                       id === 'onnxruntime-node' ||
                       id === '@xenova/transformers';
              },
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
