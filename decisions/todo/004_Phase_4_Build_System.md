# Phase 4: Build System and Export Configuration

## Overview
Configure Vite build system and package.json exports to support multiple entry points for different API versions with both ESM and CommonJS compatibility.

## Prerequisites
- Phase 3 completed (types generated and indexed)
- Understanding of Node.js package exports
- Familiarity with Vite configuration

## Critical Information
- Package must support BOTH ESM and CommonJS
- Each API version needs its own export path
- Build output goes to `dist/` directory
- Preserve directory structure in output

## Milestones

### Milestone 4.1: Package.json Exports Configuration ✅
**Status:** Not Started

**Update package.json with comprehensive exports:**

```json
{
  "name": "@juanpprieto/shopify-api-types",
  "version": "0.0.0",
  "description": "TypeScript types and schemas for Shopify GraphQL APIs",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./sfapi/*": {
      "types": "./dist/storefront/*/index.d.ts",
      "import": "./dist/storefront/*/index.js",
      "require": "./dist/storefront/*/index.cjs"
    },
    "./caapi/*": {
      "types": "./dist/customer-account/*/index.d.ts",
      "import": "./dist/customer-account/*/index.js",
      "require": "./dist/customer-account/*/index.cjs"
    },
    "./admin/*": {
      "types": "./dist/admin/*/index.d.ts",
      "import": "./dist/admin/*/index.js",
      "require": "./dist/admin/*/index.cjs"
    }
  },
  "typesVersions": {
    "*": {
      "sfapi/*": ["./dist/storefront/*/index.d.ts"],
      "caapi/*": ["./dist/customer-account/*/index.d.ts"],
      "admin/*": ["./dist/admin/*/index.d.ts"]
    }
  },
  "sideEffects": false,
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Generate dynamic exports script: `scripts/generate-exports.ts`**

```typescript
import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

async function generatePackageExports() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
  
  const versions = getLastFourVersions();
  
  // Build exports object
  const exports: Record<string, any> = {
    '.': {
      types: './dist/index.d.ts',
      import: './dist/index.js',
      require: './dist/index.cjs',
    },
  };
  
  // Add specific version exports
  versions.forEach(version => {
    // Storefront API
    exports[`./sfapi/${version}`] = {
      types: `./dist/storefront/${version}/index.d.ts`,
      import: `./dist/storefront/${version}/index.js`,
      require: `./dist/storefront/${version}/index.cjs`,
    };
    
    // Customer Account API
    exports[`./caapi/${version}`] = {
      types: `./dist/customer-account/${version}/index.d.ts`,
      import: `./dist/customer-account/${version}/index.js`,
      require: `./dist/customer-account/${version}/index.cjs`,
    };
    
    // Admin API
    exports[`./admin/${version}`] = {
      types: `./dist/admin/${version}/index.d.ts`,
      import: `./dist/admin/${version}/index.js`,
      require: `./dist/admin/${version}/index.cjs`,
    };
  });
  
  // Update package.json
  packageJson.exports = exports;
  
  await fs.writeFile(
    packagePath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf-8'
  );
  
  console.log('✓ Updated package.json exports for versions:', versions.join(', '));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generatePackageExports().catch(console.error);
}
```

### Milestone 4.2: Vite Build Configuration ✅
**Status:** Not Started

**Create `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { getLastFourVersions } from './scripts/version-utils.js';

// Get all versions
const versions = getLastFourVersions();

// Build entry points for all API versions
const entry: Record<string, string> = {
  'index': resolve(__dirname, 'src/index.ts'),
};

// Add API root indexes
['storefront', 'customer-account', 'admin'].forEach(api => {
  entry[`${api}/index`] = resolve(__dirname, `src/${api}/index.ts`);
  
  // Add version-specific entries
  versions.forEach(version => {
    entry[`${api}/${version}/index`] = resolve(__dirname, `src/${api}/${version}/index.ts`);
  });
});

export default defineConfig({
  build: {
    lib: {
      entry,
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        // Use .cjs for CommonJS to maintain .js for ESM
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [], // No external dependencies
      output: {
        preserveModules: false, // Bundle each entry point
        exports: 'named',
        generatedCode: {
          constBindings: true,
        },
      },
    },
    target: 'node18',
    minify: false, // Keep readable for debugging
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
});
```

**Create build helper script: `scripts/copy-schemas.ts`**

```typescript
import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

async function copySchemas() {
  const versions = getLastFourVersions();
  const apis = ['storefront', 'customer-account', 'admin'];
  
  console.log('Copying schema files to dist...');
  
  for (const api of apis) {
    const sourceDir = path.join('src', 'schemas', api);
    const targetDir = path.join('dist', 'schemas', api);
    
    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });
    
    // Copy each version's schema
    for (const version of versions) {
      const sourceFile = path.join(sourceDir, `${version}.json`);
      const targetFile = path.join(targetDir, `${version}.json`);
      
      try {
        await fs.copyFile(sourceFile, targetFile);
        console.log(`✓ Copied ${api}/${version}.json`);
      } catch (error) {
        console.error(`✗ Failed to copy ${api}/${version}.json:`, error);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  copySchemas().catch(console.error);
}
```

### Milestone 4.3: Build Scripts Configuration ✅
**Status:** Not Started

**Update package.json with build scripts:**

```json
{
  "scripts": {
    "prebuild": "npm run clean && npm run generate-exports",
    "build": "npm run build:types && npm run build:js && npm run build:declarations && npm run postbuild",
    "build:js": "vite build",
    "build:declarations": "tsc --emitDeclarationOnly --project tsconfig.build.json",
    "postbuild": "npm run copy-schemas",
    "clean": "rm -rf dist",
    "generate-exports": "tsx scripts/generate-exports.ts",
    "copy-schemas": "tsx scripts/copy-schemas.ts",
    "prepare": "npm run build"
  }
}
```

**Create `tsconfig.build.json` for declarations:**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "scripts", "tests"]
}
```

### Milestone 4.4: Build Validation ✅
**Status:** Not Started

**Create build validation script: `scripts/validate-build.ts`**

```typescript
import fs from 'fs/promises';
import path from 'path';
import { getLastFourVersions } from './version-utils.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

async function validateBuild(): Promise<ValidationResult> {
  const errors: string[] = [];
  const versions = getLastFourVersions();
  const apis = ['storefront', 'customer-account', 'admin'];
  
  console.log('Validating build output...\n');
  
  // Check root files
  const rootFiles = ['index.js', 'index.cjs', 'index.d.ts'];
  for (const file of rootFiles) {
    const filePath = path.join('dist', file);
    if (!await fs.access(filePath).then(() => true).catch(() => false)) {
      errors.push(`Missing root file: ${file}`);
    }
  }
  
  // Check API files
  for (const api of apis) {
    for (const version of versions) {
      const versionPath = path.join('dist', api, version);
      const requiredFiles = ['index.js', 'index.cjs', 'index.d.ts'];
      
      for (const file of requiredFiles) {
        const filePath = path.join(versionPath, file);
        if (!await fs.access(filePath).then(() => true).catch(() => false)) {
          errors.push(`Missing: ${api}/${version}/${file}`);
        }
      }
    }
  }
  
  // Check schema files
  for (const api of apis) {
    for (const version of versions) {
      const schemaPath = path.join('dist', 'schemas', api, `${version}.json`);
      if (!await fs.access(schemaPath).then(() => true).catch(() => false)) {
        errors.push(`Missing schema: ${api}/${version}.json`);
      }
    }
  }
  
  // Test imports
  try {
    // Dynamic import test
    const testImports = [
      import('../dist/index.js'),
      import('../dist/storefront/index.js'),
      import('../dist/customer-account/index.js'),
      import('../dist/admin/index.js'),
    ];
    
    await Promise.all(testImports);
    console.log('✓ All module imports working');
  } catch (error) {
    errors.push(`Import test failed: ${error}`);
  }
  
  if (errors.length === 0) {
    console.log('\n✅ Build validation passed!');
  } else {
    console.error('\n❌ Build validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateBuild().then(result => {
    process.exit(result.valid ? 0 : 1);
  });
}
```

**Add validation to package.json:**
```json
{
  "scripts": {
    "validate-build": "tsx scripts/validate-build.ts",
    "build:check": "npm run build && npm run validate-build"
  }
}
```

## Success Criteria
- [ ] Package.json exports configured for all API versions
- [ ] Vite successfully builds all entry points
- [ ] TypeScript declarations generated for all files
- [ ] Both ESM (.js) and CommonJS (.cjs) files created
- [ ] Schema JSON files copied to dist
- [ ] Build validation passes
- [ ] Package can be imported using all export paths

## Build Output Structure
```
dist/
├── index.js
├── index.cjs
├── index.d.ts
├── storefront/
│   ├── index.js
│   ├── index.cjs
│   ├── index.d.ts
│   ├── 2025-01/
│   │   ├── index.js
│   │   ├── index.cjs
│   │   └── index.d.ts
│   └── ...
├── customer-account/
│   └── ... (same structure)
├── admin/
│   └── ... (same structure)
└── schemas/
    ├── storefront/
    │   ├── 2025-01.json
    │   └── ...
    └── ... (other APIs)
```

## Common Issues & Solutions

### Issue: Vite not preserving directory structure
**Solution:** Ensure entry points are correctly configured with full paths

### Issue: CommonJS imports not working
**Solution:** Check that .cjs extension is used and exports are named

### Issue: TypeScript paths not resolving
**Solution:** Verify tsconfig paths and moduleResolution settings

### Issue: Large bundle size
**Solution:** This is expected - types are comprehensive

## Notes for Other Agents
- Build process is multi-step: clean → generate → build → copy
- The `prepare` script ensures build runs on install
- Schema files must be copied separately (not bundled)
- Both .js and .cjs files are needed for compatibility
- Source maps are included for debugging
- No minification to keep types readable

## Next Phase
Once build system is working and validated, proceed to Phase 5: Testing and Validation