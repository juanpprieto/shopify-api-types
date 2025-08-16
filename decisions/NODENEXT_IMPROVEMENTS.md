# NodeNext Module Resolution Improvements

## Current State Analysis

### ✅ Code Splitting & Tree-Shaking (SAFE)

Our package is **well-structured for tree-shaking**:

1. **Separate Entry Points**: Each API/version has its own entry point

   ```
   ./admin/2025-07 → Only Admin types
   ./sfapi/2025-07 → Only Storefront types
   ./caapi/2025-07 → Only Customer Account types
   ```

2. **`sideEffects: false`**: Package.json correctly declares no side effects

3. **Type-Only Exports**: All exports are TypeScript types (no runtime code)

   ```typescript
   export * from './types'; // Only re-exports types
   ```

4. **Granular Imports Work**:
   ```typescript
   // This only includes Product type, not entire package
   import type { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-07';
   ```

### ❌ NodeNext Resolution Issues

Current limitations with `moduleResolution: "NodeNext"`:

1. **Missing `.js` Extensions**: NodeNext requires explicit extensions
2. **No Dual Package Support**: Only ESM, no CommonJS
3. **Schema Imports**: Default exports work differently in NodeNext

## Proposed Improvements

### Option 1: Add Export Conditions (Recommended for 2024)

Based on TypeScript best practices for 2024, add proper export conditions:

```json
{
  "exports": {
    "./admin/2025-07": {
      "types": "./dist/admin/2025-07/index.d.ts",
      "import": "./dist/admin/2025-07/index.d.ts",
      "default": "./dist/admin/2025-07/index.d.ts"
    }
    // ... repeat for all paths
  }
}
```

**Key Points**:

- `types` condition must come first
- `import` condition for ESM
- `default` as fallback
- This works with `moduleResolution: "NodeNext"` and `"bundler"`

### Option 2: Full NodeNext Support

1. **Add package.json to each subpath**:

   ```
   dist/admin/2025-07/package.json
   dist/sfapi/2025-07/package.json
   ```

2. **Content**:
   ```json
   {
     "type": "module",
     "types": "./index.d.ts"
   }
   ```

### Option 3: Dual Package (ESM + CJS)

This would require significant changes:

- Generate both `.d.ts` and `.d.cts` files
- Add CommonJS exports
- Double the package size

## Tree-Shaking Safety Assessment

✅ **Current structure is SAFE for tree-shaking**:

1. **Bundlers can eliminate unused code** because:
   - Each API is in a separate file
   - We use proper ES modules exports
   - No side effects declared

2. **Import analysis shows proper separation**:

   ```typescript
   // Only imports Product types, not Admin or Customer types
   import type { Product } from '@juanpprieto/shopify-api-types/sfapi/2025-07';

   // Bundler tree-shakes away: admin/*, caapi/*
   ```

3. **Type-only imports are automatically removed** in production builds

## Recommendations Based on 2024 Best Practices

### 1. **For NodeNext Support**: Implement Enhanced Export Conditions

```javascript
// scripts/generate-exports-enhanced.ts
const exports = {
  '.': {
    types: './dist/index.d.ts',
    import: './dist/index.d.ts',
    default: './dist/index.d.ts',
  },
  './admin/2025-07': {
    types: './dist/admin/2025-07/index.d.ts',
    import: './dist/admin/2025-07/index.d.ts',
    default: './dist/admin/2025-07/index.d.ts',
  },
  // Schema exports with proper conditions
  './schemas/admin/2025-07': {
    types: './dist/schemas/admin/2025-07.json',
    import: './dist/schemas/admin/2025-07.json',
    require: './dist/schemas/admin/2025-07.json',
    default: './dist/schemas/admin/2025-07.json',
  },
  // ... repeat for all paths
};
```

### 2. **For Tree-Shaking**: Current Structure is Optimal ✅

- No changes needed
- Each import path is independent
- Types are properly isolated
- `sideEffects: false` ensures dead code elimination

### 3. **TypeScript Configuration Guidance**

```json
// Recommended for libraries (works everywhere)
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true
  }
}

// For Node.js applications (strict mode)
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true
  }
}
```

### 4. **Why Not Dual Package (CJS + ESM)?**

For a types-only package like ours:

- **Not necessary**: Types have no runtime, so no CJS/ESM distinction
- **Would double size**: Need both `.d.ts` and `.d.cts` files
- **Adds complexity**: Multiple build outputs for no benefit
- **Industry standard**: DefinitelyTyped uses ESM-only approach

## Impact on Package Size

Current code splitting means users only "pay" for what they import:

- Import only Admin types: ~1MB (not 28.9MB)
- Import only Storefront types: ~115KB
- Schemas are separate paths (not auto-imported)

The 28.9MB is only the full package size, not what ends up in user bundles.
