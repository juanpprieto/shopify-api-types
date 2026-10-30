import { describe, it, expect, vi } from 'vitest';
import { compareSchemas } from '../../scripts/lib/schema-compare.js';
import type { GraphQLSchema } from '../../scripts/lib/zod.js';

// Mock the graphql-inspector diff function to avoid GraphQL module conflicts
vi.mock('@graphql-inspector/core', () => ({
  diff: vi.fn(async (fromSchema, toSchema) => {
    // Simple mock implementation that returns changes based on schema differences
    const changes: Array<{
      type: string;
      path: string;
      message: string;
      criticality: { level: string };
    }> = [];

    // For testing purposes, we'll generate changes based on the test scenario
    // This is determined by checking the test schemas passed in
    if (fromSchema.getTypeMap && toSchema.getTypeMap) {
      const fromTypes = Object.keys(fromSchema.getTypeMap());
      const toTypes = Object.keys(toSchema.getTypeMap());

      // Find added types
      toTypes.forEach((type) => {
        if (!fromTypes.includes(type) && !type.startsWith('__')) {
          changes.push({
            type: 'TYPE_ADDED',
            path: type,
            message: `Type '${type}' was added`,
            criticality: { level: 'NON_BREAKING' },
          });
        }
      });

      // Find removed types
      fromTypes.forEach((type) => {
        if (!toTypes.includes(type) && !type.startsWith('__')) {
          changes.push({
            type: 'TYPE_REMOVED',
            path: type,
            message: `Type '${type}' was removed`,
            criticality: { level: 'BREAKING' },
          });
        }
      });
    }

    return changes;
  }),
}));

// Mock buildClientSchema to avoid GraphQL conflicts
vi.mock('graphql', () => ({
  buildClientSchema: vi.fn((introspectionResult) => {
    // Return a mock GraphQL schema object with the types from introspection
    const types = introspectionResult.__schema?.types || [];
    const typeMap: Record<string, unknown> = {};

    types.forEach((type: { name?: string }) => {
      if (type.name && !type.name.startsWith('__')) {
        typeMap[type.name] = type;
      }
    });

    return {
      getTypeMap: (): Record<string, unknown> => typeMap,
      getQueryType: (): { name: string } => ({ name: 'Query' }),
      getMutationType: (): { name: string } => ({ name: 'Mutation' }),
      getSubscriptionType: (): null => null,
    };
  }),
}));

// Helper to create a minimal GraphQL schema for testing
function createTestSchema(types: string[]): GraphQLSchema {
  return {
    __schema: {
      queryType: { name: 'Query' },
      mutationType: { name: 'Mutation' },
      subscriptionType: null,
      types: [
        { name: 'Query', kind: 'OBJECT' },
        { name: 'Mutation', kind: 'OBJECT' },
        ...types.map((name) => ({ name, kind: 'OBJECT' })),
      ],
      directives: [],
    },
  } as GraphQLSchema;
}

describe('Schema Comparison', () => {
  describe('compareSchemas', () => {
    it('should detect added types', async () => {
      const fromSchema = createTestSchema(['Product', 'Cart']);
      const toSchema = createTestSchema(['Product', 'Cart', 'Checkout']);

      const result = await compareSchemas(
        fromSchema,
        toSchema,
        '2025-04',
        '2025-07',
        'storefront',
      );

      expect(result.summary.additions).toBe(1);
      expect(result.summary.totalChanges).toBe(1);
      expect(result.changes.types).toHaveLength(1);
      expect(result.changes.types[0]).toMatchObject({
        name: 'Checkout',
        changeType: 'added',
        breaking: false,
      });
    });

    it('should detect removed types', async () => {
      const fromSchema = createTestSchema(['Product', 'Cart', 'Checkout']);
      const toSchema = createTestSchema(['Product', 'Cart']);

      const result = await compareSchemas(
        fromSchema,
        toSchema,
        '2025-04',
        '2025-07',
        'storefront',
      );

      expect(result.summary.removals).toBe(1);
      expect(result.summary.breakingChanges).toBe(1); // Removals are breaking
      expect(result.changes.types[0]).toMatchObject({
        name: 'Checkout',
        changeType: 'removed',
        breaking: true,
      });
    });

    it('should handle identical schemas', async () => {
      const schema = createTestSchema(['Product', 'Cart']);

      const result = await compareSchemas(
        schema,
        schema,
        '2025-04',
        '2025-07',
        'storefront',
      );

      expect(result.summary.totalChanges).toBe(0);
      expect(result.summary.breakingChanges).toBe(0);
      expect(result.changes.types).toHaveLength(0);
    });

    it('should include version and API information', async () => {
      const fromSchema = createTestSchema(['Product']);
      const toSchema = createTestSchema(['Product', 'Cart']);

      const result = await compareSchemas(
        fromSchema,
        toSchema,
        '2025-04',
        '2025-07',
        'admin',
      );

      expect(result.fromVersion).toBe('2025-04');
      expect(result.toVersion).toBe('2025-07');
      expect(result.apiType).toBe('admin');
      expect(result.generatedAt).toBeDefined();
    });
  });
});
