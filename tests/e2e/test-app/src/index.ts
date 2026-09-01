// Test imports from the shopify-api-types package.
// These imports validate that TypeScript can resolve the semantic alias
// export paths. Versioned paths change every quarter, so the test suite
// enumerates them dynamically from the installed package.json instead
// (see tests/imports.test.ts).
import type {} from '@juanpprieto/shopify-api-types/sfapi/current';
import type {} from '@juanpprieto/shopify-api-types/admin/current';
import type {} from '@juanpprieto/shopify-api-types/caapi/current';

import type {} from '@juanpprieto/shopify-api-types/sfapi/previous';
import type {} from '@juanpprieto/shopify-api-types/admin/previous';
import type {} from '@juanpprieto/shopify-api-types/caapi/previous';

import type {} from '@juanpprieto/shopify-api-types/sfapi/next';
import type {} from '@juanpprieto/shopify-api-types/admin/next';
import type {} from '@juanpprieto/shopify-api-types/caapi/next';

import type {} from '@juanpprieto/shopify-api-types/sfapi/unstable';
import type {} from '@juanpprieto/shopify-api-types/admin/unstable';
import type {} from '@juanpprieto/shopify-api-types/caapi/unstable';

export function testTypeImports(): boolean {
  // This function exists to ensure TypeScript can resolve the imports above
  return true;
}
