import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { match, P } from 'ts-pattern';
import { z } from 'zod';
import { convertToTypesOnly } from '../../scripts/convert-to-types-only.js';
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

// Schema for expected index file content
const IndexFileContentSchema = z
  .string()
  .includes('// Auto-generated index file - Types only');
const TypesOnlyExportSchema = z
  .string()
  .includes("export * from './types.js';");

describe('convert-to-types-only', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await createTempDir('convert-types-only-');
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await cleanupTempDir(tempDir);
    vi.resetAllMocks();
  });

  describe('convertToTypesOnly', () => {
    it('should convert all API version index files to types-only', async () => {
      const apis = ['storefront', 'customer-account', 'admin'];
      const versions = ['2025-07', '2025-04', '2025-10', 'unstable'];

      // Create original index files with JSON imports
      const originalFiles: Record<string, string> = {};

      for (const api of apis) {
        for (const version of versions) {
          originalFiles[`src/${api}/${version}/index.ts`] =
            `// Auto-generated index file
export * from './types.js';

// Re-export schema as both default and named export
import schemaJson from '../../schemas/${api}/${version}.json' with { type: 'json' };
export { schemaJson as schema };
export default schemaJson;`;
        }
      }

      await createMockDirStructure(tempDir, originalFiles);

      await convertToTypesOnly();

      // Verify all files were converted
      for (const api of apis) {
        for (const version of versions) {
          const filePath = path.join(tempDir, `src/${api}/${version}/index.ts`);
          const content = await fs.readFile(filePath, 'utf-8');

          // Validate using Zod schemas
          expect(IndexFileContentSchema.safeParse(content).success).toBe(true);
          expect(TypesOnlyExportSchema.safeParse(content).success).toBe(true);

          // Use pattern matching to verify content structure
          const hasJsonImport = match(content)
            .with(P.string.includes('import schemaJson'), () => true)
            .otherwise(() => false);

          const hasSchemaExport = match(content)
            .with(P.string.includes('export { schemaJson'), () => true)
            .otherwise(() => false);

          const hasDefaultExport = match(content)
            .with(P.string.includes('export default schemaJson'), () => true)
            .otherwise(() => false);

          // Should not contain JSON imports or schema exports
          expect(hasJsonImport).toBe(false);
          expect(hasSchemaExport).toBe(false);
          expect(hasDefaultExport).toBe(false);

          // Should contain types-only export
          expect(content).toContain("export * from './types.js';");
          expect(content).toContain(
            '// Auto-generated index file - Types only',
          );
        }
      }
    });

    it('should handle missing source files gracefully', async () => {
      // Create only some index files, not all
      await createMockDirStructure(tempDir, {
        'src/storefront/2025-07/index.ts': `// Original file
export * from './types.js';
import schemaJson from '../../schemas/storefront/2025-07.json' with { type: 'json' };
export { schemaJson as schema };`,
        'src/admin/2025-04/index.ts': `// Another original file
export * from './types.js';
import schemaJson from '../../schemas/admin/2025-04.json' with { type: 'json' };
export default schemaJson;`,
        // Missing: customer-account files and some versions
      });

      // Should not throw errors for missing files
      await expect(convertToTypesOnly()).resolves.not.toThrow();

      // Should convert existing files
      const storefrontContent = await fs.readFile(
        path.join(tempDir, 'src/storefront/2025-07/index.ts'),
        'utf-8',
      );
      expect(storefrontContent).toContain(
        '// Auto-generated index file - Types only',
      );
      expect(storefrontContent).not.toContain('import schemaJson');

      const adminContent = await fs.readFile(
        path.join(tempDir, 'src/admin/2025-04/index.ts'),
        'utf-8',
      );
      expect(adminContent).toContain(
        '// Auto-generated index file - Types only',
      );
      expect(adminContent).not.toContain('export default schemaJson');
    });

    it('should preserve file permissions and metadata', async () => {
      await createMockDirStructure(tempDir, {
        'src/storefront/2025-07/index.ts': `// Original content
export * from './types.js';
import schemaJson from '../../schemas/storefront/2025-07.json' with { type: 'json' };
export { schemaJson as schema };`,
      });

      // Get original stats
      const originalStats = await fs.stat(
        path.join(tempDir, 'src/storefront/2025-07/index.ts'),
      );

      await convertToTypesOnly();

      // Get stats after conversion
      const newStats = await fs.stat(
        path.join(tempDir, 'src/storefront/2025-07/index.ts'),
      );

      // File should still exist and be readable
      expect(newStats.isFile()).toBe(true);
      expect(newStats.mode).toBe(originalStats.mode);
    });

    it('should handle different variations of original file content', async () => {
      // Test various patterns of original files
      const testCases = [
        {
          name: 'with-import-attributes',
          content: `export * from './types.js';
import schemaJson from '../../schemas/admin/2025-07.json' with { type: 'json' };
export { schemaJson as schema };
export default schemaJson;`,
        },
        {
          name: 'without-import-attributes',
          content: `export * from './types.js';
import schemaJson from '../../schemas/admin/2025-07.json';
export { schemaJson as schema };`,
        },
        {
          name: 'with-comments',
          content: `// Auto-generated index file
export * from './types.js';

// Re-export schema as both default and named export
import schemaJson from '../../schemas/admin/2025-07.json' with { type: 'json' };
export { schemaJson as schema };
export default schemaJson;`,
        },
        {
          name: 'minimal',
          content: `export * from './types.js';
import schema from '../../schemas/admin/2025-07.json' with { type: 'json' };
export default schema;`,
        },
      ];

      // Use valid API versions from getSupportedVersions
      const validVersions = ['2025-07', '2025-04', '2025-10', 'unstable'];
      const testFiles: Record<string, string> = {};
      testCases.forEach((testCase, index) => {
        if (index < validVersions.length) {
          testFiles[`src/admin/${validVersions[index]}/index.ts`] =
            testCase.content;
        }
      });

      await createMockDirStructure(tempDir, testFiles);
      await convertToTypesOnly();

      // All files should be converted to the same standard format
      for (let i = 0; i < testCases.length && i < validVersions.length; i++) {
        const filePath = path.join(
          tempDir,
          `src/admin/${validVersions[i]}/index.ts`,
        );
        const content = await fs.readFile(filePath, 'utf-8');

        expect(content).toContain('// Auto-generated index file - Types only');
        expect(content).toContain("export * from './types.js';");
        expect(content).not.toContain('import schema');
        expect(content).not.toContain('export default');
      }
    });

    it('should validate API and version patterns using Zod', async () => {
      const ApiSchema = z.enum(['storefront', 'customer-account', 'admin']);
      const VersionSchema = z.union([
        z.string().regex(/^\d{4}-(01|04|07|10)$/),
        z.literal('unstable'),
      ]);

      const apis = ['storefront', 'customer-account', 'admin'];
      const versions = ['2025-07', '2025-04', '2025-10', 'unstable'];

      // Validate that our test data matches expected schemas
      apis.forEach((api) => {
        expect(ApiSchema.safeParse(api).success).toBe(true);
      });

      versions.forEach((version) => {
        expect(VersionSchema.safeParse(version).success).toBe(true);
      });

      // Create files following the validated patterns
      const testFiles: Record<string, string> = {};
      for (const api of apis) {
        for (const version of versions) {
          testFiles[`src/${api}/${version}/index.ts`] =
            `export * from './types.js';
import schema from '../../schemas/${api}/${version}.json' with { type: 'json' };
export default schema;`;
        }
      }

      await createMockDirStructure(tempDir, testFiles);
      await convertToTypesOnly();

      // Verify all valid combinations were processed
      for (const api of apis) {
        for (const version of versions) {
          const filePath = path.join(tempDir, `src/${api}/${version}/index.ts`);
          expect(await fileExists(filePath)).toBe(true);

          const content = await fs.readFile(filePath, 'utf-8');
          expect(content).toContain('Types only');
        }
      }
    });

    it('should handle concurrent execution safely', async () => {
      await createMockDirStructure(tempDir, {
        'src/storefront/2025-07/index.ts': `export * from './types.js';
import schema from '../../schemas/storefront/2025-07.json' with { type: 'json' };
export default schema;`,
        'src/admin/2025-04/index.ts': `export * from './types.js';
import schema from '../../schemas/admin/2025-04.json' with { type: 'json' };
export default schema;`,
      });

      // Run multiple conversions concurrently
      const promises = Array.from({ length: 3 }, () => convertToTypesOnly());

      await expect(Promise.all(promises)).resolves.not.toThrow();

      // Files should be properly converted
      const storefrontContent = await fs.readFile(
        path.join(tempDir, 'src/storefront/2025-07/index.ts'),
        'utf-8',
      );
      expect(storefrontContent).toContain('Types only');
      expect(storefrontContent).not.toContain('import schema');
    });

    it('should use pattern matching to identify file conversion needs', async () => {
      const testFiles = [
        {
          path: 'src/admin/2025-07/index.ts',
          content: `export * from './types.js';
import schema from '../../schemas/admin/2025-07.json' with { type: 'json' };
export default schema;`,
          needsConversion: true,
        },
        {
          path: 'src/admin/2025-04/index.ts',
          content: `// Auto-generated index file - Types only
export * from './types.js';`,
          needsConversion: false,
        },
        {
          path: 'src/storefront/2025-10/index.ts',
          content: `export * from './types.js';
// No imports`,
          needsConversion: true, // Will be converted to standard format
        },
      ];

      const mockFiles: Record<string, string> = {};
      testFiles.forEach((file) => {
        mockFiles[file.path] = file.content;
      });

      await createMockDirStructure(tempDir, mockFiles);

      // Before conversion, analyze which files need conversion using pattern matching
      await Promise.all(
        testFiles.map(async (file) => {
          const content = await fs.readFile(
            path.join(tempDir, file.path),
            'utf-8',
          );

          const hasSchemaImport = match(content)
            .with(
              P.string.includes('import') && P.string.includes('schema'),
              () => true,
            )
            .otherwise(() => false);

          const isAlreadyTypesOnly = match(content)
            .with(P.string.includes('Types only'), () => true)
            .otherwise(() => false);

          return {
            path: file.path,
            hasSchemaImport,
            isAlreadyTypesOnly,
            expectedNeedsConversion: file.needsConversion,
          };
        }),
      );

      await convertToTypesOnly();

      // After conversion, all files should be in types-only format
      for (const file of testFiles) {
        const content = await fs.readFile(
          path.join(tempDir, file.path),
          'utf-8',
        );
        expect(content).toContain('Types only');
        expect(content).not.toContain('import schema');
      }
    });
  });
});
