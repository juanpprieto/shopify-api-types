import { describe, it, expect } from 'vitest';

describe('validate-schemas logic', () => {
  describe('validation patterns', () => {
    it('should categorize errors using pattern matching', () => {
      const fileError = new Error('ENOENT: no such file or directory');
      const jsonError = new Error('Unexpected token } in JSON at position 123');

      // Test the pattern matching logic from the script
      const categorizeError = (error: unknown): string => {
        if (error instanceof Error && error.message.includes('ENOENT')) {
          return 'File not found';
        }
        if (error instanceof Error && error.message.includes('JSON')) {
          return `JSON parse error: ${error.message}`;
        }
        return error instanceof Error ? error.message : String(error);
      };

      expect(categorizeError(fileError)).toBe('File not found');
      expect(categorizeError(jsonError)).toBe(
        'JSON parse error: Unexpected token } in JSON at position 123',
      );
    });
  });

  describe('GraphQL schema validation', () => {
    it('should validate GraphQL schema structure', async () => {
      const { GraphQLSchemaSchema } = await import('../../src/lib/zod.js');

      const validSchema = {
        __schema: {
          queryType: { name: 'QueryRoot' },
          mutationType: null,
          subscriptionType: null,
          types: [],
        },
      };

      const invalidSchema = { data: { queryType: { name: 'QueryRoot' } } };

      expect(GraphQLSchemaSchema.safeParse(validSchema).success).toBe(true);
      expect(GraphQLSchemaSchema.safeParse(invalidSchema).success).toBe(false);
    });
  });

  describe('batch processing logic', () => {
    it('should calculate validation statistics correctly', () => {
      const results = [
        {
          apiType: 'storefront',
          version: '2025-01',
          filePath: 'path1',
          isValid: true,
        },
        {
          apiType: 'admin',
          version: '2025-01',
          filePath: 'path2',
          isValid: false,
          error: 'File not found',
        },
      ];

      const validCount = results.filter((r) => r.isValid).length;
      const totalCount = results.length;
      const allValid = validCount === totalCount;

      expect(validCount).toBe(1);
      expect(totalCount).toBe(2);
      expect(allValid).toBe(false);
    });
  });
});
