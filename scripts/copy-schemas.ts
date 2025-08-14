import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';
import { type FileOperationResult, SUPPORTED_APIS } from '../src/lib/zod.js';
import {
  createFileOperationHandler,
  processOperationResults,
  analyzeFileOperations,
} from '../src/lib/patterns.js';

/**
 * Copy a single schema file using the enhanced file operation handler
 */
async function copySchemaFile(
  sourceFile: string,
  targetFile: string,
): Promise<FileOperationResult> {
  const fileHandler = createFileOperationHandler();

  const result = await fileHandler(
    {
      operation: 'copy',
      source: sourceFile,
      target: targetFile,
    },
    async () => {
      // Ensure target directory exists
      await fs.mkdir(path.dirname(targetFile), { recursive: true });

      // Get file stats and copy
      const stats = await fs.stat(sourceFile);
      await fs.copyFile(sourceFile, targetFile);

      return { size: stats.size };
    },
  );

  return {
    filePath: targetFile,
    success: result.success,
    error: result.success ? undefined : result.error,
    size: result.success ? result.data.size : undefined,
  };
}

async function copySchemas(): Promise<void> {
  const versions = getLastFourVersions();
  const apis = SUPPORTED_APIS;
  const allResults: FileOperationResult[] = [];

  console.log('Copying schema files to dist...');

  for (const api of apis) {
    const sourceDir = path.join('src', 'graphql-schemas', api);
    const targetDir = path.join('dist', 'schemas', api);

    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });

    // Copy each version's schema
    for (const version of versions) {
      const sourceFile = path.join(sourceDir, `${version}.json`);
      const targetFile = path.join(targetDir, `${version}.json`);

      const result = await copySchemaFile(sourceFile, targetFile);
      allResults.push(result);
    }
  }

  // Process all results using shared patterns
  processOperationResults(allResults, {
    onAllSuccess: () =>
      console.log('\n✅ All schema files copied successfully'),
    onPartialFailure: (successful, failed) => {
      console.log(
        `\n⚠️  Copied ${successful.length} files, ${failed.length} skipped (source not found)`,
      );
      failed.forEach((f) =>
        console.log(
          `  ⏭ Skipped ${f.filePath}: ${f.error || 'Source file not found'}`,
        ),
      );
    },
    onAllFailure: (results) => {
      console.log('\n❌ No schema files found to copy');
      results.forEach((f) =>
        console.log(
          `  ⏭ Skipped ${f.filePath}: ${f.error || 'Source file not found'}`,
        ),
      );
    },
    onEmpty: () => console.warn('\n⚠️  No schemas to copy'),
  });

  const analysis = analyzeFileOperations(allResults);
  console.log(
    `\nCopy summary: ${analysis.successful} successful (${analysis.totalSize} bytes), ${analysis.failed} failed`,
  );

  if (analysis.missingFiles > 0) {
    console.warn(`Warning: ${analysis.missingFiles} source files not found`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  copySchemas().catch(console.error);
}

export { copySchemas };
