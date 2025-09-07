# @juanpprieto/shopify-api-types

## 2025.7.0

### Major Changes

- 🚀 **First Major Release: Complete Shopify API Types with CalVer Versioning**

  This marks the first major release of `@juanpprieto/shopify-api-types`,
  providing comprehensive TypeScript definitions for all Shopify GraphQL APIs
  with proper CalVer versioning aligned with Shopify's quarterly release
  schedule.

  ## ✨ What's New

  ### **Complete API Coverage**
  - **Admin API**: 1,758+ types for store management, webhooks, analytics
  - **Storefront API**: 261+ types for product catalog, cart, checkout
  - **Customer Account API**: 296+ types for customer profiles, orders
  - **All API Versions**: 2025-04, 2025-07, 2025-10, and unstable

  ### **CalVer Versioning System**
  - **Shopify-Aligned**: Follows `YYYY.[1|4|7|10].PATCH` pattern for quarterly
    releases
  - **Automated**: Custom Changesets integration ensures proper CalVer
    formatting
  - **Tested**: Major releases correctly produce `2025.7.0` instead of
    `2026.0.0`

  ### **Developer Experience**
  - **Modern Export Conditions**: Full ESM/CommonJS compatibility
  - **Interactive Demo**: React/Vite examples for all API types
  - **Comprehensive Docs**: 636-line CONTRIBUTING.md with workflow guides
  - **Type Safety**: Complete GraphQL schema validation and comparison tools

  ### **Production Ready**
  - **Security**: CodeQL analysis, dependency scanning, vulnerability checks
  - **Quality**: 88 test cases across all build scripts and utilities
  - **CI/CD**: Automated releases with GitHub Actions
  - **Performance**: Optimized build process with 35% script reduction

  ## 📦 **Usage**

  ```bash
  npm install @juanpprieto/shopify-api-types
  ```

  ```typescript
  // Use current stable API version
  import type {
    Product,
    Shop,
  } from '@juanpprieto/shopify-api-types/admin/current';
  import type { Cart } from '@juanpprieto/shopify-api-types/sfapi/current';

  // Or specify version explicitly
  import type { Product } from '@juanpprieto/shopify-api-types/admin/2025-07';
  ```

  This release establishes the foundation for systematic CalVer releases aligned
  with Shopify's API development cycle. (New API Version)
