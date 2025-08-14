# CalVer Versioning Strategy

## Overview

Implement Calendar Versioning (CalVer) to align package versions with Shopify's
quarterly API release cycle.

## Current State

- Package version: `0.1.0` (SemVer)
- Shopify API versions: `YYYY-MM` format (2025-07, 2025-04, etc.)
- Mismatch between package and API versioning

## Proposed CalVer Format

```
YYYY.M.PATCH
```

- **YYYY**: Full year (2025)
- **M**: Month without zero padding (7, not 07)
- **PATCH**: Incremental patches (0, 1, 2...)

### Examples

- `2025.7.0` - Initial release for Shopify API 2025-07
- `2025.7.1` - Patch fix
- `2025.10.0` - New API release (October 2025)

## Implementation Plan

### 1. Custom Changeset Process

Create a custom changeset workflow that:

- **Major changesets** → New API version (x.x.0)
- **Patch changesets** → Bug fixes (x.x.1, x.x.2)
- No minor versions (middle number = API month)

### 2. Automated Version Detection

```typescript
// scripts/update-version.ts
function getNextVersion(changesetType: 'major' | 'patch') {
  const latestApiVersion = getLatestVersion(); // "2025-07"
  const [year, month] = latestApiVersion.split('-');
  const currentPatch = getCurrentPatchVersion();

  if (changesetType === 'major') {
    return `${year}.${parseInt(month)}.0`;
  } else {
    return `${year}.${parseInt(month)}.${currentPatch + 1}`;
  }
}
```

### 3. CI/CD Integration

Update GitHub Actions to:

1. Detect new Shopify API releases
2. Automatically create PR with version bump
3. Generate changelog based on API changes
4. Tag releases with CalVer format

### 4. Migration Steps

1. Release current changes as `2025.7.0`
2. Update all documentation
3. Add deprecation notice for old versioning
4. Update npm tags:
   - `latest` → Current CalVer release
   - `legacy` → Last SemVer release

## Benefits

- **Clear API alignment** - Package version immediately shows supported API
  version
- **Predictable releases** - Quarterly releases matching Shopify's schedule
- **Simplified decision making** - No ambiguity about which package version to
  use
- **Better discoverability** - `npm view @juanpprieto/shopify-api-types@2025.10`
  shows October 2025 API support

## Risks & Mitigation

1. **Breaking change from SemVer**
   - Mitigation: Clear migration guide, maintain legacy tag
2. **Tooling compatibility**
   - Mitigation: Test with common tools (npm, yarn, pnpm, renovate)
3. **User confusion**
   - Mitigation: Comprehensive documentation, clear README

## Timeline

- Phase 1: Implement version detection script (1 day)
- Phase 2: Update changeset workflow (2 days)
- Phase 3: CI/CD integration (2 days)
- Phase 4: Documentation & migration (1 day)

## Decision

✅ Proceed with CalVer implementation starting with version `2025.7.0`
