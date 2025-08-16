# Proposed README Format

## Key Changes:

1. Professional tone with minimal, intentional emoji use
2. Tables for change summaries
3. Correct version examples (using current/previous versions)
4. Consolidated export documentation (no duplication)
5. Title casing for API names

---

# Shopify API Types

TypeScript definitions for all Shopify APIs, generated from the latest GraphQL
schemas.

## Version Overview

| Version Type  | API Version | Status       | Description                                        |
| :------------ | :---------- | :----------- | :------------------------------------------------- |
| **Current**   | `2025-07`   | ✅ Stable    | Latest stable release with full support            |
| **Previous**  | `2025-04`   | Stable       | Previous stable release with security patches only |
| **Next (RC)** | `2025-10`   | Preview      | Release candidate for upcoming quarter             |
| **Unstable**  | `unstable`  | Experimental | Bleeding edge development version                  |

## What's New

### Latest Release: 2025-07

_Changes from 2025-04 to 2025-07_

| API              | Additions | Removals | Modifications | Breaking | Impact  |
| :--------------- | --------: | -------: | ------------: | -------: | :------ |
| Storefront       |         2 |        0 |            33 |        0 | 🟢 Low  |
| Admin            |       172 |        5 |            61 |       13 | 🔴 High |
| Customer Account |        12 |        0 |            14 |        0 | 🟢 Low  |

**Summary**: 409 total changes, 13 breaking changes across 3 APIs

**Key Changes**:

- **Admin**: Added bulk operations for inventory management, new webhook topics
  for fulfillment events
- **Admin** (Breaking): Removed deprecated `inventoryLevels` field from Location
  type, use `inventoryLevel` instead
- **Storefront**: Enhanced product variant selector with new option values
- **Customer Account**: New address validation API and order history filters

### Coming Next: 2025-10 (Preview)

_Upcoming changes from 2025-07 to 2025-10_

| API              | Additions | Removals | Modifications | Breaking | Impact |
| :--------------- | --------: | -------: | ------------: | -------: | :----- |
| Storefront       |         4 |        0 |             1 |        0 | 🟢 Low |
| Admin            |        14 |        0 |            34 |        0 | 🟢 Low |
| Customer Account |         0 |        0 |             0 |        0 | —      |

**Summary**: 92 total changes, no breaking changes

## Installation

```bash
npm install @juanpprieto/shopify-api-types
```

## Usage

### Storefront API

Product catalog, cart, checkout, and customer data (~261 types)

```typescript
// Latest version (2025-07)
import { Product, Cart, Checkout } from '@juanpprieto/shopify-api-types/sfapi';

// Specific versions
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-07';
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-04';
```

### Admin API

Store management, webhooks, analytics, and orders (~1758 types)

```typescript
// Latest version (2025-07)
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin';

// Specific versions
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-07';
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-04';
```

### Customer Account API

Customer profiles, orders, and addresses (~296 types)

```typescript
// Latest version (2025-07)
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi';

// Specific versions
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-07';
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-04';
```

## Available Exports

### TypeScript Types

| API              | Latest Import                          | Available Versions                 |
| :--------------- | :------------------------------------- | :--------------------------------- |
| Storefront       | `@juanpprieto/shopify-api-types/sfapi` | 2025-07, 2025-04, 2025-01, 2024-10 |
| Admin            | `@juanpprieto/shopify-api-types/admin` | 2025-07, 2025-04, 2025-01, 2024-10 |
| Customer Account | `@juanpprieto/shopify-api-types/caapi` | 2025-07, 2025-04, 2025-01, 2024-10 |

### GraphQL Schemas

Access raw GraphQL schema definitions:

```typescript
// Example imports
import storefrontSchema from '@juanpprieto/shopify-api-types/schemas/sfapi/2025-07';
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2025-07';
import customerSchema from '@juanpprieto/shopify-api-types/schemas/caapi/2025-07';
```

### Schema Comparisons

Access detailed change reports between API versions:

```typescript
import currentChanges from '@juanpprieto/shopify-api-types/comparisons/current';
import nextChanges from '@juanpprieto/shopify-api-types/comparisons/next';
```

| Comparison      | From    | To      | Import Path            |
| :-------------- | :------ | :------ | :--------------------- |
| Current Release | 2025-04 | 2025-07 | `/comparisons/current` |
| Next Release    | 2025-07 | 2025-10 | `/comparisons/next`    |

## API Documentation

- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Shopify Customer Account API](https://shopify.dev/docs/api/customer)
- [Shopify Admin API](https://shopify.dev/docs/api/admin-graphql)

## Release Process

[Keep existing release process section as-is]
