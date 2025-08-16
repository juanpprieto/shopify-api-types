import type { KnipConfig } from 'knip';

export default {
  // Production entry points
  entry: [
    'src/**/*.ts!', // All source files are entry points for a library
    // Scripts executed via npm scripts
    'scripts/fetch-schemas.ts',
    'scripts/ci/validate-*.ts',
    'scripts/generate-*.ts',
    'scripts/copy-schemas.ts',
    'scripts/count-types.ts',
    'scripts/codegen.ts',
    'scripts/changeset-changelog.js',
  ],

  // Project files (production marked with !)
  project: [
    'src/**/*.{ts,tsx,js,jsx}!',
    'tests/**/*.{ts,tsx,js,jsx}',
    'scripts/**/*.{ts,tsx}',
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
    'tests/**',

    // Generated GraphQL types will go here
    'src/**/types.ts',
  ],

  // Ignore unused exports (they're part of the public API)
  ignoreExportsUsedInFile: true,

  // Dependencies to be used in later phases
  ignoreDependencies: [
    '@graphql-codegen/typescript', // TypeScript output - Phase 3
    '@graphql-codegen/introspection', // Schema introspection - Phase 3
    '@graphql-codegen/typescript-operations', // Operations - Phase 3
    '@vitest/coverage-v8', // Coverage reporting for Vitest
  ],

  // Don't report issues with barrel exports
  includeEntryExports: false,
} satisfies KnipConfig;
