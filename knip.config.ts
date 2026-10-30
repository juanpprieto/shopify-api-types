import type { KnipConfig } from 'knip';

export default {
  // src/ holds only the shipped type entry points; build code is in scripts/
  entry: ['src/**/*.ts!'],

  project: ['src/**/*.ts!', 'tests/**/*.ts', 'scripts/**/*.ts'],

  ignore: ['tests/**'],

  // Exports used in the same file are part of the public API
  ignoreExportsUsedInFile: true,

  // Codegen loads these plugins by name from scripts/codegen.ts
  ignoreDependencies: [
    '@graphql-codegen/introspection',
    '@graphql-codegen/typescript-operations',
  ],

  includeEntryExports: false,
} satisfies KnipConfig;
