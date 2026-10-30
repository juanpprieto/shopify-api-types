<!-- generated for 2026.10.0 -->

# @juanpprieto/shopify-api-types

[![CI](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml)
[![Release](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@juanpprieto/shopify-api-types)](https://www.npmjs.com/package/@juanpprieto/shopify-api-types)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

`@juanpprieto/shopify-api-types` exports TypeScript types for three Shopify
GraphQL APIs: Storefront (`sfapi`), Admin (`admin`), and Customer Account
(`caapi`). Each API has one type export per supported version, from `2026-01`
through the `2027-01` release candidate, plus the `unstable` development
version. The aliases `current`, `previous`, `next`, and `unstable` point to a
version, so an import needs no version number. The package also exports the
schema for each version, and JSON comparison files that list the changes between
adjacent versions. The generator built version `2026.10.0` on 2026-10-30.

## Supported versions

| Version    | Alias      | Status       | Description                                        |
| ---------- | ---------- | ------------ | -------------------------------------------------- |
| `2026-10`  | `current`  | stable       | Current stable release with full support           |
| `2026-07`  | `previous` | stable       | Previous stable release with security patches only |
| `2026-04`  | none       | stable       | Previous stable release with security patches only |
| `2026-01`  | none       | stable       | Previous stable release with security patches only |
| `2027-01`  | `next`     | preview      | Release candidate for next API version             |
| `unstable` | `unstable` | experimental | Unstable development version, APIs may change      |

Type exports accept all four aliases. Comparison exports accept `current` and
`next`. Schema exports accept no aliases. APIs in the `unstable` version may
change.

## Install

Add the package to your project:

```bash
npm install @juanpprieto/shopify-api-types
```

## Usage

### Versioned type imports

Pin an import to one API version. The path contains the API prefix and the
version.

```ts
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/sfapi/2026-10';
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/2026-10';
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi/2026-10';
```

### Alias imports

An alias replaces the version number in a type import path. In this release,
`current` points to `2026-10`, `previous` points to `2026-07`, `next` points to
`2027-01`, and `unstable` points to the unstable development version.

```ts
import { Product } from '@juanpprieto/shopify-api-types/sfapi/current';
import { Shop } from '@juanpprieto/shopify-api-types/admin/previous';
import { Customer } from '@juanpprieto/shopify-api-types/caapi/next';
```

### Schema imports

A schema path contains the `schemas` prefix, the API name, and the version.
Schema exports accept no aliases.

```ts
import storefrontSchema from '@juanpprieto/shopify-api-types/schemas/sfapi/2026-10';
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2026-10';
import customerAccountSchema from '@juanpprieto/shopify-api-types/schemas/caapi/2026-10';
```

### Comparison imports

Each comparison export is one JSON file with the changes between two versions.
The file contains summary counts, breaking changes, and notable additions.

```ts
import currentComparison from '@juanpprieto/shopify-api-types/comparisons/current';
import nextComparison from '@juanpprieto/shopify-api-types/comparisons/next';
import pinnedComparison from '@juanpprieto/shopify-api-types/comparisons/2026-07-to-2026-10';
```

The comparison keys are `2026-01-to-2026-04`, `2026-04-to-2026-07`,
`2026-07-to-2026-10`, `2026-10-to-2027-01`, `current`, and `next`.

## API overview

The three APIs cover different Shopify areas.

| API                  | Prefix  | Types | Covers                                            |
| -------------------- | ------- | ----- | ------------------------------------------------- |
| Storefront API       | `sfapi` | 272   | Product catalog, cart, checkout, and others       |
| Admin API            | `admin` | 2123  | Store management, webhooks, analytics, and others |
| Customer Account API | `caapi` | 339   | Customer profiles, orders, addresses, and others  |

## What changed from 2026-07 to 2026-10

The `current` comparison export contains the data below.

| API                  | Total changes | Breaking | Deprecations | Additions | Removals | Modifications |
| -------------------- | ------------- | -------- | ------------ | --------- | -------- | ------------- |
| Storefront API       | 9             | 2        | 0            | 1         | 0        | 3             |
| Admin API            | 2234          | 28       | 0            | 201       | 23       | 1031          |
| Customer Account API | 306           | 13       | 0            | 33        | 8        | 91            |

### Storefront API

Shopify made these breaking changes:

- `ShopPayPaymentRequestSession.paymentRequest` - Shopify changed the field type
  from `ShopPayPaymentRequest!` to `ShopPayPaymentRequest`. The field can now
  return `null`.
- `Mutation.shopPayPaymentRequestSessionCreate` - Shopify removed the argument
  `paymentRequest: ShopPayPaymentRequestInput!`.

Shopify adds one type to the Storefront API: `ShopPayPaymentRequestShopUser`.

### Admin API

Shopify made these breaking changes:

#### Removed types

- `PriceRule` - Shopify removed the type.
- `PriceRuleAllocationMethod` - Shopify removed the type.
- `PriceRuleCustomerSelection` - Shopify removed the type.
- `PriceRuleDiscountCode` - Shopify removed the type.
- `PriceRuleDiscountCodeConnection` - Shopify removed the type.
- `PriceRuleDiscountCodeEdge` - Shopify removed the type.
- `PriceRuleEntitlementToPrerequisiteQuantityRatio` - Shopify removed the type.
- `PriceRuleFeature` - Shopify removed the type.
- `PriceRuleFixedAmountValue` - Shopify removed the type.
- `PriceRuleItemEntitlements` - Shopify removed the type.
- `PriceRuleLineItemPrerequisites` - Shopify removed the type.
- `PriceRuleMoneyRange` - Shopify removed the type.
- `PriceRulePercentValue` - Shopify removed the type.
- `PriceRulePrerequisiteToEntitlementQuantityRatio` - Shopify removed the type.
- `PriceRuleQuantityRange` - Shopify removed the type.
- `PriceRuleShareableUrl` - Shopify removed the type.
- `PriceRuleShareableUrlTargetType` - Shopify removed the type.
- `PriceRuleShippingLineEntitlements` - Shopify removed the type.
- `PriceRuleStatus` - Shopify removed the type.
- `PriceRuleTarget` - Shopify removed the type.
- `PriceRuleTrait` - Shopify removed the type.
- `PriceRuleValidityPeriod` - Shopify removed the type.
- `PriceRuleValue` - Shopify removed the type.

#### Removed enum values

- `ITEM_NOT_STOCKED_AT_LOCATION` - Shopify removed the value from
  `InventoryAdjustQuantitiesUserErrorCode`.
- `ITEM_NOT_STOCKED_AT_LOCATION` - Shopify removed the value from
  `InventoryMoveQuantitiesUserErrorCode`.
- `ITEM_NOT_STOCKED_AT_LOCATION` - Shopify removed the value from
  `InventorySetOnHandQuantitiesUserErrorCode`.
- `ITEM_NOT_STOCKED_AT_LOCATION` - Shopify removed the value from
  `InventorySetQuantitiesUserErrorCode`.

Shopify adds 201 types to the Admin API. Notable additions include types for
analytics annotations and analytics targets: `AnalyticsAnnotation`,
`AnalyticsAnnotationCreateInput`, `AnalyticsAnnotationCreatePayload`,
`AnalyticsAnnotationDeletePayload`, `AnalyticsTarget`,
`AnalyticsTargetCreateInput`, `AnalyticsTargetConnection`,
`AnalyticsAnnotationSortKeys`.

### Customer Account API

Shopify made these breaking changes:

#### Removed types

- `AppliedGiftCard` - Shopify removed the type.
- `AvailableShippingRates` - Shopify removed the type.
- `Checkout` - Shopify removed the type.
- `CheckoutLineItem` - Shopify removed the type.
- `CheckoutLineItemConnection` - Shopify removed the type.
- `CheckoutLineItemEdge` - Shopify removed the type.
- `CustomerMailingAddress` - Shopify removed the type.
- `ShippingRate` - Shopify removed the type.

#### Input and argument changes

- `CustomerAddressInput.territoryCode` - Shopify removed the input field.
- `SubscriptionDeliveryMethodLocalDeliveryInput.address` - Shopify removed the
  input field.
- `Mutation.subscriptionContractFetchDeliveryOptions` - Shopify removed the
  argument `deliveryAddress: CustomerMailingAddressInput`.

Shopify adds 33 types to the Customer Account API. Notable additions include
types for requested order edits, line item eligibility, and SMS marketing
consent: `RequestedOrderEdit`, `CalculatedRequestedOrderEdit`,
`CalculateRequestedOrderEditInput`, `EditableLineItem`, `IneligibleLineItem`,
`IneligibleReason`, `OrderRequestEditPayload`, `CustomerSmsMarketingConsent`.

### What to do

The `2026-10` type exports no longer contain the removed types, so imports of
them fail. The `2026-10` input types no longer contain the removed arguments and
input fields.

- Remove the import of each removed type, or import it from the `2026-07` export
  during migration:
  `import { Checkout } from '@juanpprieto/shopify-api-types/caapi/2026-07';`
- Make sure code that reads `ShopPayPaymentRequestSession.paymentRequest`
  handles `null`.
- Remove `paymentRequest` from inputs to
  `Mutation.shopPayPaymentRequestSessionCreate`.
- Remove `territoryCode` from `CustomerAddressInput` values.
- Remove `address` from `SubscriptionDeliveryMethodLocalDeliveryInput` values.
- Remove `deliveryAddress` from calls to
  `Mutation.subscriptionContractFetchDeliveryOptions`.
- Stop matching `ITEM_NOT_STOCKED_AT_LOCATION` in the four inventory error
  enums.
- Check the `2026-10` schema exports when you need the current arguments and
  input fields.
- Use `@juanpprieto/shopify-api-types/comparisons/current` to check the change
  data for every API.

The `2026-07` version receives security patches only.

The `current` comparison export does not name replacements:

- [TK: which types replace the removed `PriceRule` types?]
- [TK: which types replace the removed `Checkout` types?]
- [TK: which input replaces the `paymentRequest` argument on
  `Mutation.shopPayPaymentRequestSessionCreate`?]
- [TK: which argument replaces `deliveryAddress` on
  `Mutation.subscriptionContractFetchDeliveryOptions`?]
- [TK: which fields replace `territoryCode` on `CustomerAddressInput` and
  `address` on `SubscriptionDeliveryMethodLocalDeliveryInput`?]

## Release candidate preview (2026-10 to 2027-01)

Import the `2027-01` types from a `next` export, for example
`@juanpprieto/shopify-api-types/admin/next`. The `next` comparison export
contains the data below.

| API                  | Total changes | Breaking | Deprecations | Additions | Removals | Modifications |
| -------------------- | ------------- | -------- | ------------ | --------- | -------- | ------------- |
| Storefront API       | 25            | 0        | 0            | 2         | 0        | 15            |
| Admin API            | 617           | 16       | 0            | 45        | 10       | 295           |
| Customer Account API | 124           | 0        | 0            | 9         | 0        | 15            |

The Storefront API and the Customer Account API show no breaking changes. In the
`2027-01` Admin API, Shopify removes types such as
`MarketCurrencySettingsUpdatePayload`, `MarketCurrencySettingsUserError`,
`DiscountAutomaticConnection`, and
`CollectionSourceInclusionConditionMetafieldInteger`. Shopify removes the
deprecated field `marketCurrencySettingsUpdate` from `Mutation`. Shopify removes
the deprecated values `PRIVATE` and `PUBLIC_READ` from `MetaobjectAdminAccess`.
Shopify removes the input field `metafieldInteger` from
`CollectionSourceInclusionConditionInput` and
`CollectionSourceInclusionConditionUpdateInput`.

Shopify adds 45 types to the Admin API. Notable additions include types for
analytics schemas, for example `AnalyticsSchema`, `AnalyticsSchemaField`, and
`AnalyticsSchemaJoin`. Shopify adds
`ShopPayPaymentRequestSessionBusinessEntityUpdatePayload` and
`shopPayPaymentRequestSessionBusinessEntityUpdate` to the Storefront API.
Shopify adds types for fees, duties, and subscription lines to the Customer
Account API, for example `FeeLine`, `FeeTarget`, `Duty`, and
`SubscriptionGroupedLine`.

## Package exports

The tree shows every export in the package. Each import path runs from the root
to a leaf, for example `@juanpprieto/shopify-api-types/sfapi/current`. For an
alias key, the text in parentheses shows its target.

```text
@juanpprieto/shopify-api-types
├── sfapi            Storefront types
│   ├── 2026-01
│   ├── 2026-04
│   ├── 2026-07
│   ├── 2026-10
│   ├── 2027-01
│   ├── current       (2026-10)
│   ├── next          (2027-01)
│   ├── previous      (2026-07)
│   └── unstable
├── admin            Admin types
│   ├── 2026-01
│   ├── 2026-04
│   ├── 2026-07
│   ├── 2026-10
│   ├── 2027-01
│   ├── current       (2026-10)
│   ├── next          (2027-01)
│   ├── previous      (2026-07)
│   └── unstable
├── caapi            Customer Account types
│   ├── 2026-01
│   ├── 2026-04
│   ├── 2026-07
│   ├── 2026-10
│   ├── 2027-01
│   ├── current       (2026-10)
│   ├── next          (2027-01)
│   ├── previous      (2026-07)
│   └── unstable
├── schemas/sfapi    Storefront schema
│   ├── 2026-01
│   ├── 2026-04
│   ├── 2026-07
│   ├── 2026-10
│   ├── 2027-01
│   └── unstable
├── schemas/admin    Admin schema
│   ├── 2026-01
│   ├── 2026-04
│   ├── 2026-07
│   ├── 2026-10
│   ├── 2027-01
│   └── unstable
├── schemas/caapi    Customer Account schema
│   ├── 2026-01
│   ├── 2026-04
│   ├── 2026-07
│   ├── 2026-10
│   ├── 2027-01
│   └── unstable
└── comparisons      JSON comparison files
    ├── 2026-01-to-2026-04
    ├── 2026-04-to-2026-07
    ├── 2026-07-to-2026-10
    ├── 2026-10-to-2027-01
    ├── current       (2026-07-to-2026-10)
    └── next          (2026-10-to-2027-01)
```

## License

MIT
