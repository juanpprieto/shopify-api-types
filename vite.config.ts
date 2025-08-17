import { defineConfig } from 'vite';
import { resolve } from 'path';
import { getSupportedVersions } from './scripts/version-utils.js';

// Get all versions
const versions = getSupportedVersions();

// Build entry points for all API versions
const entry: Record<string, string> = {
  index: resolve(__dirname, 'src/index.ts'),
};

// Add API root indexes
['storefront', 'customer-account', 'admin'].forEach((api) => {
  entry[`${api}/index`] = resolve(__dirname, `src/${api}/index.ts`);

  // Add version-specific entries
  versions.forEach((version) => {
    entry[`${api}/${version}/index`] = resolve(
      __dirname,
      `src/${api}/${version}/index.ts`,
    );
  });
});

// Note: JSON schemas are imported by index files with 'type: json' attributes
// No need to add them as separate entry points to avoid import conflicts

export default defineConfig({
  build: {
    lib: {
      entry,
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        // Use .cjs for CommonJS to maintain .js for ESM
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [], // No external dependencies
      output: {
        preserveModules: false, // Bundle each entry point
        exports: 'named',
        generatedCode: {
          constBindings: true,
        },
      },
    },
    target: 'node18',
    minify: false, // Keep readable for debugging
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
});
