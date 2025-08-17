import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Try adding server configuration for better module resolution
    server: {
      deps: {
        inline: ['@juanpprieto/shopify-api-types'],
      },
    },
  },
  resolve: {
    // Configure Vite to handle .js extensions by stripping them
    alias: [
      {
        find: /^(.*)\.js$/,
        replacement: '$1',
      },
    ],
  },
  // Enable optimizeDeps to pre-bundle dependencies
  optimizeDeps: {
    include: ['@juanpprieto/shopify-api-types'],
  },
});
