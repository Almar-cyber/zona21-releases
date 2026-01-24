import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'renderer',
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['src/shared/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/node_modules/**',
        '**/dist/**',
        '**/out/**',
        '**/.vite/**'
      ],
      reportsDirectory: './coverage/renderer'
    },
    setupFiles: ['./src/test/setup.ts']
  }
});
