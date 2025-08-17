import fs from 'fs/promises';
import path from 'path';
import { match } from 'ts-pattern';
import { getSupportedVersions } from '../version-utils.js';
import {
  ApiTypeSchema,
  ExtendedApiVersionSchema,
  BuildValidationResultSchema,
  type BuildValidationResult,
  SUPPORTED_APIS,
} from '../../src/lib/zod.js';
import { classifyBuildError } from '../../src/lib/patterns.js';

interface FileCheckResult {
  path: string;
  exists: boolean;
  category: 'root' | 'api' | 'version' | 'schema';
}

async function validateBuild(): Promise<BuildValidationResult> {
  const errors: string[] = [];
  const versions = getSupportedVersions();
  const apis = SUPPORTED_APIS;
  const fileChecks: FileCheckResult[] = [];

  console.log('Validating build output...\n');

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

  // Check root files (types-only build)
  const rootFiles = ['index.d.ts'];
  for (const file of rootFiles) {
    const filePath = path.join('dist', file);
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    fileChecks.push({ path: filePath, exists, category: 'root' });

    if (!exists) {
      errors.push(`Missing root file: ${file}`);
    } else {
      console.log(`✓ Found root file: ${file}`);
    }
  }

  // Check API files
  for (const api of apis) {
    console.log(`\nChecking ${api} API files...`);

    // Check API root files (types-only build)
    const apiRootFiles = ['index.d.ts'];
    for (const file of apiRootFiles) {
      const filePath = path.join('dist', api, file);
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      fileChecks.push({ path: filePath, exists, category: 'api' });

      if (!exists) {
        errors.push(`Missing ${api} root file: ${file}`);
      } else {
        console.log(`  ✓ Found ${api}/${file}`);
      }
    }

    // Check version-specific files (types-only build)
    for (const version of versions) {
      const versionPath = path.join('dist', api, version);
      const requiredFiles = ['index.d.ts', 'types.d.ts'];

      for (const file of requiredFiles) {
        const filePath = path.join(versionPath, file);
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);

        fileChecks.push({ path: filePath, exists, category: 'version' });

        if (!exists) {
          errors.push(`Missing: ${api}/${version}/${file}`);
        } else {
          console.log(`  ✓ Found ${api}/${version}/${file}`);
        }
      }
    }
  }

  // Check schema files
  console.log('\nChecking schema files...');
  for (const api of apis) {
    for (const version of versions) {
      const schemaPath = path.join('dist', 'schemas', api, `${version}.json`);
      const exists = await fs
        .access(schemaPath)
        .then(() => true)
        .catch(() => false);

      fileChecks.push({ path: schemaPath, exists, category: 'schema' });

      if (!exists) {
        errors.push(`Missing schema: ${api}/${version}.json`);
      } else {
        console.log(`  ✓ Found schema: ${api}/${version}.json`);
      }
    }
  }

  // Categorize errors using shared pattern matching
  const errorAnalysis = errors.reduce(
    (acc, error) => {
      const { category } = classifyBuildError(error);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Analyze file check results
  const fileAnalysis = fileChecks.reduce(
    (acc, check) => {
      match(check)
        .with({ exists: true, category: 'root' }, () => acc.rootFiles++)
        .with({ exists: true, category: 'api' }, () => acc.apiFiles++)
        .with({ exists: true, category: 'version' }, () => acc.versionFiles++)
        .with({ exists: true, category: 'schema' }, () => acc.schemaFiles++)
        .with({ exists: false }, () => acc.missingFiles++)
        .exhaustive();
      return acc;
    },
    {
      rootFiles: 0,
      apiFiles: 0,
      versionFiles: 0,
      schemaFiles: 0,
      missingFiles: 0,
    },
  );

  console.log('\n✓ Types-only build validation complete');
  console.log(
    `Files found: ${fileAnalysis.rootFiles} root, ${fileAnalysis.apiFiles} API, ${fileAnalysis.versionFiles} version, ${fileAnalysis.schemaFiles} schema`,
  );

  if (errors.length === 0) {
    console.log('\n✅ Build validation passed!');
  } else {
    console.error('\n❌ Build validation failed:');

    // Group errors by category
    Object.entries(errorAnalysis).forEach(([category, count]) => {
      console.error(`  ${category}: ${count} errors`);
    });

    console.error('\nDetails:');
    errors.forEach((err) => console.error(`  - ${err}`));
  }

  const result: BuildValidationResult = {
    valid: errors.length === 0,
    errors,
  };

  // Validate result before returning
  const resultValidation = BuildValidationResultSchema.safeParse(result);
  if (!resultValidation.success) {
    throw new Error('Invalid validation result format');
  }

  return result;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateBuild().then((result) => {
    process.exit(result.valid ? 0 : 1);
  });
}

export { validateBuild };
