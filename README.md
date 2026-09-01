# @juanpprieto/shopify-api-types

[![CI](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/ci.yml)
[![Release](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml/badge.svg)](https://github.com/juanpprieto/shopify-api-types/actions/workflows/release.yml)

TypeScript definitions for the Shopify GraphQL APIs, automatically generated
from the official Shopify GraphQL schemas.

[![npm version](https://img.shields.io/npm/v/@juanpprieto/shopify-api-types.svg)](https://www.npmjs.com/package/@juanpprieto/shopify-api-types)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📦 Installation

```bash
npm install @juanpprieto/shopify-api-types
# or
yarn add @juanpprieto/shopify-api-types
# or
pnpm add @juanpprieto/shopify-api-types
```

## 🚀 Quick Start

Import types for the specific API and version you need:

```typescript
// Storefront API
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/sfapi/2025-10';

// Admin API
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/2025-10';

// Customer Account API
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi/2025-10';
```

## 📋 Available APIs

| API                      | Types       | Description                                       | Examples                              |
| ------------------------ | ----------- | ------------------------------------------------- | ------------------------------------- |
| **Storefront API**       | 266 types   | Product catalog, cart, checkout, and others       | `Product`, `Cart`, `Checkout`         |
| **Admin API**            | 1,775 types | Store management, webhooks, analytics, and others | `Shop`, `Webhook`, `InventoryLevel`   |
| **Customer Account API** | 298 types   | Customer profiles, orders, addresses, and others  | `Customer`, `Order`, `MailingAddress` |

## 🏷️ Version Support

### Current Versions

| Version      | Status          | Description                                        |
| ------------ | --------------- | -------------------------------------------------- |
| **2025-10**  | ✅ Stable       | Current stable release with full support           |
| **2025-07**  | 🔒 Maintenance  | Previous stable release with security patches only |
| **2026-01**  | 🚧 Preview      | Release candidate for next API version             |
| **unstable** | ⚠️ Experimental | Unstable development version - APIs may change     |

### Import Patterns

You can import types using specific versions or aliases:

```typescript
// Specific versions
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-10';
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-07';

// Version aliases
import { Product } from '@juanpprieto/shopify-api-types/sfapi/current';
import { Shop } from '@juanpprieto/shopify-api-types/admin/previous';
import { Customer } from '@juanpprieto/shopify-api-types/caapi/next';
```

## 📊 What's New in 2025-10

### Storefront API Changes

- **20 total changes** with **0 breaking changes**
- ✨ **New features**: Cart cloning, delivery address management, gift card
  support
- 🔧 **Enhanced cart functionality**: Parent-child line item relationships,
  better error handling

### Admin API Changes

- **158 total changes** with **3 breaking changes**
- ✨ **New features**: Theme duplication, fulfillment order rerouting, enhanced
  metaobjects
- 🔧 **Function improvements**: Better function identifier handling across
  customizations
- ⚠️ **Breaking changes**: Collection reorder error types, cart transform
  function IDs

### Customer Account API Changes

- **4 total changes** with **0 breaking changes**
- 🔧 **Minor improvements**: Internal optimizations and bug fixes

[View detailed changelog →](./CHANGELOG.md)

## 🛠️ Advanced Usage

### Schema Validation

JSON schemas are available for runtime validation:

```typescript
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2025-10';
import storefrontSchema from '@juanpprieto/shopify-api-types/schemas/sfapi/2025-10';

// Use with your preferred validation library
```

### Version Comparisons

Access detailed API change information:

```typescript
import currentChanges from '@juanpprieto/shopify-api-types/comparisons/current';
import nextChanges from '@juanpprieto/shopify-api-types/comparisons/next';

console.log(currentChanges.admin.summary.totalChanges); // 158
console.log(nextChanges.storefront.summary.breakingChanges); // 1
```

## 🔄 Migration Guide

### Upgrading from 2025-07 to 2025-10

Most changes are additive and non-breaking:

```typescript
// ✅ Safe - no breaking changes in Storefront API
import { Product, Cart } from '@juanpprieto/shopify-api-types/sfapi/2025-10';

// ⚠️ Check breaking changes in Admin API
import { CollectionReorderProductsPayload } from '@juanpprieto/shopify-api-types/admin/2025-10';
// Note: userErrors field type changed
```

### Preparing for 2026-01

```typescript
// Preview upcoming changes
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2026-01';
// Note: returnReason field changes in RequestedLineItemInput
```

## 📖 API Reference

### Export Structure

```
@juanpprieto/shopify-api-types/
├── sfapi/{version}          # Storefront API types
├── admin/{version}          # Admin API types
├── caapi/{version}          # Customer Account API types
├── schemas/                 # JSON schemas for validation
└── comparisons/             # API change information
```

### Version Aliases

| Alias      | Resolves To | Description             |
| ---------- | ----------- | ----------------------- |
| `current`  | `2025-10`   | Current stable version  |
| `previous` | `2025-07`   | Previous stable version |
| `next`     | `2026-01`   | Next preview version    |
| `unstable` | `unstable`  | Development version     |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md)
for details.

## 📄 License

MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Shopify GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Customer Account API](https://shopify.dev/docs/api/customer)
- [NPM Package](https://www.npmjs.com/package/@juanpprieto/shopify-api-types)

---

_Last updated: November 16, 2025 • Version: 2025.10.0_
