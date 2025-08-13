import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

const INDEX_TEMPLATE = `// Auto-generated index file
export * from './types.js';

// Re-export schema as both default and named export
import schemaJson from '../../schemas/{API_TYPE}/{VERSION}.json' with { type: 'json' };
export { schemaJson as schema };
export default schemaJson;
`;

const API_INDEX_TEMPLATE = `// Auto-generated API index file
{EXPORTS}
`;

async function generateIndexFiles(): Promise<void> {
  const versions = getLastFourVersions();
  const apis = [
    { dir: 'storefront', schemaDir: 'storefront' },
    { dir: 'customer-account', schemaDir: 'customer-account' },
    { dir: 'admin', schemaDir: 'admin' },
  ];

  for (const api of apis) {
    const apiExports: string[] = [];

    for (const version of versions) {
      const versionDir = path.join('src', api.dir, version);

      // Ensure directory exists
      await fs.mkdir(versionDir, { recursive: true });

      // Generate index.ts for each version
      const indexContent = INDEX_TEMPLATE.replace(
        '{API_TYPE}',
        api.schemaDir,
      ).replace('{VERSION}', version);

      const indexPath = path.join(versionDir, 'index.ts');
      await fs.writeFile(indexPath, indexContent, 'utf-8');

      // eslint-disable-next-line no-console -- CLI output for success feedback
      console.log(`✓ Generated index: ${api.dir}/${version}/index.ts`);

      // Add to API exports
      apiExports.push(
        `export * as v${version.replace('-', '_')} from './${version}/index.js';`,
      );
    }

    // Generate main API index
    const apiIndexPath = path.join('src', api.dir, 'index.ts');
    const apiIndexContent = API_INDEX_TEMPLATE.replace(
      '{EXPORTS}',
      apiExports.join('\n'),
    );
    await fs.writeFile(apiIndexPath, apiIndexContent, 'utf-8');

    // eslint-disable-next-line no-console -- CLI output for success feedback
    console.log(`✓ Generated API index: ${api.dir}/index.ts`);
  }

  // Generate root index
  const rootIndexContent = `// Auto-generated root index
export * as storefront from './storefront/index.js';
export * as customerAccount from './customer-account/index.js';
export * as admin from './admin/index.js';
`;

  await fs.writeFile(path.join('src', 'index.ts'), rootIndexContent, 'utf-8');
  // eslint-disable-next-line no-console -- CLI output for success feedback
  console.log('✓ Generated root index: src/index.ts');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateIndexFiles().catch(console.error);
}
