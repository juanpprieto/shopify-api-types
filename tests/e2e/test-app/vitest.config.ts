import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    // Handle .js extensions in declaration files for NodeNext packages
    extensionAlias: {
      '.js': ['.js', '.ts', '.d.ts'],
    },
  },
});
