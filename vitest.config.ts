import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Tests control dates via vi.setSystemTime; an ambient RELEASE_DATE
    // (set for back-dated release builds) must never leak into them
    env: { RELEASE_DATE: '' },
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
