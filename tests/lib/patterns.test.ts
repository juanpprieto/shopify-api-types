import { describe, it, expect } from 'vitest';
import {
  matchApiEndpoint,
  matchAuthHeaders,
  validateEnvironment,
} from '../../src/lib/patterns.js';

describe('patterns', () => {
  describe('matchApiEndpoint', () => {
    it('should generate correct endpoints for each API', () => {
      expect(matchApiEndpoint('storefront', '2025-01', 'mystore')).toBe(
        'https://mystore.myshopify.com/api/2025-01/graphql.json',
      );

      expect(matchApiEndpoint('customer-account', '2025-01')).toBe(
        'https://app.myshopify.com/services/graphql/introspection/customer',
      );

      expect(matchApiEndpoint('admin', '2025-01', 'mystore')).toBe(
        'https://mystore.myshopify.com/admin/api/2025-01/graphql.json',
      );
    });

    it('should require store domain for admin API', () => {
      expect(() => matchApiEndpoint('admin', '2025-01')).toThrow(
        'Store domain required',
      );
    });
  });

  describe('matchAuthHeaders', () => {
    it('should generate correct headers for each API', () => {
      expect(matchAuthHeaders('storefront', 'token123')).toEqual({
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': 'token123',
      });

      expect(matchAuthHeaders('customer-account', 'token456')).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'token456',
        'User-Agent': '@juanpprieto/shopify-api-types',
      });

      expect(matchAuthHeaders('admin', 'token789')).toEqual({
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': 'token789',
      });
    });
  });

  describe('validateEnvironment', () => {
    it('should validate required token is present', () => {
      const validEnv = {
        SHOPIFY_STOREFRONT_TOKEN: 'valid-storefront-token-123',
      };

      const result = validateEnvironment(validEnv);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail when required token is missing', () => {
      const invalidEnv = {};

      const result = validateEnvironment(invalidEnv);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required environment variables');
      expect(result.error).toContain('SHOPIFY_STOREFRONT_TOKEN');
    });
  });
});
