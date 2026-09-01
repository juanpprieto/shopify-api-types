# @juanpprieto/shopify-api-types

[![CI](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml)
[![Release](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml)

![npm version](https://img.shields.io/npm/v/@juanpprieto/shopify-api-types)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

TypeScript type definitions and raw GraphQL schemas for Shopify's Storefront,
Admin, and Customer Account APIs. Types are published per Shopify API release,
with semantic aliases and generated comparison reports between versions.

## Supported versions

| Alias    | Version  | Status       | Description                                        |
| -------- | -------- | ------------ | -------------------------------------------------- |
| current  | 2026-07  | stable       | Current stable release with full support           |
| previous | 2026-04  | stable       | Previous stable release with security patches only |
| next     | 2026-10  | preview      | Release candidate for next API version             |
| unstable | unstable | experimental | Unstable development version, APIs may change      |

Additional supported versions, no alias:

| Version | Status | Description                                        |
| ------- | ------ | -------------------------------------------------- |
| 2026-01 | stable | Previous stable release with security patches only |
| 2025-10 | stable | Previous stable release with security patches only |

## Install

```sh
npm install @juanpprieto/shopify-api-types
```

## Usage

### Versioned type imports

```ts
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/sfapi/2026-01';
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/2026-01';
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi/2026-01';
```

Any of `2025-10`, `2026-01`, `2026-04`, `2026-07`, `2026-10` works for `sfapi`,
`admin`, and `caapi`.

### Alias imports

```ts
import type { Product } from '@juanpprieto/shopify-api-types/sfapi/current';
import type { Shop } from '@juanpprieto/shopify-api-types/admin/previous';
import type { AnalyticsAnnotation } from '@juanpprieto/shopify-api-types/admin/next';
import type { Customer } from '@juanpprieto/shopify-api-types/caapi/unstable';
```

### Schema imports

```ts
import sfapiSchema from '@juanpprieto/shopify-api-types/schemas/sfapi/2026-07';
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2026-01';
import caapiSchema from '@juanpprieto/shopify-api-types/schemas/caapi/unstable';
```

Schema exports cover `2025-10`, `2026-01`, `2026-04`, `2026-07`, `2026-10`, and
`unstable`. They do not expose `current`, `previous`, or `next` aliases.

### Comparison imports

```ts
import current from '@juanpprieto/shopify-api-types/comparisons/current';
import next from '@juanpprieto/shopify-api-types/comparisons/next';
import explicit from '@juanpprieto/shopify-api-types/comparisons/2026-04-to-2026-07';
```

Comparisons are plain JSON documents describing type differences between two
adjacent versions.

## API overview

| API              | Export prefix | Description                                       | Type count |
| ---------------- | ------------- | ------------------------------------------------- | ---------- |
| Storefront       | `sfapi`       | Product catalog, cart, checkout, and others       | 271        |
| Admin            | `admin`       | Store management, webhooks, analytics, and others | 2041       |
| Customer Account | `caapi`       | Customer profiles, orders, addresses, and others  | 323        |

## What changed from 2026-04 to 2026-07

This is the `comparisons/current` report, covering the move from `previous`
(2026-04) to `current` (2026-07).

| API              | Total changes | Breaking | Deprecations | Additions | Removals | Modifications |
| ---------------- | ------------- | -------- | ------------ | --------- | -------- | ------------- |
| Storefront       | 89            | 0        | 0            | 4         | 0        | 18            |
| Admin            | 3369          | 12       | 0            | 290       | 7        | 1857          |
| Customer Account | 63            | 0        | 0            | 9         | 0        | 30            |

### Breaking changes

Storefront and Customer Account have no breaking changes in this release. Admin
has 12, grouped below.

**Removed types**

- `InventoryScheduledChangeInput` was removed.
- `InventoryScheduledChangeItemInput` was removed.
- `InventorySetScheduledChangesInput` was removed.
- `InventorySetScheduledChangesPayload` was removed.
- `InventorySetScheduledChangesUserError` was removed.
- `InventorySetScheduledChangesUserErrorCode` was removed.

**Input field type changes**

- `RemoteAuthorizeNetCustomerPaymentProfileInput.customerPaymentProfileId`
  changed from `String` to `String!`.
- `RemoteBraintreePaymentMethodInput.paymentMethodToken` changed from `String`
  to `String!`.
- `RemoteStripePaymentMethodInput.paymentMethodId` changed from `String` to
  `String!`.

**Field and argument removals**

- `Mutation.inventorySetScheduledChanges` (deprecated) was removed.
- Argument `input: CollectionInput!` was removed from
  `Mutation.collectionCreate`.
- Argument `input: CollectionInput!` was removed from
  `Mutation.collectionUpdate`.

### Additions

Storefront adds 4 types for cart discount applications, including
`BaseCartDiscountApplication`, `CartAutomaticDiscountApplication`,
`CartCodeDiscountApplication`, and `CartCustomDiscountApplication`.

Admin adds 290 types across collection conditions and rule-based collection
sources, including `CollectionConditionsSource`,
`CollectionConditionBasicMetafieldDefinition`, `CollectionConditionMatchType`,
`CollectionCreateConditionsSourceInput`, `B2BType`, `ChannelsCondition`,
`CollectionConditionsSourceConnection`, and `CollectionConditionsSourcesByApp`.

Customer Account adds 9 types for marketing consent, including
`CustomerMarketingConsent`, `CustomerWhatsAppMarketingConsent`,
`CustomerWhatsAppMarketingConsentUpdateInput`, `MarketingConsentState`,
`UserErrorsCustomerMarketingConsentError`, and
`customerWhatsAppMarketingConsentUpdate`.

## Release candidate preview

This is a short preview of `comparisons/next`, covering 2026-07 to 2026-10 (the
`2026-10` release candidate).

| API              | Total changes | Breaking | Additions | Removals | Modifications |
| ---------------- | ------------- | -------- | --------- | -------- | ------------- |
| Storefront       | 9             | 2        | 1         | 0        | 3             |
| Admin            | 1203          | 28       | 113       | 23       | 649           |
| Customer Account | 19            | 12       | 1         | 8        | 4             |

Notable signals for planning ahead:

- Admin removes the entire `PriceRule` type family, including `PriceRule`,
  `PriceRuleDiscountCode`, and `PriceRuleValidityPeriod`.
- Customer Account removes legacy checkout types, including `Checkout`,
  `CheckoutLineItem`, and `CustomerMailingAddress`.
- Storefront changes `ShopPayPaymentRequestSession.paymentRequest` from
  `ShopPayPaymentRequest!` to `ShopPayPaymentRequest`.

Treat this data as a preview. The release candidate schema may still change
before it becomes `current`.

## Exports reference

```
@juanpprieto/shopify-api-types
├── /sfapi/2025-10
├── /sfapi/2026-01
├── /sfapi/2026-04
├── /sfapi/2026-07
├── /sfapi/2026-10
├── /sfapi/current
├── /sfapi/previous
├── /sfapi/next
├── /sfapi/unstable
├── /admin/2025-10
├── /admin/2026-01
├── /admin/2026-04
├── /admin/2026-07
├── /admin/2026-10
├── /admin/current
├── /admin/previous
├── /admin/next
├── /admin/unstable
├── /caapi/2025-10
├── /caapi/2026-01
├── /caapi/2026-04
├── /caapi/2026-07
├── /caapi/2026-10
├── /caapi/current
├── /caapi/previous
├── /caapi/next
├── /caapi/unstable
├── /schemas/sfapi/2025-10
├── /schemas/sfapi/2026-01
├── /schemas/sfapi/2026-04
├── /schemas/sfapi/2026-07
├── /schemas/sfapi/2026-10
├── /schemas/sfapi/unstable
├── /schemas/admin/2025-10
├── /schemas/admin/2026-01
├── /schemas/admin/2026-04
├── /schemas/admin/2026-07
├── /schemas/admin/2026-10
├── /schemas/admin/unstable
├── /schemas/caapi/2025-10
├── /schemas/caapi/2026-01
├── /schemas/caapi/2026-04
├── /schemas/caapi/2026-07
├── /schemas/caapi/2026-10
├── /schemas/caapi/unstable
├── /comparisons/2025-10-to-2026-01
├── /comparisons/2026-01-to-2026-04
├── /comparisons/2026-04-to-2026-07
├── /comparisons/2026-07-to-2026-10
├── /comparisons/current
└── /comparisons/next
```

## License

MIT
