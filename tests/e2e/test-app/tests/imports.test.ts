import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PKG_NAME = '@juanpprieto/shopify-api-types';

// Read the installed package's export map so this suite stays valid
// across quarterly version-set changes.
const pkgJsonPath = path.join(
  process.cwd(),
  'node_modules',
  PKG_NAME,
  'package.json',
);
const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as {
  exports: Record<string, unknown>;
};

const exportKeys = Object.keys(pkg.exports);
const toSpecifier = (key: string): string =>
  key === '.' ? PKG_NAME : PKG_NAME + key.slice(1);

const typeExports = exportKeys.filter(
  (k) => !k.startsWith('./schemas/') && !k.startsWith('./comparisons/'),
);
const schemaExports = exportKeys.filter((k) => k.startsWith('./schemas/'));
const comparisonExports = exportKeys.filter((k) =>
  k.startsWith('./comparisons/'),
);

describe('Shopify API Types Package', () => {
  it('should expose a complete export map', () => {
    // 1 root + 3 API roots + versioned + alias type paths
    expect(typeExports.length).toBeGreaterThanOrEqual(16);
    expect(schemaExports.length).toBeGreaterThanOrEqual(6);
    expect(comparisonExports.length).toBeGreaterThanOrEqual(2);
  });

  it('should expose the semantic aliases for every API', () => {
    for (const api of ['sfapi', 'admin', 'caapi']) {
      for (const alias of ['current', 'previous', 'next', 'unstable']) {
        expect(exportKeys).toContain(`./${api}/${alias}`);
      }
    }
    expect(exportKeys).toContain('./comparisons/current');
    expect(exportKeys).toContain('./comparisons/next');
  });

  it.each(typeExports)('should import type export %s', async (key) => {
    const module = await import(toSpecifier(key));
    expect(module).toBeDefined();
  });

  it.each(schemaExports)('should import schema export %s', async (key) => {
    const module = await import(toSpecifier(key));
    expect(module).toBeDefined();
    expect(module.default).toBeDefined();
  });

  it.each(comparisonExports)(
    'should import comparison export %s',
    async (key) => {
      const module = await import(toSpecifier(key));
      expect(module).toBeDefined();
      expect(module.default).toBeDefined();
    },
  );
});
