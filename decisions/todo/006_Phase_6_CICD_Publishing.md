# Phase 6: CI/CD and NPM Publishing

## Overview

Set up GitHub Actions for continuous integration, automated testing, and NPM
package publishing using Changesets for version management.

## Prerequisites

- All previous phases completed
- GitHub repository created
- NPM account with publishing rights
- Understanding of GitHub Actions and Changesets

## Critical Information

- Uses Changesets for version management
- Publishes to NPM on merge to main
- Requires NPM_TOKEN secret in GitHub
- Automated on push and PR events

## Milestones

### Milestone 6.1: GitHub Actions CI Workflow ✅

**Status:** Not Started

**Create `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['18', '20']
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate types
        run: npm run build:types
        env:
          # Add tokens if needed for schema fetching
          SHOPIFY_STOREFRONT_ACCESS_TOKEN:
            ${{ secrets.SHOPIFY_STOREFRONT_ACCESS_TOKEN }}
          SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN:
            ${{ secrets.SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN }}
          SHOPIFY_ADMIN_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ADMIN_ACCESS_TOKEN }}

      - name: Run tests
        run: npm run test:run

      - name: Run test coverage
        if: matrix.node-version == '18'
        run: npm run test:coverage

      - name: Upload coverage
        if: matrix.node-version == '18'
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: npm run build
        env:
          SHOPIFY_STOREFRONT_ACCESS_TOKEN:
            ${{ secrets.SHOPIFY_STOREFRONT_ACCESS_TOKEN }}
          SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN:
            ${{ secrets.SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN }}
          SHOPIFY_ADMIN_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ADMIN_ACCESS_TOKEN }}

      - name: Validate build
        run: npm run validate-build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

### Milestone 6.2: Changesets Configuration ✅

**Status:** Not Started

**Initialize Changesets:**

```bash
npx changeset init
```

**Update `.changeset/config.json`:**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "updateInternalDependents": "always"
  }
}
```

**Create changeset template: `.changeset/README.md`:**

````markdown
# Changesets

This repo uses [changesets](https://github.com/changesets/changesets) to manage
versioning and changelogs.

## Creating a changeset

When you make a change that should be released, run:

```bash
npx changeset
```
````

This will prompt you to:

1. Select the type of change (major, minor, patch)
2. Write a summary of the change

## Release process

1. Create a PR with your changes
2. Add a changeset file describing the changes
3. Merge the PR
4. The release workflow will automatically:
   - Update version numbers
   - Update CHANGELOG.md
   - Publish to NPM

## Types of changes

- **patch**: Bug fixes and minor updates (0.0.X)
- **minor**: New features that don't break existing code (0.X.0)
- **major**: Breaking changes (X.0.0)

````

**Add Changeset scripts to package.json:**

```json
{
  "scripts": {
    "changeset": "changeset",
    "version": "changeset version && npm run format",
    "release": "npm run build && changeset publish"
  }
}
````

### Milestone 6.3: Release Workflow ✅

**Status:** Not Started

**Create `.github/workflows/release.yml`:**

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

env:
  NODE_VERSION: '18'

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: npm run build
        env:
          SHOPIFY_STOREFRONT_ACCESS_TOKEN:
            ${{ secrets.SHOPIFY_STOREFRONT_ACCESS_TOKEN }}
          SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN:
            ${{ secrets.SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN }}
          SHOPIFY_ADMIN_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ADMIN_ACCESS_TOKEN }}

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          version: npm run version
          publish: npm run release
          createGithubReleases: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish Prerelease
        if: steps.changesets.outputs.published != 'true'
        run: |
          npm version prerelease --preid=dev --no-git-tag-version
          npm publish --tag dev
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Milestone 6.4: Additional Workflows ✅

**Status:** Not Started

**Create `.github/workflows/schema-update.yml` for weekly schema updates:**

```yaml
name: Update Schemas

on:
  schedule:
    # Run every Monday at 00:00 UTC
    - cron: '0 0 * * 1'
  workflow_dispatch:

env:
  NODE_VERSION: '18'

jobs:
  update-schemas:
    name: Update Schemas
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Fetch latest schemas
        run: npm run fetch-schemas
        env:
          SHOPIFY_STOREFRONT_ACCESS_TOKEN:
            ${{ secrets.SHOPIFY_STOREFRONT_ACCESS_TOKEN }}
          SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN:
            ${{ secrets.SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN }}
          SHOPIFY_ADMIN_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ADMIN_ACCESS_TOKEN }}

      - name: Generate types
        run: npm run generate-types

      - name: Check for changes
        id: git-check
        run: |
          git diff --exit-code || echo "changes=true" >> $GITHUB_OUTPUT

      - name: Create Pull Request
        if: steps.git-check.outputs.changes == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update GraphQL schemas and types'
          title: 'chore: update GraphQL schemas and types'
          body: |
            ## Automated Schema Update

            This PR updates the GraphQL schemas and regenerated types for all APIs.

            ### Changes
            - Updated schema files to latest versions
            - Regenerated TypeScript types

            Please review the changes and merge if everything looks correct.
          branch: update-schemas
          delete-branch: true
```

**Create `.github/workflows/publish-dry-run.yml` for testing releases:**

```yaml
name: Publish Dry Run

on:
  pull_request:
    types: [opened, synchronize]

env:
  NODE_VERSION: '18'

jobs:
  publish-dry-run:
    name: Publish Dry Run
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: npm run build

      - name: Dry run publish
        run: npm publish --dry-run
```

### Milestone 6.5: NPM Publishing Setup ✅

**Status:** Not Started

**Update package.json for publishing:**

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/",
    "provenance": true
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/juanpprieto/shopify-api-types.git"
  },
  "bugs": {
    "url": "https://github.com/juanpprieto/shopify-api-types/issues"
  },
  "homepage": "https://github.com/juanpprieto/shopify-api-types#readme",
  "keywords": [
    "shopify",
    "graphql",
    "typescript",
    "types",
    "storefront-api",
    "customer-account-api",
    "admin-api",
    "shopify-api"
  ],
  "author": "Juan P. Prieto",
  "license": "MIT"
}
```

**Create `.npmignore`:**

```
# Source files
src/
scripts/
tests/

# Config files
.changeset/
.github/
.gitignore
.npmignore
.prettierrc.json
.eslintrc.json
.editorconfig
.env
.env.*

# Development files
*.log
*.test.ts
*.spec.ts
coverage/
.vitest/
vitest.config.ts
tsconfig.json
tsconfig.build.json
vite.config.ts
codegen.ts

# Docs
decisions/
*.md
!README.md
!LICENSE

# Temporary files
temp/
*.tmp
```

### Milestone 6.6: Security and Secrets Setup ✅

**Status:** Not Started

**Required GitHub Secrets:**

1. `NPM_TOKEN`: NPM automation token for publishing
2. `SHOPIFY_STOREFRONT_ACCESS_TOKEN`: For fetching Storefront API schemas
3. `SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN`: For Customer Account API
4. `SHOPIFY_ADMIN_ACCESS_TOKEN`: For Admin API schemas
5. `CODECOV_TOKEN`: (Optional) For coverage reporting

**Create NPM automation token:**

1. Log in to npmjs.com
2. Go to Access Tokens
3. Generate new token (Automation type)
4. Add to GitHub secrets as NPM_TOKEN

**Security checks to add:**

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    assignees:
      - 'juanpprieto'
    commit-message:
      prefix: 'chore'
      include: 'scope'
```

## Success Criteria

- [ ] CI workflow runs on all PRs
- [ ] Tests pass in CI environment
- [ ] Build artifacts are created
- [ ] Changesets configured correctly
- [ ] Release workflow can publish to NPM
- [ ] Schema update workflow runs weekly
- [ ] All required secrets configured
- [ ] First version published to NPM

## Manual Release Process

1. Create feature branch
2. Make changes
3. Run `npx changeset` to create changeset
4. Commit and push
5. Create PR
6. Wait for CI to pass
7. Merge PR
8. Release workflow automatically publishes

## Common Issues & Solutions

### Issue: NPM publish fails with 401

**Solution:** Check NPM_TOKEN is valid and has publish rights

### Issue: Schema fetch fails in CI

**Solution:** Ensure Shopify tokens are set as secrets

### Issue: Release PR not created

**Solution:** Check Changesets action permissions

### Issue: Coverage upload fails

**Solution:** CODECOV_TOKEN is optional, can be skipped

## Notes for Other Agents

- Never commit tokens or secrets
- All workflows use Node 18 as baseline
- Changesets handle version bumping automatically
- NPM provenance requires id-token permission
- Schema updates create PRs, not direct commits
- Dry run on PRs helps catch publish issues early

## Post-Publishing Checklist

- [ ] Package visible on npmjs.com
- [ ] Install works: `npm install @juanpprieto/shopify-api-types`
- [ ] Types resolve correctly in IDE
- [ ] GitHub release created with changelog
- [ ] Documentation updated if needed

## Maintenance Tasks

- Monitor weekly schema update PRs
- Keep dependencies updated via Dependabot
- Review and merge Changesets version PRs
- Monitor NPM download statistics
- Respond to issues and PRs from community
