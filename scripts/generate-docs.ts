import './lib/load-env.js';
import fs from 'fs/promises';
import { match, P } from 'ts-pattern';
import { getCurrentVersionSet, getVersionMetadata } from './version-utils.js';
import { generateText } from './lib/opencode-go.js';
import {
  createFileOperationHandler,
  handleOperationResult,
} from './lib/patterns.js';

// =============================================================================
// Type Definitions (previously in readme-types.ts)
// =============================================================================

type VersionComparison = {
  'fromVersion': string;
  'toVersion': string;
  'storefront'?: unknown;
  'admin'?: unknown;
  'customer-account'?: unknown;
};

type ExportPaths = {
  types: {
    sfapi: string[];
    admin: string[];
    caapi: string[];
  };
  schemas: {
    sfapi: string[];
    admin: string[];
    caapi: string[];
  };
  comparisons: Record<string, string>;
};

type ReadmeInput = {
  packageMetadata: {
    name: string;
    version: string;
    generatedAt: string;
  };
  versionSet: {
    current: string;
    previous: string;
    olderSupported: string[];
    releaseCandidate: string;
    unstable: string;
  };
  versionMetadata: Record<
    string,
    {
      description: string;
      status: 'stable' | 'preview' | 'experimental' | 'deprecated';
    }
  >;
  exports: ExportPaths;
  apiStats: {
    'storefront': {
      description: string;
      typeCount: number;
      examples: string[];
    };
    'admin': {
      description: string;
      typeCount: number;
      examples: string[];
    };
    'customer-account': {
      description: string;
      typeCount: number;
      examples: string[];
    };
  };
  comparisons: {
    current: VersionComparison;
    next: VersionComparison;
  };
};

// =============================================================================
// Utility Functions (previously in readme-utils.ts)
// =============================================================================

/**
 * Extract export paths from package.json
 */
async function gatherExportData(): Promise<ExportPaths> {
  const packageJsonPath = './package.json';
  const content = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(content);

  // Group exports by category
  const exports = packageJson.exports || {};
  const exportPaths: ExportPaths = {
    types: {
      sfapi: [],
      admin: [],
      caapi: [],
    },
    schemas: {
      sfapi: [],
      admin: [],
      caapi: [],
    },
    comparisons: {},
  };

  // Process each export entry
  Object.entries(exports).forEach(([key, value]) => {
    match(key)
      // Type exports
      .with(P.union('./sfapi', P.string.startsWith('./sfapi/')), () => {
        // Don't include the "." version in the list - it's implicit as "latest"
        if (key !== './sfapi') {
          const version = key.replace('./sfapi/', '');
          const sfapiTypes = exportPaths.types['sfapi'];
          if (sfapiTypes) sfapiTypes.push(version);
        }
      })
      .with(P.union('./admin', P.string.startsWith('./admin/')), () => {
        // Don't include the "." version in the list - it's implicit as "latest"
        if (key !== './admin') {
          const version = key.replace('./admin/', '');
          const adminTypes = exportPaths.types['admin'];
          if (adminTypes) adminTypes.push(version);
        }
      })
      .with(P.union('./caapi', P.string.startsWith('./caapi/')), () => {
        // Don't include the "." version in the list - it's implicit as "latest"
        if (key !== './caapi') {
          const version = key.replace('./caapi/', '');
          const caapiTypes = exportPaths.types['caapi'];
          if (caapiTypes) caapiTypes.push(version);
        }
      })
      // Schema exports
      .with(P.string.startsWith('./schemas/sfapi/'), () => {
        const version = key.replace('./schemas/sfapi/', '');
        const sfapiSchemas = exportPaths.schemas['sfapi'];
        if (sfapiSchemas) sfapiSchemas.push(version);
      })
      .with(P.string.startsWith('./schemas/admin/'), () => {
        const version = key.replace('./schemas/admin/', '');
        const adminSchemas = exportPaths.schemas['admin'];
        if (adminSchemas) adminSchemas.push(version);
      })
      .with(P.string.startsWith('./schemas/caapi/'), () => {
        const version = key.replace('./schemas/caapi/', '');
        const caapiSchemas = exportPaths.schemas['caapi'];
        if (caapiSchemas) caapiSchemas.push(version);
      })
      // Comparison exports
      .with(P.string.startsWith('./comparisons/'), () => {
        const type = key.replace('./comparisons/', '');
        exportPaths.comparisons[type] = value as string;
      })
      .otherwise(() => {
        // Skip other exports
      });
  });

  // Sort versions for consistency
  Object.keys(exportPaths.types).forEach((api) => {
    const apiTypes = exportPaths.types[api as keyof typeof exportPaths.types];
    if (apiTypes) apiTypes.sort();
  });
  Object.keys(exportPaths.schemas).forEach((api) => {
    const apiSchemas =
      exportPaths.schemas[api as keyof typeof exportPaths.schemas];
    if (apiSchemas) apiSchemas.sort();
  });

  return exportPaths;
}

/**
 * Count types for a specific API
 */
async function countApiTypes(
  api: 'storefront' | 'admin' | 'customer-account',
): Promise<number> {
  try {
    const countTypesPath = './scripts/count-types.ts';
    const { execSync } = await import('child_process');

    // Run count-types script with specific API filter
    const output = execSync(`npx tsx ${countTypesPath} --api ${api}`, {
      encoding: 'utf-8',
    });

    // Parse output to extract count
    const countMatch = output.match(/Total:\s*(\d+)/);
    return countMatch && countMatch[1] ? parseInt(countMatch[1], 10) : 0;
  } catch {
    // Silently use default if count fails
    return match(api)
      .with('storefront', () => 200)
      .with('admin', () => 500)
      .with('customer-account', () => 50)
      .exhaustive();
  }
}

/**
 * Generate example imports for an API
 */
function generateApiExamples(
  api: 'sfapi' | 'admin' | 'caapi',
  versions: string[],
): string[] {
  const typeExamples = match(api)
    .with('sfapi', () => 'Product, Cart, Checkout')
    .with('admin', () => 'Shop, Webhook, InventoryLevel')
    .with('caapi', () => 'Customer, Order, MailingAddress')
    .exhaustive();

  // Generate examples for the two most recent versions
  return versions
    .filter((v) => v !== '.')
    .slice(0, 2)
    .map(
      (version) =>
        `import { ${typeExamples} } from '@juanpprieto/shopify-api-types/${api}/${version}';`,
    );
}

/**
 * Load comparison data from dist
 */
async function loadComparison(
  type: 'current' | 'next',
): Promise<VersionComparison> {
  try {
    const manifestPath = './dist/comparisons/manifest.json';
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    const comparisonFile = manifest.comparisons[type]?.file;
    if (!comparisonFile) {
      throw new Error(`No ${type} comparison file in manifest`);
    }

    const comparisonPath = `./dist/comparisons/${comparisonFile}`;
    const content = await fs.readFile(comparisonPath, 'utf-8');
    const data = JSON.parse(content);

    return data;
  } catch (error) {
    console.error(`Failed to load ${type} comparison:`, error);
    // Return empty comparison as fallback
    return {
      fromVersion: type === 'current' ? '2025-04' : '2025-07',
      toVersion: type === 'current' ? '2025-07' : '2025-10',
    };
  }
}

/**
 * Prepare all input data for README generation
 */
async function prepareInputData(): Promise<ReadmeInput> {
  // Read package.json
  const packageJsonContent = await fs.readFile('./package.json', 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);

  // Get version information
  const versionSet = getCurrentVersionSet();

  // Gather all data in parallel where possible
  const [exportPaths, rawCurrentComparison, rawNextComparison] =
    await Promise.all([
      gatherExportData(),
      loadComparison('current'),
      loadComparison('next'),
    ]);

  // Condense comparisons before prompting: the raw diffs run to hundreds
  // of KB and overflow the generation budget. The README only needs the
  // summaries, every breaking change, and a sample of additions.
  const currentComparison = condenseComparison(rawCurrentComparison);
  const nextComparison = condenseComparison(rawNextComparison);

  // Count types for each API
  const [storefrontCount, adminCount, customerAccountCount] = await Promise.all(
    [
      countApiTypes('storefront'),
      countApiTypes('admin'),
      countApiTypes('customer-account'),
    ],
  );

  // Build API stats
  const apiStats: ReadmeInput['apiStats'] = {
    'storefront': {
      description: 'Product catalog, cart, checkout, and others',
      typeCount: storefrontCount,
      examples: generateApiExamples('sfapi', exportPaths.types['sfapi'] || []),
    },
    'admin': {
      description: 'Store management, webhooks, analytics, and others',
      typeCount: adminCount,
      examples: generateApiExamples('admin', exportPaths.types['admin'] || []),
    },
    'customer-account': {
      description: 'Customer profiles, orders, addresses, and others',
      typeCount: customerAccountCount,
      examples: generateApiExamples('caapi', exportPaths.types['caapi'] || []),
    },
  };

  // Build version metadata - map to expected format
  const versionMetadata = {
    [versionSet.current]: {
      description: getVersionMetadata(versionSet.current).description,
      status: getVersionMetadata(versionSet.current).status,
    },
    [versionSet.previous]: {
      description: getVersionMetadata(versionSet.previous).description,
      status: getVersionMetadata(versionSet.previous).status,
    },
    ...Object.fromEntries(
      versionSet.olderSupported.map((version) => [
        version,
        {
          description: getVersionMetadata(version).description,
          status: getVersionMetadata(version).status,
        },
      ]),
    ),
    [versionSet.releaseCandidate]: {
      description: getVersionMetadata(versionSet.releaseCandidate).description,
      status: getVersionMetadata(versionSet.releaseCandidate).status,
    },
    [versionSet.unstable]: {
      description: getVersionMetadata(versionSet.unstable).description,
      status: getVersionMetadata(versionSet.unstable).status,
    },
  };

  // Assemble final input
  const input: ReadmeInput = {
    packageMetadata: {
      name: packageJson.name,
      version: packageJson.version,
      generatedAt: new Date().toISOString(),
    },
    versionSet,
    versionMetadata,
    exports: exportPaths,
    apiStats,
    comparisons: {
      current: currentComparison,
      next: nextComparison,
    },
  };

  return input;
}

/**
 * Reduce a raw comparison to what the README needs: per-API summary
 * counts, every breaking-change description, and a capped sample of
 * added type names. Raw diffs run to hundreds of KB.
 */
function condenseComparison(comparison: VersionComparison): VersionComparison {
  const condensed: VersionComparison = {
    fromVersion: comparison.fromVersion,
    toVersion: comparison.toVersion,
  };

  for (const api of ['storefront', 'admin', 'customer-account'] as const) {
    const data = comparison[api] as
      | {
          summary?: unknown;
          changes?: Record<
            string,
            Array<{
              name?: string;
              breaking?: boolean;
              changeType?: string;
              description?: string;
            }>
          >;
        }
      | undefined;
    if (!data) continue;

    const allChanges = Object.values(data.changes ?? {}).flat();
    const breakingChanges = allChanges
      .filter((c) => c.breaking)
      .map((c) => c.description ?? c.name ?? '')
      .filter((d) => d !== '');
    const addedNames = allChanges
      .filter((c) => c.changeType === 'added' && !c.breaking)
      .map((c) => c.name ?? '')
      .filter((n) => n !== '')
      .slice(0, 20);

    condensed[api] = {
      summary: data.summary,
      breakingChanges,
      notableAdditions: addedNames,
    };
  }

  return condensed;
}

// Fixed README header. The script adds it, so a model can never drop
// or change the title and badges.
const README_HEADER = `# @juanpprieto/shopify-api-types

[![CI](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml)
[![Release](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@juanpprieto/shopify-api-types)](https://www.npmjs.com/package/@juanpprieto/shopify-api-types)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

`;

/**
 * README generation prompt. The style contract enforces the anti-slop
 * rules from the human-writer audit protocol; validateReadmeStyle()
 * gate-checks the output against the same rules.
 */
const README_PROMPT = `Write the complete README.md for this npm package from the JSON input data below.
Output ONLY the raw markdown, no preamble and no code fence around the document.

Content requirements:
- Start with a one-paragraph description. Do not write a title or badges; the script adds them.
- The document ends with a "## License" section containing the single line "MIT".
- Supported versions table with semantic aliases (current/previous/next/unstable).
- Install and usage examples for versioned type imports, alias imports, schema imports, and comparison imports.
- API overview table with type counts.
- A section on what changed between previous and current version (use the comparison data, list every breaking change).
- A short preview section for the release candidate comparison.
- Package exports reference tree.

Correctness requirements:
- Every import path MUST match a key of the exports map in the input data exactly.
  Export keys use slashes: "@juanpprieto/shopify-api-types/sfapi/2026-01", "/sfapi/current", "/schemas/admin/2026-01", "/comparisons/current".
- Use only version numbers, counts, and change details present in the input data. Invent nothing.

Readability requirements:
- Wrap every GraphQL identifier in backticks: type names, field names, argument names, and type expressions like \`[UserError!]!\`.
- Breaking-change bullets follow the pattern: \`Identifier\` - what changed. When there are more than 6, group them under short bold labels by kind (removed types, field type changes, input changes).
- For additions, do NOT list every name. State the total count, name the feature area, and give at most 8 representative type names in backticks.
- Short paragraphs. No sentence over 25 words in prose sections.

Simplified Technical English (ASD-STE100):
- Active voice. Name the actor: "The package exports", not "is exported by".
- Simple tenses only: simple present, simple past, simple future, imperative. No perfect tenses.
- Imperative for instructions: "Install the package", not "You should install".
- One instruction per sentence. Instructions have at most 20 words.
- Standard verbs: check, make sure, start, stop, use, show, find, change, remove, need.
  Never: verify, ensure, initiate, utilize, display, locate, modify, require.

Style contract (strict):
- Zero emojis anywhere, including headings.
- Zero em dashes. Use commas, parentheses, or periods.
- No marketing adjectives: comprehensive, robust, seamless, powerful, cutting-edge, innovative, extensive, rich.
- No filler phrases: "it is important to note", "a testament to", "in today's", "at the forefront", "serves as".
- No words: delve, leverage, utilize, facilitate, streamline, holistic, ecosystem, landscape, myriad, moreover, furthermore.
- No meta-commentary ("let's explore", "in this section") and no closing summary section.
- Plain declarative sentences. Vary sentence length. Prefer tables and code blocks over prose.
- Headings are plain text, sentence case, no decorations.`;

/**
 * Hard style gate for generated READMEs (anti-slop + verbosity rules).
 * Throws when the output violates the style contract, so a bad
 * generation fails loudly instead of shipping.
 */
function validateReadmeStyle(content: string): void {
  const violations: string[] = [];

  // An empty or skeletal document must never pass the gate
  if (content.trim().length < 1500) {
    violations.push(
      `content too short (${content.trim().length} chars) - generation likely failed`,
    );
  }

  // Truncation check: the prompt requires a closing License section
  if (!/## License\s+MIT\s*$/i.test(content.trim())) {
    violations.push(
      'document does not end with the License section - output may be truncated',
    );
  }

  const emojiPattern = /\p{Extended_Pictographic}/u;
  if (emojiPattern.test(content)) {
    violations.push('contains emojis');
  }

  const emDashes = (content.match(/—/g) ?? []).length;
  if (emDashes > 0) {
    violations.push(`contains ${emDashes} em dash(es)`);
  }

  const slopWords =
    /\b(delve|tapestry|multifaceted|leverage|utilize|facilitate|streamline|holistic|myriad|moreover|furthermore|seamless|cutting-edge|comprehensive)\b/i;
  const slopMatch = content.match(slopWords);
  if (slopMatch) {
    violations.push(`contains slop vocabulary ("${slopMatch[0]}")`);
  }

  // STE: no prose sentence over 25 words (code, tables, and headings excluded)
  // Paragraphs join their wrapped lines; each list item counts on its own
  const units = content
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .flatMap((block) => {
      const lines = block
        .split('\n')
        .filter((line) => !/^\s*(\||#|!\[|\[!\[)/.test(line));
      return lines.some((line) => /^\s*([-*+]|\d+\.)\s/.test(line))
        ? lines
        : [lines.join(' ')];
    });
  const longSentence = units
    .flatMap((unit) => unit.split(/(?<=[.!?])\s+/))
    .find((sentence) => sentence.split(/\s+/).filter(Boolean).length > 25);
  if (longSentence) {
    violations.push(
      `has a sentence over 25 words ("${longSentence.slice(0, 60)}...")`,
    );
  }

  const steVerbs = /\b(verify|ensure|initiate|utilize|locate)\b/i;
  const steMatch = content.match(steVerbs);
  if (steMatch) {
    violations.push(`uses a non-STE verb ("${steMatch[0]}")`);
  }

  const slopPhrases =
    /it is important to note|a testament to|in today.s|at the forefront|serves as a|let.s (explore|dive)/i;
  const phraseMatch = content.match(slopPhrases);
  if (phraseMatch) {
    violations.push(`contains slop phrase ("${phraseMatch[0]}")`);
  }

  if (violations.length > 0) {
    throw new Error(
      `Generated README failed the style gate: ${violations.join('; ')}. ` +
        `Regenerate or edit before shipping.`,
    );
  }
}

/**
 * Generate README using AI or fallback
 */
async function generateDocs(): Promise<void> {
  console.log('Generating README documentation...\n');

  const readmePath = './README.md';
  const fileHandler = createFileOperationHandler();

  try {
    // Step 1: Gather all required data
    console.log('Gathering data for README generation...');
    const inputData = await prepareInputData();

    console.log(
      `   Package: ${inputData.packageMetadata.name} v${inputData.packageMetadata.version}`,
    );
    console.log(`   Current version: ${inputData.versionSet.current}`);
    console.log(
      `   APIs documented: ${Object.keys(inputData.apiStats).length}`,
    );
    console.log(
      `   Export paths: ${Object.keys(inputData.exports).length} categories\n`,
    );

    // Step 2: Generate README content
    console.log('Generating README content...');

    const readmeContent =
      README_HEADER +
      (await generateText(README_PROMPT, inputData)).trim() +
      '\n';
    console.log('   README generated successfully with AI\n');

    // Gate-check the output against the style contract before writing
    validateReadmeStyle(readmeContent);
    console.log('   README passed the style gate (no emojis, no slop)\n');

    // Step 3: Write README file
    console.log('Writing README.md...');

    const writeResult = await fileHandler(
      {
        operation: 'write',
        target: readmePath,
      },
      async () => {
        await fs.writeFile(readmePath, readmeContent, 'utf-8');
        return { path: readmePath };
      },
    );

    handleOperationResult(writeResult, {
      onSuccess: (data) => {
        console.log(`   README written to ${data.path}\n`);
        console.log('Documentation generation complete!');
      },
      onError: (error) => {
        throw new Error(`Failed to write README: ${error}`);
      },
    });
  } catch (error) {
    console.error('Documentation generation failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDocs();
}

export { generateDocs, validateReadmeStyle };
