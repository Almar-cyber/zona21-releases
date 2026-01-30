import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Renderer process configuration for Electron Forge
// Main and preload processes are handled by forge.config.js
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          // Large UI libraries
          'ui-vendor': ['lucide-react', 'react-window'],
          // AI/ML libraries - lazy loaded separately
          'ai-vendor': ['@anthropic-ai/sdk'],
          // Utilities
          'utils': ['date-fns', 'lodash-es', 'uuid'],
        }
      }
    },
    // Chunk size warning threshold
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5174,
    strictPort: false,
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
        '**/*.log',
        '**/.vite/**'
      ]
    }
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './electron/main'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  }
})
