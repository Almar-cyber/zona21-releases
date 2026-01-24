import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'main',
    environment: 'node',
    include: ['electron/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/*.test.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/out/**',
        '**/.vite/**'
      ],
      reportsDirectory: './coverage/main'
    }
  }
});
