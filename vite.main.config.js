import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  build: {
    outDir: '.vite/build',
    emptyOutDir: false,
    lib: {
      entry: 'electron/main/index.ts',
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'electron',
        'better-sqlite3',
        'sharp',
        'exiftool-vendored',
        'fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg',
        '@ffprobe-installer/ffprobe',
        '@xenova/transformers',
        'onnxruntime-node',
        'archiver',
        'chokidar',
        '@sentry/electron',
      ],
    },
  },
});
