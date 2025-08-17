import fs from 'fs/promises';
import path from 'path';
import { getSupportedVersions } from './version-utils.js';
import {
  ApiTypeSchema,
  ExtendedApiVersionSchema,
  IndexFileContentSchema,
  type FileOperationResult,
  SUPPORTED_APIS,
} from '../src/lib/zod.js';
import {
  analyzeFileOperations,
  createFileOperationHandler,
} from '../src/lib/patterns.js';

async function convertToTypesOnly(): Promise<void> {
  const versions = getSupportedVersions();
  const apis = SUPPORTED_APIS;
  const results: FileOperationResult[] = [];

  console.log('Converting index files to types-only exports...');

  // Validate input data
  for (const api of apis) {
    const apiValidation = ApiTypeSchema.safeParse(api);
    if (!apiValidation.success) {
      throw new Error(`Invalid API: ${api}`);
    }
  }

  for (const version of versions) {
    const versionValidation = ExtendedApiVersionSchema.safeParse(version);
    if (!versionValidation.success) {
      throw new Error(`Invalid version: ${version}`);
    }
  }

  const fileHandler = createFileOperationHandler();

  for (const api of apis) {
    for (const version of versions) {
      const indexPath = path.join('src', api, version, 'index.ts');
      const content = `// Auto-generated index file - Types only
export * from './types.js';
`;

      // Validate content before writing
      const contentValidation = IndexFileContentSchema.safeParse(content);
      if (!contentValidation.success) {
        results.push({
          filePath: indexPath,
          success: false,
          error: 'Generated content is invalid',
        });
        continue;
      }

      // Use enhanced file operation handler
      const result = await fileHandler(
        {
          operation: 'write',
          target: indexPath,
          metadata: { api, version, contentType: 'types-only-index' },
        },
        async () => {
          await fs.writeFile(indexPath, content, 'utf-8');
          return { size: Buffer.byteLength(content, 'utf-8') };
        },
      );

      if (result.success) {
        console.log(
          `✓ Updated ${api}/${version}/index.ts (${result.data.size} bytes)`,
        );
        results.push({
          filePath: indexPath,
          success: true,
          size: result.data.size,
        });
      } else {
        console.log(`⏭ Skipped ${api}/${version}/index.ts:`, result.error);
        results.push({
          filePath: indexPath,
          success: false,
          error: result.error,
        });
      }
    }
  }

  // Use shared analysis function
  const analysis = analyzeFileOperations(results);
  console.log(
    `\nConversion complete: ${analysis.successful} successful, ${analysis.failed} failed`,
  );

  if (analysis.failed > 0) {
    const skippedPaths = results
      .filter((r) => !r.success)
      .map((r) => `${r.filePath}: ${r.error}`)
      .join('\n  ');
    console.log(
      `Skipped conversions (source files not found):\n  ${skippedPaths}`,
    );
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  convertToTypesOnly().catch(console.error);
}

export { convertToTypesOnly };
