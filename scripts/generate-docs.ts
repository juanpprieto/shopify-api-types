import './lib/load-env.js';
import fs from 'fs/promises';
import { match, P } from 'ts-pattern';
import { execSync } from 'child_process';
import {
  getCurrentVersionSet,
  getVersionMetadata,
  releaseDateFromPackageVersion,
} from './version-utils.js';
import { DEFAULT_MODEL, generateText } from './lib/opencode-go.js';
import {
  WRITING_CONTRACT,
  findProseViolations,
} from './lib/writing-contract.js';
import { upsertChangelogSection } from './lib/changelog.js';
import { describeChange } from './lib/change-context.js';

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
    // Facts the README notes may state; read from package.json
    typesOnly: boolean;
    runtimeDependencies: number;
    nodeEngine: string;
    releaseNotesUrl: string;
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
      // dist ships .d.ts and JSON only (see ci:validate-build)
      typesOnly: true,
      runtimeDependencies: Object.keys(packageJson.dependencies ?? {}).length,
      nodeEngine: packageJson.engines?.node ?? '',
      // The Release workflow creates this release from the CHANGELOG section
      releaseNotesUrl: `https://github.com/juanpprieto/shopify-api-types/releases/tag/v${packageJson.version}`,
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
export function condenseComparison(
  comparison: VersionComparison,
): VersionComparison {
  const { fromVersion, toVersion } = comparison;
  const condensed: VersionComparison = { fromVersion, toVersion };

  for (const api of ['storefront', 'admin', 'customer-account'] as const) {
    const data = comparison[api] as
      | {
          fromVersion?: string;
          toVersion?: string;
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
    // The comparison files store the versions per API, not at the top
    const from = data.fromVersion ?? fromVersion;
    const to = data.toVersion ?? toVersion;

    // Every breaking change and a sample of additions, each with Shopify's
    // description and migration note, so the texts can explain the impact
    // enums repeats entries of types, so skip it
    const allChanges = Object.entries(data.changes ?? {})
      .filter(([group]) => group !== 'enums')
      .flatMap(([, changes]) => changes);
    const additions = allChanges.filter(
      (c) => c.changeType === 'added' && !c.breaking,
    );
    condensed[api] = {
      summary: data.summary,
      breakingChanges: allChanges
        .filter((c) => c.breaking)
        .map((c) => describeChange(api, from, to, c)),
      additionCount: additions.length,
      // Full list for the script; the model gets only the sample below
      additionLabels: additions.map(
        (c) => (c as { path?: string }).path ?? c.name ?? '',
      ),
      notableAdditions: additions
        .slice(0, 40)
        .map((c) => describeChange(api, from, to, c)),
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
 * Assemble README.md. The first line is a hidden version stamp: the
 * Release workflow stops when it does not match the version it publishes,
 * so a skipped Docs step cannot ship an old README.
 */
function buildReadme(version: string, body: string): string {
  return `<!-- generated for ${version} -->\n${README_HEADER}${body.trim()}\n`;
}

/**
 * README prompt. The shared writing contract carries the clarity and STE
 * rules; validateReadmeStyle() checks the output.
 */
/**
 * How to write about schema changes. Shared by the README and the
 * CHANGELOG, so both explain the same changes the same way.
 */
const CHANGE_RULES = `How to write about changes:
- The reader is a developer who maintains a Shopify app or storefront. They want to know what happened, whether it affects their code, and what to do. They do not want a list of schema items.
- Every change item in the input has Shopify's own text: shopifyDescription (what the item is) and, for a deprecated item, deprecationReason (Shopify's migration note). These are your only source for what an item does and what replaces it. Never guess a replacement.
- Group related changes by feature area, for example discounts, markets, metaobjects, checkout, or payments. Give each group a heading in plain words that names the area and what happens, like "Markets: currency settings move to \`marketUpdate\`".
- Under each group heading, write 1 to 3 sentences: what Shopify changed, which apps it affects, and what to do. Take "what to do" from deprecationReason, or from shopifyDescription when it names a replacement. When Shopify names no replacement, say so in a few words. For a new feature, say what an app can do now that it could not do before.
- State the action once. Do not write "need to change" and then the same action again.
- After those sentences, put the exact items of the group in a collapsed block. Its summary says how many items it has, like "23 removed types". One item per line, in backticks.
- Say each fact once. Do not repeat a group's sentences in an alert, an introduction, or another section.
- When an API has no changes, say so in one short line. Do not make a section for it.
- Put every identifier, type, field, argument, enum value, path, and command in backticks.
- Leave one blank line between paragraphs, lists, tables, alerts, and collapsed blocks.

Collapsed blocks use exactly this form. Leave a blank line after </summary> and before </details>, or the list inside does not render:

<details>
<summary>23 removed types</summary>

- \`PriceRule\`
- \`PriceRuleValue\`

</details>`;

const README_PROMPT = `Write the complete README.md for this npm package from the JSON input data below.
Output ONLY the raw markdown, no preamble and no code fence around the document.
Do not write a title or badges; the script adds them.

Readers see this file on GitHub and on npmjs.com. Write it for a TypeScript developer who opens it for the first time and wants to start in one minute.

Use exactly this layout, in this order:

1. One opening sentence, at most 25 words: what the package gives a TypeScript developer and why it helps. No version list, no dates, no build data.
2. "## Install": a \`bash\` code block with \`npm install -D @juanpprieto/shopify-api-types\`. Then a \`> [!NOTE]\` alert with the facts from packageMetadata: the package has types and JSON only (typesOnly), the runtime dependency count, and the Node.js range (nodeEngine).
3. "## Quick start": one \`ts\` code block with 3 short imports: an alias import, a versioned import, and a schema or comparison import. Then a table with the columns "Import path" and "Use it when", one row per import style.
4. "## Versions": a table with the columns "Alias", "Version", "Status", one row for every version in the version set. Then a \`> [!TIP]\` alert: use \`current\` for production code. Then a \`> [!WARNING]\` alert: \`next\` and \`unstable\` change before Shopify releases them.
5. "## APIs": a table with the columns "API", "Import prefix", "Types", one row per API, with the type counts.
6. "## What changed in <current version>": a \`> [!IMPORTANT]\` alert of 1 sentence with the number of breaking changes and the number of feature areas they touch. Then a table with the columns "Area", "What changes", "What to do": one row per feature area with breaking changes, at most 12 words per cell. Then one sentence that names the new feature areas. Then the line "Every changed item, with details: [release notes for <package version>](<releaseNotesUrl>)". The README gives no more detail than this; the release notes have it.
7. "## Coming in <next version>": a \`> [!WARNING]\` alert of 1 sentence: these changes are not stable yet. Then a table with the columns "Area", "What changes", one row per feature area with breaking changes in the release candidate comparison.
8. "## Schemas and comparisons": one \`ts\` code block that imports a schema and a comparison file, and 2 sentences on what each one contains.
9. "## All exports": one \`<details>\` block "Show all export paths", with a \`text\` code block that lists every export key, grouped by API.
10. "## License" with the single line "MIT". Nothing after it.

GitHub Markdown rules:
- Alerts use exactly this form, with no text on the first line:
  > [!NOTE]
  > Text of the note.
- Every code block names its language: \`bash\`, \`ts\`, or \`text\`.
- Use a table for 3 or more items that have the same fields. Use a list for anything else.
- Headings go no deeper than "###". Do not use bold text as a heading.

Correctness requirements:
- Every import path MUST match a key of the exports map in the input data exactly.
  Export keys use slashes: "@juanpprieto/shopify-api-types/sfapi/2026-01", "/sfapi/current", "/schemas/admin/2026-01", "/comparisons/current".
- Wrap every GraphQL identifier in backticks: type names, field names, argument names, and type expressions like \`[UserError!]!\`.

How to describe a change in a table cell:
- Use Shopify's own text in the input: shopifyDescription (what the item is) and deprecationReason (the migration note). Never guess a replacement.
- Name the feature area in plain words, like "Discounts" or "Markets", not the API name alone.
- "What to do" is the action from deprecationReason or shopifyDescription. When Shopify names no replacement, write "Remove the references".

${WRITING_CONTRACT}`;

/**
 * CHANGELOG prompt. The section is also the GitHub release text, so it
 * follows the same contract as the README.
 */
const CHANGELOG_PROMPT = `Write the CHANGELOG.md section for the package version in the JSON input data below.
This section is also the text of the GitHub release. A developer reads it to decide whether to upgrade and what to change.
Output ONLY the raw markdown body. Do not write the "## <version>" heading; the script adds it.

Use exactly this layout, in this order:
1. One or 2 sentences: which Shopify API version is now current, and what that means for an app that upgrades. Do not list the whole version set here.
2. A \`> [!IMPORTANT]\` alert: how many breaking changes per API, in one sentence.
3. "### Breaking changes": the groups of breaking changes from the previous to the current version. Each group heading is "####".
4. "### New features": at most 5 groups for the additions that give an app the most new capability, each with a "####" heading. Then the line "<!-- other-additions -->" on its own. The script replaces it with a collapsed list of every other addition, so do not list the other additions yourself. Use additionCount for the totals.
5. "### Release candidate": the groups of the release candidate comparison, with "####" headings, shorter than section 3.
6. "### Versions in this release": a table with the columns "Alias", "Version", one row per version in the version set, and a table with the columns "API", "Types" for the type counts.
7. "### Package changes": exactly the line "[TK: package changes in this release, for example Node.js support or dependencies]". The input data has no package changes; a person fills this in.

${CHANGE_RULES}

${WRITING_CONTRACT}`;

/**
 * Replace the other-additions marker with a collapsed list of every added
 * item that the text does not name yet. The list comes from the comparison
 * data, so it is complete; the model only sees a sample of the additions.
 */
export function fillOtherAdditions(
  body: string,
  comparison: Record<string, unknown>,
): string {
  const apis: Array<[string, string]> = [
    ['storefront', 'Storefront API'],
    ['admin', 'Admin API'],
    ['customer-account', 'Customer Account API'],
  ];
  const parts: string[] = [];
  let total = 0;
  for (const [key, label] of apis) {
    const labels =
      (comparison[key] as { additionLabels?: string[] } | undefined)
        ?.additionLabels ?? [];
    const rest = [...new Set(labels)].filter(
      (name) => name !== '' && !body.includes(`\`${name}\``),
    );
    if (rest.length === 0) continue;
    total += rest.length;
    parts.push(
      `${label} (${rest.length}):\n\n${rest.map((n) => `- \`${n}\``).join('\n')}`,
    );
  }
  const block =
    total === 0
      ? ''
      : `<details>\n<summary>${total} other additions</summary>\n\n${parts.join('\n\n')}\n\n</details>`;
  return body.replace('<!-- other-additions -->', block);
}

/**
 * README gate: the shared prose checks plus the README-specific checks.
 * Throws so that a bad generation fails before it is written.
 */
function validateReadmeStyle(content: string): void {
  const violations = findProseViolations(content);

  // An empty or skeletal document must never pass the gate
  if (content.trim().length < 1500) {
    violations.push(
      `content too short (${content.trim().length} chars) - generation likely failed`,
    );
  }

  // Layout: the elements the prompt requires for GitHub readers
  const required: Array<[RegExp, string]> = [
    [/^## Install$/m, '"## Install" section'],
    [/^## Quick start$/m, '"## Quick start" section'],
    [/^> \[!(NOTE|TIP|IMPORTANT|WARNING)\]$/m, 'a GitHub alert'],
    [/<details>/, 'a <details> block'],
    [/```ts\n/, 'a ts code block'],
  ];
  for (const [pattern, label] of required) {
    if (!pattern.test(content)) violations.push(`missing ${label}`);
  }
  const opened = (content.match(/<details>/g) ?? []).length;
  const closed = (content.match(/<\/details>/g) ?? []).length;
  if (opened !== closed) {
    violations.push(`${opened} <details> but ${closed} </details>`);
  }
  if (/<\/summary>\n(?!\n)/.test(content)) {
    violations.push('no blank line after </summary>; the list will not render');
  }
  if (/```\n(?!\n|$)/.test(content.replace(/```\n(?=[\s\S]*?```)/, ''))) {
    // checked below by language rule
  }
  if (/^```$/m.test(content.replace(/```[\w-]+\n[\s\S]*?\n```/g, ''))) {
    violations.push('a code block without a language');
  }

  // Truncation check: the prompt requires a closing License section
  if (!/## License\s+MIT\s*$/i.test(content.trim())) {
    violations.push(
      'document does not end with the License section - output may be truncated',
    );
  }

  if (violations.length > 0) {
    throw new Error(
      `Generated README failed the style gate: ${violations.join('; ')}. ` +
        `Regenerate or edit before shipping.`,
    );
  }
}

/**
 * CHANGELOG gate: the shared prose checks, the required sections, and the
 * open package-changes marker for the reviewer.
 */
function validateChangelogDraft(body: string): void {
  const violations = findProseViolations(body);
  for (const heading of [
    '### Breaking changes',
    '### Release candidate',
    '### Package changes',
  ]) {
    if (!body.includes(heading)) violations.push(`missing "${heading}"`);
  }
  if (/^##\s/m.test(body)) {
    violations.push('contains a "## " heading; the script adds it');
  }
  if (violations.length > 0) {
    throw new Error(
      `Generated CHANGELOG section failed the style gate: ${violations.join('; ')}.`,
    );
  }
}

/**
 * Generate README.md and the CHANGELOG.md section for the package version.
 * Both texts must pass their gates before either file changes.
 */
async function generateDocs(): Promise<void> {
  try {
    // Use the version set of the package version, as CI and the pre-push
    // hook do. With the clock, the texts can label one diff with another
    // quarter. Child processes (count-types) inherit the value.
    const packageVersion = (
      JSON.parse(await fs.readFile('./package.json', 'utf-8')) as {
        version: string;
      }
    ).version;
    process.env['RELEASE_DATE'] ||=
      releaseDateFromPackageVersion(packageVersion) ?? '';

    console.log('Gathering data for the README and the CHANGELOG...');
    const inputData = await prepareInputData();
    const { version } = inputData.packageMetadata;

    // The comparisons come from dist; a build for another set is stale
    const manifest = JSON.parse(
      await fs.readFile('./dist/comparisons/manifest.json', 'utf-8'),
    ) as { versionSet: { current: string } };
    if (manifest.versionSet.current !== inputData.versionSet.current) {
      throw new Error(
        `dist/comparisons is for ${manifest.versionSet.current}, but this run needs ` +
          `${inputData.versionSet.current}. ` +
          `Run npm run build first.`,
      );
    }

    // Never rewrite the section of a released version
    const released =
      execSync(`git tag --list v${version}`, { encoding: 'utf-8' }).trim() !==
      '';

    console.log(`   Package: ${inputData.packageMetadata.name} v${version}`);
    console.log(`   Current version: ${inputData.versionSet.current}\n`);

    console.log('Generating both texts (this can take 15 minutes)...');
    const changelogInput = {
      packageVersion: version,
      versionSet: inputData.versionSet,
      typeCounts: Object.fromEntries(
        Object.entries(inputData.apiStats).map(([api, stats]) => [
          api,
          stats.typeCount,
        ]),
      ),
      comparisons: inputData.comparisons,
    };
    // Preview: keep the exact model input next to the drafts, written
    // before the call so a failed run shows it too
    const previewDir = `./preview/${process.env['OPENCODE_GO_MODEL'] || DEFAULT_MODEL}`;
    if (process.argv.includes('--preview')) {
      await fs.mkdir(previewDir, { recursive: true });
      await fs.writeFile(
        `${previewDir}/input-readme.json`,
        JSON.stringify(inputData, null, 2),
      );
      await fs.writeFile(
        `${previewDir}/input-changelog.json`,
        JSON.stringify(changelogInput, null, 2),
      );
    }

    const [readmeBody, changelogDraft] = await Promise.all([
      generateText(README_PROMPT, inputData),
      generateText(CHANGELOG_PROMPT, changelogInput),
    ]);

    const readme = buildReadme(version, readmeBody);
    const changelogBody = fillOtherAdditions(
      changelogDraft,
      inputData.comparisons.current as unknown as Record<string, unknown>,
    );

    // Preview: write both texts and the gate result to preview/ only, so a
    // person can read every draft before any tracked file changes
    if (process.argv.includes('--preview')) {
      const gate = [
        ['README', (): void => validateReadmeStyle(readme)],
        ['CHANGELOG', (): void => validateChangelogDraft(changelogBody)],
      ] as const;
      const results = gate.map(([name, check]) => {
        try {
          check();
          return `${name}: passed`;
        } catch (error) {
          return `${name}: ${error instanceof Error ? error.message : error}`;
        }
      });
      const dir = previewDir;
      await fs.writeFile(`${dir}/README.md`, readme, 'utf-8');
      await fs.writeFile(
        `${dir}/CHANGELOG-${version}.md`,
        `## ${version}\n\n${changelogBody.trim()}\n`,
        'utf-8',
      );
      await fs.writeFile(`${dir}/gate.txt`, results.join('\n') + '\n');
      console.log(`Wrote ${dir}/:`);
      results.forEach((line) => console.log(`   ${line.slice(0, 200)}`));
      return;
    }

    validateReadmeStyle(readme);
    validateChangelogDraft(changelogBody);
    console.log('   Both texts passed the style gates\n');

    await fs.writeFile('./README.md', readme, 'utf-8');
    console.log('Wrote README.md.');
    if (released) {
      console.log(
        `Kept the CHANGELOG section: tag v${version} exists, so ${version} is released.`,
      );
    } else {
      const changelog = await fs.readFile('./CHANGELOG.md', 'utf-8');
      await fs.writeFile(
        './CHANGELOG.md',
        upsertChangelogSection(changelog, version, changelogBody),
        'utf-8',
      );
      console.log(`Wrote the "## ${version}" CHANGELOG section.`);
      console.log('Replace the [TK] marker in "### Package changes" by hand.');
    }
  } catch (error) {
    console.error('Documentation generation failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDocs();
}

export {
  buildReadme,
  generateDocs,
  validateReadmeStyle,
  validateChangelogDraft,
};
