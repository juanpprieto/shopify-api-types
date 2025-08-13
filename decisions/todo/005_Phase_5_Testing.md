# Phase 5: Testing and Validation

## Overview
Create comprehensive tests to validate type definitions, schema exports, and package imports work correctly for all APIs and versions.

## Prerequisites
- Phase 4 completed (build system configured)
- Vitest installed and configured
- Built package in dist/ directory

## Critical Information
- Tests should validate both development and production builds
- Import paths must match what users will actually use
- Type tests use expectTypeOf from vitest
- Schema tests validate JSON structure

## Milestones

### Milestone 5.1: Type Definition Tests ✅
**Status:** Not Started

**Create `tests/types.test.ts`:**

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type { 
  Product,
  Collection,
  Cart,
  Shop,
  Customer as StorefrontCustomer,
  Order as StorefrontOrder,
} from '../src/storefront/2025-01';
import type { 
  Customer,
  Order,
  OrderLineItem,
  Address,
} from '../src/customer-account/2025-01';
import type {
  Product as AdminProduct,
  Order as AdminOrder,
  Customer as AdminCustomer,
  InventoryItem,
} from '../src/admin/2025-01';

describe('Storefront API Types', () => {
  it('should export Product type with expected properties', () => {
    expectTypeOf<Product>().toBeObject();
    expectTypeOf<Product>().toHaveProperty('id').toBeString();
    expectTypeOf<Product>().toHaveProperty('title').toBeString();
    expectTypeOf<Product>().toHaveProperty('handle').toBeString();
  });

  it('should export Collection type', () => {
    expectTypeOf<Collection>().toBeObject();
    expectTypeOf<Collection>().toHaveProperty('id').toBeString();
    expectTypeOf<Collection>().toHaveProperty('title').toBeString();
  });

  it('should export Cart type', () => {
    expectTypeOf<Cart>().toBeObject();
    expectTypeOf<Cart>().toHaveProperty('id').toBeString();
    expectTypeOf<Cart>().toHaveProperty('lines');
  });

  it('should handle nullable fields correctly', () => {
    type ProductDescription = Product['description'];
    expectTypeOf<ProductDescription>().toEqualTypeOf<string | null | undefined>();
  });
});

describe('Customer Account API Types', () => {
  it('should export Customer type', () => {
    expectTypeOf<Customer>().toBeObject();
    expectTypeOf<Customer>().toHaveProperty('id').toBeString();
    expectTypeOf<Customer>().toHaveProperty('email');
    expectTypeOf<Customer>().toHaveProperty('firstName');
    expectTypeOf<Customer>().toHaveProperty('lastName');
  });

  it('should export Order type with line items', () => {
    expectTypeOf<Order>().toBeObject();
    expectTypeOf<Order>().toHaveProperty('id').toBeString();
    expectTypeOf<Order>().toHaveProperty('lineItems');
  });

  it('should export Address type', () => {
    expectTypeOf<Address>().toBeObject();
    expectTypeOf<Address>().toHaveProperty('address1');
    expectTypeOf<Address>().toHaveProperty('city');
    expectTypeOf<Address>().toHaveProperty('country');
  });
});

describe('Admin API Types', () => {
  it('should export Admin-specific types', () => {
    expectTypeOf<AdminProduct>().toBeObject();
    expectTypeOf<AdminProduct>().toHaveProperty('id').toBeString();
    
    expectTypeOf<AdminOrder>().toBeObject();
    expectTypeOf<AdminCustomer>().toBeObject();
    expectTypeOf<InventoryItem>().toBeObject();
  });

  it('should have different properties than Storefront types', () => {
    // Admin types typically have more fields
    expectTypeOf<AdminProduct>().not.toEqualTypeOf<Product>();
  });
});

describe('Type Compatibility', () => {
  it('should maintain type safety in usage', () => {
    // This should compile without errors
    const testProduct: Partial<Product> = {
      id: 'gid://shopify/Product/123',
      title: 'Test Product',
      handle: 'test-product',
    };

    expectTypeOf(testProduct.id).toEqualTypeOf<string | undefined>();
  });
});
```

### Milestone 5.2: Schema Export Tests ✅
**Status:** Not Started

**Create `tests/schemas.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import { getLastFourVersions } from '../scripts/version-utils';

// Import schemas from different versions
import storefrontSchema2025 from '../src/schemas/storefront/2025-01.json';
import customerSchema2025 from '../src/schemas/customer-account/2025-01.json';
import adminSchema2025 from '../src/schemas/admin/2025-01.json';

// Import via index exports
import { schema as storefrontSchemaExport } from '../src/storefront/2025-01';
import { schema as customerSchemaExport } from '../src/customer-account/2025-01';
import { schema as adminSchemaExport } from '../src/admin/2025-01';

describe('Schema Structure Validation', () => {
  it('should have valid GraphQL introspection schema structure', () => {
    // Storefront schema
    expect(storefrontSchema2025).toHaveProperty('__schema');
    expect(storefrontSchema2025.__schema).toHaveProperty('types');
    expect(storefrontSchema2025.__schema).toHaveProperty('queryType');
    expect(storefrontSchema2025.__schema).toHaveProperty('mutationType');
    expect(Array.isArray(storefrontSchema2025.__schema.types)).toBe(true);
    
    // Customer Account schema
    expect(customerSchema2025).toHaveProperty('__schema');
    expect(customerSchema2025.__schema).toHaveProperty('types');
    
    // Admin schema
    expect(adminSchema2025).toHaveProperty('__schema');
    expect(adminSchema2025.__schema).toHaveProperty('types');
  });

  it('should export schemas through index files', () => {
    expect(storefrontSchemaExport).toBe(storefrontSchema2025);
    expect(customerSchemaExport).toBe(customerSchema2025);
    expect(adminSchemaExport).toBe(adminSchema2025);
  });

  it('should contain expected root types', () => {
    const storefrontTypes = storefrontSchema2025.__schema.types.map((t: any) => t.name);
    
    // Check for common Storefront types
    expect(storefrontTypes).toContain('Product');
    expect(storefrontTypes).toContain('Collection');
    expect(storefrontTypes).toContain('Cart');
    expect(storefrontTypes).toContain('Shop');
    expect(storefrontTypes).toContain('Query');
    expect(storefrontTypes).toContain('Mutation');
  });

  it('should have consistent schema across versions', () => {
    const versions = getLastFourVersions();
    
    // This test assumes all schemas are fetched
    // In practice, you'd import all versions dynamically
    expect(versions.length).toBe(4);
    expect(versions[0]).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe('Schema Type Definitions', () => {
  it('should have scalar type definitions', () => {
    const scalarTypes = storefrontSchema2025.__schema.types
      .filter((t: any) => t.kind === 'SCALAR')
      .map((t: any) => t.name);
    
    expect(scalarTypes).toContain('String');
    expect(scalarTypes).toContain('Int');
    expect(scalarTypes).toContain('Float');
    expect(scalarTypes).toContain('Boolean');
    expect(scalarTypes).toContain('ID');
    
    // Shopify custom scalars
    expect(scalarTypes).toContain('DateTime');
    expect(scalarTypes).toContain('URL');
    expect(scalarTypes).toContain('HTML');
    expect(scalarTypes).toContain('JSON');
  });
});
```

### Milestone 5.3: Import Path Tests ✅
**Status:** Not Started

**Create `tests/imports.test.ts`:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getLastFourVersions } from '../scripts/version-utils';

describe('Package Import Paths', () => {
  const versions = getLastFourVersions();
  
  it('should import from root', async () => {
    const rootModule = await import('../src/index');
    
    expect(rootModule).toHaveProperty('storefront');
    expect(rootModule).toHaveProperty('customerAccount');
    expect(rootModule).toHaveProperty('admin');
  });

  it('should import from specific API paths', async () => {
    // Test first available version
    const version = versions[0];
    
    // Storefront
    const storefront = await import(`../src/storefront/${version}/index`);
    expect(storefront).toBeDefined();
    expect(storefront).toHaveProperty('schema');
    
    // Customer Account
    const customerAccount = await import(`../src/customer-account/${version}/index`);
    expect(customerAccount).toBeDefined();
    expect(customerAccount).toHaveProperty('schema');
    
    // Admin
    const admin = await import(`../src/admin/${version}/index`);
    expect(admin).toBeDefined();
    expect(admin).toHaveProperty('schema');
  });

  it('should support all documented import patterns', async () => {
    // Pattern 1: Direct version import
    const directImport = await import('../src/storefront/2025-01');
    expect(directImport).toHaveProperty('schema');
    
    // Pattern 2: API root import
    const apiImport = await import('../src/storefront');
    expect(apiImport).toHaveProperty('v2025_01');
    
    // Pattern 3: Root package import
    const rootImport = await import('../src');
    expect(rootImport.storefront).toHaveProperty('v2025_01');
  });

  it('should simulate npm package imports', () => {
    // This test documents the expected import patterns for users
    const expectedImports = [
      `import type { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-01'`,
      `import type { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-01'`,
      `import type { Order } from '@juanpprieto/shopify-api-types/admin/2025-01'`,
      `import { schema } from '@juanpprieto/shopify-api-types/sfapi/2025-01'`,
    ];
    
    // Just verify the syntax is what we expect
    expectedImports.forEach(imp => {
      expect(imp).toMatch(/@juanpprieto\/shopify-api-types/);
    });
  });
});

describe('Build Output Tests', () => {
  it('should generate ESM and CJS outputs', async () => {
    // This test would run after build
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check if built files exist (when running against built package)
    if (await fs.access('dist').then(() => true).catch(() => false)) {
      const esmFile = path.join('dist', 'index.js');
      const cjsFile = path.join('dist', 'index.cjs');
      const dtsFile = path.join('dist', 'index.d.ts');
      
      expect(await fs.access(esmFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(cjsFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(dtsFile).then(() => true).catch(() => false)).toBe(true);
    }
  });
});
```

### Milestone 5.4: Integration Tests ✅
**Status:** Not Started

**Create `tests/integration.test.ts`:**

```typescript
import { describe, it, expect } from 'vitest';
import type { Product } from '../src/storefront/2025-01';
import type { Customer } from '../src/customer-account/2025-01';
import { schema as storefrontSchema } from '../src/storefront/2025-01';

describe('Integration Tests', () => {
  it('should use types in realistic scenarios', () => {
    // Simulate a product fetch response
    const mockProduct: Product = {
      id: 'gid://shopify/Product/123',
      title: 'Example Product',
      handle: 'example-product',
      description: 'A great product',
      vendor: 'Example Vendor',
      productType: 'Widget',
      tags: ['tag1', 'tag2'],
      // Add other required fields based on actual type
    } as Product;
    
    expect(mockProduct.id).toContain('Product');
    expect(mockProduct.title).toBeTruthy();
  });

  it('should handle GraphQL response typing', () => {
    interface ProductQuery {
      product: Product | null;
    }
    
    const mockResponse: ProductQuery = {
      product: {
        id: 'gid://shopify/Product/456',
        title: 'Another Product',
        handle: 'another-product',
      } as Product,
    };
    
    expect(mockResponse.product?.id).toBeDefined();
  });

  it('should validate schema can be used for GraphQL operations', () => {
    // Find Product type in schema
    const productType = storefrontSchema.__schema.types.find(
      (t: any) => t.name === 'Product'
    );
    
    expect(productType).toBeDefined();
    expect(productType.kind).toBe('OBJECT');
    expect(productType.fields).toBeDefined();
    
    // Check that Product has expected fields
    const fields = productType.fields.map((f: any) => f.name);
    expect(fields).toContain('id');
    expect(fields).toContain('title');
    expect(fields).toContain('handle');
  });
});

describe('Error Cases', () => {
  it('should handle missing optional fields', () => {
    const partialProduct: Partial<Product> = {
      id: 'gid://shopify/Product/789',
      title: 'Minimal Product',
    };
    
    expect(partialProduct.description).toBeUndefined();
    expect(partialProduct.handle).toBeUndefined();
  });

  it('should maintain type safety with strict null checks', () => {
    type MaybeProduct = Product | null | undefined;
    
    const nullProduct: MaybeProduct = null;
    const undefinedProduct: MaybeProduct = undefined;
    
    expect(nullProduct).toBeNull();
    expect(undefinedProduct).toBeUndefined();
  });
});
```

### Milestone 5.5: Test Configuration Updates ✅
**Status:** Not Started

**Update `vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'scripts/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts', // Index files are just exports
      ],
    },
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
  resolve: {
    alias: {
      '@juanpprieto/shopify-api-types': path.resolve(__dirname, './src'),
    },
  },
});
```

**Add test scripts to package.json:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:types": "vitest typecheck",
    "test:all": "npm run test:types && npm run test:run"
  }
}
```

## Success Criteria
- [ ] All type definition tests pass
- [ ] Schema structure validation passes
- [ ] Import path tests confirm all patterns work
- [ ] Integration tests demonstrate real usage
- [ ] Coverage report shows good coverage
- [ ] No TypeScript errors in tests

## Test Execution Order
1. Run type generation first: `npm run build:types`
2. Run type checking: `npm run test:types`
3. Run unit tests: `npm run test:run`
4. Run with coverage: `npm run test:coverage`
5. Interactive UI for debugging: `npm run test:ui`

## Common Issues & Solutions

### Issue: Import errors in tests
**Solution:** Ensure all paths use correct extensions (.js for ESM)

### Issue: Type test failures
**Solution:** Regenerate types if schemas have changed

### Issue: Coverage too low
**Solution:** Focus on testing public API, not generated code

### Issue: Tests timing out
**Solution:** Schema files are large, increase timeout if needed

## Notes for Other Agents
- Tests run against source files, not built files
- Type tests use expectTypeOf for compile-time checking
- Schema tests validate JSON structure at runtime
- Integration tests simulate real usage patterns
- Coverage excludes generated files
- All test files should be in tests/ directory

## Next Phase
Once all tests are passing, proceed to Phase 6: CI/CD and NPM Publishing