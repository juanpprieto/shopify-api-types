import { execSync } from 'child_process';
import fs from 'fs/promises';
import { match } from 'ts-pattern';
import { TypeValidationResultSchema } from '../src/lib/zod.js';
import {
  classifyTypeScriptError,
  classifyFileSystemError,
} from '../src/lib/patterns.js';

interface TypecheckResult {
  success: boolean;
  output: string;
  errorType: 'compilation' | 'import' | 'runtime' | 'unknown';
}

async function validateTypes(): Promise<boolean> {
  console.log('Validating generated types...\n');

  try {
    // Create a temporary test file that imports all types
    const testContent = `
// Type validation test
import * as Storefront from '../src/storefront/index.js';
import * as CustomerAccount from '../src/customer-account/index.js';
import * as Admin from '../src/admin/index.js';

// Test specific type imports from latest version
import { getLatestVersion } from '../scripts/version-utils.js';

const latestVersion = getLatestVersion();
const versionPath = latestVersion.replace('-', '_');

// Dynamic imports for latest version types
// Note: These imports are examples and may not work until schemas are fetched
// import type { Product } from '../src/storefront/' + latestVersion + '/index.js';
// import type { Customer } from '../src/customer-account/' + latestVersion + '/index.js';

// Basic structural checks
if (typeof Storefront !== 'object') {
  throw new Error('Storefront API not properly exported');
}

if (typeof CustomerAccount !== 'object') {
  throw new Error('Customer Account API not properly exported');
}

if (typeof Admin !== 'object') {
  throw new Error('Admin API not properly exported');
}

// eslint-disable-next-line no-console -- CLI output for success feedback
console.log('✓ All type imports working correctly');
`;

    // Write test file
    await fs.mkdir('temp', { recursive: true });
    await fs.writeFile('temp/type-test.ts', testContent, 'utf-8');

    // Type check with pattern matching for error analysis
    let typecheckResult: TypecheckResult;
    try {
      const output = execSync(
        'npx tsc --noEmit temp/type-test.ts --module esnext --moduleResolution bundler --resolveJsonModule --esModuleInterop --allowImportingTsExtensions',
        { encoding: 'utf-8' },
      );

      typecheckResult = { success: true, output, errorType: 'unknown' };
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);

      // Use shared error categorization
      const { category } = classifyTypeScriptError(output);
      const errorType = category === 'unknown' ? 'unknown' : category;

      typecheckResult = { success: false, output, errorType };
    }

    // Clean up
    await fs.rm('temp', { recursive: true, force: true });

    // Process results based on success/failure
    const result = match(typecheckResult)
      .with({ success: true }, () => {
        console.log('\n✅ Type validation passed!');
        return { valid: true, errors: [] };
      })
      .with({ success: false, errorType: 'import' }, (r) => {
        console.error('\n❌ Import errors detected:');
        console.error(r.output);
        return { valid: false, errors: ['Import resolution failed'] };
      })
      .with({ success: false, errorType: 'compilation' }, (r) => {
        console.error('\n❌ Type compilation errors:');
        console.error(r.output);
        return { valid: false, errors: ['Type compilation failed'] };
      })
      .with({ success: false }, (r) => {
        console.error('\n❌ Type validation failed:', r.output);
        return { valid: false, errors: ['Unknown validation error'] };
      })
      .exhaustive();

    // Validate result structure
    const validationResult = TypeValidationResultSchema.safeParse(result);
    if (!validationResult.success) {
      throw new Error('Invalid validation result format');
    }

    return validationResult.data.valid;
  } catch (error) {
    // Use shared file system error categorization
    if (error instanceof Error) {
      const { category } = classifyFileSystemError(error);
      console.error(`\n❌ Type validation setup failed (${category}):`, error);
    } else {
      console.error(
        '\n❌ Type validation setup failed (unknown error):',
        error,
      );
    }

    // Clean up on error
    try {
      await fs.rm('temp', { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateTypes().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
