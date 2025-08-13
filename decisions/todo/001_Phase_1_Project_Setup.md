# Phase 1: Project Setup and Infrastructure

## Overview
Initialize the npm package structure, configure TypeScript, and set up development tooling following Shopify's patterns from shopify-app-js repository.

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
    "eslint": "^8.50.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0",
    "tsx": "^4.0.0",
    "@changesets/cli": "^2.26.0",
    "graphql": "^16.8.0"
  }
}
```

**Installation Command:**
```bash
npm install --save-dev typescript @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/introspection @graphql-codegen/typescript-operations vite vitest @vitest/ui eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier tsx @changesets/cli graphql
```

**Validation:**
- All dependencies installed successfully
- No peer dependency warnings
- package-lock.json created

### Milestone 1.3: TypeScript Configuration ✅
**Status:** Not Started

**Files to Create:**

1. **tsconfig.json** (main config):
```json
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
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

2. **tsconfig.build.json** (for build output):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "sourceMap": false
  },
  "exclude": ["node_modules", "dist", "tests", "scripts", "**/*.test.ts", "**/*.spec.ts"]
}
```

**Validation:**
- TypeScript compiles without errors: `npx tsc --noEmit`
- Config files properly extend each other

### Milestone 1.4: Development Tools Configuration ✅
**Status:** Not Started

**Files to Create:**

1. **.eslintrc.json**:
```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

2. **.prettierrc.json**:
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

3. **.editorconfig**:
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

4. **Add scripts to package.json**:
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,json}\"",
    "type-check": "tsc --noEmit"
  }
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

## Success Criteria
- [ ] All directory structure created
- [ ] Dependencies installed without errors
- [ ] TypeScript compiles without errors
- [ ] Linting and formatting configured and passing
- [ ] Basic test framework operational
- [ ] All configuration files follow Shopify patterns

## Notes for Other Agents
- This package is a SINGLE package, not a monorepo like shopify-app-js
- We're using Vite instead of other bundlers for modern ESM support
- The package will support both CommonJS and ESM exports
- TypeScript strict mode is enabled - maintain type safety
- Follow existing Shopify patterns but adapt for single package structure

## Next Phase
Once all milestones are complete, proceed to Phase 2: Schema Fetching and Version Management