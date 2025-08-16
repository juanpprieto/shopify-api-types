import fs from 'fs/promises';
import path from 'path';
import { match } from 'ts-pattern';
import {
  compareSchemas,
  compareAllApis,
  analyzeChangeImpact,
  formatChangelogSummary,
} from '../src/lib/schema-compare.js';
import { getCurrentVersionSet, getVersionMetadata } from './version-utils.js';
import {
  createFileOperationHandler,
  createFilePathResolver,
} from '../src/lib/patterns.js';
import {
  SUPPORTED_APIS,
  GraphQLSchemaSchema,
  type GraphQLSchema,
  type ApiType,
  type ExtendedApiVersion,
  type SchemaChangelog,
  type MultiApiChangelog,
} from '../src/lib/zod.js';

interface ChangelogOptions {
  fromVersion?: ExtendedApiVersion;
  toVersion?: ExtendedApiVersion;
  apis?: ApiType[];
  outputPath?: string;
  format?: 'json' | 'markdown' | 'both';
}

/**
 * Schema loader function for comparison
 */
async function loadSchema(
  api: ApiType,
  version: ExtendedApiVersion,
): Promise<GraphQLSchema> {
  const pathResolver = createFilePathResolver(process.cwd());
  const fileHandler = createFileOperationHandler();

  const schemaPathResult = pathResolver(api, version, 'schema', 'source');
  if (!schemaPathResult.success) {
    throw new Error(
      `Cannot resolve schema path for ${api}/${version}: ${schemaPathResult.error}`,
    );
  }

  const schemaPath = schemaPathResult.data;

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
 * Generate changelog between two specific versions
 */
async function generateChangelog(
  options: ChangelogOptions = {},
): Promise<void> {
  console.log('🔄 Generating API changelog...\n');

  const versionSet = getCurrentVersionSet();
  const fromVersion = options.fromVersion ?? versionSet.previous;
  const toVersion = options.toVersion ?? versionSet.current;
  const apis = options.apis ?? SUPPORTED_APIS;
  const outputPath = options.outputPath ?? './changelog';
  const format = options.format ?? 'both';

  console.log(`📊 Comparing versions: ${fromVersion} → ${toVersion}`);
  console.log(`🔧 APIs: ${apis.join(', ')}`);
  console.log(`📁 Output: ${outputPath}\n`);

  // Validate versions
  const fromMetadata = getVersionMetadata(fromVersion);
  const toMetadata = getVersionMetadata(toVersion);

  console.log(`From: ${fromVersion} (${fromMetadata.description})`);
  console.log(`To: ${toVersion} (${toMetadata.description})\n`);

  try {
    // Generate multi-API changelog
    const multiApiChangelog = await compareAllApis(
      fromVersion,
      toVersion,
      loadSchema,
    );

    // Generate individual API changelogs
    const individualChangelogs: Partial<Record<ApiType, SchemaChangelog>> = {};
    for (const api of apis) {
      if (multiApiChangelog.changelogs[api]) {
        individualChangelogs[api] = multiApiChangelog.changelogs[api];

        const summary = formatChangelogSummary(
          multiApiChangelog.changelogs[api],
        );
        const impact = analyzeChangeImpact(multiApiChangelog.changelogs[api]);

        console.log(`✅ ${summary}`);
        console.log(`   Impact: ${impact.level} - ${impact.description}`);
      } else {
        console.log(
          `⚠️  ${api} API: No changelog generated (schema not available)`,
        );
      }
    }

    console.log('\n📋 Overall Summary:');
    console.log(`   Total APIs: ${multiApiChangelog.summary.totalApis}`);
    console.log(`   Total Changes: ${multiApiChangelog.summary.totalChanges}`);
    console.log(
      `   Breaking Changes: ${multiApiChangelog.summary.totalBreakingChanges}`,
    );

    // Ensure output directory exists
    await fs.mkdir(outputPath, { recursive: true });

    // Write changelogs based on format
    if (format === 'json' || format === 'both') {
      await writeJsonChangelog(
        outputPath,
        fromVersion,
        toVersion,
        multiApiChangelog,
        individualChangelogs,
      );
    }

    if (format === 'markdown' || format === 'both') {
      await writeMarkdownChangelog(
        outputPath,
        fromVersion,
        toVersion,
        multiApiChangelog,
        individualChangelogs,
      );
    }

    console.log(`\n🎉 Changelog generation complete!`);
    console.log(`📂 Files written to: ${path.resolve(outputPath)}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Changelog generation failed:', errorMessage);
    process.exit(1);
  }
}

/**
 * Write JSON format changelogs
 */
async function writeJsonChangelog(
  outputPath: string,
  fromVersion: ExtendedApiVersion,
  toVersion: ExtendedApiVersion,
  multiApiChangelog: MultiApiChangelog,
  individualChangelogs: Partial<Record<ApiType, SchemaChangelog>>,
): Promise<void> {
  // Write multi-API changelog
  const multiApiPath = path.join(
    outputPath,
    `changelog-${fromVersion}-to-${toVersion}.json`,
  );
  await fs.writeFile(
    multiApiPath,
    JSON.stringify(multiApiChangelog, null, 2),
    'utf-8',
  );
  console.log(`✅ Multi-API changelog: ${multiApiPath}`);

  // Write individual API changelogs
  for (const [api, changelog] of Object.entries(individualChangelogs)) {
    const apiPath = path.join(
      outputPath,
      `${api}-${fromVersion}-to-${toVersion}.json`,
    );
    await fs.writeFile(apiPath, JSON.stringify(changelog, null, 2), 'utf-8');
    console.log(`✅ ${api} changelog: ${apiPath}`);
  }
}

/**
 * Write Markdown format changelogs
 */
async function writeMarkdownChangelog(
  outputPath: string,
  fromVersion: ExtendedApiVersion,
  toVersion: ExtendedApiVersion,
  multiApiChangelog: MultiApiChangelog,
  individualChangelogs: Partial<Record<ApiType, SchemaChangelog>>,
): Promise<void> {
  // Generate comprehensive markdown changelog
  const markdown = generateMarkdownChangelog(
    fromVersion,
    toVersion,
    multiApiChangelog,
    individualChangelogs,
  );

  const markdownPath = path.join(
    outputPath,
    `CHANGELOG-${fromVersion}-to-${toVersion}.md`,
  );
  await fs.writeFile(markdownPath, markdown, 'utf-8');
  console.log(`✅ Markdown changelog: ${markdownPath}`);
}

/**
 * Generate comprehensive markdown changelog
 */
function generateMarkdownChangelog(
  fromVersion: ExtendedApiVersion,
  toVersion: ExtendedApiVersion,
  multiApiChangelog: MultiApiChangelog,
  individualChangelogs: Partial<Record<ApiType, SchemaChangelog>>,
): string {
  const fromMeta = getVersionMetadata(fromVersion);
  const toMeta = getVersionMetadata(toVersion);

  let markdown = `# API Changelog: ${fromVersion} → ${toVersion}

**Generated:** ${new Date(multiApiChangelog.generatedAt).toLocaleString()}

**From:** ${fromVersion} (${fromMeta.description})
**To:** ${toVersion} (${toMeta.description})

## 📊 Summary

- **Total APIs:** ${multiApiChangelog.summary.totalApis}
- **Total Changes:** ${multiApiChangelog.summary.totalChanges}
- **Breaking Changes:** ${multiApiChangelog.summary.totalBreakingChanges}

`;

  // API-specific summaries
  markdown += '## 🔧 API Changes Summary\n\n';
  for (const [api, summary] of Object.entries(
    multiApiChangelog.summary.apisSummary,
  )) {
    const icon =
      summary.breaking > 0 ? '💥' : summary.changes > 0 ? '📝' : '✅';
    markdown += `- **${api}**: ${icon} ${summary.changes} changes (${summary.breaking} breaking)\n`;
  }
  markdown += '\n';

  // Detailed API changelogs
  for (const [api, changelog] of Object.entries(individualChangelogs)) {
    if (!changelog) continue;
    const impact = analyzeChangeImpact(changelog);
    const levelIcon = match(impact.level)
      .with('breaking', () => '💥')
      .with('major', () => '🔶')
      .with('minor', () => '🔵')
      .with('none', () => '✅')
      .exhaustive();

    markdown += `## ${levelIcon} ${api.toUpperCase()} API\n\n`;
    markdown += `**Impact Level:** ${impact.level.toUpperCase()}\n`;
    markdown += `**Description:** ${impact.description}\n\n`;

    if (changelog.summary.totalChanges === 0) {
      markdown += '✅ No changes in this API\n\n';
      continue;
    }

    // Recommendations
    if (impact.recommendations.length > 0) {
      markdown += '**Recommendations:**\n';
      impact.recommendations.forEach((rec) => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }

    // Breaking changes
    if (changelog.summary.breakingChanges > 0) {
      markdown += '### 💥 Breaking Changes\n\n';

      const breakingChanges = [
        ...changelog.changes.types.filter((c) => c.breaking),
        ...changelog.changes.queries.filter((c) => c.breaking),
        ...changelog.changes.mutations.filter((c) => c.breaking),
      ];

      breakingChanges.forEach((change) => {
        markdown += `- **${change.name}**: ${change.description || change.changeType}\n`;
      });
      markdown += '\n';
    }

    // New additions
    if (changelog.summary.additions > 0) {
      markdown += '### 🆕 New Features\n\n';

      const additions = [
        ...changelog.changes.types.filter((c) => c.changeType === 'added'),
        ...changelog.changes.queries.filter((c) => c.changeType === 'added'),
        ...changelog.changes.mutations.filter((c) => c.changeType === 'added'),
      ];

      additions.forEach((change) => {
        markdown += `- **${change.name}**: ${change.description || `New ${change.changeType}`}\n`;
      });
      markdown += '\n';
    }

    // Deprecations
    if (changelog.summary.deprecations > 0) {
      markdown += '### ⚠️ Deprecations\n\n';

      const deprecations = [
        ...changelog.changes.queries.filter(
          (c) => c.changeType === 'deprecated',
        ),
        ...changelog.changes.mutations.filter(
          (c) => c.changeType === 'deprecated',
        ),
      ];

      deprecations.forEach((change) => {
        markdown += `- **${change.name}**: ${change.deprecationReason || 'Deprecated'}\n`;
      });
      markdown += '\n';
    }
  }

  markdown += '---\n\n';
  markdown +=
    '*This changelog was automatically generated by the shopify-api-types schema comparison tool.*\n';

  return markdown;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options: ChangelogOptions = {};

  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    match(arg)
      .with('--from', () => {
        if (nextArg) {
          options.fromVersion = nextArg as ExtendedApiVersion;
          i++;
        }
      })
      .with('--to', () => {
        if (nextArg) {
          options.toVersion = nextArg as ExtendedApiVersion;
          i++;
        }
      })
      .with('--output', () => {
        if (nextArg) {
          options.outputPath = nextArg;
          i++;
        }
      })
      .with('--format', () => {
        if (nextArg && ['json', 'markdown', 'both'].includes(nextArg)) {
          options.format = nextArg as 'json' | 'markdown' | 'both';
          i++;
        }
      })
      .with('--help', () => {
        console.log(`
Usage: tsx scripts/generate-changelog.ts [options]

Options:
  --from <version>     Source version (default: previous)
  --to <version>       Target version (default: current)
  --output <path>      Output directory (default: ./changelog)
  --format <format>    Output format: json, markdown, both (default: both)
  --help               Show this help message

Examples:
  tsx scripts/generate-changelog.ts
  tsx scripts/generate-changelog.ts --from 2025-04 --to 2025-07
  tsx scripts/generate-changelog.ts --format markdown --output ./docs/changelog
        `);
        process.exit(0);
      })
      .otherwise(() => {
        if (arg && arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
      });
  }

  generateChangelog(options);
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

export { generateChangelog, generateComparisonData, loadSchema };
