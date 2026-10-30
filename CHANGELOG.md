# @juanpprieto/shopify-api-types

## 2026.10.0

This release makes `2026-10` the current API version. The package includes these
versions: `2026-10` (current), `2026-07` (previous), `2026-04` and `2026-01`
(older supported), `2027-01` (release candidate), and `unstable`.

### Breaking changes

The lists below show changes from `2026-07` to `2026-10`.

**Storefront API**

- `ShopPayPaymentRequestSession.paymentRequest` - Shopify changes the type from
  `ShopPayPaymentRequest!` to `ShopPayPaymentRequest`. The field may return
  `null`.
- `Mutation.shopPayPaymentRequestSessionCreate` - Shopify removes the argument
  `paymentRequest: ShopPayPaymentRequestInput!`.

Check your code for `null` handling of
`ShopPayPaymentRequestSession.paymentRequest`. Remove the `paymentRequest`
argument from your calls to `Mutation.shopPayPaymentRequestSessionCreate`.

**Admin API**

- `PriceRule` - Shopify removes this type.
- `PriceRuleAllocationMethod` - Shopify removes this type.
- `PriceRuleCustomerSelection` - Shopify removes this type.
- `PriceRuleDiscountCode` - Shopify removes this type.
- `PriceRuleDiscountCodeConnection` - Shopify removes this type.
- `PriceRuleDiscountCodeEdge` - Shopify removes this type.
- `PriceRuleEntitlementToPrerequisiteQuantityRatio` - Shopify removes this type.
- `PriceRuleFeature` - Shopify removes this type.
- `PriceRuleFixedAmountValue` - Shopify removes this type.
- `PriceRuleItemEntitlements` - Shopify removes this type.
- `PriceRuleLineItemPrerequisites` - Shopify removes this type.
- `PriceRuleMoneyRange` - Shopify removes this type.
- `PriceRulePercentValue` - Shopify removes this type.
- `PriceRulePrerequisiteToEntitlementQuantityRatio` - Shopify removes this type.
- `PriceRuleQuantityRange` - Shopify removes this type.
- `PriceRuleShareableUrl` - Shopify removes this type.
- `PriceRuleShareableUrlTargetType` - Shopify removes this type.
- `PriceRuleShippingLineEntitlements` - Shopify removes this type.
- `PriceRuleStatus` - Shopify removes this type.
- `PriceRuleTarget` - Shopify removes this type.
- `PriceRuleTrait` - Shopify removes this type.
- `PriceRuleValidityPeriod` - Shopify removes this type.
- `PriceRuleValue` - Shopify removes this type.
- `InventoryAdjustQuantitiesUserErrorCode.ITEM_NOT_STOCKED_AT_LOCATION` -
  Shopify removes this enum value.
- `InventoryMoveQuantitiesUserErrorCode.ITEM_NOT_STOCKED_AT_LOCATION` - Shopify
  removes this enum value.
- `InventorySetOnHandQuantitiesUserErrorCode.ITEM_NOT_STOCKED_AT_LOCATION` -
  Shopify removes this enum value.
- `InventorySetQuantitiesUserErrorCode.ITEM_NOT_STOCKED_AT_LOCATION` - Shopify
  removes this enum value.

Remove references to these types and to the `ITEM_NOT_STOCKED_AT_LOCATION` enum
value from your code.

Shopify removes the `PriceRule` types together with the
`DraftOrderDiscountNotAppliedWarning.priceRule` field. Use the `discountTitle`
and `discountCode` fields of that warning instead.

**Customer Account API**

- `AppliedGiftCard` - Shopify removes this type.
- `AvailableShippingRates` - Shopify removes this type.
- `Checkout` - Shopify removes this type.
- `CheckoutLineItem` - Shopify removes this type.
- `CheckoutLineItemConnection` - Shopify removes this type.
- `CheckoutLineItemEdge` - Shopify removes this type.
- `CustomerMailingAddress` - Shopify removes this type.
- `ShippingRate` - Shopify removes this type.
- `CustomerAddressInput.territoryCode` - Shopify removes this input field.
- `SubscriptionDeliveryMethodLocalDeliveryInput.address` - Shopify removes this
  input field.
- `Mutation.subscriptionContractFetchDeliveryOptions` - Shopify removes the
  argument `deliveryAddress: CustomerMailingAddressInput`.

Remove references to these types, input fields, and the argument from your code.

The Customer Account API has no replacement for the `Checkout` types. For an
active cart, use the Storefront API `Cart`. For finished purchases, use
`Customer.orders`.

### Additions

The table shows added types per API, from `2026-07` to `2026-10`.

| API                  | Added types | Examples                                                                                                                                      |
| -------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Storefront API       | 1           | `ShopPayPaymentRequestShopUser`                                                                                                               |
| Admin API            | 201         | `AnalyticsAnnotation`, `AnalyticsAnnotationConnection`, `AnalyticsAnnotationCreatePayload`, `AnalyticsTarget`, `AnalyticsTargetCreatePayload` |
| Customer Account API | 33          | `CalculateRequestedOrderEditInput`, `CalculatedRequestedOrderEdit`, `EditableLineItem`, `IneligibleLineItem`, `RequestedOrderEdit`            |

### Release candidate

The comparison between `2026-10` and `2027-01` shows no breaking changes for
Storefront API and Customer Account API. Admin API shows these breaking changes:

- `CollectionSourceInclusionConditionMetafieldInteger`,
  `CollectionSourceInclusionConditionMetafieldIntegerInput`,
  `CollectionSourceInclusionConditionMetafieldIntegerRelation`,
  `CollectionSourceInclusionConditionUpdateMetafieldIntegerInput` - Shopify
  removes these types.
- `DiscountAutomaticConnection`, `DiscountAutomaticEdge` - Shopify removes these
  types.
- `MarketCurrencySettingsUpdatePayload`, `MarketCurrencySettingsUserError`,
  `MarketCurrencySettingsUserErrorCode` - Shopify removes these types.
- `CollectionSourceInclusionConditionInput.metafieldInteger`,
  `CollectionSourceInclusionConditionUpdateInput.metafieldInteger` - Shopify
  removes these input fields.
- `MetaobjectAdminAccess.PRIVATE`, `MetaobjectAdminAccess.PUBLIC_READ` - Shopify
  removes these deprecated enum values.
- `Mutation.marketCurrencySettingsUpdate` - Shopify removes this deprecated
  field.

### Type counts

| API                  | Types in `2026-10` |
| -------------------- | ------------------ |
| Storefront API       | 272                |
| Admin API            | 2123               |
| Customer Account API | 339                |

### Package changes

- The package now needs Node.js 22 or later (`engines`). Node.js 20 reached end
  of life on 2026-04-30.
- The package has no runtime dependencies. Before this release, an install also
  added `@anthropic-ai/sdk`, `graphql`, `ts-pattern`, and `zod`.
- npm shows a provenance statement for this version. The Release workflow
  publishes through npm trusted publishing.

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

- **First Major Release: Complete Shopify API Types with CalVer Versioning**

  This marks the first major release of `@juanpprieto/shopify-api-types`,
  providing comprehensive TypeScript definitions for all Shopify GraphQL APIs
  with proper CalVer versioning aligned with Shopify's quarterly release
  schedule.

  ## What's New

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

  ## **Usage**

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
