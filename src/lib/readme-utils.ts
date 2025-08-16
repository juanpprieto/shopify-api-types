import fs from 'fs/promises';
import { match, P } from 'ts-pattern';
import {
  getCurrentVersionSet,
  getVersionMetadata,
} from '../../scripts/version-utils.js';
import type {
  ReadmeInput,
  ExportPaths,
  VersionComparison,
} from './readme-types.js';

/**
 * Extract export paths from package.json
 */
export async function gatherExportData(): Promise<ExportPaths> {
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

  return exportPaths as ExportPaths; // Skip validation due to zod version conflict
}

/**
 * Count types for a specific API
 */
export async function countApiTypes(
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
        `import { ${typeExamples} } from '@juanpprieto/shopify-api-types/${api}${version}';`,
    );
}

/**
 * Load comparison data from dist
 */
export async function loadComparison(
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

    return data as VersionComparison; // Skip validation due to zod version conflict
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
export async function prepareInputData(): Promise<ReadmeInput> {
  // Read package.json
  const packageJsonContent = await fs.readFile('./package.json', 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);

  // Get version information
  const versionSet = getCurrentVersionSet();

  // Gather all data in parallel where possible
  const [exportPaths, currentComparison, nextComparison] = await Promise.all([
    gatherExportData(),
    loadComparison('current'),
    loadComparison('next'),
  ]);

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

  // Skip validation due to zod version conflict with knip
  return input as ReadmeInput;
}
