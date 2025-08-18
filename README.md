# @juanpprieto/shopify-api-types

TypeScript definitions for Shopify APIs, supporting multiple API versions with
full type safety and schema validation.

## 🚀 Quick Start

```bash
npm install @juanpprieto/shopify-api-types
```

```typescript
// Use the current stable version (2025-07)
import { Product, Shop } from '@juanpprieto/shopify-api-types/admin';
import { Cart } from '@juanpprieto/shopify-api-types/sfapi';
import { Customer } from '@juanpprieto/shopify-api-types/caapi';

// Or specify a version explicitly
import { Product } from '@juanpprieto/shopify-api-types/admin2025-07';
import { Cart } from '@juanpprieto/shopify-api-types/sfapi2025-04';
```

## 📊 API Coverage

| API                  | Description                                       | Types          | Examples                                                                                         |
| -------------------- | ------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| **Storefront**       | Product catalog, cart, checkout, and others       | **261 types**  | `import { Product, Cart, Checkout } from '@juanpprieto/shopify-api-types/sfapi2025-07';`         |
| **Admin**            | Store management, webhooks, analytics, and others | **1758 types** | `import { Shop, Webhook, InventoryLevel } from '@juanpprieto/shopify-api-types/admin2025-07';`   |
| **Customer Account** | Customer profiles, orders, addresses, and others  | **296 types**  | `import { Customer, Order, MailingAddress } from '@juanpprieto/shopify-api-types/caapi2025-07';` |

## 🏷️ Version Management

### Current Versions

| Version      | Status          | Description                                        |
| ------------ | --------------- | -------------------------------------------------- |
| **2025-07**  | ✅ Current      | Current stable release with full support           |
| **2025-04**  | 🔒 Previous     | Previous stable release with security patches only |
| **2025-10**  | 🧪 RC           | Release candidate for next API version             |
| **unstable** | ⚠️ Experimental | Unstable development version - APIs may change     |

### Import Patterns

```typescript
// Recommended: Use semantic versions
import { Product } from '@juanpprieto/shopify-api-types/admin/current';
import { Product } from '@juanpprieto/shopify-api-types/admin/previous';
import { Product } from '@juanpprieto/shopify-api-types/admin/next';

// Explicit versions
import { Product } from '@juanpprieto/shopify-api-types/admin2025-07';
import { Product } from '@juanpprieto/shopify-api-types/admin2025-04';
import { Product } from '@juanpprieto/shopify-api-types/admin2025-10';

// All APIs follow the same pattern
import { Cart } from '@juanpprieto/shopify-api-types/sfapi/current';
import { Customer } from '@juanpprieto/shopify-api-types/caapi/current';
```

## 📈 What's New in 2025-07

### Storefront API Updates

- **37 total changes** with **0 breaking changes**
- ✅ New `CartRemovePersonalDataPayload` type
- ✅ Enhanced cart error handling with 7 new error codes
- ✅ Improved discount warning codes (10 new codes)
- ✅ Extended unit price measurement support

### Admin API Updates

- **334 total changes** including **172 new additions**
- ✅ **New Inventory Management**: Complete inventory transfer and shipment APIs
- ✅ **Enhanced Returns Processing**: New return processing workflows
- ✅ **Order Management**: New customer management mutations
- ✅ **Shop Pay Integration**: Payment request receipt handling
- ⚠️ **13 breaking changes** - see migration guide below

### Customer Account API Updates

- **38 total changes** with **0 breaking changes**
- ✅ New subscription discount types
- ✅ Enhanced exchange line item support
- ✅ Extended measurement unit support

### Breaking Changes in Admin API

> ⚠️ **Important**: Review these breaking changes before upgrading

1. **FeeSale.fee** - Now optional (`Fee` instead of `Fee!`)
2. **MetafieldInput** - Removed `description` field
3. **SubscriptionDeliveryMethod** - Address type changes
4. **Removed Types**: `DraftOrderCreateMerchantCheckoutPayload`,
   `MetafieldAccessGrant`, `SubscriptionMailingAddress`

## 🔧 Schema Validation

Access GraphQL schemas for validation:

```typescript
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin2025-07';
import storefrontSchema from '@juanpprieto/shopify-api-types/schemas/sfapi2025-07';
import customerSchema from '@juanpprieto/shopify-api-types/schemas/caapi2025-07';
```

## 📊 Migration Tracking

Compare API versions to track changes:

```typescript
// Compare current to previous
import currentComparison from '@juanpprieto/shopify-api-types/comparisons/current';

// Compare current to next release candidate
import nextComparison from '@juanpprieto/shopify-api-types/comparisons/next';
```

## 🛠️ Advanced Usage

### Type-Safe GraphQL Queries

```typescript
import { Shop, Product } from '@juanpprieto/shopify-api-types/admin';

const shop: Shop = {
  id: 'gid://shopify/Shop/1',
  name: 'My Shop',
  // TypeScript ensures all required fields are present
};

// Use with GraphQL code generators
const PRODUCT_QUERY = `
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
    }
  }
` as const;
```

### Version-Specific Features

```typescript
// Use features from specific API versions
import { InventoryTransfer } from '@juanpprieto/shopify-api-types/admin2025-07';
// InventoryTransfer is new in 2025-07

import { CartClonePayload } from '@juanpprieto/shopify-api-types/sfapi2025-10';
// CartClonePayload is in the 2025-10 release candidate
```

## 📚 Resources

- [Shopify API Documentation](https://shopify.dev/docs)
- [GraphQL API Reference](https://shopify.dev/docs/api)
- [API Versioning Guide](https://shopify.dev/docs/api/usage/versioning)

## 📝 License

MIT License - feel free to use in your projects!

---

**Generated on**: August 18, 2025  
**Package Version**: 2025.7.0  
**Total Types**: 2,315 across all APIs
