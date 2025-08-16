import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { match, P } from 'ts-pattern';
import { z } from 'zod';
import { validateBuild } from '../../scripts/ci/validate-build.js';
import {
  createTempDir,
  cleanupTempDir,
  createMockDirStructure,
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

// Schema for validation result - matches actual script return type
const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
});

// type ValidationResult = z.infer<typeof ValidationResultSchema>;

describe('validate-build', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await createTempDir('validate-build-');
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await cleanupTempDir(tempDir);
    vi.resetAllMocks();
  });

  describe('validateBuild', () => {
    it('should pass validation with complete build output', async () => {
      // Create complete build structure
      const buildFiles: Record<string, string> = {
        'dist/index.d.ts': 'export * from "./admin/index.js";',
        'dist/index.js': '// Main entry point',
        'dist/index.cjs': '// Main entry point CJS',
      };

      // Add all API files
      const apis = ['storefront', 'customer-account', 'admin'];
      const versions = ['2025-07', '2025-04', '2025-01', '2024-10'];

      for (const api of apis) {
        buildFiles[`dist/${api}/index.d.ts`] =
          `export * from "./2025-07/index.js";`;
        buildFiles[`dist/${api}/index.js`] = `// ${api} entry point`;
        buildFiles[`dist/${api}/index.cjs`] = `// ${api} entry point CJS`;

        for (const version of versions) {
          buildFiles[`dist/${api}/${version}/index.d.ts`] =
            `export * from "./types.js";`;
          buildFiles[`dist/${api}/${version}/index.js`] =
            `// ${api} ${version}`;
          buildFiles[`dist/${api}/${version}/index.cjs`] =
            `// ${api} ${version} CJS`;
          buildFiles[`dist/${api}/${version}/types.d.ts`] =
            `export type Test = string;`;
        }
      }

      // Add schema files
      for (const api of apis) {
        for (const version of versions) {
          const apiDir =
            api === 'customer-account'
              ? 'customer-account'
              : api === 'storefront'
                ? 'storefront'
                : 'admin';
          buildFiles[`dist/schemas/${apiDir}/${version}.json`] =
            `{"__schema": {"queryType": {"name": "QueryRoot"}}}`;
        }
      }

      await createMockDirStructure(tempDir, buildFiles);

      const result = await validateBuild();

      // Use Zod to validate the result structure
      const validation = ValidationResultSchema.safeParse(result);
      expect(validation.success).toBe(true);

      if (validation.success) {
        expect(validation.data.valid).toBe(true);
        expect(validation.data.errors).toHaveLength(0);
      }
    });

    it('should detect missing root files', async () => {
      // Create incomplete structure - missing root files
      await createMockDirStructure(tempDir, {
        'dist/admin/index.d.ts': 'export * from "./2025-07/index.js";',
        // Missing: dist/index.d.ts, dist/index.js, dist/index.cjs
      });

      const result = await validateBuild();

      expect(ValidationResultSchema.parse(result).valid).toBe(false);
      expect(result.errors).toContain('Missing root file: index.d.ts');
    });

    it('should detect missing API files using pattern matching', async () => {
      // const apis = ['storefront', 'customer-account', 'admin'];

      // Create structure missing some API files
      const buildFiles: Record<string, string> = {
        'dist/index.d.ts': 'export * from "./admin/index.js";',
        'dist/index.js': '// Main entry point',
        'dist/index.cjs': '// Main entry point CJS',
      };

      // Only create storefront files, missing customer-account and admin
      buildFiles['dist/storefront/index.d.ts'] =
        'export * from "./2025-07/index.js";';
      buildFiles['dist/storefront/index.js'] = '// storefront entry point';
      buildFiles['dist/storefront/index.cjs'] = '// storefront entry point CJS';

      await createMockDirStructure(tempDir, buildFiles);

      const result = await validateBuild();

      // Use pattern matching to categorize errors
      const missingApiErrors = result.errors.filter((error: string) =>
        match(error)
          .with(P.string.includes('customer-account'), () => true)
          .with(P.string.includes('admin'), () => true)
          .otherwise(() => false),
      );

      expect(result.valid).toBe(false);
      expect(missingApiErrors.length).toBeGreaterThan(0);
    });

    it('should detect missing schema files', async () => {
      // Create build structure but missing schema files
      await createMockDirStructure(tempDir, {
        'dist/index.d.ts': 'export * from "./admin/index.js";',
        'dist/index.js': '// Main entry point',
        'dist/index.cjs': '// Main entry point CJS',
        'dist/admin/index.d.ts': 'export * from "./2025-07/index.js";',
        'dist/admin/index.js': '// admin entry point',
        'dist/admin/index.cjs': '// admin entry point CJS',
        'dist/admin/2025-07/index.d.ts': 'export * from "./types.js";',
        'dist/admin/2025-07/index.js': '// admin 2025-07',
        'dist/admin/2025-07/index.cjs': '// admin 2025-07 CJS',
        'dist/admin/2025-07/types.d.ts': 'export type Test = string;',
        // Missing: schema files
      });

      const result = await validateBuild();

      expect(result.valid).toBe(false);

      const schemaErrors = result.errors.filter((error: string) =>
        error.includes('Missing schema:'),
      );
      expect(schemaErrors.length).toBeGreaterThan(0);
    });

    it('should validate import functionality with dynamic imports', async () => {
      // Create complete build structure with JS files
      const buildFiles: Record<string, string> = {
        'dist/index.js': 'export const version = "1.0.0";',
        'dist/storefront/index.js': 'export const api = "storefront";',
        'dist/customer-account/index.js':
          'export const api = "customer-account";',
        'dist/admin/index.js': 'export const api = "admin";',
      };

      // Add minimal required files
      const requiredFiles = [
        'dist/index.d.ts',
        'dist/index.cjs',
        'dist/storefront/index.d.ts',
        'dist/storefront/index.cjs',
        'dist/customer-account/index.d.ts',
        'dist/customer-account/index.cjs',
        'dist/admin/index.d.ts',
        'dist/admin/index.cjs',
      ];

      for (const file of requiredFiles) {
        buildFiles[file] = '// Minimal content';
      }

      // Add version files
      const apis = ['storefront', 'customer-account', 'admin'];
      const versions = ['2025-07', '2025-04', '2025-01', '2024-10'];

      for (const api of apis) {
        for (const version of versions) {
          buildFiles[`dist/${api}/${version}/index.d.ts`] =
            'export * from "./types.js";';
          buildFiles[`dist/${api}/${version}/index.js`] =
            `export const version = "${version}";`;
          buildFiles[`dist/${api}/${version}/index.cjs`] =
            `module.exports = { version: "${version}" };`;
          buildFiles[`dist/${api}/${version}/types.d.ts`] =
            'export type Test = string;';
        }
      }

      // Add schema files
      for (const api of apis) {
        for (const version of versions) {
          const apiDir =
            api === 'customer-account'
              ? 'customer-account'
              : api === 'storefront'
                ? 'storefront'
                : 'admin';
          buildFiles[`dist/schemas/${apiDir}/${version}.json`] =
            `{"__schema": {"queryType": {"name": "QueryRoot"}}}`;
        }
      }

      await createMockDirStructure(tempDir, buildFiles);

      const result = await validateBuild();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle malformed schema files gracefully', async () => {
      await createMockDirStructure(tempDir, {
        'dist/index.d.ts': 'export * from "./admin/index.js";',
        'dist/schemas/admin/2025-07.json': 'invalid json {{{',
        // Add other required files
        'dist/index.js': '// Main entry point',
        'dist/index.cjs': '// Main entry point CJS',
      });

      const result = await validateBuild();

      // Should not crash, but may report as missing or invalid
      expect(ValidationResultSchema.parse(result)).toBeDefined();
    });

    it('should use Zod schemas for validating API types', async () => {
      // Define schemas for expected API structure
      const ApiTypeSchema = z.enum(['storefront', 'customer-account', 'admin']);
      const VersionSchema = z.string().regex(/^\d{4}-(01|04|07|10)$/);

      // Test the validation logic
      expect(ApiTypeSchema.safeParse('storefront').success).toBe(true);
      expect(ApiTypeSchema.safeParse('invalid-api').success).toBe(false);
      expect(VersionSchema.safeParse('2025-07').success).toBe(true);
      expect(VersionSchema.safeParse('2025-13').success).toBe(false);

      // Create structure with valid API types and versions
      const buildFiles: Record<string, string> = {
        'dist/index.d.ts': 'export * from "./admin/index.js";',
        'dist/index.js': '// Main entry point',
        'dist/index.cjs': '// Main entry point CJS',
      };

      const validApis = ['storefront', 'customer-account', 'admin'];
      const validVersions = ['2025-07', '2025-04', '2025-01', '2024-10'];

      for (const api of validApis) {
        buildFiles[`dist/${api}/index.d.ts`] =
          'export * from "./2025-07/index.js";';
        buildFiles[`dist/${api}/index.js`] = '// api entry point';
        buildFiles[`dist/${api}/index.cjs`] = '// api entry point CJS';

        for (const version of validVersions) {
          buildFiles[`dist/${api}/${version}/index.d.ts`] =
            'export * from "./types.js";';
          buildFiles[`dist/${api}/${version}/index.js`] = '// version file';
          buildFiles[`dist/${api}/${version}/index.cjs`] =
            '// version file CJS';
          buildFiles[`dist/${api}/${version}/types.d.ts`] =
            'export type Test = string;';
        }
      }

      // Add schema files
      for (const api of validApis) {
        for (const version of validVersions) {
          const apiDir =
            api === 'customer-account'
              ? 'customer-account'
              : api === 'storefront'
                ? 'storefront'
                : 'admin';
          buildFiles[`dist/schemas/${apiDir}/${version}.json`] =
            `{"__schema": {"queryType": {"name": "QueryRoot"}}}`;
        }
      }

      await createMockDirStructure(tempDir, buildFiles);

      const result = await validateBuild();
      expect(result.valid).toBe(true);
    });

    it('should provide detailed error categorization using ts-pattern', async () => {
      await createMockDirStructure(tempDir, {
        'dist/admin/index.d.ts': 'export * from "./2025-07/index.js";',
        // Missing various types of files
      });

      const result = await validateBuild();

      // Categorize errors using pattern matching
      const errorCategories = {
        missingRootFiles: 0,
        missingApiFiles: 0,
        missingVersionFiles: 0,
        missingSchemas: 0,
        other: 0,
      };

      result.errors.forEach((error: string) => {
        match(error)
          .with(P.string.includes('Missing root file:'), () => {
            errorCategories.missingRootFiles++;
          })
          .with(
            P.string.includes('Missing') && P.string.includes('/index.'),
            () => {
              errorCategories.missingApiFiles++;
            },
          )
          .with(
            (P.string.includes('Missing') && P.string.includes('2024-')) ||
              P.string.includes('2025-'),
            () => {
              errorCategories.missingVersionFiles++;
            },
          )
          .with(P.string.includes('Missing schema:'), () => {
            errorCategories.missingSchemas++;
          })
          .otherwise(() => {
            errorCategories.other++;
          });
      });

      expect(errorCategories.missingRootFiles).toBeGreaterThan(0);
      expect(errorCategories.missingSchemas).toBeGreaterThan(0);
    });

    it('should return validation result with proper types', async () => {
      await createMockDirStructure(tempDir, {
        'dist/index.d.ts': 'export * from "./admin/index.js";',
      });

      const result = await validateBuild();

      // Validate the result matches our Zod schema
      const parsed = ValidationResultSchema.parse(result);

      expect(typeof parsed.valid).toBe('boolean');
      expect(Array.isArray(parsed.errors)).toBe(true);

      parsed.errors.forEach((error) => {
        expect(typeof error).toBe('string');
      });
    });
  });
});
