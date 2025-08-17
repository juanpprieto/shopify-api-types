import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { copySchemas } from '../../scripts/copy-schemas.js';
import {
  createTempDir,
  cleanupTempDir,
  createMockDirStructure,
  fileExists,
} from '../test-utils.js';

// Mock the version-utils module
vi.mock('../../scripts/version-utils.js', () => ({
  getSupportedVersions: vi.fn(() => [
    '2025-07',
    '2025-04',
    '2025-10',
    'unstable',
  ]),
}));

describe('copy-schemas', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await createTempDir('copy-schemas-');
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await cleanupTempDir(tempDir);
    vi.resetAllMocks();
  });

  describe('copySchemas', () => {
    it('should copy all schema files to dist directory', async () => {
      // Create source schema files
      await createMockDirStructure(tempDir, {
        'src/graphql-schemas/storefront/2025-07.json':
          '{"storefront": "2025-07"}',
        'src/graphql-schemas/storefront/2025-04.json':
          '{"storefront": "2025-04"}',
        'src/graphql-schemas/storefront/2025-10.json':
          '{"storefront": "2025-10"}',
        'src/graphql-schemas/storefront/unstable.json':
          '{"storefront": "unstable"}',
        'src/graphql-schemas/customer-account/2025-07.json':
          '{"customer-account": "2025-07"}',
        'src/graphql-schemas/customer-account/2025-04.json':
          '{"customer-account": "2025-04"}',
        'src/graphql-schemas/customer-account/2025-10.json':
          '{"customer-account": "2025-10"}',
        'src/graphql-schemas/customer-account/unstable.json':
          '{"customer-account": "unstable"}',
        'src/graphql-schemas/admin/2025-07.json': '{"admin": "2025-07"}',
        'src/graphql-schemas/admin/2025-04.json': '{"admin": "2025-04"}',
        'src/graphql-schemas/admin/2025-10.json': '{"admin": "2025-10"}',
        'src/graphql-schemas/admin/unstable.json': '{"admin": "unstable"}',
      });

      await copySchemas();

      // Verify all files were copied
      const expectedFiles = [
        'dist/schemas/storefront/2025-07.json',
        'dist/schemas/storefront/2025-04.json',
        'dist/schemas/storefront/2025-10.json',
        'dist/schemas/storefront/unstable.json',
        'dist/schemas/customer-account/2025-07.json',
        'dist/schemas/customer-account/2025-04.json',
        'dist/schemas/customer-account/2025-10.json',
        'dist/schemas/customer-account/unstable.json',
        'dist/schemas/admin/2025-07.json',
        'dist/schemas/admin/2025-04.json',
        'dist/schemas/admin/2025-10.json',
        'dist/schemas/admin/unstable.json',
      ];

      for (const filePath of expectedFiles) {
        expect(await fileExists(path.join(tempDir, filePath))).toBe(true);
      }
    });

    it('should preserve file contents when copying', async () => {
      const testContent = {
        __schema: {
          queryType: { name: 'QueryRoot' },
          mutationType: { name: 'Mutation' },
          types: [{ name: 'String', kind: 'SCALAR' }],
        },
      };

      await createMockDirStructure(tempDir, {
        'src/graphql-schemas/admin/2025-07.json': JSON.stringify(
          testContent,
          null,
          2,
        ),
      });

      await copySchemas();

      const copiedContent = JSON.parse(
        await fs.readFile(
          path.join(tempDir, 'dist/schemas/admin/2025-07.json'),
          'utf-8',
        ),
      );

      expect(copiedContent).toEqual(testContent);
    });

    it('should create target directories if they do not exist', async () => {
      await createMockDirStructure(tempDir, {
        'src/graphql-schemas/storefront/2025-07.json': '{"test": "content"}',
      });

      // Ensure dist directory doesn't exist initially
      expect(await fileExists(path.join(tempDir, 'dist'))).toBe(false);

      await copySchemas();

      // Should create nested directories
      expect(
        await fileExists(path.join(tempDir, 'dist/schemas/storefront')),
      ).toBe(true);
      expect(
        await fileExists(
          path.join(tempDir, 'dist/schemas/storefront/2025-07.json'),
        ),
      ).toBe(true);
    });

    it('should handle missing source files gracefully', async () => {
      // Create only some schema files, not all
      await createMockDirStructure(tempDir, {
        'src/graphql-schemas/storefront/2025-07.json':
          '{"storefront": "2025-07"}',
        'src/graphql-schemas/admin/2025-04.json': '{"admin": "2025-04"}',
        // Missing: customer-account files and some versions
      });

      // Should not throw, but might log errors
      await expect(copySchemas()).resolves.not.toThrow();

      // Should copy the files that exist
      expect(
        await fileExists(
          path.join(tempDir, 'dist/schemas/storefront/2025-07.json'),
        ),
      ).toBe(true);
      expect(
        await fileExists(path.join(tempDir, 'dist/schemas/admin/2025-04.json')),
      ).toBe(true);

      // Missing files should not exist in dist
      expect(
        await fileExists(
          path.join(tempDir, 'dist/schemas/customer-account/2025-07.json'),
        ),
      ).toBe(false);
    });

    it('should overwrite existing files in dist', async () => {
      // Create initial schema file
      await createMockDirStructure(tempDir, {
        'src/graphql-schemas/storefront/2025-07.json':
          '{"original": "content"}',
        'dist/schemas/storefront/2025-07.json': '{"old": "content"}',
      });

      await copySchemas();

      const content = JSON.parse(
        await fs.readFile(
          path.join(tempDir, 'dist/schemas/storefront/2025-07.json'),
          'utf-8',
        ),
      );

      expect(content).toEqual({ original: 'content' });
    });

    it('should copy all APIs and all versions from getSupportedVersions', async () => {
      const apis = ['storefront', 'customer-account', 'admin'];
      const versions = ['2025-07', '2025-04', '2025-10', 'unstable'];

      // Create all schema files
      const mockFiles: Record<string, string> = {};
      for (const api of apis) {
        for (const version of versions) {
          mockFiles[`src/graphql-schemas/${api}/${version}.json`] =
            `{"api": "${api}", "version": "${version}"}`;
        }
      }

      await createMockDirStructure(tempDir, mockFiles);
      await copySchemas();

      // Verify all combinations were copied
      for (const api of apis) {
        for (const version of versions) {
          const filePath = path.join(
            tempDir,
            `dist/schemas/${api}/${version}.json`,
          );
          expect(await fileExists(filePath)).toBe(true);

          const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          expect(content).toEqual({ api, version });
        }
      }
    });

    it('should not copy non-schema files', async () => {
      await createMockDirStructure(tempDir, {
        'src/graphql-schemas/storefront/2025-07.json': '{"valid": "schema"}',
        'src/graphql-schemas/storefront/readme.txt':
          'This should not be copied',
        'src/graphql-schemas/storefront/config.yaml':
          'also: should not be copied',
        'src/graphql-schemas/admin/2025-04.json': '{"another": "valid schema"}',
      });

      await copySchemas();

      // Should copy JSON files
      expect(
        await fileExists(
          path.join(tempDir, 'dist/schemas/storefront/2025-07.json'),
        ),
      ).toBe(true);
      expect(
        await fileExists(path.join(tempDir, 'dist/schemas/admin/2025-04.json')),
      ).toBe(true);

      // Should not copy non-JSON files
      expect(
        await fileExists(
          path.join(tempDir, 'dist/schemas/storefront/readme.txt'),
        ),
      ).toBe(false);
      expect(
        await fileExists(
          path.join(tempDir, 'dist/schemas/storefront/config.yaml'),
        ),
      ).toBe(false);
    });

    it('should handle concurrent execution safely', async () => {
      await createMockDirStructure(tempDir, {
        'src/graphql-schemas/storefront/2025-07.json': '{"test": "content"}',
        'src/graphql-schemas/admin/2025-04.json': '{"test": "content"}',
      });

      // Run multiple copies concurrently
      const promises = Array.from({ length: 3 }, () => copySchemas());

      await expect(Promise.all(promises)).resolves.not.toThrow();

      // Files should still exist and be valid
      expect(
        await fileExists(
          path.join(tempDir, 'dist/schemas/storefront/2025-07.json'),
        ),
      ).toBe(true);
      expect(
        await fileExists(path.join(tempDir, 'dist/schemas/admin/2025-04.json')),
      ).toBe(true);
    });
  });
});
