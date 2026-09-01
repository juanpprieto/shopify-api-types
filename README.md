# @juanpprieto/shopify-api-types

[![CI](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml)
[![Release](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml)

![npm version](https://img.shields.io/npm/v/@juanpprieto/shopify-api-types)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

TypeScript type definitions and GraphQL schemas for the Shopify Storefront API,
Admin API, and Customer Account API, published per API version with aliases for
current, previous, next, and unstable releases, plus JSON comparison files
describing changes between versions.

## Supported versions

| Version  | Alias    | Status       | Description                                        |
| -------- | -------- | ------------ | -------------------------------------------------- |
| 2026-04  | current  | stable       | Current stable release with full support           |
| 2026-01  | previous | stable       | Previous stable release with security patches only |
| 2025-10  |          | stable       | Previous stable release with security patches only |
| 2025-07  |          | stable       | Previous stable release with security patches only |
| 2026-07  | next     | preview      | Release candidate for next API version             |
| unstable | unstable | experimental | Unstable development version, APIs may change      |

## Install

```bash
npm install @juanpprieto/shopify-api-types
```

## Usage

### Versioned type imports

```ts
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/sfapi/2025-07';
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/2025-10';
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi/2026-01';
```

### Alias imports

```ts
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/sfapi/current';
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/previous';
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi/next';
import type { Customer } from '@juanpprieto/shopify-api-types/caapi/unstable';
```

### Schema imports

```ts
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2026-01';
import sfapiSchema from '@juanpprieto/shopify-api-types/schemas/sfapi/2026-04';
import caapiSchema from '@juanpprieto/shopify-api-types/schemas/caapi/2026-07';
```

### Comparison imports

```ts
import currentComparison from '@juanpprieto/shopify-api-types/comparisons/current';
import nextComparison from '@juanpprieto/shopify-api-types/comparisons/next';
import historicalComparison from '@juanpprieto/shopify-api-types/comparisons/2025-10-to-2026-01';
```

## API overview

| API              | Description                                       | Type count |
| ---------------- | ------------------------------------------------- | ---------- |
| Storefront       | Product catalog, cart, checkout, and others       | 268        |
| Admin            | Store management, webhooks, analytics, and others | 1928       |
| Customer Account | Customer profiles, orders, addresses, and others  | 320        |

## What changed: 2026-01 to 2026-04

This is the diff shipped as
`@juanpprieto/shopify-api-types/comparisons/current`.

### Storefront

| Total changes | Breaking | Deprecations | Additions | Removals | Modifications |
| ------------- | -------- | ------------ | --------- | -------- | ------------- |
| 8             | 0        | 0            | 0         | 0        | 2             |

No breaking changes in this API for this version pair.

### Admin

| Total changes | Breaking | Deprecations | Additions | Removals | Modifications |
| ------------- | -------- | ------------ | --------- | -------- | ------------- |
| 3200          | 18       | 0            | 304       | 4        | 1692          |

Breaking changes:

- Type 'DeliveryLegacyModeBlocked' was removed
- Type 'DeliveryLegacyModeBlockedReason' was removed
- Type 'DeliverySetting' was removed
- Type 'DeliverySettingInput' was removed
- Field 'FulfillmentOrderCancelPayload.userErrors' changed type from
  '[UserError!]!' to '[FulfillmentOrderCancelError!]!'
- Field 'FulfillmentOrderMovePayload.userErrors' changed type from
  '[UserError!]!' to '[FulfillmentOrderMoveFulfillmentOrderMoveUserError!]!'
- Input field 'compareQuantity' was removed from input object type
  'InventoryQuantityInput'
- Input field 'ignoreCompareQuantity' was removed from input object type
  'InventorySetQuantitiesInput'
- Field 'ShopPolicy.createdAt' changed type from 'Date!' to 'DateTime!'
- Field 'ShopPolicy.updatedAt' changed type from 'Date!' to 'DateTime!'
- Field 'ShopifyPaymentsDispute.evidenceDueBy' changed type from 'Date' to
  'DateTime'
- Field 'ShopifyPaymentsDispute.evidenceSentOn' changed type from 'Date' to
  'DateTime'
- Field 'ShopifyPaymentsDispute.finalizedOn' changed type from 'Date' to
  'DateTime'
- Argument 'setting: DeliverySettingInput!' was removed from field
  'Mutation.deliverySettingUpdate'

Notable additions include CashActivitiesSortKeys, CashActivity,
CashActivityConnection, CashActivityEdge, CashAdjustmentActivity,
CashAdjustmentActivityType, CashCountActivity, CashCountActivityType,
CashDrawer, CashDrawerConnection, CashDrawerCreatePayload,
CashDrawerCreateUserError, CashDrawerCreateUserErrorCode,
CashDrawerDateRangeInput, CashDrawerEdge, CashDrawerFindOrCreatePayload,
CashDrawerFindOrCreateUserError, CashDrawerFindOrCreateUserErrorCode,
CashDrawerUpdateInput, and CashDrawerUpdatePayload, part of a 304 item addition
set.

### Customer Account

| Total changes | Breaking | Deprecations | Additions | Removals | Modifications |
| ------------- | -------- | ------------ | --------- | -------- | ------------- |
| 18            | 0        | 0            | 0         | 0        | 0             |

No breaking changes in this API for this version pair.

## Release candidate preview: 2026-04 to 2026-07

This is the diff shipped as `@juanpprieto/shopify-api-types/comparisons/next`.
It describes the release candidate 2026-07 relative to the current stable
release and may still change before final release.

| API              | Total changes | Breaking | Additions | Removals | Modifications |
| ---------------- | ------------- | -------- | --------- | -------- | ------------- |
| Storefront       | 89            | 0        | 4         | 0        | 18            |
| Admin            | 3369          | 12       | 290       | 7        | 1857          |
| Customer Account | 63            | 0        | 9         | 0        | 30            |

Storefront additions in preview include BaseCartDiscountApplication,
CartAutomaticDiscountApplication, CartCodeDiscountApplication, and
CartCustomDiscountApplication.

Admin breaking changes in preview:

- Type 'InventoryScheduledChangeInput' was removed
- Type 'InventoryScheduledChangeItemInput' was removed
- Type 'InventorySetScheduledChangesInput' was removed
- Type 'InventorySetScheduledChangesPayload' was removed
- Type 'InventorySetScheduledChangesUserError' was removed
- Type 'InventorySetScheduledChangesUserErrorCode' was removed
- Input field
  'RemoteAuthorizeNetCustomerPaymentProfileInput.customerPaymentProfileId'
  changed type from 'String' to 'String!'
- Input field 'RemoteBraintreePaymentMethodInput.paymentMethodToken' changed
  type from 'String' to 'String!'
- Input field 'RemoteStripePaymentMethodInput.paymentMethodId' changed type from
  'String' to 'String!'
- Field 'inventorySetScheduledChanges' (deprecated) was removed from object type
  'Mutation'
- Argument 'input: CollectionInput!' was removed from field
  'Mutation.collectionCreate'
- Argument 'input: CollectionInput!' was removed from field
  'Mutation.collectionUpdate'

Customer Account additions in preview include CustomerMarketingConsent,
CustomerMarketingConsentInput, CustomerWhatsAppMarketingConsent,
CustomerWhatsAppMarketingConsentUpdateInput,
CustomerWhatsAppMarketingConsentUpdatePayload, MarketingConsentState,
UserErrorsCustomerMarketingConsentError,
UserErrorsCustomerMarketingConsentErrorCode, and
customerWhatsAppMarketingConsentUpdate.

## Package exports reference

```
@juanpprieto/shopify-api-types
├── /sfapi
│   ├── /2025-07
│   ├── /2025-10
│   ├── /2026-01
│   ├── /2026-04
│   ├── /2026-07
│   ├── /current
│   ├── /previous
│   ├── /next
│   └── /unstable
├── /admin
│   ├── /2025-07
│   ├── /2025-10
│   ├── /2026-01
│   ├── /2026-04
│   ├── /2026-07
│   ├── /current
│   ├── /previous
│   ├── /next
│   └── /unstable
├── /caapi
│   ├── /2025-07
│   ├── /2025-10
│   ├── /2026-01
│   ├── /2026-04
│   ├── /2026-07
│   ├── /current
│   ├── /previous
│   ├── /next
│   └── /unstable
├── /schemas
│   ├── /sfapi
│   │   ├── /2025-07
│   │   ├── /2025-10
│   │   ├── /2026-01
│   │   ├── /2026-04
│   │   ├── /2026-07
│   │   └── /unstable
│   ├── /admin
│   │   ├── /2025-07
│   │   ├── /2025-10
│   │   ├── /2026-01
│   │   ├── /2026-04
│   │   ├── /2026-07
│   │   └── /unstable
│   └── /caapi
│       ├── /2025-07
│       ├── /2025-10
│       ├── /2026-01
│       ├── /2026-04
│       ├── /2026-07
│       └── /unstable
└── /comparisons
    ├── /2025-07-to-2025-10
    ├── /2025-10-to-2026-01
    ├── /2026-01-to-2026-04
    ├── /2026-04-to-2026-07
    ├── /current
    └── /next
```

## License

MIT
