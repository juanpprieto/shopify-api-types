import fs from 'fs/promises';
import path from 'path';
import { match, P } from 'ts-pattern';
import { getSupportedVersions, getCurrentVersionSet } from './version-utils.js';
import {
  ApiVersionSchema,
  DistPathSchema,
  PackageJsonSchema,
  type ApiType,
} from '../src/lib/zod.js';
import {
  createFilePathResolver,
  createApiIndexPath,
} from '../src/lib/patterns.js';

interface ExportEntry {
  key: string;
  value: string | ExportCondition;
  category:
    | 'root'
    | 'api-root'
    | 'api-version'
    | 'schema'
    | 'comparison'
    | 'version';
}

interface ExportCondition {
  types?: string;
  import?: string;
  require?: string;
  default: string;
}

// API mapping constants - defined once, used multiple times
const API_MAPPINGS: ReadonlyArray<readonly [string, ApiType]> = [
  ['sfapi', 'storefront'],
  ['caapi', 'customer-account'],
  ['admin', 'admin'],
] as const;

function createTypeExportCondition(path: string): ExportCondition {
  return {
    types: path,
    import: path,
    default: path,
  };
}

function createSchemaExportCondition(path: string): ExportCondition {
  return {
    types: path,
    import: path,
    require: path,
    default: path,
  };
}

async function generatePackageExports(): Promise<void> {
  const packagePath = path.join(process.cwd(), 'package.json');
  const rawPackageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
  const pathResolver = createFilePathResolver('.');

  // Validate package.json structure
  const packageJsonValidation = PackageJsonSchema.safeParse(rawPackageJson);
  if (!packageJsonValidation.success) {
    throw new Error('Invalid package.json format');
  }

  // Get only the 4 supported versions
  const versions = getSupportedVersions();
  const versionSet = getCurrentVersionSet(); // Need this for comparison exports
  const exportEntries: ExportEntry[] = [];

  // Validate input data
  for (const version of versions) {
    // Skip validation for 'unstable' as it's not a date format
    if (version !== 'unstable') {
      const versionValidation = ApiVersionSchema.safeParse(version);
      if (!versionValidation.success) {
        throw new Error(`Invalid version: ${version}`);
      }
    }
  }

  // Build exports object with proper conditions for NodeNext support
  const exports: Record<string, string | ExportCondition> = {};

  // Add root export with conditions
  const rootExportPath = './dist/index.d.ts';
  const rootPathValidation = DistPathSchema.safeParse(rootExportPath);
  if (!rootPathValidation.success) {
    throw new Error('Invalid root export path');
  }
  exports['.'] = createTypeExportCondition(rootExportPath);
  exportEntries.push({
    key: '.',
    value: createTypeExportCondition(rootExportPath),
    category: 'root',
  });

  // Add specific version exports with conditions
  versions.forEach((version) => {
    API_MAPPINGS.forEach(([exportKey, api]) => {
      // Use path resolver for consistent path generation
      const pathResult = pathResolver(api, version, 'index', 'dist');
      if (!pathResult.success) {
        throw new Error(
          `Failed to resolve path for ${api}/${version}: ${pathResult.error}`,
        );
      }
      const exportPath = pathResult.data.replace(process.cwd(), '.');
      const pathValidation = DistPathSchema.safeParse(exportPath);
      if (!pathValidation.success) {
        throw new Error(`Invalid export path: ${exportPath}`);
      }

      const fullKey = `./${exportKey}/${version}`;
      exports[fullKey] = createTypeExportCondition(exportPath);
      exportEntries.push({
        key: fullKey,
        value: createTypeExportCondition(exportPath),
        category: 'api-version',
      });
    });
  });

  // Add API root exports with conditions
  API_MAPPINGS.forEach(([exportKey, api]) => {
    const exportPath = createApiIndexPath('.', api, 'dist');
    const pathValidation = DistPathSchema.safeParse(exportPath);
    if (!pathValidation.success) {
      throw new Error(`Invalid API root export path: ${exportPath}`);
    }

    const fullKey = `./${exportKey}`;
    exports[fullKey] = createTypeExportCondition(exportPath);
    exportEntries.push({
      key: fullKey,
      value: createTypeExportCondition(exportPath),
      category: 'api-root',
    });
  });

  // Add schema exports with proper conditions for runtime access
  versions.forEach((version) => {
    API_MAPPINGS.forEach(([exportKey, api]) => {
      // Schema paths go to dist/schemas (copied by copy-schemas script)
      const schemaPath = `./dist/schemas/${api}/${version}.json`;
      const fullKey = `./schemas/${exportKey}/${version}`;
      exports[fullKey] = createSchemaExportCondition(schemaPath);
      exportEntries.push({
        key: fullKey,
        value: createSchemaExportCondition(schemaPath),
        category: 'schema',
      });
    });
  });

  // Add comparison exports with conditions
  const comparisonExports: ReadonlyArray<readonly [string, string]> = [
    [
      './comparisons/current',
      `./dist/comparisons/${versionSet.previous}-to-${versionSet.current}.json`,
    ],
    [
      './comparisons/next',
      `./dist/comparisons/${versionSet.current}-to-${versionSet.releaseCandidate}.json`,
    ],
  ] as const;

  comparisonExports.forEach(([key, value]) => {
    exports[key] = createSchemaExportCondition(value);
    exportEntries.push({
      key,
      value: createSchemaExportCondition(value),
      category: 'comparison',
    });
  });

  // Add version aliases (current, previous, next) with conditions
  const aliases = [
    { alias: 'current', version: versionSet.current },
    { alias: 'previous', version: versionSet.previous },
    { alias: 'next', version: versionSet.releaseCandidate },
  ];

  const apis: ApiType[] = ['storefront', 'customer-account', 'admin'];
  apis.forEach((api) => {
    const exportPrefix =
      api === 'storefront'
        ? 'sfapi'
        : api === 'customer-account'
          ? 'caapi'
          : 'admin';

    aliases.forEach(({ alias, version }) => {
      const key = `./${exportPrefix}/${alias}`;
      const versionKey = `./${exportPrefix}/${version}`;
      const versionExport = exports[versionKey];

      if (versionExport) {
        exports[key] = versionExport;
        exportEntries.push({
          key,
          value: versionExport,
          category: 'version',
        });
      }
    });
  });

  // Build typesVersions for older TypeScript compatibility
  const typesVersions: Record<string, Record<string, string[]>> = {
    '*': {
      sfapi: [createApiIndexPath('.', 'storefront', 'dist')],
      caapi: [createApiIndexPath('.', 'customer-account', 'dist')],
      admin: [createApiIndexPath('.', 'admin', 'dist')],
    },
  };

  versions.forEach((version) => {
    if (typesVersions['*']) {
      const storefrontResult = pathResolver(
        'storefront',
        version,
        'index',
        'dist',
      );
      const customerAccountResult = pathResolver(
        'customer-account',
        version,
        'index',
        'dist',
      );
      const adminResult = pathResolver('admin', version, 'index', 'dist');

      typesVersions['*'][`sfapi/${version}`] = [
        storefrontResult.success
          ? storefrontResult.data.replace(process.cwd(), '.')
          : `./dist/storefront/${version}/index.d.ts`,
      ];
      typesVersions['*'][`caapi/${version}`] = [
        customerAccountResult.success
          ? customerAccountResult.data.replace(process.cwd(), '.')
          : `./dist/customer-account/${version}/index.d.ts`,
      ];
      typesVersions['*'][`admin/${version}`] = [
        adminResult.success
          ? adminResult.data.replace(process.cwd(), '.')
          : `./dist/admin/${version}/index.d.ts`,
      ];
    }
  });

  // Add alias mappings to typesVersions
  const tv = typesVersions['*'];
  if (tv) {
    aliases.forEach(({ alias, version }) => {
      tv[`sfapi/${alias}`] = tv[`sfapi/${version}`] || [
        `./dist/storefront/${version}/index.d.ts`,
      ];
      tv[`caapi/${alias}`] = tv[`caapi/${version}`] || [
        `./dist/customer-account/${version}/index.d.ts`,
      ];
      tv[`admin/${alias}`] = tv[`admin/${version}`] || [
        `./dist/admin/${version}/index.d.ts`,
      ];
    });
  }

  // Analyze export entries using pattern matching
  const exportAnalysis = exportEntries.reduce(
    (acc, entry) => {
      match(entry)
        .with({ category: 'root' }, () => acc.rootExports++)
        .with({ category: 'api-root' }, () => acc.apiRootExports++)
        .with({ category: 'api-version' }, () => acc.versionExports++)
        .with({ category: 'version' }, () => acc.versionExports++) // Handle aliases
        .with({ category: 'schema' }, () => acc.schemaExports++)
        .with({ category: 'comparison' }, () => acc.comparisonExports++)
        .exhaustive();
      return acc;
    },
    {
      rootExports: 0,
      apiRootExports: 0,
      versionExports: 0,
      schemaExports: 0,
      comparisonExports: 0,
    },
  );

  // Update package.json - work with raw object to avoid type issues
  const updatedPackageJson = {
    ...rawPackageJson,
    exports,
    typesVersions,
  };

  // Skip validation for now - PackageJsonSchema needs update to support export conditions
  // TODO: Update PackageJsonSchema to support export condition objects

  await fs.writeFile(
    packagePath,
    JSON.stringify(updatedPackageJson, null, 2) + '\n',
    'utf-8',
  );

  console.log(
    '✓ Updated package.json exports with NodeNext-compatible conditions for versions:',
    versions.join(', '),
  );
  console.log(
    `Generated exports: ${exportAnalysis.rootExports} root, ${exportAnalysis.apiRootExports} API root, ${exportAnalysis.versionExports} version, ${exportAnalysis.schemaExports} schema, ${exportAnalysis.comparisonExports} comparison`,
  );

  // Log export validation
  const validExports = exportEntries.filter((entry) => {
    const value =
      typeof entry.value === 'string' ? entry.value : entry.value.default;
    return match(value)
      .with(P.string.endsWith('.d.ts'), () => true)
      .with(P.string.endsWith('.json'), () => true)
      .otherwise(() => false);
  });

  console.log(
    `Export validation: ${validExports.length}/${exportEntries.length} entries have valid file extensions`,
  );

  console.log(
    '\n✅ NodeNext Support: Export conditions added for better module resolution compatibility',
  );
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePackageExports().catch(console.error);
}

export { generatePackageExports };
