# @juanpprieto/shopify-api-types

TypeScript types and JSON schemas for Shopify GraphQL APIs - Storefront, Customer Account, and Admin APIs.

## Features

- =æ Complete TypeScript types for all three Shopify GraphQL APIs
- = Support for the last 4 API versions (quarterly releases)
- =Ë JSON schema exports for runtime validation
- =€ Automatic type generation from official GraphQL schemas
- =Á Clean import paths for each API and version

## Installation

```bash
npm install @juanpprieto/shopify-api-types
```

## Usage

```typescript
// Import types from specific API versions
import type { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-01';
import type { Order } from '@juanpprieto/shopify-api-types/sfapi/2024-10';
import type { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-01';

// Import JSON schemas for validation
import { schema as StorefrontSchema } from '@juanpprieto/shopify-api-types/sfapi/2025-01';
```

## Supported APIs

- **Storefront API** (`sfapi`) - Public product, collection, and checkout types
- **Customer Account API** (`caapi`) - Customer authentication and account management
- **Admin API** (`admin`) - Store management and administration

## API Versions

Supports the last 4 quarterly releases following Shopify's release cycle (January, April, July, October).

## Development Status

=§ **Work in Progress** - This package is under active development.

## License

MIT