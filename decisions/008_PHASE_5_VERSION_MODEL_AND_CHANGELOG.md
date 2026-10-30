# Phase 5: New Version Model and Schema Changelog System

## Executive Summary

This phase introduces a significant shift in our versioning strategy from
supporting the "last 4 versions" to a more forward-looking model that includes:

- **Current** - The latest stable API version (e.g., 2025-07)
- **Previous** - The prior stable version (e.g., 2025-04)
- **Next (RC)** - Release candidate for the upcoming quarter (e.g., 2025-10-rc)
- **Unstable** - Work-in-progress future version (e.g., unstable)

Additionally, we will implement a comprehensive schema changelog system that
tracks changes between versions, including types, queries, mutations, and
deprecations.

## Goals

1. Support forward-looking API versions (RC and unstable)
2. Provide detailed changelogs between API versions
3. Maintain backward compatibility with existing consumers
4. Enhance developer experience with clear migration guides
5. Automate change detection and documentation

## Technical Architecture

### 1. Enhanced Version Model

#### 1.1 Version Type System

```typescript
// src/lib/zod.ts - Enhanced version schemas
export const StableApiVersionSchema = z.string().regex(/^\d{4}-(01|04|07|10)$/);
export const RCApiVersionSchema = z.string().regex(/^\d{4}-(01|04|07|10)-rc$/);
export const UnstableApiVersionSchema = z.literal('unstable');

export const ExtendedApiVersionSchema = z.union([
  StableApiVersionSchema,
  RCApiVersionSchema,
  UnstableApiVersionSchema,
]);

export type ExtendedApiVersion = z.infer<typeof ExtendedApiVersionSchema>;

// Version categories for pattern matching
export const VersionCategorySchema = z.enum([
  'current',
  'previous',
  'next',
  'unstable',
]);
export type VersionCategory = z.infer<typeof VersionCategorySchema>;

// Version set representing all supported versions
export const VersionSetSchema = z.object({
  current: StableApiVersionSchema,
  previous: StableApiVersionSchema,
  next: RCApiVersionSchema,
  unstable: UnstableApiVersionSchema,
});
export type VersionSet = z.infer<typeof VersionSetSchema>;
```

#### 1.2 Version Utilities Enhancement

```typescript
// scripts/version-utils.ts - New functions
export function getCurrentVersionSet(): VersionSet {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Determine current and next quarters
  const quarters = [1, 4, 7, 10];
  const currentQuarter = quarters.find((q) => currentMonth >= q) ?? 10;
  const currentQuarterIndex = quarters.indexOf(currentQuarter);

  // Calculate versions using pattern matching
  return match({ currentQuarter, currentQuarterIndex })
    .with({ currentQuarterIndex: 3 }, () => ({
      current: `${currentYear}-${currentQuarter.toString().padStart(2, '0')}`,
      previous: `${currentYear}-07`,
      next: `${currentYear + 1}-01-rc`,
      unstable: 'unstable',
    }))
    .otherwise(({ currentQuarterIndex }) => ({
      current: `${currentYear}-${currentQuarter.toString().padStart(2, '0')}`,
      previous:
        currentQuarterIndex > 0
          ? `${currentYear}-${quarters[currentQuarterIndex - 1].toString().padStart(2, '0')}`
          : `${currentYear - 1}-10`,
      next: `${currentYear}-${quarters[currentQuarterIndex + 1].toString().padStart(2, '0')}-rc`,
      unstable: 'unstable',
    }));
}

export function classifyVersion(
  version: ExtendedApiVersion,
  versionSet: VersionSet,
): VersionCategory {
  return match(version)
    .when(
      (v) => v === versionSet.current,
      () => 'current' as const,
    )
    .when(
      (v) => v === versionSet.previous,
      () => 'previous' as const,
    )
    .when(
      (v) => v === versionSet.next,
      () => 'next' as const,
    )
    .when(
      (v) => v === versionSet.unstable,
      () => 'unstable' as const,
    )
    .run();
}
```

### 2. Schema Comparison System

#### 2.1 Change Detection Types

```typescript
// src/lib/zod.ts - Schema change tracking
export const FieldChangeSchema = z.object({
  name: z.string(),
  type: z.string(),
  changeType: z.enum(['added', 'removed', 'modified', 'deprecated']),
  description: z.string().optional(),
  deprecationReason: z.string().optional(),
  breaking: z.boolean(),
});

export const TypeChangeSchema = z.object({
  name: z.string(),
  kind: z.enum([
    'OBJECT',
    'INTERFACE',
    'UNION',
    'ENUM',
    'SCALAR',
    'INPUT_OBJECT',
  ]),
  changeType: z.enum(['added', 'removed', 'modified']),
  fields: z.array(FieldChangeSchema).optional(),
  breaking: z.boolean(),
});

export const SchemaChangelogSchema = z.object({
  fromVersion: ExtendedApiVersionSchema,
  toVersion: ExtendedApiVersionSchema,
  generatedAt: z.string().datetime(),
  summary: z.object({
    totalChanges: z.number(),
    breakingChanges: z.number(),
    deprecations: z.number(),
    additions: z.number(),
    removals: z.number(),
  }),
  changes: z.object({
    types: z.array(TypeChangeSchema),
    queries: z.array(FieldChangeSchema),
    mutations: z.array(FieldChangeSchema),
    subscriptions: z.array(FieldChangeSchema),
    enums: z.array(TypeChangeSchema),
  }),
});

export type SchemaChangelog = z.infer<typeof SchemaChangelogSchema>;
```

#### 2.2 Schema Comparison Implementation

```typescript
// src/lib/schema-compare.ts
import { match, P } from 'ts-pattern';
import type {
  GraphQLSchema,
  SchemaChangelog,
  TypeChange,
  FieldChange,
} from './zod.js';

export function compareSchemas(
  fromSchema: GraphQLSchema,
  toSchema: GraphQLSchema,
  fromVersion: ExtendedApiVersion,
  toVersion: ExtendedApiVersion,
): SchemaChangelog {
  const fromTypes = new Map(fromSchema.__schema.types.map((t) => [t.name, t]));
  const toTypes = new Map(toSchema.__schema.types.map((t) => [t.name, t]));

  const typeChanges: TypeChange[] = [];
  const queryChanges: FieldChange[] = [];
  const mutationChanges: FieldChange[] = [];

  // Detect removed types
  for (const [name, type] of fromTypes) {
    if (!toTypes.has(name) && !name.startsWith('__')) {
      typeChanges.push({
        name,
        kind: type.kind,
        changeType: 'removed',
        breaking: true,
      });
    }
  }

  // Detect added and modified types
  for (const [name, toType] of toTypes) {
    if (name.startsWith('__')) continue;

    const fromType = fromTypes.get(name);

    if (!fromType) {
      typeChanges.push({
        name,
        kind: toType.kind,
        changeType: 'added',
        breaking: false,
      });
    } else if (fromType.kind === toType.kind) {
      const fieldChanges = compareFields(
        fromType.fields || [],
        toType.fields || [],
      );
      if (fieldChanges.length > 0) {
        typeChanges.push({
          name,
          kind: toType.kind,
          changeType: 'modified',
          fields: fieldChanges,
          breaking: fieldChanges.some((f) => f.breaking),
        });
      }
    }
  }

  // Compare root types (Query, Mutation, Subscription)
  const fromQuery = fromTypes.get(
    fromSchema.__schema.queryType?.name || 'Query',
  );
  const toQuery = toTypes.get(toSchema.__schema.queryType?.name || 'Query');
  if (fromQuery && toQuery) {
    queryChanges.push(
      ...compareFields(fromQuery.fields || [], toQuery.fields || []),
    );
  }

  const fromMutation = fromTypes.get(
    fromSchema.__schema.mutationType?.name || 'Mutation',
  );
  const toMutation = toTypes.get(
    toSchema.__schema.mutationType?.name || 'Mutation',
  );
  if (fromMutation && toMutation) {
    mutationChanges.push(
      ...compareFields(fromMutation.fields || [], toMutation.fields || []),
    );
  }

  // Calculate summary
  const summary = {
    totalChanges:
      typeChanges.length + queryChanges.length + mutationChanges.length,
    breakingChanges: [
      ...typeChanges,
      ...queryChanges,
      ...mutationChanges,
    ].filter((c) => c.breaking).length,
    deprecations: [...queryChanges, ...mutationChanges].filter(
      (c) => c.changeType === 'deprecated',
    ).length,
    additions: [...typeChanges, ...queryChanges, ...mutationChanges].filter(
      (c) => c.changeType === 'added',
    ).length,
    removals: [...typeChanges, ...queryChanges, ...mutationChanges].filter(
      (c) => c.changeType === 'removed',
    ).length,
  };

  return {
    fromVersion,
    toVersion,
    generatedAt: new Date().toISOString(),
    summary,
    changes: {
      types: typeChanges,
      queries: queryChanges,
      mutations: mutationChanges,
      subscriptions: [],
      enums: typeChanges.filter((t) => t.kind === 'ENUM'),
    },
  };
}

function compareFields(fromFields: any[], toFields: any[]): FieldChange[] {
  const changes: FieldChange[] = [];
  const fromFieldMap = new Map(fromFields.map((f) => [f.name, f]));
  const toFieldMap = new Map(toFields.map((f) => [f.name, f]));

  // Check for removed fields
  for (const [name, field] of fromFieldMap) {
    if (!toFieldMap.has(name)) {
      changes.push({
        name,
        type: field.type.name || field.type.ofType?.name || 'Unknown',
        changeType: 'removed',
        breaking: true,
      });
    }
  }

  // Check for added or modified fields
  for (const [name, toField] of toFieldMap) {
    const fromField = fromFieldMap.get(name);

    if (!fromField) {
      changes.push({
        name,
        type: toField.type.name || toField.type.ofType?.name || 'Unknown',
        changeType: 'added',
        description: toField.description,
        breaking: false,
      });
    } else {
      // Check for deprecation
      if (!fromField.isDeprecated && toField.isDeprecated) {
        changes.push({
          name,
          type: toField.type.name || toField.type.ofType?.name || 'Unknown',
          changeType: 'deprecated',
          deprecationReason: toField.deprecationReason,
          breaking: false,
        });
      }
    }
  }

  return changes;
}
```

### 3. Enhanced Documentation Generation

#### 3.1 README Updates

```typescript
// src/lib/patterns.ts - Enhanced release table generation
export function generateEnhancedReleaseTable(
  versionSet: VersionSet,
  changelog?: SchemaChangelog,
): string {
  const table = `## Supported API Versions

| Version | Status | API Version | Key Changes |
|---------|--------|-------------|-------------|
| **Current** | Stable | ${versionSet.current} | ${changelog ? summarizeChanges(changelog) : 'Latest stable release'} |
| **Previous** | Maintenance | ${versionSet.previous} | Security patches only |
| **Next** | Release Candidate | ${versionSet.next} | [Preview upcoming changes](#changelog) |
| **Unstable** | Development | ${versionSet.unstable} | Bleeding edge, subject to change |

### Version Support Policy

- **Current**: Full support with all features and bug fixes
- **Previous**: Security patches and critical bug fixes only
- **Next (RC)**: Preview of upcoming quarterly release, may have breaking changes
- **Unstable**: Daily updates, no stability guarantees

### Changelog Highlights (${versionSet.previous} → ${versionSet.current})

${changelog ? formatDetailedChangelog(changelog) : 'No changes detected'}`;

  return table;
}

function summarizeChanges(changelog: SchemaChangelog): string {
  const { summary } = changelog;
  const parts: string[] = [];

  if (summary.additions > 0) parts.push(`+${summary.additions} additions`);
  if (summary.removals > 0) parts.push(`-${summary.removals} removals`);
  if (summary.deprecations > 0)
    parts.push(`${summary.deprecations} deprecations`);
  if (summary.breakingChanges > 0)
    parts.push(`${summary.breakingChanges} breaking`);

  return parts.join(', ') || 'No changes';
}

function formatDetailedChangelog(changelog: SchemaChangelog): string {
  return match(changelog.summary)
    .when(
      (s) => s.totalChanges === 0,
      () => 'No breaking changes in this release',
    )
    .otherwise(({ summary, changes }) => {
      const sections: string[] = [];

      if (changes.queries.filter((q) => q.changeType === 'added').length > 0) {
        sections.push(`#### New Queries
${changes.queries
  .filter((q) => q.changeType === 'added')
  .map((q) => `- \`${q.name}\`: ${q.description || 'New query added'}`)
  .join('\n')}`);
      }

      if (
        changes.mutations.filter((m) => m.changeType === 'added').length > 0
      ) {
        sections.push(`#### New Mutations
${changes.mutations
  .filter((m) => m.changeType === 'added')
  .map((m) => `- \`${m.name}\`: ${m.description || 'New mutation added'}`)
  .join('\n')}`);
      }

      if (summary.deprecations > 0) {
        sections.push(`#### Deprecations
${[...changes.queries, ...changes.mutations]
  .filter((f) => f.changeType === 'deprecated')
  .map((f) => `- \`${f.name}\`: ${f.deprecationReason || 'Deprecated'}`)
  .join('\n')}`);
      }

      if (summary.breakingChanges > 0) {
        sections.push(`#### Breaking Changes
${[...changes.types, ...changes.queries, ...changes.mutations]
  .filter((c) => c.breaking)
  .map((c) => `- ${c.name}: ${c.changeType}`)
  .join('\n')}`);
      }

      return sections.join('\n\n');
    });
}
```

### 4. Build System Updates

#### 4.1 Fetch Schema Updates

```typescript
// scripts/fetch-schemas.ts - Support for unstable/RC
export async function fetchSchemas(options?: {
  includeUnstable?: boolean;
  includeRC?: boolean;
}): Promise<void> {
  const versionSet = getCurrentVersionSet();
  const versions: ExtendedApiVersion[] = [
    versionSet.current,
    versionSet.previous,
  ];

  if (options?.includeRC) {
    versions.push(versionSet.next);
  }

  if (options?.includeUnstable) {
    versions.push(versionSet.unstable);
  }

  // Enhanced endpoint matching for special versions
  const matchEnhancedEndpoint = (
    api: ApiType,
    version: ExtendedApiVersion,
  ): string => {
    return match({ api, version })
      .when({ version: 'unstable' }, ({ api }) => {
        // Unstable endpoints
        return match(api)
          .with(
            'storefront',
            () => 'https://storefront-api.myshopify.com/unstable/graphql.json',
          )
          .with(
            'admin',
            () => 'https://admin-api.myshopify.com/unstable/graphql.json',
          )
          .with(
            'customer-account',
            () =>
              'https://customer-account-api.myshopify.com/unstable/graphql.json',
          )
          .exhaustive();
      })
      .when({ version: P.string.endsWith('-rc') }, ({ api, version }) => {
        // RC endpoints use the base version with RC parameter
        const baseVersion = version.replace('-rc', '');
        return `${matchApiEndpoint(api, baseVersion as ApiVersion)}?rc=true`;
      })
      .otherwise(({ api, version }) =>
        matchApiEndpoint(api, version as ApiVersion),
      );
  };

  // Fetch schemas with enhanced error handling
  for (const api of SUPPORTED_APIS) {
    for (const version of versions) {
      try {
        const endpoint = matchEnhancedEndpoint(api, version);
        // ... rest of fetch logic
      } catch (error) {
        // Handle version-specific errors
        handleVersionError(error, api, version);
      }
    }
  }
}
```

#### 4.2 CI/CD Updates

```yaml
# .github/workflows/api-version-check.yml - Enhanced
name: Check API Versions
on:
  schedule:
    - cron: '0 6 * * 1' # Weekly on Monday
  workflow_dispatch:

jobs:
  check-versions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check for new API versions
        run: |
          # Check stable versions
          npm run check-api-versions

          # Check RC availability
          npm run check-rc-version

          # Update unstable schema daily
          npm run fetch-schemas -- --unstable-only

      - name: Generate changelog if changes detected
        run: |
          npm run generate-changelog

      - name: Create PR if changes
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'feat: Update API schemas and changelog'
          body: |
            ## API Schema Updates

            This PR includes:
            - Updated schemas for new API versions
            - Generated changelog between versions
            - Updated documentation

            Please review the changelog for breaking changes.
```

### 5. Migration Strategy

#### Phase 5.1: Infrastructure (Week 1)

1. Update Zod schemas for extended version support
2. Implement schema comparison utilities
3. Create enhanced version utilities

#### Phase 5.2: Schema Fetching (Week 2)

1. Update fetch-schemas to support unstable/RC
2. Implement proper error handling for special versions
3. Test with live Shopify endpoints

#### Phase 5.3: Documentation (Week 3)

1. Update README generation with new version model
2. Implement changelog generation
3. Create migration guide for consumers

#### Phase 5.4: CI/CD (Week 4)

1. Update GitHub Actions workflows
2. Implement automated changelog generation
3. Set up daily unstable updates

## Risk Mitigation

### 1. Unstable API Availability

- **Risk**: Unstable endpoints may not always be available
- **Mitigation**: Graceful fallback, clear error messages, optional inclusion

### 2. Breaking Changes in RC

- **Risk**: RC versions may have significant changes
- **Mitigation**: Clear warnings, separate exports, opt-in usage

### 3. Increased Package Size

- **Risk**: Supporting more versions increases package size
- **Mitigation**: Separate entry points, tree-shaking support

### 4. Complexity for Consumers

- **Risk**: More versions may confuse developers
- **Mitigation**: Clear documentation, sensible defaults, migration guides

## Success Metrics

1. **Developer Experience**
   - Clear understanding of version support
   - Easy migration between versions
   - Comprehensive changelogs

2. **Technical Quality**
   - Zero runtime errors from version handling
   - Accurate change detection
   - Automated updates working reliably

3. **Adoption**
   - Developers using RC versions for testing
   - Reduced issues from API changes
   - Positive feedback on changelog feature

## Conclusion

This enhanced version model positions the package as a forward-looking tool that
helps developers prepare for upcoming API changes while maintaining stability
with current versions. The comprehensive changelog system provides transparency
and helps developers plan their migrations effectively.
