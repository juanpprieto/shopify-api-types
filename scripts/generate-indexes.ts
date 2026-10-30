import fs from 'fs/promises';
import path from 'path';
import { getSupportedVersions } from './version-utils.js';
import {
  ApiTypeSchema,
  ExtendedApiVersionSchema,
  TemplateContentSchema,
  type ApiType,
  type CategorizedFileResult,
} from './lib/zod.js';
import {
  createFileOperationHandler,
  createFilePathResolver,
  createApiIndexPath,
} from './lib/patterns.js';

const INDEX_TEMPLATE = `// Auto-generated index file
export * from './types.js';

// Re-export schema as both default and named export
import schemaJson from '../../graphql-schemas/{API_TYPE}/{VERSION}.json' with { type: 'json' };
export { schemaJson as schema };
export default schemaJson;
`;

const API_INDEX_TEMPLATE = `// Auto-generated API index file
{EXPORTS}
`;

async function generateIndexFiles(): Promise<void> {
  // Deterministic order for generated files: newest stable first,
  // unstable last. Reduces diff noise across quarterly regenerations.
  const versions = [...getSupportedVersions()].sort((a, b) => {
    if (a === 'unstable') return 1;
    if (b === 'unstable') return -1;
    return b.localeCompare(a);
  });
  const pathResolver = createFilePathResolver(process.cwd());
  const apis: Array<{ type: ApiType; dir: string; schemaDir: string }> = [
    { type: 'storefront', dir: 'storefront', schemaDir: 'storefront' },
    {
      type: 'customer-account',
      dir: 'customer-account',
      schemaDir: 'customer-account',
    },
    { type: 'admin', dir: 'admin', schemaDir: 'admin' },
  ];
  const results: CategorizedFileResult[] = [];

  // Validate input data
  for (const version of versions) {
    // Use ExtendedApiVersionSchema to support 'unstable'
    const versionValidation = ExtendedApiVersionSchema.safeParse(version);
    if (!versionValidation.success) {
      throw new Error(`Invalid version: ${version}`);
    }
  }

  for (const api of apis) {
    const apiValidation = ApiTypeSchema.safeParse(api.dir);
    if (!apiValidation.success) {
      throw new Error(`Invalid API: ${api.dir}`);
    }

    const apiExports: string[] = [];

    const fileHandler = createFileOperationHandler();

    for (const version of versions) {
      // Use path resolver for consistent path generation
      const indexPath = pathResolver.resolve(
        'src',
        api.type,
        version,
        'index.ts',
      );
      const versionDir = path.dirname(indexPath);

      // Generate and validate index.ts content
      const indexContent = INDEX_TEMPLATE.replace(
        '{API_TYPE}',
        api.schemaDir,
      ).replace('{VERSION}', version);

      const contentValidation = TemplateContentSchema.safeParse(indexContent);
      if (!contentValidation.success) {
        results.push({
          filePath: indexPath,
          success: false,
          category: 'version',
          error: 'Generated content is too short or invalid',
        });
        continue;
      }

      // Use enhanced file operation handler
      const result = await fileHandler(
        {
          operation: 'write',
          target: indexPath,
          metadata: {
            api: api.dir,
            version,
            contentLength: indexContent.length,
          },
        },
        async () => {
          // Ensure directory exists
          await fs.mkdir(versionDir, { recursive: true });
          // Write file
          await fs.writeFile(indexPath, indexContent, 'utf-8');
          return { size: Buffer.byteLength(indexContent, 'utf-8') };
        },
      );

      if (result.success) {
        console.log(
          `Generated index: ${api.dir}/${version}/index.ts (${result.data.size} bytes)`,
        );
        results.push({
          filePath: indexPath,
          success: true,
          category: 'version',
        });

        // Add to API exports
        apiExports.push(
          `export * as v${version.replace('-', '_')} from './${version}/index.js';`,
        );
      } else {
        console.error(
          `Failed to generate ${api.dir}/${version}/index.ts:`,
          result.error,
        );
        results.push({
          filePath: indexPath,
          success: false,
          error: result.error,
          category: 'version',
        });
      }
    }

    try {
      // Generate main API index using path helper
      const apiIndexPath = createApiIndexPath(
        process.cwd(),
        api.type,
        'source',
      );
      const apiIndexContent = API_INDEX_TEMPLATE.replace(
        '{EXPORTS}',
        apiExports.join('\n'),
      );

      const apiContentValidation =
        TemplateContentSchema.safeParse(apiIndexContent);
      if (!apiContentValidation.success) {
        throw new Error('API index content is invalid');
      }

      await fs.writeFile(apiIndexPath, apiIndexContent, 'utf-8');

      console.log(`Generated API index: ${api.dir}/index.ts`);
      results.push({ filePath: apiIndexPath, success: true, category: 'api' });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const apiIndexPath = createApiIndexPath(
        process.cwd(),
        api.type,
        'source',
      );
      console.error(`Failed to generate ${api.dir}/index.ts:`, errorMessage);
      results.push({
        filePath: apiIndexPath,
        success: false,
        error: errorMessage,
        category: 'api',
      });
    }
  }

  // Generate root index
  try {
    const rootIndexContent = `// Auto-generated root index
export * as storefront from './storefront/index.js';
export * as customerAccount from './customer-account/index.js';
export * as admin from './admin/index.js';
`;

    const rootContentValidation =
      TemplateContentSchema.safeParse(rootIndexContent);
    if (!rootContentValidation.success) {
      throw new Error('Root index content is invalid');
    }

    const rootIndexPath = path.join(process.cwd(), 'src', 'index.ts');
    await fs.writeFile(rootIndexPath, rootIndexContent, 'utf-8');

    console.log('Generated root index: src/index.ts');
    results.push({ filePath: rootIndexPath, success: true, category: 'root' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const rootIndexPath = path.join(process.cwd(), 'src', 'index.ts');
    console.error('Failed to generate src/index.ts:', errorMessage);
    results.push({
      filePath: rootIndexPath,
      success: false,
      error: errorMessage,
      category: 'root',
    });
  }

  // Analyze results
  const versionCount = results.filter((r) => r.category === 'version').length;
  const apiCount = results.filter((r) => r.category === 'api').length;
  const rootCount = results.filter((r) => r.category === 'root').length;
  const failedResults = results.filter((r) => !r.success);

  console.log(
    `\nGeneration complete: ${versionCount} version, ${apiCount} API, ${rootCount} root indexes created`,
  );

  if (failedResults.length > 0) {
    const failedFiles = failedResults
      .map((r) => `${r.filePath}: ${r.error}`)
      .join('\n  ');
    console.error(`Failed generations:\n  ${failedFiles}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateIndexFiles().catch(console.error);
}

export { generateIndexFiles };
