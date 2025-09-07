# NPM Publishing Plan for shopify-ts-utils

> Date: 2025-08-18 Status: Active Package: shopify-ts-utils

## Overview

This document outlines the complete plan for publishing our TypeScript package
to npm for the first time, following 2025 best practices for dual ESM/CJS module
support.

## Prerequisites Checklist

### 1. npm Account Setup

- [ ] Create npm account at https://www.npmjs.com/signup
- [ ] Enable 2FA (Two-Factor Authentication) in account settings
- [ ] Install authenticator app (Google Authenticator, Authy, etc.)
- [ ] Verify email address

### 2. Local Environment Setup

- [ ] Install Node.js v22+ (LTS recommended)
- [ ] Update npm to latest: `npm install -g npm@latest`
- [ ] Login to npm locally: `npm login`
- [ ] Verify login: `npm whoami`

### 3. Package Name Availability

- [ ] Check package name availability: `npm view shopify-ts-utils`
- [ ] If taken, choose alternative name
- [ ] Ensure scoped package if using organization (@juanpprieto)

## Package Configuration Validation

### 1. package.json Verification

```json
{
  "name": "shopify-ts-utils",
  "version": "2025.7.0",
  "description": "TypeScript types and JSON schemas for Shopify's GraphQL APIs",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    // ✅ Verify all export paths match actual files
    "./admin": {
      "import": {
        "types": "./dist/admin/index.d.ts",
        "default": "./dist/admin/index.js"
      },
      "require": {
        "types": "./dist/admin/index.d.ts",
        "default": "./dist/admin/index.cjs"
      }
    }
    // ... verify all other exports
  },
  "files": ["dist", "!dist/**/*.test.*", "!dist/**/*.spec.*"],
  "scripts": {
    "build": "npm run build:ci",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

### 2. Build Output Verification

- [ ] Run `npm run build`
- [ ] Verify dist/ folder structure matches exports
- [ ] Check .d.ts files are generated for all modules
- [ ] Verify both .js (ESM) and .cjs (CommonJS) files exist

### 3. Type Definitions Validation

- [ ] All TypeScript interfaces/types are exported
- [ ] Declaration files (.d.ts) are in correct locations
- [ ] No TypeScript errors in generated files

## Pre-Publishing Testing

### 1. Local Package Testing

```bash
# Create package tarball without publishing
npm pack --dry-run

# Review what will be published
npm pack
tar -tf juanpprieto-shopify-api-types-*.tgz

# Test in another project
cd /tmp
mkdir test-package && cd test-package
npm init -y
npm install /path/to/juanpprieto-shopify-api-types-*.tgz

# Create test file
echo 'import { Product } from "shopify-ts-utils/admin";
console.log("Import successful");' > test.mjs

# Test ESM import
node test.mjs

# Test CommonJS require
echo 'const { Product } = require("shopify-ts-utils/admin");
console.log("Require successful");' > test.cjs
node test.cjs
```

### 2. Module Resolution Testing

- [ ] Test all export paths from README examples
- [ ] Verify TypeScript autocomplete works
- [ ] Test in both ESM and CJS projects
- [ ] Validate with "Are the Types Wrong" tool

### 3. Documentation Verification

- [ ] README.md is complete and accurate
- [ ] All code examples work
- [ ] License file exists (MIT)
- [ ] CHANGELOG.md is up to date

## Security Checklist

### 1. Dependency Audit

```bash
npm audit
npm audit fix
```

### 2. Secret Scanning

- [ ] No API keys in code
- [ ] No tokens in .env (should be in .gitignore)
- [ ] No sensitive data in package

### 3. File Inclusion Review

- [ ] .npmignore or files field excludes:
  - Source files (src/)
  - Test files
  - Configuration files
  - .env files
  - Development scripts

## Publishing Process

### 1. Final Pre-Publish Checks

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Run all checks
npm run lint
npm run type-check
npm test
npm run build

# Verify version
npm version # Should show 2025.7.0
```

### 2. First-Time Publishing

```bash
# For scoped packages, might need to set access
npm config set access public

# Publish with OTP (One-Time Password)
npm publish --otp=YOUR_2FA_CODE

# If you need to test first
npm publish --dry-run
```

### 3. Post-Publishing Verification

- [ ] Check package page: https://www.npmjs.com/package/shopify-ts-utils
- [ ] Verify all metadata is correct
- [ ] Test installation in clean project: `npm install shopify-ts-utils`
- [ ] Verify README renders correctly on npm

## Troubleshooting Guide

### Common Issues

1. **"You need to authorize this package"**

   ```bash
   npm access public shopify-ts-utils
   ```

2. **"Package name too similar to existing package"**
   - Add more specific scope or suffix

3. **"Cannot publish over previously published version"**
   - Bump version: `npm version patch`

4. **2FA Issues**
   - Ensure OTP is current (regenerates every 30 seconds)
   - Use: `npm publish --otp=123456`

### Rollback Procedure

If issues are discovered after publishing:

```bash
# Deprecate broken version
npm deprecate shopify-ts-utils@2025.7.0 "Critical bug - use 2025.7.1"

# Cannot unpublish after 24 hours, must publish fix
npm version patch
npm publish --otp=YOUR_2FA_CODE
```

## CI/CD Integration (Future)

### GitHub Actions Setup

```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

### npm Token Setup

1. Generate automation token:
   https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add as GitHub secret: NPM_TOKEN
3. Token bypasses 2FA for automation

## Success Criteria

- [ ] Package published successfully to npm
- [ ] All examples from README work in fresh project
- [ ] TypeScript types provide proper autocomplete
- [ ] Both ESM and CJS imports work
- [ ] Package page shows correct metadata
- [ ] No security vulnerabilities reported

## Next Steps After First Release

1. Set up automated publishing via GitHub Actions
2. Create release tags in git
3. Monitor download statistics
4. Set up issue templates for bug reports
5. Plan regular update schedule aligned with Shopify API releases

---

## Quick Reference Commands

```bash
# Login and verify
npm login
npm whoami

# Test package locally
npm pack --dry-run
npm pack

# Publish
npm publish --otp=123456

# View published package
npm view shopify-ts-utils

# Install and test
npm install shopify-ts-utils
```
