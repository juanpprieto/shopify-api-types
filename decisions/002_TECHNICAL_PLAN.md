# Shopify API Types - Technical Implementation Plan

## Project Overview

Create an npm package `@juanpprieto/shopify-api-types` that provides TypeScript
types and JSON schemas for Shopify's GraphQL APIs (Storefront, Customer Account,
and Admin) for the last 4 API versions.

## Phase 1: Project Setup and Infrastructure

### Milestone 1.1: Repository Structure

- Initialize npm package with single `src/` folder structure
- Set up TypeScript configuration based on Shopify's patterns
- Configure ESLint, Prettier, and development tools

**Structure:**

```
shopify-api-types/
├── src/
│   ├── storefront/
│   ├── customer-account/
│   └── admin/
├── dist/
├── scripts/
├── .github/
│   └── workflows/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── codegen.ts
```

### Milestone 1.2: Dependencies Setup

**Core Dependencies:**

- `typescript`: ^5.x
- `@graphql-codegen/cli`: ^5.x
- `@graphql-codegen/typescript`: ^4.x
- `@graphql-codegen/introspection`: ^4.x
- `@graphql-codegen/typescript-operations`: ^4.x

**Dev Dependencies:**

- `vite`: For build system
- `vitest`: For testing
- `eslint` & `prettier`: Code quality
- `tsx`: For running TypeScript scripts
- `changesets`: Version management

### Milestone 1.3: TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Phase 2: Schema Fetching and Version Management

### Milestone 2.1: API Version Calculator

Create utility to calculate the last 4 API versions based on Shopify's release
cycle (01, 04, 07, 10).

```typescript
// scripts/version-utils.ts
export function getLastFourVersions(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Calculate current API version
  const quarters = [1, 4, 7, 10];
  const currentQuarter =
    quarters.reverse().find((q) => currentMonth >= q) || 10;

  // Generate last 4 versions
  const versions: string[] = [];
  let year =
    currentQuarter === 10 && currentMonth < 10 ? currentYear - 1 : currentYear;
  let quarter = currentQuarter;

  for (let i = 0; i < 4; i++) {
    versions.push(`${year}-${quarter.toString().padStart(2, '0')}`);

    // Move to previous quarter
    const currentIndex = quarters.indexOf(quarter);
    if (currentIndex === 0) {
      quarter = 10;
      year--;
    } else {
      quarter = quarters[currentIndex - 1];
    }
  }

  return versions;
}
```

### Milestone 2.2: Schema Fetcher

Implement schema fetching for all three APIs with proper authentication.

```typescript
// scripts/fetch-schemas.ts
interface SchemaConfig {
  storefront: {
    url: (version: string) => string;
    headers: HeadersInit;
  };
  customerAccount: {
    url: string;
    headers: HeadersInit;
  };
  admin: {
    url: (version: string) => string;
    headers: HeadersInit;
  };
}

export async function fetchAllSchemas(versions: string[]) {
  for (const version of versions) {
    await fetchStorefrontSchema(version);
    await fetchCustomerAccountSchema(version);
    await fetchAdminSchema(version);
  }
}
```

### Milestone 2.3: Schema Storage

Store fetched schemas in a structured format:

```
src/
├── schemas/
│   ├── storefront/
│   │   ├── 2025-01.json
│   │   ├── 2024-10.json
│   │   └── ...
│   ├── customer-account/
│   │   └── ...
│   └── admin/
│       └── ...
```

## Phase 3: Code Generation Pipeline

### Milestone 3.1: GraphQL Codegen Configuration

Create a flexible codegen configuration that generates types for all API
versions.

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';
import { getLastFourVersions } from './scripts/version-utils';

const versions = getLastFourVersions();

const config: CodegenConfig = {
  overwrite: true,
  generates: {},
};

// Generate config for each API and version
versions.forEach((version) => {
  // Storefront API
  config.generates[`./src/storefront/${version}/types.ts`] = {
    schema: `./src/schemas/storefront/${version}.json`,
    plugins: ['typescript'],
    config: {
      scalars: {
        DateTime: 'string',
        Decimal: 'string',
        HTML: 'string',
        URL: 'string',
        JSON: 'unknown',
        Color: 'string',
        UnsignedInt64: 'string',
      },
    },
  };

  // Similar for Customer Account and Admin APIs
});

export default config;
```

### Milestone 3.2: Type Generation Scripts

```json
// package.json scripts
{
  "scripts": {
    "fetch-schemas": "tsx scripts/fetch-schemas.ts",
    "generate-types": "graphql-codegen --config codegen.ts",
    "build:types": "npm run fetch-schemas && npm run generate-types",
    "format": "prettier --write \"src/**/*.{ts,json}\""
  }
}
```

### Milestone 3.3: Index Files Generation

Generate index files for easy imports:

```typescript
// src/storefront/2025-01/index.ts
export * from './types';
export { default as schema } from '../../schemas/storefront/2025-01.json';
```

## Phase 4: Build System and Export Configuration

### Milestone 4.1: Package.json Exports

Configure multiple export paths for different APIs and versions:

```json
{
  "name": "@juanpprieto/shopify-api-types",
  "version": "0.0.0",
  "exports": {
    "./sfapi/2025-01": {
      "types": "./dist/storefront/2025-01/index.d.ts",
      "import": "./dist/storefront/2025-01/index.js",
      "require": "./dist/storefront/2025-01/index.cjs"
    },
    "./caapi/2025-01": {
      "types": "./dist/customer-account/2025-01/index.d.ts",
      "import": "./dist/customer-account/2025-01/index.js",
      "require": "./dist/customer-account/2025-01/index.cjs"
    },
    "./admin/2025-01": {
      "types": "./dist/admin/2025-01/index.d.ts",
      "import": "./dist/admin/2025-01/index.js",
      "require": "./dist/admin/2025-01/index.cjs"
    }
  },
  "typesVersions": {
    "*": {
      "sfapi/*": ["./dist/storefront/*/index.d.ts"],
      "caapi/*": ["./dist/customer-account/*/index.d.ts"],
      "admin/*": ["./dist/admin/*/index.d.ts"]
    }
  }
}
```

### Milestone 4.2: Vite Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { getLastFourVersions } from './scripts/version-utils';

const versions = getLastFourVersions();
const entries: Record<string, string> = {};

// Generate entry points for all APIs and versions
['storefront', 'customer-account', 'admin'].forEach((api) => {
  versions.forEach((version) => {
    entries[`${api}/${version}/index`] = resolve(
      __dirname,
      `src/${api}/${version}/index.ts`,
    );
  });
});

export default defineConfig({
  build: {
    lib: {
      entry: entries,
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
```

### Milestone 4.3: Build Scripts

```json
{
  "scripts": {
    "build": "npm run build:types && npm run build:js && npm run build:declarations",
    "build:js": "vite build",
    "build:declarations": "tsc --emitDeclarationOnly --project tsconfig.build.json",
    "clean": "rm -rf dist",
    "prebuild": "npm run clean"
  }
}
```

## Phase 5: Testing and Validation

### Milestone 5.1: Type Testing

Create tests to validate generated types:

```typescript
// tests/types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type { Product } from '../src/storefront/2025-01';
import type { Customer } from '../src/customer-account/2025-01';

describe('Type definitions', () => {
  it('should export Storefront API types', () => {
    expectTypeOf<Product>().toBeObject();
    expectTypeOf<Product>().toHaveProperty('id');
  });

  it('should export Customer Account API types', () => {
    expectTypeOf<Customer>().toBeObject();
    expectTypeOf<Customer>().toHaveProperty('email');
  });
});
```

### Milestone 5.2: Schema Validation

Validate that schemas are properly formatted and accessible:

```typescript
// tests/schemas.test.ts
import { describe, it, expect } from 'vitest';
import storefrontSchema from '../src/schemas/storefront/2025-01.json';

describe('Schema exports', () => {
  it('should export valid GraphQL schemas', () => {
    expect(storefrontSchema).toHaveProperty('__schema');
    expect(storefrontSchema.__schema).toHaveProperty('types');
  });
});
```

### Milestone 5.3: Import Testing

Test that package exports work correctly:

```typescript
// tests/imports.test.ts
describe('Package imports', () => {
  it('should import from sfapi paths', async () => {
    const module = await import('@juanpprieto/shopify-api-types/sfapi/2025-01');
    expect(module).toHaveProperty('Product');
  });
});
```

## Phase 6: CI/CD and NPM Publishing

### Milestone 6.1: GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  publish:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Milestone 6.2: Changesets Configuration

```json
// .changeset/config.json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### Milestone 6.3: Release Scripts

```json
{
  "scripts": {
    "release": "changeset publish",
    "version": "changeset version && npm run format",
    "prepublishOnly": "npm run build"
  }
}
```

## Development Workflow

1. **Initial Setup**: Clone repo, install dependencies
2. **Fetch Schemas**: Run `npm run fetch-schemas` to get latest schemas
3. **Generate Types**: Run `npm run generate-types` to create TypeScript
   definitions
4. **Build**: Run `npm run build` to compile everything
5. **Test**: Run `npm run test` to validate types and exports
6. **Release**: Create changeset, bump version, and publish

## Key Features

- TypeScript types for Storefront, Customer Account, and Admin APIs
- Support for last 4 API versions (quarterly releases)
- JSON schema exports for runtime validation
- Automatic type generation from GraphQL schemas
- Multiple export paths for clean imports
- CommonJS and ES module support
- Automated CI/CD with GitHub Actions
- Version management with Changesets

## Usage Examples

```typescript
// Import specific types
import type { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-01';
import type { Order } from '@juanpprieto/shopify-api-types/sfapi/2024-10';
import type { Customer } from '@juanpprieto/shopify-api-types/caapi/2025-01';

// Import schemas for validation
import { schema as StorefrontSchema } from '@juanpprieto/shopify-api-types/sfapi/2025-01';
import { schema as CustomerAccountSchema } from '@juanpprieto/shopify-api-types/caapi/2025-01';
```

## Maintenance

- Run schema fetch weekly to check for updates
- Update versions quarterly (January, April, July, October)
- Keep dependencies up to date
- Monitor Shopify API changelog for breaking changes
