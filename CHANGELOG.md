# @juanpprieto/shopify-api-types

## 2026.7.0

### Major Changes (New API Version: 2026-07)

- New current version 2026-07 for the Storefront, Admin, and Customer Account
  APIs. Version set: current=2026-07, previous=2026-04, olderSupported=[2026-01,
  2025-10], next(RC)=2026-10, unstable.
- Breaking changes from 2026-04 to 2026-07 (Admin only, 12 total): the
  InventoryScheduledChange type family was removed, remote payment input fields
  became required, and the deprecated inventorySetScheduledChanges mutation and
  CollectionInput arguments were removed. Full list in the README and in
  `comparisons/current`.
- Release candidate preview (2026-10): Admin removes the PriceRule type family;
  Customer Account removes legacy Checkout types. See `comparisons/next`.
- Type counts: Admin 2,041 / Customer Account 323 / Storefront 271.

This release completes the 2026 catch-up. The package is current with Shopify's
quarterly schedule again.

## 2026.4.0

### Major Changes (New API Version: 2026-04)

- New current version 2026-04 for the Storefront, Admin, and Customer Account
  APIs. Version set: current=2026-04, previous=2026-01, olderSupported=[2025-10,
  2025-07], next(RC)=2026-07, unstable.
- Breaking changes from 2026-01 to 2026-04 (Admin only, 18 total):
  DeliverySetting types removed, fulfillment order userErrors types changed,
  inventory compareQuantity fields removed, ShopPolicy and
  ShopifyPaymentsDispute date fields moved from Date to DateTime. Full list in
  the README and in `comparisons/current`.
- Type counts: Admin 1,928 / Customer Account 320 / Storefront 268.
- README is now generated under a strict style gate (no emojis, no filler,
  verified export paths).

Note: this release was published 2026-09-01 as a catch-up for the 2026-04
quarter. Its RC (2026-07) and unstable schemas are snapshots from the
publication date.

## 2026.1.0

### Major Changes (New API Version: 2026-01)

- **New current version 2026-01** for Storefront, Admin, and Customer Account
  APIs. Version set: current=2026-01, previous=2025-10, olderSupported=[2025-07,
  2025-04], next(RC)=2026-04, unstable.
- **Support-window version model**: each release now ships every API version
  Shopify still supports (4 stable quarters + release candidate + unstable),
  aligned with Shopify's 12-month support policy. See CONTRIBUTING.md "Version
  Support Principle" and decisions/011.
- **Comparisons for every adjacent version pair** (4 pairs), exported as
  `comparisons/<from>-to-<to>` plus the `comparisons/current` and
  `comparisons/next` aliases.
- **`RELEASE_DATE` env override** for back-dated builds, and fall-forward guards
  in the schema fetcher (header check + content-duplicate check) so
  retired-version schemas can never be silently overwritten.
- Type counts: Admin 1,790 / Customer Account 320 / Storefront 268.
- Breaking changes from 2025-10 to 2026-01 are listed in the README and in
  `comparisons/current`.

Note: this release was published 2026-09-01 as a catch-up for the 2026-01
quarter. Its RC (2026-04) and unstable schemas are snapshots from the
publication date.

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
