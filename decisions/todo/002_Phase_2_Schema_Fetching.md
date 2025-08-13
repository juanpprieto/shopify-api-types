# Phase 2: Schema Fetching and Version Management

## Overview
Implement the logic to fetch GraphQL schemas from Shopify's APIs and manage multiple API versions following Shopify's quarterly release cycle.

## Prerequisites
- Phase 1 completed (project structure and dependencies)
- Understanding of Shopify's API versioning: releases on months 01, 04, 07, 10
- Access tokens or API keys for Shopify APIs (will need to be configured)

## Critical Information
- Shopify releases new API versions quarterly: January (01), April (04), July (07), October (10)
- We need to support the LAST 4 versions at any given time
- Schema endpoints differ for each API type
- Reference implementation: https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen-react/codegen.ts

## Milestones

### Milestone 2.1: API Version Calculator ✅
**Status:** Not Started

**File to Create: `scripts/version-utils.ts`**

```typescript
export function getLastFourVersions(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Shopify API quarters
  const quarters = [10, 7, 4, 1]; // Reverse order for finding
  
  // Find current or most recent quarter
  const currentQuarter = quarters.find(q => currentMonth >= q) || 10;
  
  // If we're in a month before the quarter release, use previous year's Q4
  let year = currentQuarter === 10 && currentMonth < 10 ? currentYear - 1 : currentYear;
  let quarter = currentQuarter;
  
  // Generate last 4 versions
  const versions: string[] = [];
  const quartersOrdered = [1, 4, 7, 10];
  
  for (let i = 0; i < 4; i++) {
    versions.push(`${year}-${quarter.toString().padStart(2, '0')}`);
    
    // Move to previous quarter
    const currentIndex = quartersOrdered.indexOf(quarter);
    if (currentIndex === 0) {
      quarter = 10;
      year--;
    } else {
      quarter = quartersOrdered[currentIndex - 1];
    }
  }
  
  return versions;
}

// Helper to get the latest stable version
export function getLatestVersion(): string {
  return getLastFourVersions()[0];
}

// Test the function
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Last 4 API versions:', getLastFourVersions());
  console.log('Latest version:', getLatestVersion());
}
```

**Validation:**
- Run `tsx scripts/version-utils.ts` and verify output
- Should return 4 versions in YYYY-MM format
- Versions should be valid Shopify API versions

### Milestone 2.2: Schema Fetcher Implementation ✅
**Status:** Not Started

**File to Create: `scripts/fetch-schemas.ts`**

```typescript
import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

// Schema endpoints based on hydrogen-react codegen.ts
const SCHEMA_ENDPOINTS = {
  storefront: (version: string) => 
    `https://hydrogen-preview.myshopify.com/api/${version}/graphql.json`,
  customerAccount: 'https://app.myshopify.com/services/graphql/introspection/customer',
  admin: (version: string) => 
    `https://shopify.dev/admin-graphql-direct-proxy/${version}`
};

// You'll need to set these as environment variables
const REQUIRED_TOKENS = {
  STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  CUSTOMER_ACCOUNT_ACCESS_TOKEN: process.env.SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN,
  ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
};

interface FetchOptions {
  url: string;
  headers: HeadersInit;
  apiType: string;
  version: string;
}

async function fetchSchema(options: FetchOptions): Promise<void> {
  const { url, headers, apiType, version } = options;
  
  console.log(`Fetching ${apiType} schema for version ${version}...`);
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const schema = await response.json();
    
    // Ensure directory exists
    const schemaDir = path.join('src', 'schemas', apiType);
    await fs.mkdir(schemaDir, { recursive: true });
    
    // Save schema
    const schemaPath = path.join(schemaDir, `${version}.json`);
    await fs.writeFile(
      schemaPath,
      JSON.stringify(schema, null, 2),
      'utf-8'
    );
    
    console.log(`✓ Saved ${apiType} schema for ${version}`);
  } catch (error) {
    console.error(`✗ Failed to fetch ${apiType} schema for ${version}:`, error);
    throw error;
  }
}

async function fetchStorefrontSchema(version: string): Promise<void> {
  if (!REQUIRED_TOKENS.STOREFRONT_ACCESS_TOKEN) {
    console.warn('⚠️  SHOPIFY_STOREFRONT_ACCESS_TOKEN not set, skipping Storefront API');
    return;
  }
  
  await fetchSchema({
    url: SCHEMA_ENDPOINTS.storefront(version),
    headers: {
      'X-Shopify-Storefront-Access-Token': REQUIRED_TOKENS.STOREFRONT_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    apiType: 'storefront',
    version,
  });
}

async function fetchCustomerAccountSchema(version: string): Promise<void> {
  if (!REQUIRED_TOKENS.CUSTOMER_ACCOUNT_ACCESS_TOKEN) {
    console.warn('⚠️  SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN not set, skipping Customer Account API');
    return;
  }
  
  // Customer Account API doesn't use version in URL
  await fetchSchema({
    url: SCHEMA_ENDPOINTS.customerAccount,
    headers: {
      'Authorization': REQUIRED_TOKENS.CUSTOMER_ACCOUNT_ACCESS_TOKEN,
      'Content-Type': 'application/json',
      'User-Agent': '@juanpprieto/shopify-api-types',
    },
    apiType: 'customer-account',
    version,
  });
}

async function fetchAdminSchema(version: string): Promise<void> {
  if (!REQUIRED_TOKENS.ADMIN_ACCESS_TOKEN) {
    console.warn('⚠️  SHOPIFY_ADMIN_ACCESS_TOKEN not set, skipping Admin API');
    return;
  }
  
  await fetchSchema({
    url: SCHEMA_ENDPOINTS.admin(version),
    headers: {
      'X-Shopify-Access-Token': REQUIRED_TOKENS.ADMIN_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    apiType: 'admin',
    version,
  });
}

export async function fetchAllSchemas(): Promise<void> {
  const versions = getLastFourVersions();
  
  console.log('Fetching schemas for versions:', versions.join(', '));
  console.log('');
  
  for (const version of versions) {
    console.log(`\n=== Fetching schemas for ${version} ===`);
    
    await Promise.allSettled([
      fetchStorefrontSchema(version),
      fetchCustomerAccountSchema(version),
      fetchAdminSchema(version),
    ]);
  }
  
  console.log('\n✅ Schema fetching complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllSchemas().catch(console.error);
}
```

**Environment Setup Required:**
Create a `.env` file (add to .gitignore):
```env
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN=your_token_here  
SHOPIFY_ADMIN_ACCESS_TOKEN=your_token_here
```

**Validation:**
- Run `tsx scripts/fetch-schemas.ts`
- Check that schema files are created in `src/schemas/`
- Verify JSON files are valid GraphQL introspection schemas

### Milestone 2.3: Schema Storage Structure ✅
**Status:** Not Started

**Expected Directory Structure:**
```
src/
└── schemas/
    ├── storefront/
    │   ├── 2025-01.json
    │   ├── 2024-10.json
    │   ├── 2024-07.json
    │   └── 2024-04.json
    ├── customer-account/
    │   ├── 2025-01.json
    │   ├── 2024-10.json
    │   ├── 2024-07.json
    │   └── 2024-04.json
    └── admin/
        ├── 2025-01.json
        ├── 2024-10.json
        ├── 2024-07.json
        └── 2024-04.json
```

**Schema Validation Script to Create: `scripts/validate-schemas.ts`**
```typescript
import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

const APIS = ['storefront', 'customer-account', 'admin'];

async function validateSchemas(): Promise<boolean> {
  const versions = getLastFourVersions();
  let allValid = true;
  
  for (const api of APIS) {
    for (const version of versions) {
      const schemaPath = path.join('src', 'schemas', api, `${version}.json`);
      
      try {
        const exists = await fs.access(schemaPath).then(() => true).catch(() => false);
        
        if (!exists) {
          console.error(`✗ Missing schema: ${schemaPath}`);
          allValid = false;
          continue;
        }
        
        const content = await fs.readFile(schemaPath, 'utf-8');
        const schema = JSON.parse(content);
        
        // Basic GraphQL schema validation
        if (!schema.__schema || !schema.__schema.types) {
          console.error(`✗ Invalid schema structure: ${schemaPath}`);
          allValid = false;
        } else {
          console.log(`✓ Valid schema: ${api}/${version}.json`);
        }
      } catch (error) {
        console.error(`✗ Error validating ${schemaPath}:`, error);
        allValid = false;
      }
    }
  }
  
  return allValid;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateSchemas().then(valid => {
    process.exit(valid ? 0 : 1);
  });
}
```

### Milestone 2.4: NPM Scripts Integration ✅
**Status:** Not Started

**Add to package.json:**
```json
{
  "scripts": {
    "fetch-schemas": "tsx scripts/fetch-schemas.ts",
    "validate-schemas": "tsx scripts/validate-schemas.ts",
    "schemas:update": "npm run fetch-schemas && npm run validate-schemas"
  }
}
```

**Also install dotenv for environment variables:**
```bash
npm install --save-dev dotenv
```

**Update fetch-schemas.ts to load .env:**
```typescript
// Add at the top of fetch-schemas.ts
import 'dotenv/config';
```

**Validation:**
- `npm run fetch-schemas` executes successfully
- `npm run validate-schemas` reports all schemas as valid
- Schema files contain valid GraphQL introspection data

## Success Criteria
- [ ] Version calculator returns correct 4 versions
- [ ] Schema fetcher can download from all 3 API endpoints
- [ ] All 12 schema files created (4 versions × 3 APIs)
- [ ] Schema validation passes
- [ ] Environment variables properly configured
- [ ] NPM scripts working correctly

## Notes for Other Agents
- Schema fetching requires API tokens - these should be kept secure
- Customer Account API may not version the same way as others
- Admin API endpoint structure may differ from the example
- If tokens are not available, the fetcher will skip that API with a warning
- Schemas are large JSON files - ensure .gitignore includes them if needed
- The fetch process is idempotent - safe to run multiple times

## Troubleshooting
- If schema fetch fails with 401: Check API tokens
- If schema fetch fails with 404: Verify endpoint URLs
- If JSON parse fails: Check response is actually JSON
- Network issues: Add retry logic if needed

## Next Phase
Once all schemas are successfully fetched and validated, proceed to Phase 3: Code Generation Pipeline