import type { CodegenConfig } from '@graphql-codegen/cli';
import { getLastFourVersions } from './version-utils.js';
import {
  createApiSpecificCodeGenConfig,
  handleOperationResult,
} from '../src/lib/patterns.js';

/**
 * Storefront API specific CodeGen configuration
 * Uses consolidated patterns with API-specific optimizations
 */
function createStorefrontCodegenConfig(): CodegenConfig {
  const versions = getLastFourVersions();

  // Generate Storefront API specific configuration
  const configResult = createApiSpecificCodeGenConfig(
    'storefront',
    versions,
    '.',
  );

  return handleOperationResult(configResult, {
    onSuccess: (data) => {
      console.log(
        `🏪 Storefront CodeGen configured for ${versions.length} versions`,
      );
      console.log(`   Versions: ${versions.join(', ')}`);
      console.log(`   Output files: ${Object.keys(data.generates).length}`);

      return data as CodegenConfig;
    },
    onError: (error) => {
      console.error(
        '❌ Failed to generate Storefront CodeGen configuration:',
        error,
      );
      process.exit(1);
    },
  });
}

const config = createStorefrontCodegenConfig();

export default config;
