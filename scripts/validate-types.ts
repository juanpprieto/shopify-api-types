import { execSync } from 'child_process';
import fs from 'fs/promises';

async function validateTypes(): Promise<boolean> {
  // eslint-disable-next-line no-console -- CLI output for operation start
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

    // Type check
    execSync(
      'npx tsc --noEmit temp/type-test.ts --module esnext --moduleResolution bundler --resolveJsonModule --esModuleInterop --allowImportingTsExtensions',
      {
        stdio: 'inherit',
      },
    );

    // Clean up
    await fs.rm('temp', { recursive: true, force: true });

    // eslint-disable-next-line no-console -- CLI output for success feedback
    console.log('\n✅ Type validation passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Type validation failed:', error);

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
