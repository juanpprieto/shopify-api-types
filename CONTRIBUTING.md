# Contributing to @juanpprieto/shopify-api-types

Welcome! This guide will help you understand how to contribute to this
TypeScript types package for Shopify's GraphQL APIs.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all validations (type-check, lint, test)
npm run validate

# Build the package
npm run build

# Run comprehensive CI validation
npm run ci:validate-all
```

## 📋 NPM Scripts Reference

### Core Development Scripts

| Script     | Purpose                           | When to Use                      |
| ---------- | --------------------------------- | -------------------------------- |
| `validate` | Run type-check + lint + test      | Before committing changes        |
| `build`    | Full production build             | Before releases, testing exports |
| `build:ci` | CI build with memory optimization | CI/CD pipelines                  |
| `clean`    | Remove build artifacts            | Fresh starts, troubleshooting    |
| `check`    | Type-check + lint (no tests)      | Quick validation                 |

### Type Generation Scripts

| Script                 | Purpose                                      | When to Use                      |
| ---------------------- | -------------------------------------------- | -------------------------------- |
| `fetch-schemas`        | Download latest GraphQL schemas from Shopify | Weekly updates, new API versions |
| `generate-types`       | Generate TypeScript types from schemas       | After fetching new schemas       |
| `generate:exports`     | Generate package.json exports                | After adding new API versions    |
| `generate:indexes`     | Create index.ts files for all APIs           | After type generation            |
| `generate:comparisons` | Generate API change comparisons              | For documentation, release notes |

### Code Quality Scripts

| Script         | Purpose                          | When to Use        |
| -------------- | -------------------------------- | ------------------ |
| `lint`         | Run ESLint                       | Before commits, CI |
| `lint:check`   | Run ESLint without fixes         | CI validation      |
| `format`       | Format all code with Prettier    | Before commits     |
| `format:check` | Check formatting without changes | CI validation      |
| `type-check`   | TypeScript compilation check     | Development, CI    |

### Testing & Validation Scripts

| Script                 | Purpose                        | When to Use        |
| ---------------------- | ------------------------------ | ------------------ |
| `test`                 | Run test suite                 | Development, CI    |
| `test:coverage`        | Run tests with coverage report | Release validation |
| `deadcode`             | Find unused code with Knip     | Code cleanup       |
| `find-deadcode:strict` | Find unused exports            | Code cleanup       |

### CI/CD Validation Scripts

| Script                      | Purpose                         | When to Use           |
| --------------------------- | ------------------------------- | --------------------- |
| `ci:validate-build`         | Validate build output structure | CI/CD pipelines       |
| `ci:validate-types`         | Validate generated type files   | After type generation |
| `ci:validate-schemas`       | Validate downloaded schemas     | After schema updates  |
| `ci:validate-comparisons`   | Validate comparison files       | Release preparation   |
| `ci:validate-version-model` | Validate API version structure  | System validation     |
| `ci:validate-system`        | Core system validation          | Build pipeline        |

### Release & Publishing Scripts

| Script              | Purpose                      | When to Use                  |
| ------------------- | ---------------------------- | ---------------------------- |
| `changeset:version` | Version bump with changesets | Release preparation          |
| `changeset:publish` | Publish to npm               | Release execution            |
| `release:dry`       | Dry run release process      | Testing release flow         |
| `prepublishOnly`    | Pre-publish validation       | Automatic before npm publish |

### Documentation & Utilities

| Script              | Purpose                                                      | When to Use                    |
| ------------------- | ------------------------------------------------------------ | ------------------------------ |
| `docs`              | Generate API documentation                                   | Documentation updates          |
| `count-types`       | Count types in each API                                      | Statistics, release notes      |
| `copy-schemas`      | Copy schemas to dist folder                                  | Build process                  |
| `fix-js-extensions` | Fix import extensions                                        | Build process                  |
| `knip:strict`       | Strict dependency analysis                                   | Code cleanup                   |
| `knip:fix`          | Auto-fix dependency issues                                   | Maintenance                    |
| `version:calver`    | **MAIN RELEASE COMMAND** - Run changeset + CalVer correction | Instead of `changeset version` |
| `version:correct`   | Manual CalVer correction after changeset                     | Fix version post-changeset     |
| `version:test`      | Test next CalVer version calculation                         | Release validation             |

## 📋 CalVer Workflow Guide

This package uses **Shopify CalVer** (`YYYY.[1|4|7|10].PATCH`) with Changesets
for version management. Here's how to use it:

### 🔄 Complete Release Workflow

#### 1. Development & Testing

```bash
# 1. Make your changes
# 2. Validate everything works
npm run validate

# 3. Test CalVer version calculation
npm run version:test
```

#### 2. Create Changeset

```bash
# Add changeset for your changes
npx changeset add

# Choose change type:
# - patch: Bug fixes, docs (2025.4.0 → 2025.4.1)
# - minor: New features (treated as patch in CalVer)
# - major: New API version (2025.4.0 → 2025.7.0 - quarterly only!)
```

#### 3. Pre-Release Validation

```bash
# Check what changesets exist
npx changeset status

# Test version bump (dry run)
npm run version:calver -- --dry-run

# Full validation
npm run validate && npm run build
```

#### 4. Release Process ⭐ **NEW CALVER WORKFLOW**

```bash
# 🔥 USE THIS INSTEAD of "changeset version"
npm run version:calver

# This does:
# 1. Runs changeset version (creates CHANGELOG, updates to SemVer)
# 2. Automatically corrects version to CalVer (2026.0.0 → 2025.7.0)
# 3. Updates both package.json and CHANGELOG.md

# Verify CalVer constraints were applied
cat CHANGELOG.md
cat package.json | grep version

# Publish (usually done by CI)
npx changeset publish
```

### 🚨 CalVer Constraints & Validation

**Important:** Our CalVer integration enforces Shopify's quarterly pattern:

- ✅ **Valid major versions**: `2025.1.0`, `2025.4.0`, `2025.7.0`, `2025.10.0`
- ❌ **Invalid major versions**: `2025.2.0`, `2025.5.0`, `2025.6.0`, `2025.8.0`

**Change Type Mapping:**

- `patch` → Increment patch number (`2025.7.0` → `2025.7.1`)
- `minor` → Treated as patch in CalVer (`2025.7.0` → `2025.7.1`)
- `major` → New API quarter (`2025.7.0` → `2025.10.0`)

### 🎯 Example Workflows

#### Bug Fix Release

```bash
# 1. Fix bug, add tests
npm run validate

# 2. Create patch changeset
npx changeset add
# Choose: patch
# Summary: "Fix TypeScript declarations for GraphQL schemas"

# 3. Release
npx changeset version  # 2025.7.0 → 2025.7.1
npx changeset publish
```

#### New Feature Release

```bash
# 1. Add feature, add tests
npm run validate

# 2. Create minor changeset (treated as patch)
npx changeset add
# Choose: minor
# Summary: "Add support for new Product API fields"

# 3. Release - automatically becomes patch in CalVer
npx changeset version  # 2025.7.0 → 2025.7.1 (not 2025.8.0!)
```

#### New API Version Release (Quarterly)

```bash
# 1. Fetch new schemas
npm run fetch-schemas

# 2. Generate new types
npm run generate-types

# 3. Validate everything
npm run validate && npm run build

# 4. Create major changeset
npx changeset add
# Choose: major
# Summary: "Add support for Shopify API 2025-10"

# 5. Release - creates new API version
npx changeset version  # 2025.7.0 → 2025.10.0
npx changeset publish
```

### 🔧 CalVer Scripts Reference

| Command                               | Purpose                                              | Output                         |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------ |
| `npm run version:test`                | Preview next CalVer version                          | Shows version calculation      |
| `npm run version:calver`              | **MAIN COMMAND** - Run changeset + CalVer correction | Complete CalVer workflow       |
| `npm run version:calver -- --dry-run` | Preview CalVer workflow                              | Shows what would happen        |
| `npm run version:correct`             | Manual CalVer correction                             | Fixes version after changeset  |
| `npx changeset add`                   | Create new changeset                                 | Interactive changeset creation |
| `npx changeset status`                | View pending changesets                              | Lists changes to be released   |
| `npx changeset publish`               | Publish to NPM                                       | Releases new version           |

### ⚠️ Important Notes

1. **Use `npm run version:calver` instead of `changeset version`** - This is the
   main difference!
2. **Major versions should align with Shopify's quarterly releases** (Jan, Apr,
   Jul, Oct)
3. **Our changelog adds CalVer context** - look for "(New API Version)" markers
4. **Minor changes are treated as patches** - see "(Feature - treated as patch
   in CalVer)"
5. **Validate before releasing** - always run
   `npm run validate && npm run build`
6. **Use CI for publishing** - manual publishing should be rare

### ✅ **Tested & Proven Results**

Our CalVer integration has been fully tested and works perfectly:

- ✅ **Major changeset**: `2025.4.0` → `2025.7.0` (not `2026.0.0`!)
- ✅ **Automatic correction**: SemVer `2026.0.0` automatically becomes CalVer
  `2025.7.0`
- ✅ **CHANGELOG.md updated**: Header changes from `## 2026.0.0` to
  `## 2025.7.0`
- ✅ **API Version detection**: Correctly identifies `2025-07` as the API
  version
- ✅ **Quarterly validation**: Only allows `1`, `4`, `7`, `10` for major
  versions
- ✅ **Custom changelog context**: Adds "(New API Version)" for major releases

## 🏗️ Development Workflow

### 1. Setting Up Development Environment

```bash
# Clone and setup
git clone <repo-url>
cd shopify-api-types
npm install

# Verify setup
npm run validate
```

### 2. Making Changes

```bash
# For schema updates
npm run fetch-schemas
npm run generate-types

# For code changes
npm run validate  # Run frequently during development
```

### 3. Before Committing

```bash
# Full validation
npm run validate

# Check for unused code
npm run deadcode

# Verify build works
npm run build
```

### 4. Release Process

```bash
# 1. Update schemas
npm run fetch-schemas
npm run generate-types

# 2. Validate everything
npm run ci:validate-all

# 3. Create changeset
npx changeset add

# 4. Version and publish (automated in CI)
npm run changeset:version
npm run changeset:publish
```

## 📦 Package Structure

```
├── src/
│   ├── admin/           # Admin API types by version
│   ├── storefront/      # Storefront API types by version
│   ├── customer-account/# Customer Account API types
│   ├── lib/            # Shared utilities
│   └── graphql-schemas/# Raw GraphQL schemas
├── scripts/            # Build and maintenance scripts
├── tests/              # Test suites
└── demo/               # Demo React application
```

## 🔄 API Version Management

### Supported Versions (Updated 2025.10.0)

- **Current**: `2025-10` - Active stable version
- **Previous**: `2025-07` - Legacy support
- **Next**: `2026-01` - Release candidate
- **Unstable**: Latest development version

## 📅 Quarterly API Release Guide

This section documents the complete process for releasing a new Shopify API
quarterly version, based on our successful 2025.10.0 release.

### 🎯 Overview

Shopify releases new API versions quarterly (January, April, July, October). Our
package uses automated CalVer versioning that dynamically calculates the correct
versions based on the current date.

### 📐 Version Support Principle

**Each package release ships every API version that Shopify still supports.**

Shopify supports each stable API version for a minimum of 12 months, with at
least 9 months of overlap between consecutive versions
([versioning docs](https://shopify.dev/docs/api/usage/versioning)). In practice,
the 4 most recent stable quarters are callable at any time. A request for a
retired version silently "falls forward" to the oldest supported version — the
`x-shopify-api-version` response header reports the version that was actually
served.

The version set therefore contains 6 versions:

- **current** — this quarter's stable version (alias: `current`)
- **previous** — last quarter's stable version (alias: `previous`)
- **olderSupported** — the 2 quarters before that (versioned paths only)
- **releaseCandidate** — next quarter's preview (alias: `next`)
- **unstable** — the development version (alias: `unstable`)

Comparisons ship for every adjacent version pair, so users on any supported
version have an upgrade path. Users on a version that has left the support
window install the older package release whose window contained it — CalVer
package versions map one-to-one to Shopify quarters.

**Version Set Calculation (example, Q3 2026):**

- current=2026-07, previous=2026-04, olderSupported=[2026-01, 2025-10],
  next=2026-10

**Back-dated builds:** set the `RELEASE_DATE` env var (YYYY-MM-DD, use a
mid-month day) to make all version-set tooling compute the set for that date.
Example: `RELEASE_DATE=2026-01-15 npm run generate:exports`. This exists for
catch-up releases of missed quarters.

**Fall-forward guard:** `npm run fetch-schemas` refuses to save a schema when
Shopify serves a different version than requested, and keeps the existing file
in `src/graphql-schemas/` instead. Retired versions can only be built from
schemas already in the repo.

### 🧭 Release Crossroads (decisions for future maintainers and agents)

These rules resolve the recurring decision points of a release. They come from
the 2026-09 catch-up releases (see `decisions/011`).

1. **Back-dated releases use `RELEASE_DATE`.** Set it (YYYY-MM-DD, mid-month
   day) on EVERY command of that release: fetch, generate, build, validate,
   `git push` (the pre-push hook rebuilds), and `npm publish` (`prepublishOnly`
   rebuilds). A missed override rebuilds with today's version set and corrupts
   the release artifacts.
2. **Retired schema files are irreplaceable.** Once Shopify retires a version,
   `src/graphql-schemas/<api>/<version>.json` is the only source. Never delete
   them from `src`. Two guards protect them during fetch:
   - Storefront/Admin: the `x-shopify-api-version` response header must equal
     the requested version.
   - Customer Account: the endpoint sends no version header, so the fetch script
     detects fall-forward by content - a dated version whose bytes equal a newer
     version's schema is a fall-forward response, and the previous file is
     restored automatically.
3. **dist ships only the release window.** The build compiles every version dir
   in `src`, so after the build remove the
   `dist/{storefront,admin,customer-account}/<version>` dirs that are outside
   the release's version set. Remove from `dist` only - never from `src`.
4. **Publish locally before you push.** Order: commit → `npm publish` (with OTP,
   and `RELEASE_DATE` if back-dated) → tag → push → GitHub release. Pushing an
   unpublished version first makes the CI release workflow publish it via
   `NPM_TOKEN`, which bypasses the local verification flow.
5. **Paid doc generation runs last.** `npm run docs` calls the Anthropic API and
   costs tokens. Run it only after `npm run validate`, `ci:validate-build`, and
   the export smoke test all pass. The same gate exists in the quarterly
   `api-version-check` workflow. Model: `claude-sonnet-5` (override with
   `ANTHROPIC_MODEL`).
6. **Changesets on release.** A release consumes the pending changeset files
   together with the manual CalVer version bump. Close any bot-opened "Version
   Packages" PR that a release supersedes.
7. **Node support follows EOL.** The CI matrices test only non-EOL Node
   versions, and `engines.node` mirrors the oldest tested version.
8. **The e2e test-app never hardcodes versions.** It enumerates every export
   path from the installed package.json at test time, so quarterly version-set
   changes cannot break it.

### 🚀 Complete Release Process (2025.10.0 Template)

Follow these exact steps for the next quarterly release:

#### Step 1: Environment Setup & Verification

```bash
# Verify current version set
tsx -e "import { getCurrentVersionSet } from './scripts/version-utils.js'; console.log('Current version set:', getCurrentVersionSet());"

# Expected output for Q1 2026:
# { current: '2026-01', previous: '2025-10', releaseCandidate: '2026-04', unstable: 'unstable' }

# Ensure clean working directory
git status
npm run clean
```

#### Step 2: Update Package Version

```bash
# Update package.json to new CalVer version
# Example: 2025.10.0 → 2026.01.0
npm version 2026.1.0 --no-git-tag-version
```

#### Step 3: Fetch Latest API Schemas

```bash
# Verify environment variables are set
echo $SHOPIFY_ADMIN_ACCESS_TOKEN
echo $SHOPIFY_STOREFRONT_ACCESS_TOKEN
echo $SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN

# Fetch all API schemas (this will automatically fetch current/previous/next/unstable)
npm run fetch-schemas

# Verify schemas were downloaded
ls -la src/graphql-schemas/admin/
ls -la src/graphql-schemas/storefront/
ls -la src/graphql-schemas/customer-account/
```

#### Step 4: Generate TypeScript Types

```bash
# Generate types for all API versions
npm run generate-types

# This creates types for all supported versions automatically
# Verify type generation
npm run count-types
```

#### Step 5: Update Package Exports

```bash
# Generate new package.json exports for all versions
npm run generate:exports

# Verify exports were created correctly
grep -A 5 -B 5 "2026-01" package.json
```

#### Step 6: Build & Validate

```bash
# Full build with validation
npm run build

# This runs:
# 1. TypeScript compilation
# 2. Fix JS extensions
# 3. Copy schemas to dist
# 4. Generate comparisons
# 5. System validation

# Verify build output
npm run ci:validate-build
```

#### Step 7: Fix Test Mocks (Critical Step!)

```bash
# Update test mocks to use new version set
# Edit tests/scripts/validate-build.test.ts
# Change the mock from old versions to new versions:

# FROM:
# getSupportedVersions: vi.fn(() => [
#   '2025-10', '2025-07', '2026-01', 'unstable'
# ])

# TO:
# getSupportedVersions: vi.fn(() => [
#   '2026-01', '2025-10', '2026-04', 'unstable'
# ])

# Also update all version arrays in test files to match new version set
```

#### Step 8: Clean Up Old Unsupported Versions

```bash
# Remove old version files that are no longer supported
# (The automated version set supports 6 versions: 4 stable + RC + unstable)
rm -rf dist/admin/2025-04 dist/customer-account/2025-04 dist/storefront/2025-04

# Re-validate after cleanup
npm run ci:validate-build
```

#### Step 9: Run Full Validation Suite

```bash
# Ensure tests use run mode (not watch mode)
# Verify package.json has: "test": "vitest run --silent"

# Run complete validation
npm run validate

# Additional validation
npm run ci:validate-system
```

#### Step 10: Update Documentation

```bash
# Update README.md examples with new version paths
# Update CONTRIBUTING.md supported versions section
# Generate API comparisons for release notes
npm run generate:comparisons
```

#### Step 11: Test Package Exports

```bash
# Create temporary test project to verify exports work
cd /tmp
mkdir test-shopify-types
cd test-shopify-types
npm init -y
npm install file:/path/to/your/shopify-ts

# Test imports work correctly
node -e "
const admin = require('@juanpprieto/shopify-api-types/admin/current');
const storefront = require('@juanpprieto/shopify-api-types/sfapi/current');
console.log('Imports successful!');
"
```

#### Step 12: Commit & Push Changes

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: release 2026.1.0 with 2026-01 API support

- Add 2026-01 API schemas and types
- Update CalVer version set for Q1 2026
- Generate new package exports and comparisons
- Update test mocks for new version set
- Remove unsupported 2025-04 version files

Version set: current=2026-01, previous=2025-10, next=2026-04"

# Push to remote
git push origin main
```

#### Step 13: Publish to NPM

```bash
# Ensure you have 2FA set up and authenticator app ready
npm publish --access public --otp=123456

# Replace 123456 with your 6-digit OTP code from authenticator app
```

#### Step 14: Verify Publication

```bash
# Check that new version is available
npm view @juanpprieto/shopify-api-types version

# Verify new exports work
npm view @juanpprieto/shopify-api-types exports | grep 2026-01
```

### 🔍 Key Files Modified During Release

1. **package.json** - Version number and exports
2. **src/graphql-schemas/** - New API schemas
3. **src/{admin,storefront,customer-account}/** - Generated types
4. **dist/** - Built output with new types and schemas
5. **tests/scripts/validate-build.test.ts** - Test version mocks
6. **README.md** - Documentation and examples

### 💡 Lessons Learned from 2025.10.0

1. **CalVer automation works perfectly** - No manual version calculation needed
2. **Test mocks must be updated** - Critical for CI validation
3. **Watch mode causes publish loops** - Always use `vitest run --silent`
4. **Old version cleanup is essential** - Remove unsupported versions
5. **2FA setup required** - Ensure authenticator app is configured

### 🚨 Common Pitfalls to Avoid

- ❌ Forgetting to update test mocks → CI failures
- ❌ Using `vitest` instead of `vitest run` → infinite loops during publish
- ❌ Not cleaning up old version files → validation failures
- ❌ Missing environment variables → schema fetch failures
- ❌ Not testing exports in temp project → runtime import errors

### ✅ Success Criteria

Your release is successful when:

- ✅ All CI validation passes
- ✅ Package builds without errors
- ✅ All 39+ export paths are valid
- ✅ npm publish succeeds
- ✅ New version appears on npmjs.com
- ✅ Import examples work in test project

### 📊 Expected Results (2026.01.0 Example)

**Generated Types:**

- Admin API: ~1,800+ types
- Storefront API: ~270+ types
- Customer Account API: ~300+ types

**Package Size:**

- Compressed: ~4.5MB
- Unpacked: ~60MB

**Export Paths:**

- 39+ total exports (types + schemas + comparisons)
- Semantic aliases: current/previous/next/unstable

### Adding New API Versions

1. **Automatic detection** - CalVer logic automatically calculates new versions
2. Run schema fetch: `npm run fetch-schemas`
3. Generate types: `npm run generate-types`
4. Update exports: `npm run generate:exports`
5. Validate: `npm run build && npm run ci:validate-build`

## 🧪 Testing Guidelines

### Test Categories

- **Unit Tests**: Individual function testing
- **Integration Tests**: Script workflow testing
- **E2E Tests**: Full package import testing
- **Validation Tests**: Build output verification

### Writing Tests

```typescript
// Example test structure
describe('feature-name', () => {
  it('should do something specific', () => {
    // Test implementation
  });
});
```

## 🎯 Code Quality Standards

### TypeScript Configuration

- Strict mode enabled
- No explicit `any` types
- Explicit return types required
- Consistent type imports

### ESLint Rules

- Prettier integration
- No unused variables
- Consistent import style
- No console statements (except in scripts)

### Commit Guidelines

- Descriptive commit messages
- Small, focused changes
- All tests must pass
- Linting must pass

## 🚢 Release Process

### Automated Release Pipeline

The package uses **Changesets** for version management and **GitHub Actions**
for automated releases:

```mermaid
graph LR
    A[Create PR] --> B[Add Changeset]
    B --> C[CI Validates]
    C --> D[Merge to Main]
    D --> E[Release PR Created]
    E --> F[Merge Release PR]
    F --> G[Publish to NPM]
```

### Creating a Release

1. **Add Changeset**

   ```bash
   npx changeset add
   # Choose change type: patch/minor/major
   # Write clear change description
   ```

2. **Commit Changeset**

   ```bash
   git add .changeset/
   git commit -m "feat: add new API features"
   git push
   ```

3. **Release PR Creation**
   - GitHub Actions automatically creates a release PR
   - Reviews version bumps and changelog
   - Merging triggers automatic NPM publish

### Change Types & CalVer Versioning

This package follows **Shopify CalVer** versioning pattern:
`YYYY.[1|4|7|10].PATCH`

| Type      | When to Use                        | CalVer Impact              | Example                  |
| --------- | ---------------------------------- | -------------------------- | ------------------------ |
| **patch** | Bug fixes, docs updates            | Increment patch number     | `2025.7.0` → `2025.7.1`  |
| **minor** | New features, non-breaking changes | Treated as patch in CalVer | `2025.7.0` → `2025.7.1`  |
| **major** | New API versions, breaking changes | New quarterly version      | `2025.7.0` → `2025.10.0` |

**Important CalVer Constraints:**

- Major versions **only** occur during Shopify's quarterly API releases
- Valid months: `1` (January), `4` (April), `7` (July), `10` (October)
- Minor changes are treated as patch releases in CalVer
- Breaking changes should align with Shopify's quarterly release schedule

## 🔧 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clean and rebuild
npm run clean
npm install
npm run build

# Check for TypeScript errors
npm run type-check
```

#### Schema Download Issues

```bash
# Verify environment variables
echo $SHOPIFY_ADMIN_ACCESS_TOKEN
echo $SHOPIFY_STOREFRONT_ACCESS_TOKEN

# Manual schema fetch
npm run fetch-schemas
```

#### Type Generation Problems

```bash
# Check GraphQL schemas
ls -la src/graphql-schemas/

# Regenerate types
npm run generate-types

# Validate output
npm run ci:validate-types
```

#### Test Failures

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test -- path/to/test.ts

# Check coverage
npm run test:coverage
```

### Debug Commands

| Command                   | Purpose                         |
| ------------------------- | ------------------------------- |
| `npm run count-types`     | Count types in each API version |
| `npm run deadcode`        | Find unused dependencies        |
| `npm run ci:validate-all` | Full system validation          |
| `npm run knip:strict`     | Strict dependency analysis      |

## 📚 Documentation

### Generating Documentation

```bash
# Generate API docs
npm run docs

# Update README with latest changes
# (Manual process - update examples and version info)
```

### Documentation Standards

- All functions must have JSDoc comments
- Include examples for complex APIs
- Update README for user-facing changes
- Document breaking changes in changeset

## 🤝 Contributing Guidelines

### Getting Started

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/awesome-feature`
3. **Make changes** following code quality standards
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit pull request**

### Pull Request Requirements

- [ ] All tests pass (`npm run validate`)
- [ ] No linting errors
- [ ] Code follows TypeScript standards
- [ ] Includes changeset for user-facing changes
- [ ] Documentation updated if needed
- [ ] Descriptive PR title and description

### Code Review Process

1. **Automated Checks**: CI runs all validations
2. **Manual Review**: Maintainer reviews code quality
3. **Feedback**: Address any requested changes
4. **Approval**: PR approved and merged
5. **Release**: Changes included in next release

### What We Look For

- ✅ Clean, readable code
- ✅ Comprehensive tests
- ✅ Proper error handling
- ✅ Performance considerations
- ✅ Backward compatibility
- ✅ Clear documentation

### Areas for Contribution

- 🆕 New API version support
- 🐛 Bug fixes and improvements
- 📝 Documentation enhancements
- 🧪 Test coverage improvements
- ⚡ Performance optimizations
- 🔧 Developer experience improvements

## 📞 Getting Help

### Resources

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Questions and community support
- **Documentation**: README and inline code docs
- **Demo App**: `/demo` folder with examples

### Reporting Issues

When reporting bugs, include:

- Node.js and npm versions
- Package version
- Minimal reproduction case
- Expected vs actual behavior
- Error messages and stack traces

### Feature Requests

For new features:

- Explain the use case
- Provide examples of desired API
- Consider backward compatibility
- Discuss implementation approach

## 🤖 Claude AI Configuration

The documentation generation uses Claude AI. The model selection works as
follows:

1. **Environment Variable** (highest priority): Set `ANTHROPIC_MODEL` to use a
   specific model

   ```bash
   export ANTHROPIC_MODEL="claude-opus-4-1-20250805"
   ```

2. **Automatic Latest** (development): In non-production environments, uses
   `claude-sonnet-4-0` alias which automatically points to the latest Sonnet 4
   version

3. **Stable Version** (production): In production, uses a specific version
   (`claude-sonnet-4-20250514`) for consistency

This approach ensures:

- Flexibility for testing new models via environment variable
- Automatic updates in development environments
- Stability in production environments

---

Thank you for contributing to @juanpprieto/shopify-api-types! 🎉
