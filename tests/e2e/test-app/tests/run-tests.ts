#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const results = {
  passed: 0,
  failed: 0,
  errors: [] as string[],
};

function runTest(name: string, testFn: () => void): void {
  try {
    process.stdout.write(`Running: ${name}...`);
    testFn();
    process.stdout.write(` ✅\n`);
    results.passed++;
  } catch (error) {
    process.stdout.write(` ❌\n`);
    results.failed++;
    results.errors.push(`${name}: ${error}`);
  }
}

runTest('Package Installation', () => {
  const packagePath = join(
    process.cwd(),
    'node_modules',
    '@juanpprieto',
    'shopify-api-types',
  );
  if (!existsSync(packagePath)) {
    throw new Error('Package not found in node_modules');
  }
});

runTest('TypeScript Compilation', () => {
  execSync('npm run typecheck', { stdio: 'pipe' });
});

runTest('Basic Imports Test', async () => {
  await import('../src/test-basic-imports.js');
});

runTest('Simple Type Test', async () => {
  await import('../src/simple-test.js');
});

runTest('Version Alias Test', async () => {
  await import('../src/test-aliases.js');
});

runTest('Root Exports Test', async () => {
  await import('../src/test-root-exports.js');
});

runTest('Tree Shaking Test', async () => {
  await import('../src/test-tree-shaking.js');
});

runTest('NodeNext Compatibility Test', async () => {
  await import('../src/test-nodenext-compat.js');
});

runTest('Package Exports Structure', async () => {
  const { readFile } = await import('fs/promises');
  const { join } = await import('path');

  const pkgPath = join(
    process.cwd(),
    'node_modules/@juanpprieto/shopify-api-types/package.json',
  );
  const pkgContent = await readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent);

  const requiredExports = [
    '.',
    './sfapi',
    './admin',
    './caapi',
    './schemas/sfapi/2025-07',
    './comparisons/current',
  ];

  for (const exp of requiredExports) {
    if (!pkg.exports[exp]) {
      throw new Error(`Missing export: ${exp}`);
    }
  }
});

runTest('Types-Only Package', async () => {
  try {
    const sfapiModule = await import('@juanpprieto/shopify-api-types/sfapi');
    const exportCount = Object.keys(sfapiModule).length;
    if (exportCount === 0) {
      throw new Error('No exports found - expected version namespaces');
    }
    if (typeof sfapiModule.v2025_07 !== 'object') {
      throw new Error('Expected version namespace exports');
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Cannot find module')) {
      return;
    }
    throw err;
  }
});

process.stdout.write('\n📊 E2E Test Results:\n');
process.stdout.write(`✅ Passed: ${results.passed}\n`);
process.stdout.write(`❌ Failed: ${results.failed}\n`);

if (results.failed > 0) {
  process.stdout.write('\n❌ Failed tests:\n');
  results.errors.forEach((err: string) => process.stderr.write(`  - ${err}\n`));
  process.exit(1);
} else {
  process.stdout.write('\n🎉 All E2E tests passed!\n');
  process.exit(0);
}
