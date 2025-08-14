import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { match } from 'ts-pattern';
import { getLastFourVersions } from './version-utils.js';
import {
  ApiTypeSchema,
  ApiVersionSchema,
  TypescriptFilePathSchema,
  type FileOperationResult,
} from '../src/lib/zod.js';
import {
  analyzeFileOperations,
  classifyFileSystemError,
} from '../src/lib/patterns.js';

async function testCodegen(): Promise<boolean> {
  console.log('Testing code generation...\n');
  const results: FileOperationResult[] = [];

  try {
    // Validate environment first
    const startTime = Date.now();

    // Run codegen with error handling
    try {
      execSync('npm run generate-types', { stdio: 'inherit' });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Code generation command failed:', error);

      // Use pattern matching for error categorization
      const errorType = match(error)
        .when(
          (e) => e instanceof Error && e.message.includes('ENOENT'),
          () => 'missing-command',
        )
        .when(
          (e) => e instanceof Error && e.message.includes('permission'),
          () => 'permission-error',
        )
        .otherwise(() => 'execution-error');

      console.error(`Error type: ${errorType}, Duration: ${duration}ms`);
      return false;
    }

    // Validate input data
    const versions = getLastFourVersions();
    const apis = ['storefront', 'customer-account', 'admin'];

    for (const api of apis) {
      const apiValidation = ApiTypeSchema.safeParse(api);
      if (!apiValidation.success) {
        throw new Error(`Invalid API: ${api}`);
      }
    }

    for (const version of versions) {
      const versionValidation = ApiVersionSchema.safeParse(version);
      if (!versionValidation.success) {
        throw new Error(`Invalid version: ${version}`);
      }
    }

    // Verify files were created with validation
    for (const api of apis) {
      for (const version of versions) {
        const typePath = path.join('src', api, version, 'types.ts');

        // Validate file path format
        const pathValidation = TypescriptFilePathSchema.safeParse(typePath);
        if (!pathValidation.success) {
          console.error(`Invalid path format: ${typePath}`);
          results.push({
            filePath: typePath,
            success: false,
            error: 'Invalid path format',
          });
          continue;
        }

        const exists = await fs
          .access(typePath)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          console.log(`✓ Generated: ${api}/${version}/types.ts`);
          results.push({ filePath: typePath, success: true });
        } else {
          console.error(`✗ Missing: ${api}/${version}/types.ts`);
          results.push({
            filePath: typePath,
            success: false,
            error: 'File not found',
          });
        }
      }
    }

    // Use shared analysis
    const analysis = analyzeFileOperations(results);
    console.log(
      `\nCodegen test complete: ${analysis.successful}/${analysis.successful + analysis.otherErrors} files generated`,
    );

    return analysis.otherErrors === 0;
  } catch (error) {
    // Use shared error categorization
    if (error instanceof Error) {
      const { category, userActionRequired } = classifyFileSystemError(error);
      console.error(`\nCodegen test failed (${category}):`, error.message);
      if (userActionRequired) {
        console.error('User action required to resolve this error.');
      }
    } else {
      console.error('Codegen test failed with unknown error:', error);
    }
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCodegen().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
