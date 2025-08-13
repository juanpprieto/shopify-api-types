import type { CodegenConfig } from '@graphql-codegen/cli';
import { getLastFourVersions } from './version-utils.js';

const versions = getLastFourVersions();

// Shopify scalar type mappings (from hydrogen-react)
const scalarMappings = {
  DateTime: 'string',
  Decimal: 'string',
  HTML: 'string',
  URL: 'string',
  JSON: 'unknown',
  Color: 'string',
  UnsignedInt64: 'string',
  Money: 'string',
  ISO8601DateTime: 'string',
};

const config: CodegenConfig = {
  overwrite: true,
  generates: {},
};

// Generate configuration for Storefront API only
versions.forEach((version) => {
  config.generates[`./src/storefront/${version}/types.ts`] = {
    schema: `./src/schemas/storefront/${version}.json`,
    plugins: ['typescript'],
    config: {
      skipTypename: true,
      enumsAsTypes: true,
      scalars: scalarMappings,
      avoidOptionals: false,
      maybeValue: 'T | null | undefined',
      namingConvention: {
        typeNames: 'pascal-case#pascalCase',
        enumValues: 'upper-case#upperCase',
      },
    },
  };
});

export default config;
