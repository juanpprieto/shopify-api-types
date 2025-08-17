import { describe, it, expect } from 'vitest';

describe('Shopify API Types Package', () => {
  it('should import storefront types', async () => {
    const module = await import('@juanpprieto/shopify-api-types/sfapi/2025-07');
    expect(module).toBeDefined();
  });

  it('should import admin types', async () => {
    const module = await import('@juanpprieto/shopify-api-types/admin/2025-07');
    expect(module).toBeDefined();
  });

  it('should import customer account types', async () => {
    const module = await import('@juanpprieto/shopify-api-types/caapi/2025-07');
    expect(module).toBeDefined();
  });

  it('should import current version aliases', async () => {
    const sfCurrent = await import(
      '@juanpprieto/shopify-api-types/sfapi/current'
    );
    const adminCurrent = await import(
      '@juanpprieto/shopify-api-types/admin/current'
    );
    const caApiCurrent = await import(
      '@juanpprieto/shopify-api-types/caapi/current'
    );

    expect(sfCurrent).toBeDefined();
    expect(adminCurrent).toBeDefined();
    expect(caApiCurrent).toBeDefined();
  });

  it('should import unstable versions', async () => {
    const sfUnstable = await import(
      '@juanpprieto/shopify-api-types/sfapi/unstable'
    );
    expect(sfUnstable).toBeDefined();
  });

  it('should import schema files', async () => {
    const sfSchema = await import(
      '@juanpprieto/shopify-api-types/schemas/sfapi/2025-07'
    );
    const adminSchema = await import(
      '@juanpprieto/shopify-api-types/schemas/admin/2025-07'
    );

    expect(sfSchema).toBeDefined();
    expect(adminSchema).toBeDefined();
    expect(sfSchema.default).toBeDefined();
    expect(adminSchema.default).toBeDefined();
  });

  it('should export version comparison data', async () => {
    const currentComparison = await import(
      '@juanpprieto/shopify-api-types/comparisons/current'
    );
    const nextComparison = await import(
      '@juanpprieto/shopify-api-types/comparisons/next'
    );

    expect(currentComparison).toBeDefined();
    expect(nextComparison).toBeDefined();
  });
});
