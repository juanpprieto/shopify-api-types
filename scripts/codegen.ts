import type { CodegenConfig } from '@graphql-codegen/cli';
import { getSupportedVersions } from './version-utils.js';
import { SUPPORTED_APIS } from '../src/lib/zod.js';
import {
  generateCodeGenConfig,
  analyzeCodeGenConfig,
  handleOperationResult,
} from '../src/lib/patterns.js';

/**
 * Consolidated CodeGen configuration using atomic schemas and ts-pattern
 */
function createCodegenConfig(): CodegenConfig {
  // Get only the 4 supported versions
  const versions = getSupportedVersions();

  // Generate configuration using consolidated patterns
  const configResult = generateCodeGenConfig(SUPPORTED_APIS, versions, '.', {
    overwrite: true,
    apiSpecificConfigs: {
      'customer-account': {
        // Customer Account API tends to have more optional fields
        avoidOptionals: true,
      },
    },
  });

  return handleOperationResult(configResult, {
    onSuccess: (data) => {
      // Analyze the configuration for optimization opportunities
      const analysis = analyzeCodeGenConfig(data);

      console.log(`📊 CodeGen Analysis:`);
      console.log(`   Total outputs: ${analysis.totalOutputs}`);
      console.log(
        `   API breakdown: ${Object.entries(analysis.apiBreakdown)
          .map(([api, count]) => `${api}=${count}`)
          .join(', ')}`,
      );

      if (analysis.duplicateConfigs.length > 0) {
        console.log(`   Duplicates: ${analysis.duplicateConfigs.length} found`);
      }

      if (analysis.recommendedOptimizations.length > 0) {
        console.log(`   Recommendations:`);
        analysis.recommendedOptimizations.forEach((rec) =>
          console.log(`     - ${rec}`),
        );
      }

      return data as CodegenConfig;
    },
    onError: (error) => {
      console.error('❌ Failed to generate CodeGen configuration:', error);
      process.exit(1);
    },
  });
}

const config = createCodegenConfig();

export default config;
