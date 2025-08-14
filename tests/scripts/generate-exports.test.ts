import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { generatePackageExports } from '../../scripts/generate-exports.js';
import {
  createTempDir,
  cleanupTempDir,
  createMockPackageJson,
  readJsonFile,
} from '../test-utils.js';

// Mock the version-utils module
vi.mock('../../scripts/version-utils.js', () => ({
  getLastFourVersions: vi.fn(() => [
    '2025-07',
    '2025-04',
    '2025-01',
    '2024-10',
  ]),
}));

describe('generate-exports', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await createTempDir('generate-exports-');
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await cleanupTempDir(tempDir);
    vi.resetAllMocks();
  });

  describe('generatePackageExports', () => {
    it('should update package.json with correct exports structure', async () => {
      // Create initial package.json
      await createMockPackageJson(tempDir, {
        name: 'test-package',
        version: '1.0.0',
        exports: { old: 'value' },
        typesVersions: { old: { oldKey: ['old/path'] } },
      });

      await generatePackageExports();

      const packageJson = (await readJsonFile(
        path.join(tempDir, 'package.json'),
      )) as {
        exports: Record<string, string>;
        typesVersions: Record<string, Record<string, string[]>>;
        [key: string]: unknown;
      };

      // Check main export
      expect(packageJson['exports']['.']).toBe('./dist/index.d.ts');

      // Check API version exports
      expect(packageJson['exports']['./sfapi/2025-07']).toBe(
        './dist/storefront/2025-07/index.d.ts',
      );
      expect(packageJson['exports']['./caapi/2025-07']).toBe(
        './dist/customer-account/2025-07/index.d.ts',
      );
      expect(packageJson['exports']['./admin/2025-07']).toBe(
        './dist/admin/2025-07/index.d.ts',
      );

      // Check API root exports
      expect(packageJson['exports']['./sfapi']).toBe(
        './dist/storefront/index.d.ts',
      );
      expect(packageJson['exports']['./caapi']).toBe(
        './dist/customer-account/index.d.ts',
      );
      expect(packageJson['exports']['./admin']).toBe('./dist/admin/index.d.ts');

      // Check schema exports
      expect(packageJson['exports']['./schemas/sfapi/2025-07']).toBe(
        './dist/schemas/storefront/2025-07.json',
      );
      expect(packageJson['exports']['./schemas/caapi/2025-07']).toBe(
        './dist/schemas/customer-account/2025-07.json',
      );
      expect(packageJson['exports']['./schemas/admin/2025-07']).toBe(
        './dist/schemas/admin/2025-07.json',
      );
    });

    it('should generate typesVersions for backward compatibility', async () => {
      await createMockPackageJson(tempDir);
      await generatePackageExports();

      const packageJson = (await readJsonFile(
        path.join(tempDir, 'package.json'),
      )) as {
        exports: Record<string, string>;
        typesVersions: Record<string, Record<string, string[]>>;
        [key: string]: unknown;
      };

      expect(packageJson['typesVersions']).toEqual({
        '*': {
          'sfapi': ['./dist/storefront/index.d.ts'],
          'caapi': ['./dist/customer-account/index.d.ts'],
          'admin': ['./dist/admin/index.d.ts'],
          'sfapi/2025-07': ['./dist/storefront/2025-07/index.d.ts'],
          'caapi/2025-07': ['./dist/customer-account/2025-07/index.d.ts'],
          'admin/2025-07': ['./dist/admin/2025-07/index.d.ts'],
          'sfapi/2025-04': ['./dist/storefront/2025-04/index.d.ts'],
          'caapi/2025-04': ['./dist/customer-account/2025-04/index.d.ts'],
          'admin/2025-04': ['./dist/admin/2025-04/index.d.ts'],
          'sfapi/2025-01': ['./dist/storefront/2025-01/index.d.ts'],
          'caapi/2025-01': ['./dist/customer-account/2025-01/index.d.ts'],
          'admin/2025-01': ['./dist/admin/2025-01/index.d.ts'],
          'sfapi/2024-10': ['./dist/storefront/2024-10/index.d.ts'],
          'caapi/2024-10': ['./dist/customer-account/2024-10/index.d.ts'],
          'admin/2024-10': ['./dist/admin/2024-10/index.d.ts'],
        },
      });
    });

    it('should preserve other package.json fields', async () => {
      const originalContent = {
        name: 'test-package',
        version: '2.0.0',
        description: 'Test package description',
        author: 'Test Author',
        license: 'MIT',
        dependencies: { 'some-dep': '^1.0.0' },
        exports: { old: 'value' },
        typesVersions: { old: { oldKey: ['old/path'] } },
      };

      await createMockPackageJson(tempDir, originalContent);
      await generatePackageExports();

      const packageJson = (await readJsonFile(
        path.join(tempDir, 'package.json'),
      )) as {
        exports: Record<string, string>;
        typesVersions: Record<string, Record<string, string[]>>;
        [key: string]: unknown;
      };

      // Should preserve non-exports fields
      expect(packageJson['name']).toBe('test-package');
      expect(packageJson['version']).toBe('2.0.0');
      expect(packageJson['description']).toBe('Test package description');
      expect(packageJson['author']).toBe('Test Author');
      expect(packageJson['license']).toBe('MIT');
      expect(packageJson['dependencies']).toEqual({ 'some-dep': '^1.0.0' });

      // Should replace exports and typesVersions
      expect(packageJson['exports']).not.toHaveProperty('old');
      expect(packageJson['typesVersions']).not.toHaveProperty('old');
    });

    it('should handle all four versions from getLastFourVersions', async () => {
      await createMockPackageJson(tempDir);
      await generatePackageExports();

      const packageJson = (await readJsonFile(
        path.join(tempDir, 'package.json'),
      )) as {
        exports: Record<string, string>;
        typesVersions: Record<string, Record<string, string[]>>;
        [key: string]: unknown;
      };

      // Check that all four versions are included
      const expectedVersions = ['2025-07', '2025-04', '2025-01', '2024-10'];

      for (const version of expectedVersions) {
        // Check exports
        expect(packageJson['exports'][`./sfapi/${version}`]).toBe(
          `./dist/storefront/${version}/index.d.ts`,
        );
        expect(packageJson['exports'][`./caapi/${version}`]).toBe(
          `./dist/customer-account/${version}/index.d.ts`,
        );
        expect(packageJson['exports'][`./admin/${version}`]).toBe(
          `./dist/admin/${version}/index.d.ts`,
        );

        // Check schema exports
        expect(packageJson['exports'][`./schemas/sfapi/${version}`]).toBe(
          `./dist/schemas/storefront/${version}.json`,
        );
        expect(packageJson['exports'][`./schemas/caapi/${version}`]).toBe(
          `./dist/schemas/customer-account/${version}.json`,
        );
        expect(packageJson['exports'][`./schemas/admin/${version}`]).toBe(
          `./dist/schemas/admin/${version}.json`,
        );

        // Check typesVersions
        expect(packageJson['typesVersions']['*']?.[`sfapi/${version}`]).toEqual(
          [`./dist/storefront/${version}/index.d.ts`],
        );
        expect(packageJson['typesVersions']['*']?.[`caapi/${version}`]).toEqual(
          [`./dist/customer-account/${version}/index.d.ts`],
        );
        expect(packageJson['typesVersions']['*']?.[`admin/${version}`]).toEqual(
          [`./dist/admin/${version}/index.d.ts`],
        );
      }
    });

    it('should write valid JSON with proper formatting', async () => {
      await createMockPackageJson(tempDir);
      await generatePackageExports();

      const rawContent = await fs.readFile(
        path.join(tempDir, 'package.json'),
        'utf-8',
      );

      // Should be properly formatted JSON with newline at end
      expect(rawContent.endsWith('\n')).toBe(true);
      expect(() => JSON.parse(rawContent)).not.toThrow();

      // Should be indented (not minified)
      expect(rawContent.includes('  ')).toBe(true);
    });

    it('should throw if package.json does not exist', async () => {
      // Don't create a package.json file
      await expect(generatePackageExports()).rejects.toThrow();
    });

    it('should throw if package.json is invalid JSON', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        'invalid json {',
        'utf-8',
      );
      await expect(generatePackageExports()).rejects.toThrow();
    });
  });
});
