import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'electron/**/*.test.ts'],
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
      reportsDirectory: './coverage'
    }
  }
});
