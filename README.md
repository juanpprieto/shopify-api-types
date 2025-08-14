# Shopify API Types

TypeScript definitions for all Shopify APIs, generated from the latest GraphQL
schemas.

## Supported API Versions

### 📦 2025.7.0 (Current)

| **Shopify API Version** | **Status**  |
| :---------------------- | :---------- |
| 2025-07                 | ✅ Latest   |
| 2025-04                 | ✓ Supported |
| 2025-01                 | ✓ Supported |
| 2024-10                 | ✓ Supported |

### 📦 2025.4.1 (Previous)

| **Shopify API Version** | **Status**  |
| :---------------------- | :---------- |
| 2025-04                 | ✅ Latest   |
| 2025-01                 | ✓ Supported |
| 2024-10                 | ✓ Supported |
| 2024-07                 | ✓ Supported |

### 📦 2025.1.0 (Older)

| **Shopify API Version** | **Status**  |
| :---------------------- | :---------- |
| 2025-01                 | ✅ Latest   |
| 2024-10                 | ✓ Supported |
| 2024-07                 | ✓ Supported |
| 2024-04                 | ✓ Supported |

### 📦 2024.10.2 (Oldest)

| **Shopify API Version** | **Status**  |
| :---------------------- | :---------- |
| 2024-10                 | ✅ Latest   |
| 2024-07                 | ✓ Supported |
| 2024-04                 | ✓ Supported |
| 2024-01                 | ✓ Supported |

---

_Showing last 4 releases (1 year history). Install specific version:
`npm install @juanpprieto/shopify-api-types@<version>`_

## Installation

```bash
npm install @juanpprieto/shopify-api-types
```

## Usage Examples

### Storefront API

Product catalog, cart, checkout, and others (~200 types available)

```typescript
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/storefront/v2025_07';
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/storefront/v2025_04';
```

### Customer Account API

Customer profiles, orders, addresses, and others (~50 types available)

```typescript
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/customer-account/v2025_07';
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/customer-account/v2025_04';
```

### Admin API

Store management, webhooks, analytics, and others (~500 types available)

```typescript
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/v2025_07';
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/v2025_04';
```

## Schema Access

Access the raw GraphQL schemas:

```typescript
import { schema } from '@juanpprieto/shopify-api-types/storefront/v2025_07';
// schema contains the full GraphQL introspection result
```

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

#### 🚀 **Major Releases** (API Updates)

Released quarterly when Shopify publishes new API versions:

```bash
# Create changeset for new API version
npm run changeset
# Select "major" and describe API changes

# Release new API version
npm run release
# 2025.7.0 → 2025.10.0
```

#### 🐛 **Patch Releases** (Bug Fixes)

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

## License

MIT

---

_Last updated: 8/13/2025_ _Package version: 2025.7.0_
