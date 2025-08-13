import type { KnipConfig } from 'knip';

export default {
  // Production entry points
  entry: [
    'src/index.ts!',
    'vite.config.ts',
    'vitest.config.ts',
    'eslint.config.mjs',
  ],

  // Project files (production marked with !)
  project: [
    'src/**/*.{ts,tsx,js,jsx}!',
    'tests/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],

  // Ignore patterns for false positives
  ignore: [
    // Generated files
    'dist/**',
    'build/**',
    '**/*.d.ts',

    // Development utilities
    'src/test-utils/**',
    'src/setupTests.ts',
  ],

  // Dependencies currently used in Phase 1 setup only
  // Will be used when actual GraphQL types are generated in Phase 3
  ignoreDependencies: [
    'zod', // Runtime validation - will be used in Phase 3
    'ts-pattern', // Pattern matching - will be used in Phase 3
    'graphql', // Peer dependency for GraphQL Codegen
    '@changesets/cli', // Version management - will be used in Phase 6
    '@graphql-codegen/cli', // GraphQL code generation - Phase 3
    '@graphql-codegen/typescript', // TypeScript output - Phase 3
    '@graphql-codegen/introspection', // Schema introspection - Phase 3
    '@graphql-codegen/typescript-operations', // Operations - Phase 3
    '@vitest/coverage-v8', // Coverage reporting for Vitest
  ],

  // Strict options for comprehensive analysis
  ignoreExportsUsedInFile: false,
  includeEntryExports: true,
} satisfies KnipConfig;
