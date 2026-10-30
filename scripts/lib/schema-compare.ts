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
} from './zod.js';
import { SchemaChangelogSchema } from './zod.js';

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
    ...(change.path ? { path: change.path } : {}),
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
  const fieldChanges: FieldChange[] = [];

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
    } else {
      // Field and argument changes on other types (for example a removed
      // Customer field). Without this group they were dropped.
      fieldChanges.push(convertInspectorChangeToFieldChange(change));
    }
  }

  // Calculate summary statistics
  const allChanges = [
    ...typeChanges,
    ...queryChanges,
    ...mutationChanges,
    ...subscriptionChanges,
    ...fieldChanges,
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
      fields: fieldChanges,
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
    // Shopify names its query root "QueryRoot"
    /^Query(Root)?\./.test(change.path || change.message) ||
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
