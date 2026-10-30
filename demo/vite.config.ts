import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The installed package version maps to its current API version
// (2026.7.0 -> 2026-07), so the clients match the imported types
const { version } = JSON.parse(
  readFileSync(
    'node_modules/@juanpprieto/shopify-api-types/package.json',
    'utf-8',
  ),
) as { version: string };
const [year, month] = version.split('.');

export default defineConfig({
  plugins: [react()],
  define: {
    __SHOPIFY_API_VERSION__: JSON.stringify(
      `${year}-${month.padStart(2, '0')}`,
    ),
  },
});
