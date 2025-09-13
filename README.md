# @juanpprieto/shopify-api-types

[![npm version](https://img.shields.io/npm/v/@juanpprieto/shopify-api-types.svg)](https://www.npmjs.com/package/@juanpprieto/shopify-api-types)
[![npm downloads](https://img.shields.io/npm/dm/@juanpprieto/shopify-api-types.svg)](https://www.npmjs.com/package/@juanpprieto/shopify-api-types)

Complete TypeScript type definitions for all Shopify APIs - Storefront, Admin,
and Customer Account APIs. Stay up-to-date with the latest Shopify API changes
with automatic type generation and version-specific exports.

## 📦 Installation

```bash
npm install @juanpprieto/shopify-api-types
```

## 🚀 Quick Start

### Storefront API (261 types)

Product catalog, cart, checkout, and others

```typescript
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/storefront/2025-07';

// Use current stable version
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/storefront/current';
```

### Admin API (1758 types)

Store management, webhooks, analytics, and others

```typescript
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/2025-07';

// Use current stable version
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin/current';
```

### Customer Account API (296 types)

Customer profiles, orders, addresses, and others

```typescript
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/customer-account/2025-07';

// Use current stable version
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/customer-account/current';
```

## 📋 API Versions

| Version     | Status               | Description                                        |
| ----------- | -------------------- | -------------------------------------------------- |
| 2025-04     | 🔒 Previous          | Previous stable release with security patches only |
| **2025-07** | ✅ **Current**       | Current stable release with full support           |
| 2025-10     | 🧪 Release Candidate | Release candidate for next API version             |
| unstable    | ⚠️ Experimental      | Unstable development version - APIs may change     |

## 📖 Version-Specific Imports

### Using Specific Versions

```typescript
// Specific API versions
import type { Product } from '@juanpprieto/shopify-api-types/storefront/2025-04';
import type { Product } from '@juanpprieto/shopify-api-types/storefront/2025-07';
import type { Product } from '@juanpprieto/shopify-api-types/storefront/2025-10';

// Admin API
import type { Shop } from '@juanpprieto/shopify-api-types/admin/2025-07';

// Customer Account API
import type { Customer } from '@juanpprieto/shopify-api-types/customer-account/2025-07';
```

### Using Semantic Versions

```typescript
// Always get the current stable version
import type { Product } from '@juanpprieto/shopify-api-types/storefront/current';

// Get the previous version
import type { Product } from '@juanpprieto/shopify-api-types/storefront/previous';

// Get the next release candidate
import type { Product } from '@juanpprieto/shopify-api-types/storefront/next';
```

## 💡 Production-Ready Examples

This package includes comprehensive demo implementations showing real-world
integration patterns:

### Storefront API with GraphQL Client

```typescript
import { createGraphQLClient } from '@shopify/graphql-client';
import type {
  QueryRoot,
  Mutation,
  CartInput,
} from '@juanpprieto/shopify-api-types/storefront/current';

// Use Pick<> for targeted type safety
type ProductsQueryResponse = Pick<QueryRoot, 'products'>;
type CartCreateMutationResponse = Pick<Mutation, 'cartCreate'>;

const client = createGraphQLClient({
  url: 'https://your-shop.myshopify.com/api/2025-07/graphql.json',
  headers: {
    'X-Shopify-Storefront-Access-Token': 'your-token-here',
  },
});

const response = await client.request<ProductsQueryResponse>(
  GET_PRODUCTS_QUERY,
  {
    variables: { first: 10 },
  },
);
```

### Admin API with Dedicated Client

```typescript
import { createAdminApiClient } from '@shopify/admin-api-client';
import type {
  QueryRoot,
  Mutation,
  ProductInput,
  CustomerInput,
} from '@juanpprieto/shopify-api-types/admin/current';

const adminClient = createAdminApiClient({
  storeDomain: 'your-store.myshopify.com',
  apiVersion: '2025-07',
  accessToken: 'your-admin-access-token',
});

// Strongly typed queries and mutations
type ProductsQueryResponse = Pick<QueryRoot, 'products'>;
type ProductCreateMutationResponse = Pick<Mutation, 'productCreate'>;
```

### Multi-API Version Support

```typescript
// Use different API versions in the same project
import type { Product as CurrentProduct } from '@juanpprieto/shopify-api-types/storefront/current';
import type { Product as LegacyProduct } from '@juanpprieto/shopify-api-types/storefront/2025-04';
import type { Product as BetaProduct } from '@juanpprieto/shopify-api-types/storefront/2025-10';

// Type-safe migration helpers
function migrateProduct(legacy: LegacyProduct): CurrentProduct {
  // Implementation with full type safety
}
```

> **Demo Application**: Check the `/demo` folder for a complete Vite + React
> TypeScript application demonstrating all integration patterns with both
> Storefront and Admin APIs.

## 🔄 API Changes & Migration

### Current Changes (2025-04 → 2025-07)

#### 🏪 Storefront API

- **37 total changes** (0 breaking)
- ✅ **2 additions**: New `CartRemovePersonalDataPayload` type and
  `cartRemovePersonalData` mutation
- 🔧 **33 modifications**: Enhanced cart error handling and unit price
  measurements
- 📦 **New Features**:
  - Personal data removal for carts
  - Improved discount validation
  - Extended unit measurement types (FLOZ, PT, QT, GAL, etc.)

#### 🛒 Customer Account API

- **38 total changes** (0 breaking)
- ✅ **12 additions**: New subscription discounts, exchange line items, and BMP
  image support
- 🔧 **14 modifications**: Enhanced unit measurements and company location
  features

#### ⚙️ Admin API

- **334 total changes** (13 breaking)
- ✅ **172 additions**: Major inventory management overhaul with transfers and
  shipments
- ⚠️ **13 breaking changes**: Subscription address types, metafield improvements
- 📦 **New Features**:
  - Complete inventory transfer system
  - Inventory shipment management
  - PayPal wallet payment details
  - Shop Pay payment requests
  - Enhanced return processing

### Next Changes (2025-07 → 2025-10)

#### 🏪 Storefront API

- **5 total changes** (0 breaking)
- New cart cloning and delivery address management

#### ⚙️ Admin API

- **87 total changes** (0 breaking)
- Enhanced discount contexts and order edit sessions
- New theme duplication capabilities

## 📊 GraphQL Schema Support

Access GraphQL schemas for runtime validation and tooling:

```typescript
// Import schemas for different versions
import storefrontSchema from '@juanpprieto/shopify-api-types/schemas/storefront/2025-07';
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2025-07';
import customerSchema from '@juanpprieto/shopify-api-types/schemas/customer-account/2025-07';
```

## 🔍 Change Comparisons

Access detailed API comparisons between versions:

```typescript
// Get current changes (2025-04 to 2025-07)
import currentChanges from '@juanpprieto/shopify-api-types/comparisons/current';

// Get next changes (2025-07 to 2025-10)
import nextChanges from '@juanpprieto/shopify-api-types/comparisons/next';

console.log(currentChanges.storefront.summary);
// { totalChanges: 37, breakingChanges: 0, additions: 2, ... }
```

## 🛠️ Advanced Usage

### Type-Safe GraphQL Client Wrapper

```typescript
import type {
  QueryRoot,
  Mutation,
} from '@juanpprieto/shopify-api-types/storefront/current';
import { createGraphQLClient } from '@shopify/graphql-client';

class TypeSafeStorefrontClient {
  private client: ReturnType<typeof createGraphQLClient>;

  constructor(config: { url: string; headers: Record<string, string> }) {
    this.client = createGraphQLClient(config);
  }

  async query<T extends Pick<QueryRoot, K>, K extends keyof QueryRoot>(
    query: string,
    variables?: any,
  ): Promise<{ data?: T }> {
    return this.client.request<T>(query, { variables });
  }

  async mutate<T extends Pick<Mutation, K>, K extends keyof Mutation>(
    mutation: string,
    variables?: any,
  ): Promise<{ data?: T }> {
    return this.client.request<T>(mutation, { variables });
  }
}

// Usage with full type safety
const client = new TypeSafeStorefrontClient({
  url: 'https://shop.myshopify.com/api/2025-07/graphql.json',
  headers: { 'X-Shopify-Storefront-Access-Token': 'token' },
});

type ProductsResponse = Pick<QueryRoot, 'products'>;
const result = await client.query<ProductsResponse>(GET_PRODUCTS_QUERY);
```

## 📚 Examples & Guides

### Working with Products

```typescript
import type {
  Product,
  ProductVariant,
} from '@juanpprieto/shopify-api-types/storefront/current';

function processProduct(product: Product) {
  const variant: ProductVariant | undefined = product.variants.edges[0]?.node;

  if (variant?.priceV2) {
    console.log(
      `Price: ${variant.priceV2.amount} ${variant.priceV2.currencyCode}`,
    );
  }
}
```

### Admin API Mutations

```typescript
import type {
  ProductInput,
  Mutation,
} from '@juanpprieto/shopify-api-types/admin/current';

type ProductCreateMutationResponse = Pick<Mutation, 'productCreate'>;

async function createProduct(
  input: ProductInput,
): Promise<ProductCreateMutationResponse> {
  // Your GraphQL client implementation
}
```

### Type-Safe GraphQL Operations

```typescript
import type {
  QueryRoot,
  Mutation,
} from '@juanpprieto/shopify-api-types/storefront/current';

// Instead of defining custom interfaces, use Pick<> for precision
type ProductQuery = Pick<QueryRoot, 'products' | 'shop'>;
type CartMutation = Pick<Mutation, 'cartCreate' | 'cartLinesAdd'>;

// This ensures your types match Shopify's schema exactly
const response = await client.request<ProductQuery>(query, variables);
```

## 🤝 Contributing

We welcome contributions! This package is automatically generated from Shopify's
official GraphQL schemas.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Packages

- [`@shopify/admin-api-client`](https://www.npmjs.com/package/@shopify/admin-api-client) -
  Official Shopify Admin API client
- [`@shopify/graphql-client`](https://www.npmjs.com/package/@shopify/graphql-client) -
  Universal GraphQL client for Storefront API

## 🎯 Best Practices

### ✅ Recommended Patterns

```typescript
// ✅ Use Pick<> for targeted operations
type ProductsQuery = Pick<QueryRoot, 'products'>;

// ✅ Import specific versions when needed
import type { Product } from '@juanpprieto/shopify-api-types/storefront/2025-07';

// ✅ Use semantic versions for flexibility
import type { Product } from '@juanpprieto/shopify-api-types/storefront/current';
```

### ❌ Anti-Patterns

```typescript
// ❌ Don't create custom interfaces that duplicate Shopify types
interface CustomProduct {
  id: string;
  title: string;
  // This can become out of sync with Shopify's schema
}

// ❌ Don't use 'any' - leverage the type system
const response: any = await client.request(query); // Loses type safety
```

---

**Generated at:** 2025-09-06T21:16:54.289Z **Package Version:** 2025.7.0
