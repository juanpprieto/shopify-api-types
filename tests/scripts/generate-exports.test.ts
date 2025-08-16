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
  getSupportedVersions: vi.fn(() => [
    '2025-07',
    '2025-04',
    '2025-10',
    'unstable',
  ]),
  getCurrentVersionSet: vi.fn(() => ({
    current: '2025-07',
    previous: '2025-04',
    releaseCandidate: '2025-10',
    unstable: 'unstable',
  })),
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
        exports: Record<string, string | Record<string, string>>;
        typesVersions: Record<string, Record<string, string[]>>;
        [key: string]: unknown;
      };

      // Check main export
      expect(packageJson['exports']['.']).toMatchObject({
        types: './dist/index.d.ts',
        import: './dist/index.d.ts',
        default: './dist/index.d.ts',
      });

      // Check API version exports
      expect(packageJson['exports']['./sfapi/2025-07']).toMatchObject({
        types: './dist/storefront/2025-07/index.d.ts',
        import: './dist/storefront/2025-07/index.d.ts',
        default: './dist/storefront/2025-07/index.d.ts',
      });
      expect(packageJson['exports']['./caapi/2025-07']).toMatchObject({
        types: './dist/customer-account/2025-07/index.d.ts',
        import: './dist/customer-account/2025-07/index.d.ts',
        default: './dist/customer-account/2025-07/index.d.ts',
      });
      expect(packageJson['exports']['./admin/2025-07']).toMatchObject({
        types: './dist/admin/2025-07/index.d.ts',
        import: './dist/admin/2025-07/index.d.ts',
        default: './dist/admin/2025-07/index.d.ts',
      });

      // Check API root exports
      expect(packageJson['exports']['./sfapi']).toMatchObject({
        types: './dist/storefront/index.d.ts',
        import: './dist/storefront/index.d.ts',
        default: './dist/storefront/index.d.ts',
      });
      expect(packageJson['exports']['./caapi']).toMatchObject({
        types: './dist/customer-account/index.d.ts',
        import: './dist/customer-account/index.d.ts',
        default: './dist/customer-account/index.d.ts',
      });
      expect(packageJson['exports']['./admin']).toMatchObject({
        types: './dist/admin/index.d.ts',
        import: './dist/admin/index.d.ts',
        default: './dist/admin/index.d.ts',
      });

      // Check schema exports
      expect(packageJson['exports']['./schemas/sfapi/2025-07']).toMatchObject({
        types: './dist/schemas/storefront/2025-07.json',
        import: './dist/schemas/storefront/2025-07.json',
        require: './dist/schemas/storefront/2025-07.json',
        default: './dist/schemas/storefront/2025-07.json',
      });
      expect(packageJson['exports']['./schemas/caapi/2025-07']).toMatchObject({
        types: './dist/schemas/customer-account/2025-07.json',
        import: './dist/schemas/customer-account/2025-07.json',
        require: './dist/schemas/customer-account/2025-07.json',
        default: './dist/schemas/customer-account/2025-07.json',
      });
      expect(packageJson['exports']['./schemas/admin/2025-07']).toMatchObject({
        types: './dist/schemas/admin/2025-07.json',
        import: './dist/schemas/admin/2025-07.json',
        require: './dist/schemas/admin/2025-07.json',
        default: './dist/schemas/admin/2025-07.json',
      });
    });

    it('should generate typesVersions for backward compatibility', async () => {
      await createMockPackageJson(tempDir);
      await generatePackageExports();

      const packageJson = (await readJsonFile(
        path.join(tempDir, 'package.json'),
      )) as {
        exports: Record<string, string | Record<string, string>>;
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
          'sfapi/2025-10': ['./dist/storefront/2025-10/index.d.ts'],
          'caapi/2025-10': ['./dist/customer-account/2025-10/index.d.ts'],
          'admin/2025-10': ['./dist/admin/2025-10/index.d.ts'],
          'sfapi/unstable': ['./dist/storefront/unstable/index.d.ts'],
          'caapi/unstable': ['./dist/customer-account/unstable/index.d.ts'],
          'admin/unstable': ['./dist/admin/unstable/index.d.ts'],
          'sfapi/current': ['./dist/storefront/2025-07/index.d.ts'],
          'caapi/current': ['./dist/customer-account/2025-07/index.d.ts'],
          'admin/current': ['./dist/admin/2025-07/index.d.ts'],
          'sfapi/previous': ['./dist/storefront/2025-04/index.d.ts'],
          'caapi/previous': ['./dist/customer-account/2025-04/index.d.ts'],
          'admin/previous': ['./dist/admin/2025-04/index.d.ts'],
          'sfapi/next': ['./dist/storefront/2025-10/index.d.ts'],
          'caapi/next': ['./dist/customer-account/2025-10/index.d.ts'],
          'admin/next': ['./dist/admin/2025-10/index.d.ts'],
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
        exports: Record<string, string | Record<string, string>>;
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

    it('should handle all four versions from getSupportedVersions', async () => {
      await createMockPackageJson(tempDir);
      await generatePackageExports();

      const packageJson = (await readJsonFile(
        path.join(tempDir, 'package.json'),
      )) as {
        exports: Record<string, string | Record<string, string>>;
        typesVersions: Record<string, Record<string, string[]>>;
        [key: string]: unknown;
      };

      // Check that all four versions are included
      const expectedVersions = ['2025-07', '2025-04', '2025-10', 'unstable'];

      for (const version of expectedVersions) {
        // Check exports - now they are export condition objects
        const sfapiExport = packageJson['exports'][`./sfapi/${version}`];
        expect(sfapiExport).toMatchObject({
          types: `./dist/storefront/${version}/index.d.ts`,
          import: `./dist/storefront/${version}/index.d.ts`,
          default: `./dist/storefront/${version}/index.d.ts`,
        });

        const caapiExport = packageJson['exports'][`./caapi/${version}`];
        expect(caapiExport).toMatchObject({
          types: `./dist/customer-account/${version}/index.d.ts`,
          import: `./dist/customer-account/${version}/index.d.ts`,
          default: `./dist/customer-account/${version}/index.d.ts`,
        });

        const adminExport = packageJson['exports'][`./admin/${version}`];
        expect(adminExport).toMatchObject({
          types: `./dist/admin/${version}/index.d.ts`,
          import: `./dist/admin/${version}/index.d.ts`,
          default: `./dist/admin/${version}/index.d.ts`,
        });

        // Check schema exports - they have additional conditions
        const sfapiSchema =
          packageJson['exports'][`./schemas/sfapi/${version}`];
        expect(sfapiSchema).toMatchObject({
          types: `./dist/schemas/storefront/${version}.json`,
          import: `./dist/schemas/storefront/${version}.json`,
          require: `./dist/schemas/storefront/${version}.json`,
          default: `./dist/schemas/storefront/${version}.json`,
        });

        const caapiSchema =
          packageJson['exports'][`./schemas/caapi/${version}`];
        expect(caapiSchema).toMatchObject({
          types: `./dist/schemas/customer-account/${version}.json`,
          import: `./dist/schemas/customer-account/${version}.json`,
          require: `./dist/schemas/customer-account/${version}.json`,
          default: `./dist/schemas/customer-account/${version}.json`,
        });

        const adminSchema =
          packageJson['exports'][`./schemas/admin/${version}`];
        expect(adminSchema).toMatchObject({
          types: `./dist/schemas/admin/${version}.json`,
          import: `./dist/schemas/admin/${version}.json`,
          require: `./dist/schemas/admin/${version}.json`,
          default: `./dist/schemas/admin/${version}.json`,
        });

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
