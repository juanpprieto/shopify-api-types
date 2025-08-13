import { z } from 'zod';

// =============================================================================
// Core Shopify API Types
// =============================================================================

/**
 * Shopify API types that our tooling supports
 */
export const ApiTypeSchema = z.enum([
  'storefront',
  'customer-account',
  'admin',
]);
export type ApiType = z.infer<typeof ApiTypeSchema>;

/**
 * Shopify API version in YYYY-MM format
 */
export const ApiVersionSchema = z
  .string()
  .regex(
    /^\d{4}-(01|04|07|10)$/,
    'API version must be in YYYY-MM format with valid quarters (01, 04, 07, 10)',
  );
export type ApiVersion = z.infer<typeof ApiVersionSchema>;

/**
 * Shopify store domain (without .myshopify.com suffix)
 */
export const StoreDomainSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?!-))*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
    'Store domain must contain only alphanumeric characters and single hyphens',
  );
export type StoreDomain = z.infer<typeof StoreDomainSchema>;

/**
 * Shopify access token validation
 */
export const AccessTokenSchema = z
  .string()
  .min(10)
  .refine(
    (token) => !token.includes('your_') || !token.includes('_here'),
    'Token cannot be a placeholder value',
  );
export type AccessToken = z.infer<typeof AccessTokenSchema>;

// =============================================================================
// Environment Configuration
// =============================================================================

/**
 * Environment variables schema for schema fetching
 */
export const EnvConfigSchema = z.object({
  SHOPIFY_STORE_DOMAIN: StoreDomainSchema.optional(),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: AccessTokenSchema.optional(),
  SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN: AccessTokenSchema.optional(),
  SHOPIFY_ADMIN_ACCESS_TOKEN: AccessTokenSchema.optional(),
});
export type EnvConfig = z.infer<typeof EnvConfigSchema>;

// =============================================================================
// Schema Fetching Types
// =============================================================================

/**
 * HTTP request headers
 */
export const HeadersSchema = z.record(z.string(), z.string());
export type Headers = z.infer<typeof HeadersSchema>;

/**
 * Schema fetch options
 */
export const FetchOptionsSchema = z.object({
  url: z.string().url(),
  headers: HeadersSchema,
  apiType: ApiTypeSchema,
  version: ApiVersionSchema,
});
export type FetchOptions = z.infer<typeof FetchOptionsSchema>;

/**
 * GraphQL schema structure validation
 */
export const GraphQLSchemaSchema = z.object({
  __schema: z.object({
    queryType: z.object({
      name: z.string(),
    }),
    mutationType: z
      .object({
        name: z.string(),
      })
      .nullable(),
    subscriptionType: z
      .object({
        name: z.string(),
      })
      .nullable(),
    types: z.array(z.unknown()), // Types array can be complex, validate structure exists
  }),
});
export type GraphQLSchema = z.infer<typeof GraphQLSchemaSchema>;

// =============================================================================
// Operation Results
// =============================================================================

/**
 * Operation result types for pattern matching
 */
export const OperationResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.unknown(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
  }),
]);
export type OperationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Schema fetch result
 */
export const SchemaFetchResultSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.object({
      apiType: ApiTypeSchema,
      version: ApiVersionSchema,
      schema: GraphQLSchemaSchema,
      filePath: z.string(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    apiType: ApiTypeSchema,
    version: ApiVersionSchema,
    code: z.string().optional(),
  }),
]);
export type SchemaFetchResult = z.infer<typeof SchemaFetchResultSchema>;

// =============================================================================
// Validation Result Types
// =============================================================================

/**
 * Schema validation result
 */
export const ValidationResultSchema = z.object({
  apiType: ApiTypeSchema,
  version: ApiVersionSchema,
  filePath: z.string(),
  isValid: z.boolean(),
  error: z.string().optional(),
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Batch validation results
 */
export const BatchValidationResultSchema = z.object({
  results: z.array(ValidationResultSchema),
  allValid: z.boolean(),
  validCount: z.number(),
  totalCount: z.number(),
});
export type BatchValidationResult = z.infer<typeof BatchValidationResultSchema>;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Safe parse with detailed error information
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): OperationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessage = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  return {
    success: false,
    error: `Validation failed: ${errorMessage}`,
    code: 'VALIDATION_ERROR',
  };
}

/**
 * Create type-safe environment config
 */
export function parseEnvConfig(
  env: Record<string, string | undefined>,
): OperationResult<EnvConfig> {
  return safeParse(EnvConfigSchema, env);
}
