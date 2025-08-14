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
 * Supported API types array - single source of truth
 * Validated constant to eliminate hardcoded arrays across scripts
 */
export const SUPPORTED_APIS: ApiType[] = [
  'storefront',
  'customer-account',
  'admin',
];

/**
 * Schema for validating API arrays
 */
export const ApiArraySchema = z.array(ApiTypeSchema).min(1);

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
 * Build validation result (types-only build)
 */
export const BuildValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
});
export type BuildValidationResult = z.infer<typeof BuildValidationResultSchema>;

/**
 * Type validation result with detailed error categorization
 */
export const TypeValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
});
export type TypeValidationResult = z.infer<typeof TypeValidationResultSchema>;

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

// =============================================================================
// File System and Build Schemas
// =============================================================================

// =============================================================================
// Atomic Base Schemas - Building blocks for all validations
// =============================================================================

/**
 * Basic string validation atoms
 */
export const NonEmptyStringSchema = z.string().min(1);
export const MinLengthContentSchema = z.string().min(10);

/**
 * File path atoms for different file types
 */
export const FilePathSchema = NonEmptyStringSchema;
export const JsonFilePathSchema = NonEmptyStringSchema.refine(
  (path) => path.endsWith('.json'),
  'Must be a JSON file path',
);
export const TypescriptFilePathSchema = NonEmptyStringSchema.refine(
  (path) => path.endsWith('.ts'),
  'Must be a TypeScript file path',
);
export const DeclarationFilePathSchema = NonEmptyStringSchema.refine(
  (path) => path.endsWith('.d.ts'),
  'Must be a TypeScript declaration file path',
);
export const DistPathSchema = NonEmptyStringSchema.refine(
  (path) => path.startsWith('./dist/'),
  'Must be a dist directory path',
);

/**
 * Content validation atoms
 */
export const TemplateContentSchema = MinLengthContentSchema;
export const IndexFileContentSchema = NonEmptyStringSchema;

/**
 * Package.json structure validation
 */
export const PackageJsonSchema = z
  .object({
    name: NonEmptyStringSchema,
    version: NonEmptyStringSchema,
    exports: z.record(z.string(), z.string()).optional(),
    typesVersions: z
      .record(z.string(), z.record(z.string(), z.array(z.string())))
      .optional(),
  })
  .passthrough();

// =============================================================================
// Atomic Operation Result Schemas
// =============================================================================

/**
 * Base operation result atoms
 */
export const SuccessSchema = z.boolean();
export const ErrorMessageSchema = NonEmptyStringSchema.optional();
export const FileSizeSchema = z.number().min(0).optional();

/**
 * Operation category atoms
 */
export const FileCategorySchema = z.enum([
  'root',
  'api',
  'version',
  'schema',
  'export',
  'generation',
]);

/**
 * Composable result schemas built from atoms
 */
export const BaseResultSchema = z.object({
  success: SuccessSchema,
  error: ErrorMessageSchema,
});

export const FileOperationResultSchema = BaseResultSchema.extend({
  filePath: FilePathSchema,
  size: FileSizeSchema,
});

export const CategorizedFileResultSchema = FileOperationResultSchema.extend({
  category: FileCategorySchema,
});

// Export types
export type FileOperationResult = z.infer<typeof FileOperationResultSchema>;
export type CategorizedFileResult = z.infer<typeof CategorizedFileResultSchema>;

// =============================================================================
// HTTP and Network Schemas
// =============================================================================

/**
 * HTTP status code atoms
 */
export const HttpStatusCodeSchema = z.number().int().min(100).max(599);
export const HttpOkStatusSchema = z.number().int().min(200).max(299);
export const HttpErrorStatusSchema = z.number().int().min(400).max(599);

/**
 * HTTP response atoms
 */
export const HttpResponseSchema = z.object({
  status: HttpStatusCodeSchema,
  statusText: NonEmptyStringSchema,
  data: z.unknown(),
});

/**
 * Network error schema
 */
export const NetworkErrorSchema = BaseResultSchema.extend({
  code: z.enum(['NETWORK_ERROR', 'TIMEOUT', 'ABORT']).optional(),
  status: HttpStatusCodeSchema.optional(),
});

// =============================================================================
// CodeGen Configuration Schemas
// =============================================================================

/**
 * Shopify scalar type mappings (from hydrogen-react)
 * These are the standard scalar mappings used across all Shopify GraphQL schemas
 */
export const ShopifyScalarMappingSchema = z.object({
  DateTime: z.literal('string'),
  Decimal: z.literal('string'),
  HTML: z.literal('string'),
  URL: z.literal('string'),
  JSON: z.literal('unknown'),
  Color: z.literal('string'),
  UnsignedInt64: z.literal('string'),
  Money: z.literal('string'),
  ISO8601DateTime: z.literal('string'),
});

export type ShopifyScalarMapping = z.infer<typeof ShopifyScalarMappingSchema>;

/**
 * Validated Shopify scalars constant - single source of truth
 */
export const SHOPIFY_SCALARS: ShopifyScalarMapping = {
  DateTime: 'string',
  Decimal: 'string',
  HTML: 'string',
  URL: 'string',
  JSON: 'unknown',
  Color: 'string',
  UnsignedInt64: 'string',
  Money: 'string',
  ISO8601DateTime: 'string',
};

/**
 * Generic scalar mapping schema for custom mappings
 */
export const ScalarMappingSchema = z.record(
  NonEmptyStringSchema,
  NonEmptyStringSchema,
);

/**
 * CodeGen plugin configuration
 */
export const CodeGenPluginSchema = z.union([
  NonEmptyStringSchema,
  z.object({}).passthrough(),
]);

/**
 * CodeGen configuration schema
 */
export const CodeGenConfigSchema = z.object({
  schema: NonEmptyStringSchema,
  plugins: z.array(CodeGenPluginSchema),
  config: z.object({}).passthrough().optional(),
});

/**
 * Naming convention configuration
 */
export const NamingConventionSchema = z.object({
  typeNames: NonEmptyStringSchema.optional(),
  enumValues: NonEmptyStringSchema.optional(),
  fieldNames: NonEmptyStringSchema.optional(),
});

/**
 * Complete codegen output configuration
 */
export const CodeGenOutputConfigSchema = z.object({
  schema: NonEmptyStringSchema,
  plugins: z.array(CodeGenPluginSchema),
  config: z
    .object({
      skipTypename: z.boolean().optional(),
      enumsAsTypes: z.boolean().optional(),
      scalars: ScalarMappingSchema.optional(),
      avoidOptionals: z.boolean().optional(),
      maybeValue: NonEmptyStringSchema.optional(),
      namingConvention: NamingConventionSchema.optional(),
    })
    .passthrough()
    .optional(),
});

/**
 * Full codegen configuration
 */
export const FullCodeGenConfigSchema = z.object({
  overwrite: z.boolean().optional(),
  generates: z.record(NonEmptyStringSchema, CodeGenOutputConfigSchema),
});

export type CodeGenOutputConfig = z.infer<typeof CodeGenOutputConfigSchema>;
export type FullCodeGenConfig = z.infer<typeof FullCodeGenConfigSchema>;

// =============================================================================
// Test and Validation Schemas
// =============================================================================

/**
 * Test execution result atoms
 */
export const TestResultSchema = BaseResultSchema.extend({
  duration: z.number().min(0).optional(),
  output: NonEmptyStringSchema.optional(),
});

/**
 * File existence check result
 */
export const FileExistenceSchema = z.object({
  path: FilePathSchema,
  exists: z.boolean(),
  type: z.enum(['file', 'directory', 'unknown']).optional(),
});

// =============================================================================
// Documentation Generation Schemas
// =============================================================================

/**
 * Representative types for each API - used in README examples
 */
export const RepresentativeTypesSchema = z.object({
  types: z.array(NonEmptyStringSchema).min(1),
  total: z.number().min(1),
  description: NonEmptyStringSchema,
});

export type RepresentativeTypes = z.infer<typeof RepresentativeTypesSchema>;

/**
 * API documentation configuration
 */
export const ApiDocsConfigSchema = z.object({
  'storefront': RepresentativeTypesSchema,
  'customer-account': RepresentativeTypesSchema,
  'admin': RepresentativeTypesSchema,
});

export type ApiDocsConfig = z.infer<typeof ApiDocsConfigSchema>;

/**
 * Complete documentation configuration
 */
export const DocsConfigSchema = z.object({
  currentPackageVersion: NonEmptyStringSchema,
  latestShopifyApiVersion: ApiVersionSchema,
  supportedVersions: z.array(ApiVersionSchema).min(1).max(4),
  representativeTypes: ApiDocsConfigSchema,
  generatedAt: z.string().datetime(),
});

export type DocsConfig = z.infer<typeof DocsConfigSchema>;

/**
 * Package release history for historical documentation
 */
export const PackageReleaseSchema = z.object({
  version: NonEmptyStringSchema,
  supportedApiVersions: z.array(ApiVersionSchema).min(1).max(4),
  releaseDate: z.string().datetime(),
  status: z.enum(['current', 'previous', 'older', 'oldest']),
});

export type PackageRelease = z.infer<typeof PackageReleaseSchema>;

/**
 * Complete release history configuration
 */
export const ReleaseHistorySchema = z.object({
  releases: z.array(PackageReleaseSchema).min(1).max(4),
});

export type ReleaseHistory = z.infer<typeof ReleaseHistorySchema>;

/**
 * Default representative types configuration
 */
export const DEFAULT_REPRESENTATIVE_TYPES: ApiDocsConfig = {
  'storefront': {
    types: ['Product', 'Cart', 'Checkout'],
    total: 200,
    description: 'Product catalog, cart, checkout, and others',
  },
  'customer-account': {
    types: ['Customer', 'Order', 'MailingAddress'],
    total: 50,
    description: 'Customer profiles, orders, addresses, and others',
  },
  'admin': {
    types: ['Shop', 'Webhook', 'InventoryLevel'],
    total: 500,
    description: 'Store management, webhooks, analytics, and others',
  },
};
