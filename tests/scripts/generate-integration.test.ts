import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { generatePackageExports } from '../../scripts/generate-exports.js';
import { generateIndexFiles } from '../../scripts/generate-indexes.js';
import {
  getSupportedVersions,
  getCurrentVersionSet,
} from '../../scripts/version-utils.js';

// These tests run the real generators. They must never write into the
// repository working tree, so each test runs inside a temp directory with
// a pinned RELEASE_DATE for deterministic version sets.
describe('Generation Scripts Integration Tests', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    process.env['RELEASE_DATE'] = '2025-08-13';
    originalCwd = process.cwd();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'shopify-ts-gen-'));

    // Minimal package.json so generatePackageExports can run
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify(
        { name: '@juanpprieto/shopify-api-types', version: '0.0.0-test' },
        null,
        2,
      ),
      'utf-8',
    );

    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
    delete process.env['RELEASE_DATE'];
  });

  describe('Generate Exports', () => {
    it('should generate exports for all supported versions', async () => {
      await generatePackageExports();

      const packageJson = JSON.parse(
        await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'),
      );
      const versions = getSupportedVersions();

      // Check that exports exist for each supported version
      versions.forEach((version) => {
        if (version !== 'unstable') {
          expect(packageJson.exports[`./sfapi/${version}`]).toBeDefined();
          expect(packageJson.exports[`./admin/${version}`]).toBeDefined();
          expect(packageJson.exports[`./caapi/${version}`]).toBeDefined();
        }
      });

      // Check unstable exports
      expect(packageJson.exports['./sfapi/unstable']).toBeDefined();
      expect(packageJson.exports['./admin/unstable']).toBeDefined();
      expect(packageJson.exports['./caapi/unstable']).toBeDefined();
    });

    it('should generate comparison exports for aliases and adjacent pairs', async () => {
      await generatePackageExports();

      const packageJson = JSON.parse(
        await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'),
      );
      const versionSet = getCurrentVersionSet();

      expect(packageJson.exports['./comparisons/current']).toBeDefined();
      expect(packageJson.exports['./comparisons/next']).toBeDefined();

      // Adjacent stable pairs
      const ordered = [
        ...[...versionSet.olderSupported].reverse(),
        versionSet.previous,
        versionSet.current,
        versionSet.releaseCandidate,
      ];
      ordered.slice(0, -1).forEach((from, i) => {
        const to = ordered[i + 1];
        expect(
          packageJson.exports[`./comparisons/${from}-to-${to}`],
        ).toBeDefined();
      });
    });

    it('should not include retired versions in exports', async () => {
      await generatePackageExports();

      const packageJson = JSON.parse(
        await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'),
      );

      // Retired versions (outside the support window) should not exist
      expect(packageJson.exports['./sfapi/2024-07']).toBeUndefined();
      expect(packageJson.exports['./sfapi/2024-04']).toBeUndefined();
    });
  });

  describe('Generate Indexes', () => {
    it('should create index files for all supported versions', async () => {
      await generateIndexFiles();

      const versions = getSupportedVersions();
      const apis = ['storefront', 'customer-account', 'admin'];

      // Check that index files were created
      for (const api of apis) {
        for (const version of versions) {
          const indexPath = path.join(tempDir, 'src', api, version, 'index.ts');

          const exists = await fs
            .access(indexPath)
            .then(() => true)
            .catch(() => false);
          expect(exists).toBe(true);
        }
      }
    });

    it('should create root index files for each API', async () => {
      await generateIndexFiles();

      const apis = ['storefront', 'customer-account', 'admin'];

      for (const api of apis) {
        const indexPath = path.join(tempDir, 'src', api, 'index.ts');
        const exists = await fs
          .access(indexPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      }
    });

    it('should create root index file', async () => {
      await generateIndexFiles();

      const rootIndexPath = path.join(tempDir, 'src', 'index.ts');
      const exists = await fs
        .access(rootIndexPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(rootIndexPath, 'utf-8');
      expect(content).toContain('export * as storefront');
      expect(content).toContain('export * as customerAccount');
      expect(content).toContain('export * as admin');
    });
  });

  describe('Version Consistency', () => {
    it('should use the same 6 versions across all generation scripts', async () => {
      const versions = getSupportedVersions();
      const versionSet = getCurrentVersionSet();

      // Should always be exactly 6 versions
      expect(versions).toHaveLength(6);

      // Should include the full support window from dynamic calculation
      expect(versions).toContain(versionSet.current);
      expect(versions).toContain(versionSet.previous);
      versionSet.olderSupported.forEach((v) => {
        expect(versions).toContain(v);
      });
      expect(versions).toContain(versionSet.releaseCandidate);
      expect(versions).toContain('unstable');
    });
  });
});
