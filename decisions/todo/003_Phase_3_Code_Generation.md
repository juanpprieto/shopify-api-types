# Phase 3: Code Generation Pipeline

## Overview
Set up GraphQL Code Generator to transform the fetched schemas into TypeScript type definitions for all APIs and versions.

## Prerequisites
- Phase 2 completed (schemas fetched and stored)
- GraphQL Code Generator dependencies installed
- Understanding of GraphQL Code Generator configuration

## Critical Information
- We generate types for 3 APIs × 4 versions = 12 type files
- Each API version gets its own types.ts file
- Custom scalar mappings must match Shopify's types
- Index files export both types and schemas

## Milestones

### Milestone 3.1: GraphQL Codegen Configuration ✅
**Status:** Not Started

**File to Create: `codegen.ts`**

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';
import { getLastFourVersions } from './scripts/version-utils.js';

const versions = getLastFourVersions();

// Shopify scalar type mappings (from hydrogen-react)
const scalarMappings = {
  DateTime: 'string',
  Decimal: 'string',
  HTML: 'string',
  URL: 'string',
  JSON: 'unknown',
  Color: 'string',
  UnsignedInt64: 'string',
  Money: 'string',
  ISO8601DateTime: 'string',
};

const config: CodegenConfig = {
  overwrite: true,
  generates: {},
};

// Generate configuration for each API and version
versions.forEach(version => {
  // Storefront API
  config.generates[`./src/storefront/${version}/types.ts`] = {
    schema: `./src/schemas/storefront/${version}.json`,
    plugins: ['typescript'],
    config: {
      skipTypename: true,
      enumsAsTypes: true,
      scalars: scalarMappings,
      avoidOptionals: false,
      maybeValue: 'T | null | undefined',
      namingConvention: {
        typeNames: 'pascal-case#pascalCase',
        enumValues: 'upper-case#upperCase',
      },
    },
  };
  
  // Customer Account API
  config.generates[`./src/customer-account/${version}/types.ts`] = {
    schema: `./src/schemas/customer-account/${version}.json`,
    plugins: ['typescript'],
    config: {
      skipTypename: true,
      enumsAsTypes: true,
      scalars: scalarMappings,
      avoidOptionals: false,
      maybeValue: 'T | null | undefined',
      namingConvention: {
        typeNames: 'pascal-case#pascalCase',
        enumValues: 'upper-case#upperCase',
      },
    },
  };
  
  // Admin API
  config.generates[`./src/admin/${version}/types.ts`] = {
    schema: `./src/schemas/admin/${version}.json`,
    plugins: ['typescript'],
    config: {
      skipTypename: true,
      enumsAsTypes: true,
      scalars: scalarMappings,
      avoidOptionals: false,
      maybeValue: 'T | null | undefined',
      namingConvention: {
        typeNames: 'pascal-case#pascalCase',
        enumValues: 'upper-case#upperCase',
      },
    },
  };
});

export default config;
```

**Validation:**
- File exports a valid CodegenConfig
- All schema paths are correctly referenced
- Scalar mappings match Shopify's conventions

### Milestone 3.2: Type Generation Scripts ✅
**Status:** Not Started

**Update package.json:**
```json
{
  "scripts": {
    "generate-types": "graphql-codegen --config codegen.ts",
    "build:types": "npm run fetch-schemas && npm run generate-types",
    "postgenerate-types": "npm run format && npm run generate-indexes"
  }
}
```

**Create a type generation test script: `scripts/test-codegen.ts`**
```typescript
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

async function testCodegen() {
  console.log('Testing code generation...\n');
  
  try {
    // Run codegen
    execSync('npm run generate-types', { stdio: 'inherit' });
    
    // Verify files were created
    const versions = getLastFourVersions();
    const apis = ['storefront', 'customer-account', 'admin'];
    let allGenerated = true;
    
    for (const api of apis) {
      for (const version of versions) {
        const typePath = path.join('src', api, version, 'types.ts');
        const exists = await fs.access(typePath).then(() => true).catch(() => false);
        
        if (exists) {
          console.log(`✓ Generated: ${api}/${version}/types.ts`);
        } else {
          console.error(`✗ Missing: ${api}/${version}/types.ts`);
          allGenerated = false;
        }
      }
    }
    
    return allGenerated;
  } catch (error) {
    console.error('Code generation failed:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCodegen().then(success => {
    process.exit(success ? 0 : 1);
  });
}
```

**Validation:**
- Run `npm run generate-types`
- All 12 type files should be generated
- No TypeScript errors in generated files

### Milestone 3.3: Index Files Generation ✅
**Status:** Not Started

**Create index generator script: `scripts/generate-indexes.ts`**

```typescript
import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

const INDEX_TEMPLATE = `// Auto-generated index file
export * from './types.js';

// Re-export schema as both default and named export
import schemaJson from '../../schemas/{API_TYPE}/{VERSION}.json';
export { schemaJson as schema };
export default schemaJson;
`;

const API_INDEX_TEMPLATE = `// Auto-generated API index file
{EXPORTS}
`;

async function generateIndexFiles() {
  const versions = getLastFourVersions();
  const apis = [
    { dir: 'storefront', schemaDir: 'storefront' },
    { dir: 'customer-account', schemaDir: 'customer-account' },
    { dir: 'admin', schemaDir: 'admin' },
  ];
  
  for (const api of apis) {
    const apiExports: string[] = [];
    
    for (const version of versions) {
      const versionDir = path.join('src', api.dir, version);
      
      // Ensure directory exists
      await fs.mkdir(versionDir, { recursive: true });
      
      // Generate index.ts for each version
      const indexContent = INDEX_TEMPLATE
        .replace('{API_TYPE}', api.schemaDir)
        .replace('{VERSION}', version);
      
      const indexPath = path.join(versionDir, 'index.ts');
      await fs.writeFile(indexPath, indexContent, 'utf-8');
      
      console.log(`✓ Generated index: ${api.dir}/${version}/index.ts`);
      
      // Add to API exports
      apiExports.push(`export * as v${version.replace('-', '_')} from './${version}/index.js';`);
    }
    
    // Generate main API index
    const apiIndexPath = path.join('src', api.dir, 'index.ts');
    const apiIndexContent = API_INDEX_TEMPLATE.replace('{EXPORTS}', apiExports.join('\n'));
    await fs.writeFile(apiIndexPath, apiIndexContent, 'utf-8');
    
    console.log(`✓ Generated API index: ${api.dir}/index.ts`);
  }
  
  // Generate root index
  const rootIndexContent = `// Auto-generated root index
export * as storefront from './storefront/index.js';
export * as customerAccount from './customer-account/index.js';
export * as admin from './admin/index.js';
`;
  
  await fs.writeFile(path.join('src', 'index.ts'), rootIndexContent, 'utf-8');
  console.log('✓ Generated root index: src/index.ts');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateIndexFiles().catch(console.error);
}
```

**Add script to package.json:**
```json
{
  "scripts": {
    "generate-indexes": "tsx scripts/generate-indexes.ts"
  }
}
```

**Expected file structure after generation:**
```
src/
├── index.ts
├── storefront/
│   ├── index.ts
│   ├── 2025-01/
│   │   ├── types.ts
│   │   └── index.ts
│   └── ...
├── customer-account/
│   ├── index.ts
│   └── ...
└── admin/
    ├── index.ts
    └── ...
```

### Milestone 3.4: Type Validation ✅
**Status:** Not Started

**Create type validation script: `scripts/validate-types.ts`**

```typescript
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function validateTypes() {
  console.log('Validating generated types...\n');
  
  try {
    // Create a temporary test file that imports all types
    const testContent = `
// Type validation test
import * as Storefront from '../src/storefront/index.js';
import * as CustomerAccount from '../src/customer-account/index.js';
import * as Admin from '../src/admin/index.js';

// Test specific type imports
import type { Product } from '../src/storefront/2025-01/index.js';
import type { Customer } from '../src/customer-account/2025-01/index.js';
import { schema as storefrontSchema } from '../src/storefront/2025-01/index.js';

// Basic type checks
const testProduct: Partial<Product> = {
  id: 'test-id',
};

const testCustomer: Partial<Customer> = {
  id: 'test-id',
};

// Schema check
if (!storefrontSchema.__schema) {
  throw new Error('Schema not properly exported');
}

console.log('✓ All type imports working correctly');
`;
    
    // Write test file
    await fs.mkdir('temp', { recursive: true });
    await fs.writeFile('temp/type-test.ts', testContent, 'utf-8');
    
    // Type check
    execSync('npx tsc --noEmit temp/type-test.ts --module esnext --moduleResolution bundler --resolveJsonModule --esModuleInterop', {
      stdio: 'inherit'
    });
    
    // Clean up
    await fs.rm('temp', { recursive: true, force: true });
    
    console.log('\n✅ Type validation passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Type validation failed:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateTypes().then(success => {
    process.exit(success ? 0 : 1);
  });
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "validate-types": "tsx scripts/validate-types.ts"
  }
}
```

## Success Criteria
- [ ] GraphQL Codegen configuration created
- [ ] All 12 type files generated successfully
- [ ] Index files created for all APIs and versions
- [ ] Types compile without errors
- [ ] Schema exports working correctly
- [ ] Type imports working as expected

## Common Issues & Solutions

### Issue: "Cannot find module" errors
**Solution:** Ensure all paths use `.js` extension in imports (for ESM)

### Issue: GraphQL Codegen fails
**Solution:** Check that all schema JSON files exist and are valid

### Issue: Type conflicts
**Solution:** Verify scalar mappings match Shopify's conventions

### Issue: Index files not found
**Solution:** Run `npm run generate-indexes` after type generation

## Notes for Other Agents
- Generated files should NOT be edited manually
- Always regenerate types after schema updates
- The `.js` extension in imports is required for ESM
- Type files can be large - this is normal
- Custom scalars must map to TypeScript primitives
- Generated types follow Shopify's naming conventions

## Next Phase
Once type generation is working and validated, proceed to Phase 4: Build System and Export Configuration