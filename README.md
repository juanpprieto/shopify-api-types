<!-- generated for 2026.10.0 -->

# @juanpprieto/shopify-api-types

[![CI](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml)
[![Release](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@juanpprieto/shopify-api-types)](https://www.npmjs.com/package/@juanpprieto/shopify-api-types)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

This package gives you TypeScript types, GraphQL schemas, and version comparisons for Shopify APIs, so you can check API changes.

## Install

```bash
npm install -D @juanpprieto/shopify-api-types
```

> [!NOTE]
> The package contains types and JSON only, has 0 runtime dependencies, and supports Node.js `>=22.0.0`.

## Quick start

```ts
import type { Product } from '@juanpprieto/shopify-api-types/sfapi/current';
import type { AnalyticsAnnotation } from '@juanpprieto/shopify-api-types/admin/2026-10';
import currentComparison from '@juanpprieto/shopify-api-types/comparisons/current';
```

| Import path                                          | Use it when                                               |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `@juanpprieto/shopify-api-types/sfapi/current`       | You want types that follow the current stable release.    |
| `@juanpprieto/shopify-api-types/admin/2026-10`       | You need types pinned to one API version.                 |
| `@juanpprieto/shopify-api-types/comparisons/current` | You need the JSON comparison from `2026-07` to `2026-10`. |

## Versions

| Alias            | Version    | Status       |
| ---------------- | ---------- | ------------ |
| `current`        | `2026-10`  | stable       |
| `previous`       | `2026-07`  | stable       |
| Versioned import | `2026-04`  | stable       |
| Versioned import | `2026-01`  | stable       |
| `next`           | `2027-01`  | preview      |
| `unstable`       | `unstable` | experimental |

> [!TIP]
> Use `current` for production code.

> [!WARNING]
> `next` and `unstable` change before Shopify releases them.

## APIs

| API              | Import prefix                          | Types |
| ---------------- | -------------------------------------- | ----: |
| Storefront       | `@juanpprieto/shopify-api-types/sfapi` |   272 |
| Admin            | `@juanpprieto/shopify-api-types/admin` |  2123 |
| Customer Account | `@juanpprieto/shopify-api-types/caapi` |   339 |

## What changed in 2026-10

> [!IMPORTANT]
> Shopify makes 43 breaking changes across 8 feature areas in `2026-10`.

| Area                  | What changes                                                                                                                                         | What to do                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Shop Pay              | Shopify makes `ShopPayPaymentRequestSession.paymentRequest` nullable and removes `paymentRequest` from `Mutation.shopPayPaymentRequestSessionCreate` | Check for `null`. Remove the references.                                                                                                |
| Discounts             | Shopify removes `PriceRule` and its related types                                                                                                    | Use the types and queries in [Shopify's discount tutorials](https://shopify.dev/docs/apps/selling-strategies/discounts/getting-started) |
| Inventory             | Shopify removes `ITEM_NOT_STOCKED_AT_LOCATION` from four inventory error enums                                                                       | Remove the references                                                                                                                   |
| Draft order discounts | Shopify removes `DraftOrderDiscountNotAppliedWarning.priceRule`                                                                                      | Use `discountCode` and `discountTitle` instead                                                                                          |
| Checkout              | Shopify removes `Checkout`, related types, and `Customer.lastIncompleteCheckout`                                                                     | Remove the references                                                                                                                   |
| Customer addresses    | Shopify removes `CustomerMailingAddress` and `CustomerAddressInput.territoryCode`                                                                    | Remove the references                                                                                                                   |
| Subscription delivery | Shopify removes `SubscriptionDeliveryMethodLocalDeliveryInput.address` and the `deliveryAddress` argument                                            | Remove the references                                                                                                                   |
| Orders                | Shopify removes `Order.shippingTitle`                                                                                                                | Remove the references                                                                                                                   |

New feature areas include Shop Pay user details, analytics annotations and targets, audit trail adjustments, product variant barcodes, requested order edits, and SMS marketing consent.

Every changed item, with details: [release notes for 2026.10.0](https://github.com/juanpprieto/shopify-api-types/releases/tag/v2026.10.0)

## Coming in 2027-01

> [!WARNING]
> These changes are not stable yet and may change before Shopify releases `2027-01`.

| Area        | What changes                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Collections | Shopify removes `CollectionSourceInclusionConditionMetafieldInteger`, related types, and `metafieldInteger` input fields                          |
| Discounts   | Shopify removes `QueryRoot.automaticDiscounts`, `DiscountAutomaticConnection`, and `DiscountAutomaticEdge`                                        |
| Markets     | Shopify removes `Mutation.marketCurrencySettingsUpdate` and its payload and error types                                                           |
| Metaobjects | Shopify removes `PRIVATE` and `PUBLIC_READ` from `MetaobjectAdminAccess`, plus `StandardMetaobjectDefinitionFieldTemplate.visibleToStorefrontApi` |

## Schemas and comparisons

```ts
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2026-10';
import currentComparison from '@juanpprieto/shopify-api-types/comparisons/current';
```

The schema file contains the Admin API schema for `2026-10`. The comparison file contains the changes from `2026-07` to `2026-10`, including breaking changes and additions.

## All exports

<details>
<summary>Show all export paths</summary>

```text
Storefront types
@juanpprieto/shopify-api-types/sfapi/2026-01
@juanpprieto/shopify-api-types/sfapi/2026-04
@juanpprieto/shopify-api-types/sfapi/2026-07
@juanpprieto/shopify-api-types/sfapi/2026-10
@juanpprieto/shopify-api-types/sfapi/2027-01
@juanpprieto/shopify-api-types/sfapi/current
@juanpprieto/shopify-api-types/sfapi/next
@juanpprieto/shopify-api-types/sfapi/previous
@juanpprieto/shopify-api-types/sfapi/unstable

Storefront schemas
@juanpprieto/shopify-api-types/schemas/sfapi/2026-01
@juanpprieto/shopify-api-types/schemas/sfapi/2026-04
@juanpprieto/shopify-api-types/schemas/sfapi/2026-07
@juanpprieto/shopify-api-types/schemas/sfapi/2026-10
@juanpprieto/shopify-api-types/schemas/sfapi/2027-01
@juanpprieto/shopify-api-types/schemas/sfapi/unstable

Admin types
@juanpprieto/shopify-api-types/admin/2026-01
@juanpprieto/shopify-api-types/admin/2026-04
@juanpprieto/shopify-api-types/admin/2026-07
@juanpprieto/shopify-api-types/admin/2026-10
@juanpprieto/shopify-api-types/admin/2027-01
@juanpprieto/shopify-api-types/admin/current
@juanpprieto/shopify-api-types/admin/next
@juanpprieto/shopify-api-types/admin/previous
@juanpprieto/shopify-api-types/admin/unstable

Admin schemas
@juanpprieto/shopify-api-types/schemas/admin/2026-01
@juanpprieto/shopify-api-types/schemas/admin/2026-04
@juanpprieto/shopify-api-types/schemas/admin/2026-07
@juanpprieto/shopify-api-types/schemas/admin/2026-10
@juanpprieto/shopify-api-types/schemas/admin/2027-01
@juanpprieto/shopify-api-types/schemas/admin/unstable

Customer account types
@juanpprieto/shopify-api-types/caapi/2026-01
@juanpprieto/shopify-api-types/caapi/2026-04
@juanpprieto/shopify-api-types/caapi/2026-07
@juanpprieto/shopify-api-types/caapi/2026-10
@juanpprieto/shopify-api-types/caapi/2027-01
@juanpprieto/shopify-api-types/caapi/current
@juanpprieto/shopify-api-types/caapi/next
@juanpprieto/shopify-api-types/caapi/previous
@juanpprieto/shopify-api-types/caapi/unstable

Customer account schemas
@juanpprieto/shopify-api-types/schemas/caapi/2026-01
@juanpprieto/shopify-api-types/schemas/caapi/2026-04
@juanpprieto/shopify-api-types/schemas/caapi/2026-07
@juanpprieto/shopify-api-types/schemas/caapi/2026-10
@juanpprieto/shopify-api-types/schemas/caapi/2027-01
@juanpprieto/shopify-api-types/schemas/caapi/unstable

Comparisons
@juanpprieto/shopify-api-types/comparisons/2026-01-to-2026-04
@juanpprieto/shopify-api-types/comparisons/2026-04-to-2026-07
@juanpprieto/shopify-api-types/comparisons/2026-07-to-2026-10
@juanpprieto/shopify-api-types/comparisons/2026-10-to-2027-01
@juanpprieto/shopify-api-types/comparisons/current
@juanpprieto/shopify-api-types/comparisons/next
```

</details>

## License

MIT
