import fs from 'fs/promises';
import path from 'path';
import { compareSchemas } from './lib/schema-compare.js';
import {
  getCurrentVersionSet,
  getAdjacentVersionPairs,
} from './version-utils.js';
import {
  createFileOperationHandler,
  createFilePathResolver,
} from './lib/patterns.js';
import {
  SUPPORTED_APIS,
  GraphQLSchemaSchema,
  type GraphQLSchema,
  type ApiType,
  type ExtendedApiVersion,
  type SchemaChangelog,
} from './lib/zod.js';

async function loadSchema(
  api: ApiType,
  version: ExtendedApiVersion,
): Promise<GraphQLSchema> {
  const pathResolver = createFilePathResolver(process.cwd());
  const fileHandler = createFileOperationHandler();

  const schemaPath = pathResolver.resolve(
    'src',
    'graphql-schemas',
    api,
    `${version}.json`,
  );

  const readResult = await fileHandler(
    { operation: 'read', target: schemaPath },
    async () => {
      const content = await fs.readFile(schemaPath, 'utf-8');
      return { content, size: Buffer.byteLength(content, 'utf-8') };
    },
  );

  if (!readResult.success) {
    throw new Error(
      `Failed to read schema ${api}/${version}: ${readResult.error}`,
    );
  }

  const schemaData = JSON.parse(readResult.data.content);

  // Normalize customer-account schema structure (it's wrapped in a "data" object)
  const normalizedSchema = schemaData.data?.__schema
    ? schemaData.data
    : schemaData;

  const schemaValidation = GraphQLSchemaSchema.safeParse(normalizedSchema);

  if (!schemaValidation.success) {
    throw new Error(
      `Invalid schema format for ${api}/${version}: ${schemaValidation.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  return schemaValidation.data;
}

/**
 * Generate comparison data for AI agent documentation
 */
async function generateComparisonData(
  fromVersion: ExtendedApiVersion,
  toVersion: ExtendedApiVersion,
): Promise<Record<string, SchemaChangelog>> {
  const comparisons: Record<string, SchemaChangelog> = {};

  for (const api of SUPPORTED_APIS) {
    try {
      const fromSchema = await loadSchema(api, fromVersion);
      const toSchema = await loadSchema(api, toVersion);

      const changelog = await compareSchemas(
        fromSchema,
        toSchema,
        fromVersion,
        toVersion,
        api,
      );
      comparisons[api] = changelog;
    } catch (error) {
      console.warn(
        `Failed to compare ${api} API: ${error instanceof Error ? error.message : error}`,
      );
      // Skip API if comparison fails - comparisons object only stores successful results
    }
  }

  return comparisons;
}

/**
 * Generate all version comparisons for the build process
 */
async function generateComparisonFiles(): Promise<void> {
  console.log('Generating schema comparisons for documentation...\n');

  const versionSet = getCurrentVersionSet();
  const outputDir = './dist/comparisons';

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // All adjacent version pairs, oldest first:
  // older[1] → older[0] → previous → current → releaseCandidate
  const pairs = getAdjacentVersionPairs(versionSet);

  console.log(`Generating comparisons:`);
  pairs.forEach(({ from, to }) => console.log(`   ${from} → ${to}`));
  console.log(`   Output: ${outputDir}\n`);

  try {
    for (const { from, to } of pairs) {
      console.log(`Generating comparison ${from} → ${to}...`);
      const comparison = await generateComparisonData(from, to);

      const filePath = path.join(outputDir, `${from}-to-${to}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify(comparison, null, 2),
        'utf-8',
      );
      console.log(`Saved: ${filePath}`);
    }

    // Generate comparison manifest: every adjacent pair, plus the
    // current/next semantic aliases
    const manifest = {
      generatedAt: new Date().toISOString(),
      versionSet,
      comparisons: {
        current: {
          from: versionSet.previous,
          to: versionSet.current,
          file: `${versionSet.previous}-to-${versionSet.current}.json`,
        },
        next: {
          from: versionSet.current,
          to: versionSet.releaseCandidate,
          file: `${versionSet.current}-to-${versionSet.releaseCandidate}.json`,
        },
        adjacent: pairs.map(({ from, to }) => ({
          from,
          to,
          file: `${from}-to-${to}.json`,
        })),
      },
    };

    const manifestPath = path.join(outputDir, 'manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );
    console.log(`Saved: ${manifestPath}`);

    console.log('\nSchema comparisons generated successfully!');
    console.log(`   Available in: ${path.resolve(outputDir)}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Comparison generation failed:', errorMessage);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateComparisonFiles().catch(console.error);
}

export { generateComparisonFiles };
