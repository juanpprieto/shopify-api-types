import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { generatePackageExports } from '../../scripts/generate-exports.js';
import { generateIndexFiles } from '../../scripts/generate-indexes.js';
import { getSupportedVersions } from '../../scripts/version-utils.js';

describe('Generation Scripts Integration Tests', () => {
  describe('Generate Exports', () => {
    let originalPackageJson: string;
    const packagePath = path.join(process.cwd(), 'package.json');

    beforeEach(async () => {
      // Backup original package.json
      originalPackageJson = await fs.readFile(packagePath, 'utf-8');
    });

    afterEach(async () => {
      // Restore original package.json
      await fs.writeFile(packagePath, originalPackageJson, 'utf-8');
    });

    it('should generate exports for all 4 supported versions', async () => {
      await generatePackageExports();

      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
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

    it('should generate comparison exports', async () => {
      await generatePackageExports();

      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));

      expect(packageJson.exports['./comparisons/current']).toBeDefined();
      expect(packageJson.exports['./comparisons/next']).toBeDefined();
    });

    it('should not include old versions in exports', async () => {
      await generatePackageExports();

      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));

      // These old versions should not exist
      expect(packageJson.exports['./sfapi/2024-10']).toBeUndefined();
      expect(packageJson.exports['./sfapi/2025-01']).toBeUndefined();
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
          const indexPath = path.join(
            process.cwd(),
            'src',
            api,
            version,
            'index.ts',
          );

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
        const indexPath = path.join(process.cwd(), 'src', api, 'index.ts');
        const exists = await fs
          .access(indexPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      }
    });

    it('should create root index file', async () => {
      await generateIndexFiles();

      const rootIndexPath = path.join(process.cwd(), 'src', 'index.ts');
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
    it('should use the same 4 versions across all generation scripts', async () => {
      const versions = getSupportedVersions();

      // Should always be exactly 4 versions
      expect(versions).toHaveLength(4);

      // Should include current, previous, RC, and unstable
      expect(versions).toContain('2025-07'); // current
      expect(versions).toContain('2025-04'); // previous
      expect(versions).toContain('2025-10'); // RC
      expect(versions).toContain('unstable');
    });
  });
});
