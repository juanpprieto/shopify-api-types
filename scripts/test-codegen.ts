import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

async function testCodegen(): Promise<boolean> {
  // eslint-disable-next-line no-console -- CLI output for operation start
  console.log('Testing code generation...\n');

  try {
    // Run codegen
    execSync('npm run generate-types', { stdio: 'inherit' });

    // Verify files were created
    const versions = getLastFourVersions();
    const apis = ['storefront', 'customer-account', 'admin'];
    let allGenerated = true;

    for (const api of apis) {
      for (const version of versions) {
        const typePath = path.join('src', api, version, 'types.ts');
        const exists = await fs
          .access(typePath)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          // eslint-disable-next-line no-console -- CLI output for success feedback
          console.log(`✓ Generated: ${api}/${version}/types.ts`);
        } else {
          console.error(`✗ Missing: ${api}/${version}/types.ts`);
          allGenerated = false;
        }
      }
    }

    return allGenerated;
  } catch (error) {
    console.error('Code generation failed:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCodegen().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
