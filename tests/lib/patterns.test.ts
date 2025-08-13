import { describe, it, expect } from 'vitest';
import {
  matchApiEndpoint,
  matchAuthHeaders,
  validateEnvironment,
} from '../../src/lib/patterns.js';

describe('patterns', () => {
  describe('matchApiEndpoint', () => {
    it('should generate correct endpoints for each API', () => {
      expect(matchApiEndpoint('storefront', '2025-01')).toBe(
        'https://hydrogen-preview.myshopify.com/api/2025-01/graphql.json',
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
    it('should detect available APIs', () => {
      const validEnv = {
        SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'valid-storefront-token-123',
        SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN: 'valid-customer-token-456',
        SHOPIFY_ADMIN_ACCESS_TOKEN: 'valid-admin-token-789',
        SHOPIFY_STORE_DOMAIN: 'mystore',
      };

      const result = validateEnvironment(validEnv);

      expect(result.hasValidTokens).toBe(true);
      expect(result.availableApis).toEqual([
        'storefront',
        'customer-account',
        'admin',
      ]);
      expect(result.warnings).toEqual([]);
    });

    it('should reject invalid tokens', () => {
      const invalidEnv = {
        SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'your_token_here',
        SHOPIFY_ADMIN_ACCESS_TOKEN: 'short',
      };

      const result = validateEnvironment(invalidEnv);

      expect(result.hasValidTokens).toBe(false);
      expect(result.availableApis).toEqual([]);
      expect(result.warnings).toHaveLength(3);
    });
  });
});
