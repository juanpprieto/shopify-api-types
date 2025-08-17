# @juanpprieto/shopify-api-types

TypeScript types and JSON schemas for Shopify's GraphQL APIs.

## Installation

```bash
npm install @juanpprieto/shopify-api-types
```

## Usage

### Import Types

```typescript
import {
  Product,
  Cart,
  Checkout,
} from '@juanpprieto/shopify-api-types/sfapi2025-04';
import {
  Shop,
  Webhook,
  InventoryLevel,
} from '@juanpprieto/shopify-api-types/admin2025-04';
import {
  Customer,
  Order,
  MailingAddress,
} from '@juanpprieto/shopify-api-types/caapi2025-04';
```

### Version Support

- **Current**: 2025-07 (Stable)
- **Previous**: 2025-04 (Maintenance)
- **Release Candidate**: 2025-10 (Preview)
- **Unstable**: unstable (Experimental)

### Available APIs

- **Storefront API**: Product catalog, cart, checkout, and others (261+ types)
- **Admin API**: Store management, webhooks, analytics, and others (1758+ types)
- **Customer Account API**: Customer profiles, orders, addresses, and others
  (296+ types)

### Version-Specific Imports

All APIs support version-specific imports:

```typescript
// Import specific version
import { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-07';

// Import with version aliases
import { Shop } from '@juanpprieto/shopify-api-types/admin/current';
import { Customer } from '@juanpprieto/shopify-api-types/caapi/previous';
```

### GraphQL Schemas

Raw GraphQL schemas are also available:

```typescript
import storefrontSchema from '@juanpprieto/shopify-api-types/schemas/sfapi/2025-07';
import adminSchema from '@juanpprieto/shopify-api-types/schemas/admin/2025-07';
```

## License

MIT

---

Generated on 2025-08-17
