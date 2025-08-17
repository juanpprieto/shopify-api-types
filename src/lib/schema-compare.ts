import { diff } from '@graphql-inspector/core';
import { buildClientSchema } from 'graphql';
import { match } from 'ts-pattern';
import type {
  GraphQLSchema,
  SchemaChangelog,
  TypeChange,
  FieldChange,
  ExtendedApiVersion,
  ApiType,
  MultiApiChangelog,
} from './zod.js';
import {
  SchemaChangelogSchema,
  MultiApiChangelogSchema,
  SUPPORTED_APIS,
} from './zod.js';

// =============================================================================
// Core Schema Comparison using GraphQL Inspector
// =============================================================================

/**
 * Convert GraphQL Inspector Change to our FieldChange format
 */
function convertInspectorChangeToFieldChange(change: {
  type: string;
  criticality?: { level?: string };
  path?: string;
  message: string;
}): FieldChange {
  const isBreaking = change.criticality?.level === 'BREAKING';

  // Extract field name from the change path or message
  const fieldName = extractFieldName(change.path || change.message);

  // Determine change type based on GraphQL Inspector change type
  const changeType = match(change.type)
    .with('FIELD_REMOVED', () => 'removed' as const)
    .with('FIELD_ADDED', () => 'added' as const)
    .with('FIELD_TYPE_CHANGED', () => 'modified' as const)
    .with('FIELD_DEPRECATED', () => 'deprecated' as const)
    .with('DIRECTIVE_REMOVED', () => 'removed' as const)
    .with('DIRECTIVE_ADDED', () => 'added' as const)
    .otherwise(() => 'modified' as const);

  return {
    name: fieldName,
    type: extractTypeName(change.message),
    changeType,
    description: change.message,
    breaking: isBreaking,
    deprecationReason:
      change.type === 'FIELD_DEPRECATED' ? change.message : undefined,
  };
}

/**
 * Convert GraphQL Inspector Change to our TypeChange format
 */
function convertInspectorChangeToTypeChange(change: {
  type: string;
  criticality?: { level?: string };
  path?: string;
  message: string;
}): TypeChange {
  const isBreaking = change.criticality?.level === 'BREAKING';

  // Extract type name and kind from the change
  const typeName = extractTypeName(change.path || change.message);
  const typeKind = extractTypeKind(change.message);

  const changeType = match(change.type)
    .with('TYPE_REMOVED', () => 'removed' as const)
    .with('TYPE_ADDED', () => 'added' as const)
    .otherwise(() => 'modified' as const);

  return {
    name: typeName,
    kind: typeKind,
    changeType,
    breaking: isBreaking,
    description: change.message,
  };
}

/**
 * Extract field name from change path or message
 */
function extractFieldName(pathOrMessage: string): string {
  // Try to extract field name from path like "Query.field" or from message
  const fieldMatch = pathOrMessage.match(/\.([a-zA-Z_][a-zA-Z0-9_]*)/);
  if (fieldMatch && fieldMatch[1]) {
    return fieldMatch[1];
  }

  // Fallback: try to extract from message
  const messageMatch =
    pathOrMessage.match(/field `([^`]+)`/i) ||
    pathOrMessage.match(/`([^`]+)` field/i);
  if (messageMatch && messageMatch[1]) {
    return messageMatch[1];
  }

  return 'unknown';
}

/**
 * Extract type name from change path or message
 */
function extractTypeName(pathOrMessage: string): string {
  // Try to extract type name from path like "Type.field" or from message
  const typeMatch = pathOrMessage.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
  if (typeMatch && typeMatch[1]) {
    return typeMatch[1];
  }

  // Fallback: try to extract from message
  const messageMatch =
    pathOrMessage.match(/type `([^`]+)`/i) ||
    pathOrMessage.match(/`([^`]+)` type/i);
  if (messageMatch && messageMatch[1]) {
    return messageMatch[1];
  }

  return 'Unknown';
}

/**
 * Extract GraphQL type kind from message
 */
function extractTypeKind(
  message: string,
): 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'SCALAR' | 'INPUT_OBJECT' {
  return match(message.toLowerCase())
    .when(
      (m) => m.includes('enum'),
      () => 'ENUM' as const,
    )
    .when(
      (m) => m.includes('interface'),
      () => 'INTERFACE' as const,
    )
    .when(
      (m) => m.includes('union'),
      () => 'UNION' as const,
    )
    .when(
      (m) => m.includes('scalar'),
      () => 'SCALAR' as const,
    )
    .when(
      (m) => m.includes('input'),
      () => 'INPUT_OBJECT' as const,
    )
    .otherwise(() => 'OBJECT' as const);
}

/**
 * Compare two GraphQL schemas using GraphQL Inspector
 */
export async function compareSchemas(
  fromSchema: GraphQLSchema,
  toSchema: GraphQLSchema,
  fromVersion: ExtendedApiVersion,
  toVersion: ExtendedApiVersion,
  apiType: ApiType,
): Promise<SchemaChangelog> {
  // Our schemas are JSON introspection results, convert them to GraphQL Schema objects
  // The buildClientSchema expects IntrospectionQuery result, but we have GraphQLSchema type
  const fromGraphQLSchema = buildClientSchema(
    fromSchema as unknown as Parameters<typeof buildClientSchema>[0],
  );
  const toGraphQLSchema = buildClientSchema(
    toSchema as unknown as Parameters<typeof buildClientSchema>[0],
  );

  // Use GraphQL Inspector to get changes
  const changes = await diff(fromGraphQLSchema, toGraphQLSchema);

  // Categorize changes
  const typeChanges: TypeChange[] = [];
  const queryChanges: FieldChange[] = [];
  const mutationChanges: FieldChange[] = [];
  const subscriptionChanges: FieldChange[] = [];

  for (const change of changes) {
    // Categorize by change type and target
    if (isTypeChange(change)) {
      typeChanges.push(convertInspectorChangeToTypeChange(change));
    } else if (isQueryChange(change)) {
      queryChanges.push(convertInspectorChangeToFieldChange(change));
    } else if (isMutationChange(change)) {
      mutationChanges.push(convertInspectorChangeToFieldChange(change));
    } else if (isSubscriptionChange(change)) {
      subscriptionChanges.push(convertInspectorChangeToFieldChange(change));
    }
  }

  // Calculate summary statistics
  const allChanges = [
    ...typeChanges,
    ...queryChanges,
    ...mutationChanges,
    ...subscriptionChanges,
  ];
  const summary = {
    totalChanges: changes.length,
    breakingChanges: changes.filter((c) => c.criticality?.level === 'BREAKING')
      .length,
    deprecations: changes.filter((c) => c.type === 'FIELD_DEPRECATED').length,
    additions: allChanges.filter((c) => c.changeType === 'added').length,
    removals: allChanges.filter((c) => c.changeType === 'removed').length,
    modifications: allChanges.filter((c) => c.changeType === 'modified').length,
  };

  const changelog: SchemaChangelog = {
    fromVersion,
    toVersion,
    apiType,
    generatedAt: new Date().toISOString(),
    summary,
    changes: {
      types: typeChanges,
      queries: queryChanges,
      mutations: mutationChanges,
      subscriptions: subscriptionChanges,
      enums: typeChanges.filter((t) => t.kind === 'ENUM'),
    },
  };

  // Validate the changelog
  const validation = SchemaChangelogSchema.safeParse(changelog);
  if (!validation.success) {
    throw new Error(
      `Invalid schema changelog: ${validation.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  return validation.data;
}

/**
 * Check if a change affects a type definition
 */
function isTypeChange(change: { type: string }): boolean {
  return (
    change.type.includes('TYPE_') ||
    change.type.includes('ENUM_') ||
    change.type.includes('UNION_') ||
    change.type.includes('INTERFACE_') ||
    change.type.includes('SCALAR_') ||
    change.type.includes('INPUT_')
  );
}

/**
 * Check if a change affects Query fields
 */
function isQueryChange(change: { path?: string; message: string }): boolean {
  return (
    (change.path || change.message).startsWith('Query.') ||
    change.message.includes('Query type')
  );
}

/**
 * Check if a change affects Mutation fields
 */
function isMutationChange(change: { path?: string; message: string }): boolean {
  return (
    (change.path || change.message).startsWith('Mutation.') ||
    change.message.includes('Mutation type')
  );
}

/**
 * Check if a change affects Subscription fields
 */
function isSubscriptionChange(change: {
  path?: string;
  message: string;
}): boolean {
  return (
    (change.path || change.message).startsWith('Subscription.') ||
    change.message.includes('Subscription type')
  );
}

// =============================================================================
// Multi-API Comparison
// =============================================================================

/**
 * Compare schemas across all APIs between two versions
 */
export async function compareAllApis(
  fromVersion: ExtendedApiVersion,
  toVersion: ExtendedApiVersion,
  schemaLoader: (
    api: ApiType,
    version: ExtendedApiVersion,
  ) => Promise<GraphQLSchema>,
): Promise<MultiApiChangelog> {
  const changelogs: Record<string, SchemaChangelog> = {};
  const apisSummary: Record<string, { changes: number; breaking: number }> = {};

  let totalChanges = 0;
  let totalBreakingChanges = 0;

  for (const api of SUPPORTED_APIS) {
    try {
      const fromSchema = await schemaLoader(api, fromVersion);
      const toSchema = await schemaLoader(api, toVersion);

      const changelog = await compareSchemas(
        fromSchema,
        toSchema,
        fromVersion,
        toVersion,
        api,
      );

      changelogs[api] = changelog;
      apisSummary[api] = {
        changes: changelog.summary.totalChanges,
        breaking: changelog.summary.breakingChanges,
      };

      totalChanges += changelog.summary.totalChanges;
      totalBreakingChanges += changelog.summary.breakingChanges;
    } catch (error) {
      console.error(
        `Failed to compare ${api} API: ${error instanceof Error ? error.message : error}`,
      );
      // Continue with other APIs even if one fails
      apisSummary[api] = { changes: 0, breaking: 0 };
    }
  }

  const multiApiChangelog: MultiApiChangelog = {
    fromVersion,
    toVersion,
    generatedAt: new Date().toISOString(),
    changelogs,
    summary: {
      totalApis: SUPPORTED_APIS.length,
      totalChanges,
      totalBreakingChanges,
      apisSummary,
    },
  };

  // Validate the multi-API changelog
  const validation = MultiApiChangelogSchema.safeParse(multiApiChangelog);
  if (!validation.success) {
    throw new Error(
      `Invalid multi-API changelog: ${validation.error.issues.map((i) => i.message).join(', ')}`,
    );
  }

  return validation.data;
}

// =============================================================================
// Changelog Analysis and Formatting
// =============================================================================

/**
 * Analyze the impact level of changes
 */
export function analyzeChangeImpact(changelog: SchemaChangelog): {
  level: 'none' | 'minor' | 'major' | 'breaking';
  description: string;
  recommendations: string[];
} {
  const { summary } = changelog;

  return match(summary)
    .when(
      (s) => s.totalChanges === 0,
      () => ({
        level: 'none' as const,
        description: 'No changes detected',
        recommendations: ['No action required'],
      }),
    )
    .when(
      (s) => s.breakingChanges > 0,
      () => ({
        level: 'breaking' as const,
        description: `${summary.breakingChanges} breaking changes detected`,
        recommendations: [
          'Review all breaking changes carefully',
          'Update your code before upgrading',
          'Test thoroughly in staging environment',
          'Consider gradual migration strategy',
        ],
      }),
    )
    .when(
      (s) => s.additions > s.removals && s.deprecations > 0,
      () => ({
        level: 'major' as const,
        description: 'Significant additions and deprecations',
        recommendations: [
          'Review deprecated fields and plan migration',
          'Explore new features and capabilities',
          'Update documentation and types',
        ],
      }),
    )
    .otherwise(() => ({
      level: 'minor' as const,
      description: 'Minor changes and improvements',
      recommendations: [
        'Review changelog for new features',
        'Update types and documentation',
        'Safe to upgrade with standard testing',
      ],
    }));
}

/**
 * Generate a human-readable summary of changes
 */
export function formatChangelogSummary(changelog: SchemaChangelog): string {
  const { summary, apiType, fromVersion, toVersion } = changelog;

  if (summary.totalChanges === 0) {
    return `No changes in ${apiType} API between ${fromVersion} and ${toVersion}`;
  }

  const parts: string[] = [];

  if (summary.additions > 0) {
    parts.push(`+${summary.additions} additions`);
  }

  if (summary.removals > 0) {
    parts.push(`-${summary.removals} removals`);
  }

  if (summary.modifications > 0) {
    parts.push(`~${summary.modifications} modifications`);
  }

  if (summary.deprecations > 0) {
    parts.push(`⚠️ ${summary.deprecations} deprecations`);
  }

  if (summary.breakingChanges > 0) {
    parts.push(`💥 ${summary.breakingChanges} breaking`);
  }

  return `${apiType} API (${fromVersion} → ${toVersion}): ${parts.join(', ')}`;
}
