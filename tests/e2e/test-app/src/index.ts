// Test imports from the shopify-api-types package
// These imports validate that TypeScript can resolve all export paths
import type {} from '@juanpprieto/shopify-api-types/sfapi/2025-07';
import type {} from '@juanpprieto/shopify-api-types/admin/2025-07';
import type {} from '@juanpprieto/shopify-api-types/caapi/2025-07';

// Test that we can access the current version exports
import type {} from '@juanpprieto/shopify-api-types/sfapi/current';
import type {} from '@juanpprieto/shopify-api-types/admin/current';
import type {} from '@juanpprieto/shopify-api-types/caapi/current';

// Test unstable version imports
import type {} from '@juanpprieto/shopify-api-types/sfapi/unstable';

// Test schema imports
import storefrontSchema from '@juanpprieto/shopify-api-types/schemas/sfapi/2025-07';
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2025-07';

export function testTypeImports(): boolean {
  // This function exists to ensure TypeScript can resolve all the imports
  // Returns true if schemas are importable
  return !!(storefrontSchema && adminSchema);
}
