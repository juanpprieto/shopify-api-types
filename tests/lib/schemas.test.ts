import { describe, it, expect } from 'vitest';
import {
  ApiTypeSchema,
  ApiVersionSchema,
  StoreDomainSchema,
  AccessTokenSchema,
  GraphQLSchemaSchema,
  safeParse,
} from '../../src/lib/zod.js';

describe('schemas', () => {
  describe('ApiTypeSchema', () => {
    it('should validate API types', () => {
      expect(ApiTypeSchema.safeParse('storefront').success).toBe(true);
      expect(ApiTypeSchema.safeParse('customer-account').success).toBe(true);
      expect(ApiTypeSchema.safeParse('admin').success).toBe(true);
      expect(ApiTypeSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('ApiVersionSchema', () => {
    it('should validate API versions', () => {
      expect(ApiVersionSchema.safeParse('2025-01').success).toBe(true);
      expect(ApiVersionSchema.safeParse('2025-04').success).toBe(true);
      expect(ApiVersionSchema.safeParse('2025-07').success).toBe(true);
      expect(ApiVersionSchema.safeParse('2025-10').success).toBe(true);

      expect(ApiVersionSchema.safeParse('2025-02').success).toBe(false); // Invalid quarter
      expect(ApiVersionSchema.safeParse('2025-1').success).toBe(false); // Wrong format
    });
  });

  describe('StoreDomainSchema', () => {
    it('should validate store domains', () => {
      expect(StoreDomainSchema.safeParse('mystore').success).toBe(true);
      expect(StoreDomainSchema.safeParse('my-store').success).toBe(true);
      expect(StoreDomainSchema.safeParse('store123').success).toBe(true);

      expect(StoreDomainSchema.safeParse('-mystore').success).toBe(false); // Starts with hyphen
      expect(StoreDomainSchema.safeParse('my--store').success).toBe(false); // Double hyphen
      expect(StoreDomainSchema.safeParse('my store').success).toBe(false); // Space
    });
  });

  describe('AccessTokenSchema', () => {
    it('should validate access tokens', () => {
      expect(
        AccessTokenSchema.safeParse('shpat_1234567890abcdef').success,
      ).toBe(true);
      expect(AccessTokenSchema.safeParse('valid-token-123').success).toBe(true);

      expect(AccessTokenSchema.safeParse('short').success).toBe(false); // Too short
      expect(AccessTokenSchema.safeParse('your_token_here').success).toBe(
        false,
      ); // Placeholder
    });
  });

  describe('GraphQLSchemaSchema', () => {
    it('should validate GraphQL schemas', () => {
      const validSchema = {
        __schema: {
          queryType: { name: 'QueryRoot' },
          mutationType: null,
          subscriptionType: null,
          types: [],
        },
      };

      expect(GraphQLSchemaSchema.safeParse(validSchema).success).toBe(true);
      expect(GraphQLSchemaSchema.safeParse({}).success).toBe(false); // Missing __schema
    });
  });

  describe('safeParse', () => {
    it('should return structured results', () => {
      const successResult = safeParse(ApiTypeSchema, 'storefront');
      expect(successResult.success).toBe(true);
      if (successResult.success) {
        expect(successResult.data).toBe('storefront');
      }

      const errorResult = safeParse(ApiTypeSchema, 'invalid');
      expect(errorResult.success).toBe(false);
      if (!errorResult.success) {
        expect(errorResult.error).toContain('Validation failed');
        expect(errorResult.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
