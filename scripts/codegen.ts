import type { CodegenConfig } from '@graphql-codegen/cli';
import { getSupportedVersions } from './version-utils.js';
import { SUPPORTED_APIS, SHOPIFY_SCALARS } from '../src/lib/zod.js';

/**
 * Create CodeGen configuration for all APIs and versions
 */
function createCodegenConfig(): CodegenConfig {
  const versions = getSupportedVersions();
  const generates: CodegenConfig['generates'] = {};

  // Generate configuration for each API and version
  SUPPORTED_APIS.forEach((api) => {
    versions.forEach((version) => {
      const schemaPath = `./src/graphql-schemas/${api}/${version}.json`;
      const outputPath = `./src/${api}/${version}/types.ts`;

      generates[outputPath] = {
        schema: schemaPath,
        documents: [],
        plugins: ['typescript'],
        config: {
          skipTypename: true,
          enumsAsTypes: true,
          scalars: SHOPIFY_SCALARS,
          avoidOptionals: api === 'customer-account', // Customer Account API has more optional fields
          maybeValue: 'T | null | undefined',
          namingConvention: {
            typeNames: 'pascal-case#pascalCase',
            enumValues: 'upper-case#upperCase',
          },
        },
      };
    });
  });

  console.log(`📊 CodeGen Configuration:`);
  console.log(`   Total outputs: ${Object.keys(generates).length}`);
  console.log(`   APIs: ${SUPPORTED_APIS.join(', ')}`);
  console.log(`   Versions: ${versions.join(', ')}`);

  return {
    overwrite: true,
    generates,
    hooks: {
      afterOneFileWrite: ['prettier --write'],
    },
  };
}

const config = createCodegenConfig();
export default config;
