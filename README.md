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
| Storefront       |         2 |        0 |            35 |        0 | 🟢 Low  |
| Admin            |       172 |        5 |            57 |       13 | 🔴 High |
| Customer Account |        12 |        0 |            26 |        0 | 🟢 Low  |

**Summary**: 409 total changes, 13 breaking changes across 3 APIs

**Key Changes**:

- **Admin**: Major expansion of inventory management with comprehensive transfer
  and shipment operations
- **Admin** (Breaking): Removed deprecated merchant checkout features and
  simplified metafield grant system
- **Storefront**: Enhanced cart operations with personal data removal and
  improved error/warning handling
- **Customer Account**: Added subscription discount tracking and exchange order
  support

### Notable Changes by API

#### Storefront API

| Change Type | Field/Type/Mutation                     | Description                                                                   | Breaking |
| :---------- | :-------------------------------------- | :---------------------------------------------------------------------------- | :------- |
| Added       | `cartRemovePersonalData` mutation       | Remove personal data from abandoned carts                                     | No       |
| Modified    | `CartErrorCode` enum                    | Added 7 new error codes for cart validation and payment handling              | No       |
| Modified    | `UnitPriceMeasurementMeasuredUnit` enum | Added Imperial measurement units (FLOZ, PT, QT, GAL, LB, OZ, IN, FT, YD, FT2) | No       |

#### Admin API

| Change Type | Field/Type/Mutation                         | Description                                                                | Breaking |
| :---------- | :------------------------------------------ | :------------------------------------------------------------------------- | :------- |
| Added       | `inventoryTransferCreate` mutation          | Create inventory transfers between locations                               | No       |
| Added       | `inventoryShipmentCreate` mutation          | Create shipments for inventory tracking                                    | No       |
| Added       | `returnProcess` mutation                    | Process returns with comprehensive exchange and refund handling            | No       |
| Removed     | `draftOrderCreateMerchantCheckout` mutation | Deprecated merchant checkout functionality removed                         | Yes      |
| Modified    | `SubscriptionDeliveryAddress` type          | Now uses standard `MailingAddress` instead of `SubscriptionMailingAddress` | Yes      |

#### Customer Account API

| Change Type | Field/Type/Mutation                   | Description                                              | Breaking |
| :---------- | :------------------------------------ | :------------------------------------------------------- | :------- |
| Added       | `SubscriptionDiscountAllocation` type | Track discount allocations on subscriptions              | No       |
| Added       | `ExchangeLineItem` type               | Support for order exchanges and returns                  | No       |
| Modified    | `UnitPriceMeasurementUnit` enum       | Added Imperial measurement units matching Storefront API | No       |

### Coming Next: 2025-10 (Preview)

_Upcoming changes from 2025-07 to 2025-10_

| API              | Additions | Removals | Modifications | Breaking | Impact    |
| :--------------- | --------: | -------: | ------------: | -------: | :-------- |
| Storefront       |         4 |        0 |             1 |        0 | 🟢 Low    |
| Admin            |        14 |        0 |            73 |        0 | 🟡 Medium |
| Customer Account |         0 |        0 |             0 |        0 | —         |

**Summary**: 92 total changes, 0 breaking changes across 2 APIs

## Installation

```bash
npm install @juanpprieto/shopify-api-types
```

## Usage

### Storefront API

Product catalog, cart, checkout, and others (~261 types)

```typescript
// Latest stable version (currently 2025-07)
import { Product, Cart, Checkout } from '@juanpprieto/shopify-api-types/sfapi';

// Specific stable versions
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-07'; // Current
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-04'; // Previous

// Release candidate
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-10'; // Release candidate

// Unstable/experimental
import { Product } from '@juanpprieto/shopify-api-types/sfapi/unstable'; // Bleeding edge

// All supported versions
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-04';
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-07';
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-10';
import { Product } from '@juanpprieto/shopify-api-types/sfapi/unstable';
```

### Admin API

Store management, webhooks, analytics, and others (~1758 types)

```typescript
// Latest stable version (currently 2025-07)
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin';

// Specific stable versions
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-07'; // Current
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-04'; // Previous

// Release candidate
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-10'; // Release candidate

// Unstable/experimental
import { Shop } from '@juanpprieto/shopify-api-types/admin/unstable'; // Bleeding edge

// All supported versions
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-04';
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-07';
import { Shop } from '@juanpprieto/shopify-api-types/admin/2025-10';
import { Shop } from '@juanpprieto/shopify-api-types/admin/unstable';
```

### Customer Account API

Customer profiles, orders, addresses, and others (~296 types)

```typescript
// Latest stable version (currently 2025-07)
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi';

// Specific stable versions
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-07'; // Current
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-04'; // Previous

// Release candidate
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-10'; // Release candidate

// Unstable/experimental
import { Customer } from '@juanpprieto/shopify-api-types/caapi/unstable'; // Bleeding edge

// All supported versions
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-04';
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-07';
import { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-10';
import { Customer } from '@juanpprieto/shopify-api-types/caapi/unstable';
```

## Available Exports

### TypeScript Types

| API              | Latest Import                          | Available Versions                  |
| :--------------- | :------------------------------------- | :---------------------------------- |
| Storefront       | `@juanpprieto/shopify-api-types/sfapi` | 2025-04, 2025-07, 2025-10, unstable |
| Admin            | `@juanpprieto/shopify-api-types/admin` | 2025-04, 2025-07, 2025-10, unstable |
| Customer Account | `@juanpprieto/shopify-api-types/caapi` | 2025-04, 2025-07, 2025-10, unstable |

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

This package uses **Calendar Versioning (CalVer)** aligned with Shopify's
quarterly API releases.

### Version Format: `YYYY.M.PATCH`

- **YYYY**: Full year (2025)
- **M**: Month without zero padding (7, not 07)
- **PATCH**: Incremental patches (0, 1, 2...)

### Release Types

#### Major Releases (API Updates)

Released quarterly when Shopify publishes new API versions:

```bash
# Create changeset for new API version
npm run changeset

# Select "major" and describe API changes

# Release new API version
npm run release

# 2025.7.0 → 2025.10.0
```

#### Patch Releases (Bug Fixes)

Released as needed for bug fixes and improvements:

```bash
# Create changeset for bug fix
npm run changeset

# Select "patch" and describe the fix

# Release patch
npm run release

# 2025.7.0 → 2025.7.1
```

### Development Workflow

#### 1. **Making Changes**

```bash
# Create a new changeset
npm run changeset

# Preview what would be released
npm run release:dry

# Run tests and validation
npm test && npm run build
```

#### 2. **Testing Releases**

```bash
# Validate version format
npm run version validate 2025.7.0

# Get version information
npm run version info 2025.7.0

# Count types in schemas
npm run count-types
```

#### 3. **Publishing**

```bash
# Full release process
npm run release

# Manual steps (if needed)
git push origin main --tags
npm publish
```

### Automated Releases

The release process is automated via GitHub Actions:

- **Quarterly**: Auto-detects new Shopify API versions
- **On-demand**: Triggered by changesets in pull requests
- **Validation**: All tests, builds, and type checks must pass

### Release Schedule

| Quarter | API Version | Expected Release |
| ------- | ----------- | ---------------- |
| Q1      | YYYY-01     | January 15       |
| Q2      | YYYY-04     | April 15         |
| Q3      | YYYY-07     | July 15          |
| Q4      | YYYY-10     | October 15       |

_Patch releases are published as needed between quarterly releases._

### Support Policy

- **4 versions supported** (1 year rolling window)
- **Latest version** receives all updates
- **Previous 3 versions** receive critical patches only
- **Older versions** are deprecated and removed

---

_Last updated: August 15, 2025_  
_Package version: 2025.7.0_
