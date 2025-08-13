# Phase 1: Project Setup and Infrastructure

## Overview
Initialize the npm package structure with the strictest TypeScript and Prettier configurations, set up modern development tooling following 2025 best practices for TypeScript projects.

## Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Git initialized repository

## Milestones

### Milestone 1.1: Repository Structure ✅
**Status:** Not Started

**Tasks:**
1. Create single package structure (NOT monorepo)
2. Create directory structure:
   ```
   shopify-api-types/
   ├── src/
   │   ├── storefront/
   │   ├── customer-account/
   │   └── admin/
   ├── scripts/
   ├── tests/
   ├── .github/
   │   └── workflows/
   └── decisions/
       └── todo/
   ```
3. Initialize package.json with correct naming: `@juanpprieto/shopify-api-types`
4. Set package type to "module" for ESM support
5. Add .gitignore with standard Node.js patterns plus `dist/`

**Validation:**
- Directory structure matches specification
- package.json exists with correct name
- Git repository properly initialized

### Milestone 1.2: Dependencies Setup ✅
**Status:** Not Started

**Core Dependencies to Install:**
```json
{
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.3.3",
    "@graphql-codegen/cli": "^5.0.0",
    "@graphql-codegen/typescript": "^4.0.1",
    "@graphql-codegen/introspection": "^4.0.0",
    "@graphql-codegen/typescript-operations": "^4.0.1",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "eslint": "^8.57.0",
    "@eslint/js": "^8.57.0",
    "typescript-eslint": "^7.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "prettier": "^3.2.5",
    "tsx": "^4.0.0",
    "@changesets/cli": "^2.26.0",
    "graphql": "^16.8.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0"
  }
}
```

**Installation Command:**
```bash
npm install --save-dev --save-exact typescript @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/introspection @graphql-codegen/typescript-operations vite vitest @vitest/ui eslint @eslint/js typescript-eslint eslint-config-prettier eslint-plugin-prettier prettier tsx @changesets/cli graphql husky lint-staged
```

**Validation:**
- All dependencies installed successfully
- No peer dependency warnings
- package-lock.json created

### Milestone 1.3: TypeScript Configuration ✅
**Status:** Not Started

**Files to Create:**

1. **tsconfig.json** (main config with strictest settings):
```json
{
  "compilerOptions": {
    // Target and Module
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    
    // Core strict settings (all enabled)
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional strict checks
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "noImplicitOverride": true,
    
    // Module interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    
    // Type checking and output
    "skipLibCheck": false,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    
    // Output configuration
    "outDir": "./dist",
    "rootDir": "./src",
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "**/*.spec.ts", "**/*.test.ts"]
}
```

2. **tsconfig.build.json** (for build output):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "sourceMap": false,
    "removeComments": true
  },
  "exclude": ["node_modules", "dist", "tests", "scripts", "**/*.test.ts", "**/*.spec.ts"]
}
```

3. **tsconfig.scripts.json** (for build scripts):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "target": "ES2022",
    "outDir": "./dist/scripts",
    "rootDir": "./scripts",
    "noEmit": false
  },
  "include": ["scripts/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Validation:**
- TypeScript compiles without errors: `npx tsc --noEmit`
- All strict checks are enabled and passing
- Config files properly extend each other

### Milestone 1.4: Development Tools Configuration ✅
**Status:** Not Started

**Files to Create:**

1. **eslint.config.mjs** (using flat config):
```javascript
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "prettier": prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": ["error", {
        "prefer": "type-imports",
        "fixStyle": "inline-type-imports"
      }],
      "@typescript-eslint/no-import-type-side-effects": "error"
    },
  },
  eslintConfigPrettier,
];
```

2. **.prettierrc.json** (strictest configuration):
```json
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "consistent",
  "jsxSingleQuote": false,
  "trailingComma": "all",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "proseWrap": "always",
  "htmlWhitespaceSensitivity": "strict",
  "endOfLine": "lf",
  "embeddedLanguageFormatting": "auto",
  "singleAttributePerLine": true
}
```

3. **.prettierignore**:
```
# Dependencies
node_modules/
dist/
build/
coverage/

# Generated files
*.min.js
*.min.css
.tsbuildinfo

# IDE
.vscode/
.idea/
```

4. **.editorconfig**:
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

5. **Add scripts to package.json**:
```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,scss,md}\" --ignore-path .prettierignore",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,scss,md}\" --ignore-path .prettierignore",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "prepare": "husky"
  }
}
```

6. **.vscode/settings.json** (VS Code integration):
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**Validation:**
- `npm run lint` runs without errors
- `npm run format:check` passes
- `npm run type-check` passes

### Milestone 1.5: Initial Test Setup ✅
**Status:** Not Started

**Files to Create:**

1. **vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
```

2. **tests/setup.test.ts** (basic test to verify setup):
```typescript
import { describe, it, expect } from 'vitest';

describe('Project Setup', () => {
  it('should have vitest configured', () => {
    expect(true).toBe(true);
  });
});
```

3. **Add test scripts to package.json**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Validation:**
- `npm test` runs successfully
- Basic test passes

### Milestone 1.6: Git Hooks Setup ✅
**Status:** Not Started

**Files to Create:**

1. **.husky/pre-commit**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

2. **Add lint-staged configuration to package.json**:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

3. **Initialize Husky**:
```bash
npx husky init
```

**Validation:**
- Pre-commit hooks run on staged files
- Code is automatically formatted and linted before commit

### Milestone 1.7: Build Configuration ✅
**Status:** Not Started

**Files to Create:**

1. **vite.config.ts**:
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'storefront/index': resolve(__dirname, 'src/storefront/index.ts'),
        'customer-account/index': resolve(__dirname, 'src/customer-account/index.ts'),
        'admin/index': resolve(__dirname, 'src/admin/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['graphql'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].[format].js',
        exports: 'named',
      },
    },
    target: 'node18',
    sourcemap: true,
    minify: false,
  },
});
```

2. **Add build scripts to package.json**:
```json
{
  "scripts": {
    "build": "vite build",
    "build:watch": "vite build --watch",
    "clean": "rm -rf dist .tsbuildinfo"
  }
}
```

**Validation:**
- `npm run build` creates dist directory
- Both ESM and CJS formats are generated
- Source maps are created

### Milestone 1.8: Documentation Setup ✅
**Status:** Not Started

**Files to Create:**

1. **README.md**:
```markdown
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
```

2. **CONTRIBUTING.md**:
```markdown
# Contributing

## Development Setup

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm test

# Build the package
npm run build
```

## Code Quality

This project uses the strictest TypeScript and Prettier configurations.
All code must pass linting, formatting, and type checks.

## Pre-commit Hooks

Husky and lint-staged are configured to ensure code quality before commits.
```

**Validation:**
- README provides clear usage examples
- CONTRIBUTING guide explains development workflow

## Success Criteria
- [ ] All directory structure created
- [ ] Dependencies installed without errors  
- [ ] TypeScript compiles without errors (strictest settings)
- [ ] ESLint flat config with TypeScript strict rules
- [ ] Prettier with strictest formatting rules
- [ ] Basic test framework operational
- [ ] Git hooks configured with Husky and lint-staged
- [ ] Vite build configuration for ESM and CJS
- [ ] Documentation files created
- [ ] VS Code integration configured
- [ ] All configuration files follow 2025 best practices

## Notes for Other Agents
- This package is a SINGLE package, not a monorepo like shopify-app-js
- We're using Vite instead of other bundlers for modern ESM support
- The package will support both CommonJS and ESM exports
- TypeScript strict mode is enabled - maintain type safety
- Follow existing Shopify patterns but adapt for single package structure

## Next Phase
Once all milestones are complete, proceed to Phase 2: Schema Fetching and Version Management