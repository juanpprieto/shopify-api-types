import fs from 'fs/promises';
import path from 'path';
import { match, P } from 'ts-pattern';
import { getLastFourVersions } from './version-utils.js';
import {
  ApiTypeSchema,
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
  value: string;
  category: 'root' | 'api-root' | 'api-version' | 'schema';
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
  const packageJson = packageJsonValidation.data;

  const versions = getLastFourVersions();
  const exportEntries: ExportEntry[] = [];

  // Validate input data
  for (const version of versions) {
    const versionValidation = ApiVersionSchema.safeParse(version);
    if (!versionValidation.success) {
      throw new Error(`Invalid version: ${version}`);
    }
  }

  // Build exports object - Types only for a TypeScript library
  const exports: Record<string, string> = {};

  // Add root export
  const rootExportPath = './dist/index.d.ts';
  const rootPathValidation = DistPathSchema.safeParse(rootExportPath);
  if (!rootPathValidation.success) {
    throw new Error('Invalid root export path');
  }
  exports['.'] = rootExportPath;
  exportEntries.push({ key: '.', value: rootExportPath, category: 'root' });

  // Add specific version exports
  versions.forEach((version) => {
    const apiMappings: Array<[string, string]> = [
      ['sfapi', 'storefront'],
      ['caapi', 'customer-account'],
      ['admin', 'admin'],
    ];

    apiMappings.forEach(([exportKey, api]) => {
      // Validate API
      const apiValidation = ApiTypeSchema.safeParse(api);
      if (!apiValidation.success) {
        throw new Error(`Invalid API: ${api}`);
      }

      // Use path resolver for consistent path generation
      const pathResult = pathResolver(api as ApiType, version, 'index', 'dist');
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
      exports[fullKey] = exportPath;
      exportEntries.push({
        key: fullKey,
        value: exportPath,
        category: 'api-version',
      });
    });
  });

  // Add API root exports
  const apiRootMappings: Array<[string, string]> = [
    ['sfapi', 'storefront'],
    ['caapi', 'customer-account'],
    ['admin', 'admin'],
  ];

  apiRootMappings.forEach(([exportKey, api]) => {
    const apiValidation = ApiTypeSchema.safeParse(api);
    if (!apiValidation.success) {
      throw new Error(`Invalid API: ${api}`);
    }

    const exportPath = createApiIndexPath('.', api as ApiType, 'dist');
    const pathValidation = DistPathSchema.safeParse(exportPath);
    if (!pathValidation.success) {
      throw new Error(`Invalid API root export path: ${exportPath}`);
    }

    const fullKey = `./${exportKey}`;
    exports[fullKey] = exportPath;
    exportEntries.push({
      key: fullKey,
      value: exportPath,
      category: 'api-root',
    });
  });

  // Add schema exports for runtime access
  versions.forEach((version) => {
    const schemaMappings: Array<[string, string]> = [
      ['sfapi', 'storefront'],
      ['caapi', 'customer-account'],
      ['admin', 'admin'],
    ];

    schemaMappings.forEach(([exportKey, api]) => {
      const apiValidation = ApiTypeSchema.safeParse(api);
      if (!apiValidation.success) {
        throw new Error(`Invalid schema API: ${api}`);
      }

      // Schema paths go to dist/schemas (copied by copy-schemas script)
      const schemaPath = `./dist/schemas/${api}/${version}.json`;
      const fullKey = `./schemas/${exportKey}/${version}`;
      exports[fullKey] = schemaPath;
      exportEntries.push({
        key: fullKey,
        value: schemaPath,
        category: 'schema',
      });
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

  // Analyze export entries using pattern matching
  const exportAnalysis = exportEntries.reduce(
    (acc, entry) => {
      match(entry)
        .with({ category: 'root' }, () => acc.rootExports++)
        .with({ category: 'api-root' }, () => acc.apiRootExports++)
        .with({ category: 'api-version' }, () => acc.versionExports++)
        .with({ category: 'schema' }, () => acc.schemaExports++)
        .exhaustive();
      return acc;
    },
    { rootExports: 0, apiRootExports: 0, versionExports: 0, schemaExports: 0 },
  );

  // Update package.json
  packageJson.exports = exports;
  packageJson.typesVersions = typesVersions;

  // Validate final package.json before writing
  const finalValidation = PackageJsonSchema.safeParse(packageJson);
  if (!finalValidation.success) {
    throw new Error('Generated package.json is invalid');
  }

  await fs.writeFile(
    packagePath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf-8',
  );

  console.log(
    '✓ Updated package.json exports for versions:',
    versions.join(', '),
  );
  console.log(
    `Generated exports: ${exportAnalysis.rootExports} root, ${exportAnalysis.apiRootExports} API root, ${exportAnalysis.versionExports} version, ${exportAnalysis.schemaExports} schema`,
  );

  // Log export validation
  const validExports = exportEntries.filter((entry) =>
    match(entry.value)
      .with(P.string.endsWith('.d.ts'), () => true)
      .with(P.string.endsWith('.json'), () => true)
      .otherwise(() => false),
  );

  console.log(
    `Export validation: ${validExports.length}/${exportEntries.length} entries have valid file extensions`,
  );
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePackageExports().catch(console.error);
}

export { generatePackageExports };
