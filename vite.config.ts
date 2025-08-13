import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        'storefront/index': resolve(__dirname, 'src/storefront/index.ts'),
        'customer-account/index': resolve(
          __dirname,
          'src/customer-account/index.ts',
        ),
        'admin/index': resolve(__dirname, 'src/admin/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['graphql'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].[format].js',
        exports: 'named',
      },
    },
    target: 'node18',
    sourcemap: true,
    minify: false,
  },
});
