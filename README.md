# @juanpprieto/shopify-api-types

> TypeScript types and JSON schemas for Shopify's GraphQL APIs

## Installation

```bash
npm install @juanpprieto/shopify-api-types
```

## Usage

```typescript
// Import types from specific versions
import type { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-01';
import type { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-01';
import type { Order } from '@juanpprieto/shopify-api-types/admin/2024-10';

// Import schemas for validation
import { schema } from '@juanpprieto/shopify-api-types/sfapi/2025-01';
```

## Supported APIs

- Storefront API (sfapi)
- Customer Account API (caapi)
- Admin API (admin)

## Supported Versions

Last 4 quarterly releases:

- 2025-01
- 2024-10
- 2024-07
- 2024-04

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup.
