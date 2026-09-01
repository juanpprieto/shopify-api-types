# @juanpprieto/shopify-api-types

[![npm version](https://img.shields.io/npm/v/@juanpprieto/shopify-api-types.svg)](https://www.npmjs.com/package/@juanpprieto/shopify-api-types)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Comprehensive, version-pinned **TypeScript types** and **JSON schemas** for
Shopify's GraphQL APIs — **Storefront**, **Admin**, and **Customer Account** —
spanning multiple API versions, plus auto-generated **version comparison** diffs
to help you track breaking changes and plan upgrades.

> Generated: 2026-09-01T11:40:14.105Z · Package version: `2026.1.0`

---

## ✨ Features

- 🗂 **Multi-version support** — access types for `2025-04` through `2026-04`
  (including `unstable`) side-by-side
- 🏷 **Semantic aliases** — import via `current`, `next`, `previous`, or
  `unstable` instead of hardcoding version numbers
- 📦 **Three API surfaces** — Storefront (`sfapi`), Admin (`admin`), and
  Customer Account (`caapi`)
- 📄 **Raw JSON schemas** — for tooling, codegen, or introspection-based
  workflows
- 🔍 **Version comparison reports** — machine-readable diffs (additions,
  removals, breaking changes) between consecutive versions
- ⚠️ **Breaking change detection** — every comparison flags breaking vs.
  non-breaking changes

---

## 📦 Installation

```bash
npm install @juanpprieto/shopify-api-types
# or
yarn add @juanpprieto/shopify-api-types
# or
pnpm add @juanpprieto/shopify-api-types
```

---

## 🗓 Supported API Versions

| Version    | Alias      | Status          | Description                                        |
| ---------- | ---------- | --------------- | -------------------------------------------------- |
| `2026-01`  | `current`  | 🟢 stable       | Current stable release with full support           |
| `2025-10`  | `previous` | 🟢 stable       | Previous stable release with security patches only |
| `2025-07`  | —          | 🟢 stable       | Previous stable release with security patches only |
| `2025-04`  | —          | 🟢 stable       | Previous stable release with security patches only |
| `2026-04`  | `next`     | 🟡 preview      | Release candidate for next API version             |
| `unstable` | —          | 🔴 experimental | Unstable development version — APIs may change     |

---

## 🚀 Usage

### Import types for a specific API version

```ts
// Storefront API
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/sfapi/2026-01';

// Admin API
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/2026-01';

// Customer Account API
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi/2026-01';
```

### Import using semantic aliases (recommended)

Avoid hardcoding version strings — these aliases automatically track the right
version as this package is updated:

```ts
import { Product } from '@juanpprieto/shopify-api-types/sfapi/current'; // → 2026-01
import { Product } from '@juanpprieto/shopify-api-types/sfapi/next'; // → 2026-04
import { Product } from '@juanpprieto/shopify-api-types/sfapi/previous'; // → 2025-10
import { Product } from '@juanpprieto/shopify-api-types/sfapi/unstable'; // → unstable
```

The same pattern (`current` / `next` / `previous` / `unstable`) applies to
`admin` and `caapi`.

### Import raw JSON schemas

Useful for introspection tooling, codegen pipelines, or validation:

```ts
import sfapiSchema from '@juanpprieto/shopify-api-types/schemas/sfapi/2026-01';
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2026-01';
import caapiSchema from '@juanpprieto/shopify-api-types/schemas/caapi/2026-01';
```

Schemas are available for every supported version: `2025-04`, `2025-07`,
`2025-10`, `2026-01`, `2026-04`, and `unstable`.

### Import version comparison reports

Get a structured diff (additions, removals, modifications, breaking flags)
between two consecutive API versions:

```ts
import currentDiff from '@juanpprieto/shopify-api-types/comparisons/current'; // 2025-10 → 2026-01
import nextDiff from '@juanpprieto/shopify-api-types/comparisons/next'; // 2026-01 → 2026-04
import specificDiff from '@juanpprieto/shopify-api-types/comparisons/2025-10-to-2026-01';
```

Available comparison keys: `2025-04-to-2025-07`, `2025-07-to-2025-10`,
`2025-10-to-2026-01`, `2026-01-to-2026-04`, plus the `current` and `next`
aliases.

---

## 📊 API Overview

| API                            | Description                                       | Type Count |
| ------------------------------ | ------------------------------------------------- | ---------- |
| **Storefront** (`sfapi`)       | Product catalog, cart, checkout, and others       | 268        |
| **Admin** (`admin`)            | Store management, webhooks, analytics, and others | 1,790      |
| **Customer Account** (`caapi`) | Customer profiles, orders, addresses, and others  | 320        |

---

## 🔄 What Changed: `2025-10` → `2026-01` (current)

Summary of the diff powering this release's `current` alias.

| API              | Total Changes | 🔴 Breaking | Additions | Removals | Modifications |
| ---------------- | ------------- | ----------- | --------- | -------- | ------------- |
| Storefront       | 23            | 1           | 2         | 0        | 7             |
| Customer Account | 443           | 1           | 36        | 0        | 104           |
| Admin            | 440           | 2           | 30        | 0        | 258           |

### ⚠️ Breaking changes to review

- **Storefront**: `Mutation.cartDiscountCodesUpdate` — the `discountCodes`
  argument type changed from `[String!]` to `[String!]!` (now required).
- **Customer Account**: `RequestedLineItemInput.returnReason` was removed in
  favor of `returnReasonDefinitionId`, which references the new
  `ReturnReasonDefinition` object.
- **Admin**: `Mutation.bulkOperationRunMutation` — the `groupObjects` argument
  was removed.
- **Admin**: `Mutation.deliverySettingUpdate` — the
  `setting: DeliverySettingInput!` argument was removed (along with
  `DeliverySetting`, `DeliverySettingInput`, `DeliveryLegacyModeBlocked`, and
  `DeliveryLegacyModeBlockedReason` types).

### 🌟 Notable additions

- New object types across Storefront/Customer Account: `SocialLoginProvider`,
  `Translation`, media types (`MediaImage`, `Video`, `Model3d`, `GenericFile`),
  and new payment instrument objects (`BankPaymentInstrument`,
  `BankPaymentMethod`, `PaymentMandateInput`).
- New Admin mutations: `collectionDuplicate`, `taxSummaryCreate`.
- Cart error codes gained `PARENT_LINE_INVALID_REFERENCE` and
  `GIFT_CARD_RECIPIENT_INVALID`.

---

## 🔬 Preview: `2026-01` → `2026-04` (next)

| API              | Total Changes | 🔴 Breaking | Additions | Removals | Modifications |
| ---------------- | ------------- | ----------- | --------- | -------- | ------------- |
| Storefront       | 8             | 0           | 0         | 0        | 2             |
| Customer Account | 18            | 0           | 0         | 0        | 0             |
| Admin            | 3,200         | 18          | 304       | 4        | 1,692         |

> ⚠️ The `next` (`2026-04`) release candidate for the Admin API introduces **18
> breaking changes** and is under active development — do not use in production.
> Notable additions include Cash Management (`CashDrawer`, `CashActivity`),
> multi-channel support (`Channel`, `ChannelCreateInput`), and extensive
> Checkout & Accounts branding customization types.

---

## 📁 Package Exports Reference

```
@juanpprieto/shopify-api-types/
├── sfapi/{version}             # Storefront types (2025-04 … 2026-04, unstable, current, next, previous)
├── admin/{version}             # Admin types (same version set)
├── caapi/{version}             # Customer Account types (same version set)
├── schemas/sfapi/{version}     # Storefront JSON schema
├── schemas/admin/{version}     # Admin JSON schema
├── schemas/caapi/{version}     # Customer Account JSON schema
└── comparisons/{from-to|alias} # Version diff reports
```

---

## 📄 License

MIT
