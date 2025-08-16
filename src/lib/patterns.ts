import { match, P } from 'ts-pattern';
import { z } from 'zod';
import type {
  ApiType,
  ApiVersion,
  ExtendedApiVersion,
  OperationResult,
  SchemaFetchResult,
  ValidationResult,
  BatchValidationResult,
  GraphQLSchema,
  FileOperationResult,
  CategorizedFileResult,
  DocsConfig,
  PackageRelease,
  ReleaseHistory,
  CodeGenOutputConfig,
  FullCodeGenConfig,
} from './zod.js';
import { DEFAULT_REPRESENTATIVE_TYPES, SHOPIFY_SCALARS } from './zod.js';
import {
  ApiTypeSchema,
  ApiVersionSchema,
  ExtendedApiVersionSchema,
  FilePathSchema,
  CodeGenOutputConfigSchema,
  FullCodeGenConfigSchema,
} from './zod.js';

// =============================================================================
// API Type Patterns
// =============================================================================

/**
 * Match API type for endpoint generation
 */
export function matchApiEndpoint(
  apiType: ApiType,
  version: ExtendedApiVersion,
  storeDomain?: string,
): string {
  return match(apiType)
    .with('storefront', () => {
      if (!storeDomain) {
        throw new Error('Store domain required for Storefront API');
      }
      return `https://${storeDomain}.myshopify.com/api/${version}/graphql.json`;
    })
    .with('customer-account', () => {
      // Customer Account API doesn't use version in URL path, but as query param
      return 'https://app.myshopify.com/services/graphql/introspection/customer';
    })
    .with('admin', () => {
      if (!storeDomain) {
        throw new Error('Store domain required for Admin API');
      }
      return `https://${storeDomain}.myshopify.com/admin/api/${version}/graphql.json`;
    })
    .exhaustive();
}

/**
 * Match API type for authentication headers
 */
export function matchAuthHeaders(
  apiType: ApiType,
  token: string,
): Record<string, string> {
  const baseHeaders = { 'Content-Type': 'application/json' };

  return match(apiType)
    .with('storefront', () => ({
      ...baseHeaders,
      'X-Shopify-Storefront-Access-Token': token,
    }))
    .with('customer-account', () => ({
      ...baseHeaders,
      'Authorization': token,
      'User-Agent': '@juanpprieto/shopify-api-types',
    }))
    .with('admin', () => ({
      ...baseHeaders,
      'X-Shopify-Access-Token': token,
    }))
    .exhaustive();
}

// =============================================================================
// Result Patterns
// =============================================================================

/**
 * Handle operation results with exhaustive pattern matching
 */
export function handleOperationResult<T, R>(
  result: OperationResult<T>,
  handlers: {
    onSuccess: (data: T) => R;
    onError: (error: string, code?: string) => R;
  },
): R {
  return match(result)
    .with({ success: true }, (res) => handlers.onSuccess(res.data))
    .with({ success: false }, (res) => handlers.onError(res.error, res.code))
    .exhaustive();
}

/**
 * Handle schema fetch results with specific error handling
 */
export function handleSchemaFetchResult<R>(
  result: SchemaFetchResult,
  handlers: {
    onSuccess: (data: {
      apiType: ApiType;
      version: ApiVersion;
      schema: GraphQLSchema;
      filePath: string;
    }) => R;
    onAuthError: (apiType: ApiType, version: ApiVersion) => R;
    onNotFoundError: (apiType: ApiType, version: ApiVersion) => R;
    onValidationError: (
      apiType: ApiType,
      version: ApiVersion,
      error: string,
    ) => R;
    onGenericError: (apiType: ApiType, version: ApiVersion, error: string) => R;
  },
): R {
  return match(result)
    .with({ success: true }, (res) => handlers.onSuccess(res.data))
    .with({ success: false, code: '401' }, (res) =>
      handlers.onAuthError(res.apiType, res.version),
    )
    .with({ success: false, code: '404' }, (res) =>
      handlers.onNotFoundError(res.apiType, res.version),
    )
    .with({ success: false, code: 'VALIDATION_ERROR' }, (res) =>
      handlers.onValidationError(res.apiType, res.version, res.error),
    )
    .with({ success: false }, (res) =>
      handlers.onGenericError(res.apiType, res.version, res.error),
    )
    .exhaustive();
}

// =============================================================================
// Validation Patterns
// =============================================================================

/**
 * Process validation results with pattern matching
 */
export function processValidationResults(
  results: ValidationResult[],
): BatchValidationResult {
  const validCount = results.filter((r) => r.isValid).length;
  const totalCount = results.length;
  const allValid = validCount === totalCount;

  // Log results with pattern matching
  results.forEach((result) => {
    match(result)
      .with({ isValid: true }, (res) => {
        // eslint-disable-next-line no-console -- CLI output for validation success
        console.log(`✓ Valid schema: ${res.apiType}/${res.version}.json`);
      })
      .with({ isValid: false }, (res) => {
        const errorType = match(res.error)
          .with(P.string.includes('ENOENT'), () => 'Missing schema')
          .with(P.string.includes('JSON'), () => 'Invalid JSON')
          .with(P.string.includes('__schema'), () => 'Invalid schema structure')
          .otherwise(() => 'Validation error');

        console.error(`✗ ${errorType}: ${res.filePath}`);
        if (res.error && !res.error.includes('ENOENT')) {
          console.error(`  Error: ${res.error}`);
        }
      })
      .exhaustive();
  });

  return {
    results,
    allValid,
    validCount,
    totalCount,
  };
}

// =============================================================================
// Error Classification Patterns
// =============================================================================

/**
 * Classify HTTP errors for better handling
 */
export function classifyHttpError(status: number): {
  category: 'auth' | 'not-found' | 'client' | 'server' | 'network';
  code: string;
  retry: boolean;
} {
  return match(status)
    .with(401, () => ({
      category: 'auth' as const,
      code: '401',
      retry: false,
    }))
    .with(403, () => ({
      category: 'auth' as const,
      code: '403',
      retry: false,
    }))
    .with(404, () => ({
      category: 'not-found' as const,
      code: '404',
      retry: false,
    }))
    .with(P.number.between(400, 499), () => ({
      category: 'client' as const,
      code: status.toString(),
      retry: false,
    }))
    .with(P.number.between(500, 599), () => ({
      category: 'server' as const,
      code: status.toString(),
      retry: true,
    }))
    .with(0, () => ({
      category: 'network' as const,
      code: 'NETWORK_ERROR',
      retry: true,
    }))
    .otherwise(() => ({
      category: 'client' as const,
      code: status.toString(),
      retry: false,
    }));
}

// =============================================================================
// Environment Validation Patterns
// =============================================================================

/**
 * Validate environment configuration with pattern matching
 */
export function validateEnvironment(env: Record<string, string | undefined>): {
  hasValidTokens: boolean;
  availableApis: ApiType[];
  warnings: string[];
} {
  const availableApis: ApiType[] = [];
  const warnings: string[] = [];

  // Check each API token with pattern matching
  const storefrontValid = match(env['SHOPIFY_STOREFRONT_ACCESS_TOKEN'])
    .with(
      P.string.minLength(10),
      (token) => !token.includes('your_') && !token.includes('_here'),
    )
    .otherwise(() => false);

  const customerAccountValid = match(
    env['SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN'],
  )
    .with(
      P.string.minLength(10),
      (token) => !token.includes('your_') && !token.includes('_here'),
    )
    .otherwise(() => false);

  const adminValid = match({
    token: env['SHOPIFY_ADMIN_ACCESS_TOKEN'],
    domain: env['SHOPIFY_STORE_DOMAIN'],
  })
    .with(
      {
        token: P.string.minLength(10),
        domain: P.string.minLength(1),
      },
      ({ token, domain }) =>
        !token.includes('your_') &&
        !token.includes('_here') &&
        !domain.includes('your_'),
    )
    .otherwise(() => false);

  if (storefrontValid) availableApis.push('storefront');
  else warnings.push('Storefront API token not configured');

  if (customerAccountValid) availableApis.push('customer-account');
  else warnings.push('Customer Account API token not configured');

  if (adminValid) availableApis.push('admin');
  else warnings.push('Admin API token or store domain not configured');

  return {
    hasValidTokens: availableApis.length > 0,
    availableApis,
    warnings,
  };
}

// =============================================================================
// Reusable Pattern Functions for Scripts
// =============================================================================

/**
 * Generic validator with pattern matching for different outcomes
 */
export function validateAndProcess<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  data: unknown,
  processor: (validated: TInput) => OperationResult<TOutput>,
): OperationResult<TOutput> {
  return match(schema.safeParse(data))
    .with({ success: true }, (result) => processor(result.data))
    .with({ success: false }, (result) => ({
      success: false as const,
      error: `Validation failed: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
      code: 'VALIDATION_ERROR',
    }))
    .exhaustive();
}

/**
 * Create API processor with validation and type-specific handling
 */
export function createApiProcessor<T>(handlers: {
  'storefront': (version: ApiVersion) => T;
  'customer-account': (version: ApiVersion) => T;
  'admin': (version: ApiVersion) => T;
}) {
  return (api: unknown, version: unknown): OperationResult<T> => {
    return validateAndProcess(ApiTypeSchema, api, (validApi) =>
      validateAndProcess(ApiVersionSchema, version, (validVersion) => {
        const result = match(validApi)
          .with('storefront', () => handlers.storefront(validVersion))
          .with('customer-account', () =>
            handlers['customer-account'](validVersion),
          )
          .with('admin', () => handlers.admin(validVersion))
          .exhaustive();

        return { success: true as const, data: result };
      }),
    );
  };
}

/**
 * File path resolver with pattern matching for different file types
 */
export function createFilePathResolver(basePath: string) {
  type FileType = 'types' | 'index' | 'schema' | 'declaration';
  type PathVariant = 'source' | 'dist';

  return (
    api: ApiType,
    version: ExtendedApiVersion,
    fileType: FileType,
    variant: PathVariant = 'source',
  ): OperationResult<string> => {
    return validateAndProcess(ApiTypeSchema, api, (validApi) =>
      validateAndProcess(ExtendedApiVersionSchema, version, (validVersion) => {
        const resolvedPath = match({ fileType, variant, api: validApi })
          .with(
            { fileType: 'types', variant: 'source' },
            () => `${basePath}/src/${validApi}/${validVersion}/types.ts`,
          )
          .with(
            { fileType: 'types', variant: 'dist' },
            () => `${basePath}/dist/${validApi}/${validVersion}/types.d.ts`,
          )
          .with(
            { fileType: 'index', variant: 'source' },
            () => `${basePath}/src/${validApi}/${validVersion}/index.ts`,
          )
          .with(
            { fileType: 'index', variant: 'dist' },
            () => `${basePath}/dist/${validApi}/${validVersion}/index.d.ts`,
          )
          .with(
            { fileType: 'schema' },
            () =>
              `${basePath}/src/graphql-schemas/${validApi}/${validVersion}.json`,
          )
          .with(
            { fileType: 'declaration' },
            () => `${basePath}/dist/${validApi}/${validVersion}/index.d.ts`,
          )
          .exhaustive();

        return validateAndProcess(FilePathSchema, resolvedPath, (path) => ({
          success: true as const,
          data: path,
        }));
      }),
    );
  };
}

/**
 * Simple helper for API-level index paths (e.g., src/storefront/index.ts)
 */
export function createApiIndexPath(
  basePath: string,
  api: ApiType,
  variant: 'source' | 'dist' = 'source',
): string {
  const extension = variant === 'source' ? 'ts' : 'd.ts';
  return `${basePath}/${variant === 'source' ? 'src' : 'dist'}/${api}/index.${extension}`;
}

/**
 * Simple helper for root index paths (e.g., src/index.ts)
 */
export function createRootIndexPath(
  basePath: string,
  variant: 'source' | 'dist' = 'source',
): string {
  const extension = variant === 'source' ? 'ts' : 'd.ts';
  return `${basePath}/${variant === 'source' ? 'src' : 'dist'}/index.${extension}`;
}

/**
 * Enhanced file operation handler with comprehensive error categorization
 */
export function createFileOperationHandler() {
  type FileOperationContext = {
    operation: 'copy' | 'write' | 'read' | 'delete' | 'check';
    source?: string;
    target: string;
    metadata?: Record<string, unknown>;
  };

  return async function handleFileOperation<T>(
    context: FileOperationContext,
    operation: () => Promise<T>,
  ): Promise<
    OperationResult<
      T & { context: FileOperationContext; executionTime: number }
    >
  > {
    const startTime = Date.now();

    try {
      const result = await operation();
      const executionTime = Date.now() - startTime;

      return {
        success: true as const,
        data: { ...result, context, executionTime },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return match(error)
        .with({ code: 'ENOENT' }, () => ({
          success: false as const,
          error: `File not found: ${context.source || context.target}`,
          code: 'FILE_NOT_FOUND',
          context: { ...context, executionTime },
        }))
        .with({ code: 'EACCES' }, () => ({
          success: false as const,
          error: `Permission denied: ${context.target}`,
          code: 'PERMISSION_DENIED',
          context: { ...context, executionTime },
        }))
        .with({ code: 'ENOSPC' }, () => ({
          success: false as const,
          error: `No space left on device: ${context.target}`,
          code: 'DISK_FULL',
          context: { ...context, executionTime },
        }))
        .when(
          (e): e is Error => e instanceof Error,
          (err) => ({
            success: false as const,
            error: err.message,
            code: 'FILE_OPERATION_ERROR',
            context: { ...context, executionTime },
          }),
        )
        .otherwise(() => ({
          success: false as const,
          error: 'Unknown file operation error',
          code: 'UNKNOWN_ERROR',
          context: { ...context, executionTime },
        }));
    }
  };
}

/**
 * Command execution error categorizer with actionable suggestions
 */
export function classifyCommandError(error: unknown): {
  category:
    | 'missing-command'
    | 'permission-error'
    | 'spawn-error'
    | 'execution-error'
    | 'timeout';
  severity: 'error' | 'warning';
  recoverable: boolean;
  suggestion: string;
} {
  return match(error)
    .when(
      (e): e is Error => e instanceof Error && e.message.includes('ENOENT'),
      () => ({
        category: 'missing-command' as const,
        severity: 'error' as const,
        recoverable: false,
        suggestion:
          'Ensure the command exists in PATH or install required dependencies',
      }),
    )
    .when(
      (e): e is Error => e instanceof Error && e.message.includes('EACCES'),
      () => ({
        category: 'permission-error' as const,
        severity: 'error' as const,
        recoverable: true,
        suggestion: 'Check file permissions or run with appropriate privileges',
      }),
    )
    .when(
      (e): e is Error => e instanceof Error && e.message.includes('spawn'),
      () => ({
        category: 'spawn-error' as const,
        severity: 'error' as const,
        recoverable: false,
        suggestion:
          'Command failed to start - verify executable exists and is accessible',
      }),
    )
    .when(
      (e): e is Error => e instanceof Error && e.message.includes('timeout'),
      () => ({
        category: 'timeout' as const,
        severity: 'warning' as const,
        recoverable: true,
        suggestion:
          'Command timed out - consider increasing timeout or check for hanging processes',
      }),
    )
    .otherwise(() => ({
      category: 'execution-error' as const,
      severity: 'error' as const,
      recoverable: false,
      suggestion:
        'Unknown execution error - check command syntax and arguments',
    }));
}

/**
 * Configuration builder with pattern matching for different targets
 */
export function createConfigurationBuilder() {
  type ConfigTarget = {
    api: ApiType;
    version: ApiVersion;
    outputType: 'typescript' | 'json' | 'index';
    variant?: 'types-only' | 'runtime';
    options?: Record<string, unknown>;
  };

  return (target: ConfigTarget): OperationResult<Record<string, unknown>> => {
    return validateAndProcess(ApiTypeSchema, target.api, (api) =>
      validateAndProcess(ApiVersionSchema, target.version, (version) => {
        const config = match({ ...target, api, version })
          .with({ outputType: 'typescript', variant: 'types-only' }, (t) => ({
            schema: `./src/graphql-schemas/${t.api}/${t.version}.json`,
            plugins: ['typescript'],
            config: {
              skipTypename: true,
              enumsAsTypes: true,
              avoidOptionals: false,
              maybeValue: 'T | null | undefined',
              ...t.options,
            },
          }))
          .with({ outputType: 'index' }, (t) => ({
            content: `// Auto-generated index file\nexport * from './types.js';\n`,
            path: `./src/${t.api}/${t.version}/index.ts`,
          }))
          .with({ outputType: 'json' }, (t) => ({
            source: `./src/graphql-schemas/${t.api}/${t.version}.json`,
            target: `./dist/schemas/${t.api}/${t.version}.json`,
          }))
          .otherwise(() => ({}));

        return { success: true as const, data: config };
      }),
    );
  };
}

/**
 * Result processor with pattern matching for different operation outcomes
 */
export function processOperationResults<T extends { success: boolean }>(
  results: T[],
  handlers: {
    onAllSuccess: (results: T[]) => void;
    onPartialFailure: (successful: T[], failed: T[]) => void;
    onAllFailure: (results: T[]) => void;
    onEmpty: () => void;
  },
): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  match({
    hasResults: results.length > 0,
    hasSuccess: successful.length > 0,
    hasFailures: failed.length > 0,
  })
    .with({ hasResults: false }, () => handlers.onEmpty())
    .with({ hasResults: true, hasSuccess: true, hasFailures: false }, () =>
      handlers.onAllSuccess(results),
    )
    .with({ hasResults: true, hasSuccess: false, hasFailures: true }, () =>
      handlers.onAllFailure(results),
    )
    .with({ hasResults: true, hasSuccess: true, hasFailures: true }, () =>
      handlers.onPartialFailure(successful, failed),
    )
    .with({ hasResults: true, hasSuccess: false, hasFailures: false }, () =>
      handlers.onEmpty(),
    ) // Edge case: empty results
    .exhaustive();
}

// =============================================================================
// File Operation Patterns
// =============================================================================

/**
 * Analyze file operation results with pattern matching
 */
export function analyzeFileOperations(results: FileOperationResult[]): {
  successful: number;
  failed: number;
  totalSize: number;
  missingFiles: number;
  otherErrors: number;
} {
  return results.reduce(
    (acc, result) => {
      match(result)
        .with({ success: true }, (r) => {
          acc.successful++;
          acc.totalSize += r.size || 0;
        })
        .with({ success: false, error: P.string.includes('ENOENT') }, () => {
          acc.missingFiles++;
        })
        .with({ success: false }, () => {
          acc.otherErrors++;
        })
        .exhaustive();
      return acc;
    },
    { successful: 0, failed: 0, totalSize: 0, missingFiles: 0, otherErrors: 0 },
  );
}

/**
 * Categorize file operation results by type
 */
export function categorizeFileResults(results: CategorizedFileResult[]): {
  root: number;
  api: number;
  version: number;
  schema: number;
  export: number;
  generation: number;
  failed: number;
} {
  return results.reduce(
    (acc, result) => {
      match(result)
        .with({ success: true, category: 'root' }, () => acc.root++)
        .with({ success: true, category: 'api' }, () => acc.api++)
        .with({ success: true, category: 'version' }, () => acc.version++)
        .with({ success: true, category: 'schema' }, () => acc.schema++)
        .with({ success: true, category: 'export' }, () => acc.export++)
        .with({ success: true, category: 'generation' }, () => acc.generation++)
        .with({ success: false }, () => acc.failed++)
        .exhaustive();
      return acc;
    },
    {
      root: 0,
      api: 0,
      version: 0,
      schema: 0,
      export: 0,
      generation: 0,
      failed: 0,
    },
  );
}

// =============================================================================
// Error Categorization Patterns
// =============================================================================

/**
 * Categorize build errors using pattern matching
 */
export function classifyBuildError(error: string): {
  category:
    | 'missing-root'
    | 'missing-api'
    | 'missing-version'
    | 'missing-schema'
    | 'other';
  severity: 'error' | 'warning';
} {
  return match(error)
    .with(P.string.includes('Missing root file'), () => ({
      category: 'missing-root' as const,
      severity: 'error' as const,
    }))
    .with(P.string.includes('root file'), () => ({
      category: 'missing-api' as const,
      severity: 'error' as const,
    }))
    .with(P.string.includes('Missing:') && P.string.includes('/'), () => ({
      category: 'missing-version' as const,
      severity: 'error' as const,
    }))
    .with(P.string.includes('Missing schema'), () => ({
      category: 'missing-schema' as const,
      severity: 'warning' as const,
    }))
    .otherwise(() => ({
      category: 'other' as const,
      severity: 'error' as const,
    }));
}

/**
 * Categorize TypeScript errors using pattern matching
 */
export function classifyTypeScriptError(output: string): {
  category: 'import' | 'compilation' | 'runtime' | 'unknown';
  actionable: boolean;
} {
  return match(output)
    .with(P.string.includes('Cannot find module'), () => ({
      category: 'import' as const,
      actionable: true,
    }))
    .with(P.string.includes('Cannot resolve'), () => ({
      category: 'import' as const,
      actionable: true,
    }))
    .with(P.string.includes('Type instantiation'), () => ({
      category: 'compilation' as const,
      actionable: false,
    }))
    .with(
      P.string.includes('Property') && P.string.includes('does not exist'),
      () => ({
        category: 'compilation' as const,
        actionable: true,
      }),
    )
    .otherwise(() => ({
      category: 'unknown' as const,
      actionable: false,
    }));
}

// =============================================================================
// File System Error Patterns
// =============================================================================

/**
 * Categorize file system errors
 */
export function classifyFileSystemError(error: Error): {
  category: 'permission' | 'not-found' | 'disk-full' | 'network' | 'unknown';
  retry: boolean;
  userActionRequired: boolean;
} {
  return match(error.message)
    .with(P.string.includes('EACCES'), () => ({
      category: 'permission' as const,
      retry: false,
      userActionRequired: true,
    }))
    .with(P.string.includes('ENOENT'), () => ({
      category: 'not-found' as const,
      retry: false,
      userActionRequired: true,
    }))
    .with(P.string.includes('ENOSPC'), () => ({
      category: 'disk-full' as const,
      retry: false,
      userActionRequired: true,
    }))
    .with(P.string.includes('ENETWORK'), () => ({
      category: 'network' as const,
      retry: true,
      userActionRequired: false,
    }))
    .otherwise(() => ({
      category: 'unknown' as const,
      retry: false,
      userActionRequired: false,
    }));
}

// =============================================================================
// Documentation Generation Patterns
// =============================================================================

/**
 * Create documentation configuration with pattern matching for different formats
 */
export function createDocsConfig(
  packageVersion: string,
  latestApiVersion: ApiVersion,
  supportedVersions: ApiVersion[],
): OperationResult<DocsConfig> {
  return validateAndProcess(z.string().min(1), packageVersion, (validVersion) =>
    validateAndProcess(ApiVersionSchema, latestApiVersion, (validLatest) => {
      const config: DocsConfig = {
        currentPackageVersion: validVersion,
        latestShopifyApiVersion: validLatest,
        supportedVersions: supportedVersions.slice(0, 4), // Last 4 versions only
        representativeTypes: DEFAULT_REPRESENTATIVE_TYPES,
        generatedAt: new Date().toISOString(),
      };

      return { success: true as const, data: config };
    }),
  );
}

/**
 * Generate import examples with pattern matching for different API types
 */
export function generateImportExamples(
  config: DocsConfig,
): Record<ApiType, string[]> {
  return match(config.supportedVersions.length)
    .when(
      (count) => count > 0,
      () => {
        const examples: Record<ApiType, string[]> = {
          'storefront': [],
          'customer-account': [],
          'admin': [],
        };

        config.supportedVersions.forEach((version) => {
          const versionVar = version.replace('-', '_');

          examples.storefront.push(
            `import { ${config.representativeTypes.storefront.types.join(', ')} } from '@juanpprieto/shopify-api-types/storefront/v${versionVar}';`,
          );

          examples['customer-account'].push(
            `import { ${config.representativeTypes['customer-account'].types.join(', ')} } from '@juanpprieto/shopify-api-types/customer-account/v${versionVar}';`,
          );

          examples.admin.push(
            `import { ${config.representativeTypes.admin.types.join(', ')} } from '@juanpprieto/shopify-api-types/admin/v${versionVar}';`,
          );
        });

        return examples;
      },
    )
    .otherwise(() => ({
      'storefront': [],
      'customer-account': [],
      'admin': [],
    }));
}

/**
 * Generate historical release tables showing last 4 package versions
 */
export function generateHistoricalReleaseTables(
  releaseHistory: ReleaseHistory,
): string {
  return releaseHistory.releases
    .map((release) => {
      const statusIcon = match(release.status)
        .with('current', () => '📦')
        .with('previous', () => '📦')
        .with('older', () => '📦')
        .with('oldest', () => '📦')
        .exhaustive();

      const statusLabel = match(release.status)
        .with('current', () => 'Current')
        .with('previous', () => 'Previous')
        .with('older', () => 'Older')
        .with('oldest', () => 'Oldest')
        .exhaustive();

      const sortedVersions = sortVersionsDescending(
        release.supportedApiVersions,
      );
      const rows = sortedVersions.map((version, index) => {
        const status = index === 0 ? '✅ Latest' : '✓ Supported';
        return `| ${version} | ${status} |`;
      });

      return [
        `### ${statusIcon} ${release.version} (${statusLabel})`,
        '| **Shopify API Version** | **Status** |',
        '|:---|:---|',
        ...rows,
      ].join('\n');
    })
    .join('\n\n');
}

/**
 * Create mock release history for current version (temporary until we have real history)
 */
export function createMockReleaseHistory(
  currentVersion: string,
  supportedVersions: ApiVersion[],
): ReleaseHistory {
  const currentDate = new Date().toISOString();

  // For now, create a simplified history based on current version
  // In the future, this would read from a release history file or Git tags
  const releases: PackageRelease[] = [
    {
      version: currentVersion,
      supportedApiVersions: [...supportedVersions],
      releaseDate: currentDate,
      status: 'current',
    },
  ];

  // Add mock previous versions if we can infer them
  if (currentVersion.includes('2025.7.')) {
    releases.push({
      version: '2025.4.1',
      supportedApiVersions: ['2025-04', '2025-01', '2024-10', '2024-07'],
      releaseDate: '2025-04-15T00:00:00.000Z',
      status: 'previous',
    });

    releases.push({
      version: '2025.1.0',
      supportedApiVersions: ['2025-01', '2024-10', '2024-07', '2024-04'],
      releaseDate: '2025-01-15T00:00:00.000Z',
      status: 'older',
    });

    releases.push({
      version: '2024.10.2',
      supportedApiVersions: ['2024-10', '2024-07', '2024-04', '2024-01'],
      releaseDate: '2024-10-15T00:00:00.000Z',
      status: 'oldest',
    });
  }

  return { releases };
}

/**
 * Generate version table with CalVer format (2025-10 → v2025.10.0)
 */
export function generateVersionTable(
  supportedVersions: ApiVersion[],
  currentPackageVersion: string,
): string {
  const sortedVersions = sortVersionsDescending(supportedVersions);

  const rows = sortedVersions.map((version, index) => {
    const shopifyVersion = version;
    const status = index === 0 ? '✅ Latest' : '✓ Supported';

    return `| ${shopifyVersion} | ${status} |`;
  });

  // Create a cleaner table with package version as header
  return [
    `| Package Version: **${currentPackageVersion}** ||`,
    '|:---|:---|',
    '| **Shopify API Version** | **Status** |',
    ...rows,
  ].join('\n');
}

/**
 * Sort API versions in descending order (newest first)
 */
export function sortVersionsDescending(versions: ApiVersion[]): ApiVersion[] {
  return [...versions].sort((a, b) => {
    // Convert YYYY-MM to comparable numbers
    const aNum = parseInt(a.replace('-', ''), 10);
    const bNum = parseInt(b.replace('-', ''), 10);
    return bNum - aNum;
  });
}

/**
 * Convert Shopify API version to CalVer package version
 */
export function convertToCalVer(
  apiVersion: ApiVersion,
  baseVersion: string,
): string {
  return match(apiVersion)
    .with(P.string.regex(/^(\d{4})-(\d{2})$/), (version) => {
      const [year, month] = version.split('-');
      if (!year || !month) {
        throw new Error(`Invalid API version format: ${version}`);
      }
      // Use base version's patch if provided, otherwise default to 0
      const versionParts = baseVersion.split('.');
      const patch =
        versionParts.length > 2 && versionParts[2] ? versionParts[2] : '0';
      return `v${year}.${parseInt(month, 10)}.${patch}`;
    })
    .otherwise(() => baseVersion);
}

// =============================================================================
// CodeGen Configuration Patterns
// =============================================================================

/**
 * Default CodeGen configuration for Shopify APIs
 */
export const DEFAULT_CODEGEN_CONFIG = {
  skipTypename: true,
  enumsAsTypes: true,
  scalars: SHOPIFY_SCALARS,
  avoidOptionals: false,
  maybeValue: 'T | null | undefined',
  namingConvention: {
    typeNames: 'pascal-case#pascalCase',
    enumValues: 'upper-case#upperCase',
  },
} as const;

/**
 * Create CodeGen output configuration for a specific API and version
 */
export function createCodeGenOutputConfig(
  api: ApiType,
  version: ExtendedApiVersion,
  basePath: string = '.',
  customConfig: Partial<CodeGenOutputConfig['config']> = {},
): OperationResult<CodeGenOutputConfig> {
  return validateAndProcess(ApiTypeSchema, api, (validApi) =>
    validateAndProcess(ExtendedApiVersionSchema, version, (validVersion) => {
      const schemaPath = `${basePath}/src/graphql-schemas/${validApi}/${validVersion}.json`;

      const config: CodeGenOutputConfig = {
        schema: schemaPath,
        plugins: ['typescript'],
        config: {
          ...DEFAULT_CODEGEN_CONFIG,
          ...customConfig,
        },
      };

      const validation = CodeGenOutputConfigSchema.safeParse(config);
      if (!validation.success) {
        return {
          success: false as const,
          error: `Invalid CodeGen configuration: ${validation.error.message}`,
          code: 'CODEGEN_CONFIG_ERROR',
        };
      }

      return { success: true as const, data: config };
    }),
  );
}

/**
 * Generate complete CodeGen configuration for multiple APIs and versions
 */
export function generateCodeGenConfig(
  apis: ApiType[],
  versions: ExtendedApiVersion[],
  basePath: string = '.',
  options: {
    overwrite?: boolean;
    apiSpecificConfigs?: Partial<
      Record<ApiType, Partial<CodeGenOutputConfig['config']>>
    >;
  } = {},
): OperationResult<FullCodeGenConfig> {
  const generates: Record<string, CodeGenOutputConfig> = {};

  for (const api of apis) {
    for (const version of versions) {
      const apiSpecificConfig = options.apiSpecificConfigs?.[api] || {};
      const configResult = createCodeGenOutputConfig(
        api,
        version,
        basePath,
        apiSpecificConfig,
      );

      if (!configResult.success) {
        return {
          success: false as const,
          error: `Failed to create config for ${api}/${version}: ${configResult.error}`,
          code: 'CODEGEN_GENERATION_ERROR',
        };
      }

      const outputPath = `${basePath}/src/${api}/${version}/types.ts`;
      generates[outputPath] = configResult.data;
    }
  }

  const fullConfig: FullCodeGenConfig = {
    overwrite: options.overwrite ?? true,
    generates,
  };

  const validation = FullCodeGenConfigSchema.safeParse(fullConfig);
  if (!validation.success) {
    return {
      success: false as const,
      error: `Invalid full CodeGen configuration: ${validation.error.message}`,
      code: 'FULL_CODEGEN_CONFIG_ERROR',
    };
  }

  return { success: true as const, data: fullConfig };
}

/**
 * Create API-specific CodeGen configuration with pattern matching
 */
export function createApiSpecificCodeGenConfig(
  api: ApiType,
  versions: ApiVersion[],
  basePath: string = '.',
): OperationResult<FullCodeGenConfig> {
  // API-specific configuration overrides
  const apiConfigs = match(api)
    .with('storefront', () => ({
      // Storefront API specific configuration
      enumsAsTypes: true,
      avoidOptionals: false,
    }))
    .with('customer-account', () => ({
      // Customer Account API specific configuration
      enumsAsTypes: true,
      avoidOptionals: true, // Customer Account API tends to have more optional fields
    }))
    .with('admin', () => ({
      // Admin API specific configuration
      enumsAsTypes: true,
      avoidOptionals: false,
      // Admin API has many more types, might need different naming
    }))
    .exhaustive();

  return generateCodeGenConfig([api], versions, basePath, {
    overwrite: true,
    apiSpecificConfigs: { [api]: apiConfigs },
  });
}

/**
 * Analyze CodeGen configuration for optimization opportunities
 */
export function analyzeCodeGenConfig(config: FullCodeGenConfig): {
  totalOutputs: number;
  apiBreakdown: Record<ApiType, number>;
  duplicateConfigs: string[];
  recommendedOptimizations: string[];
} {
  const totalOutputs = Object.keys(config.generates).length;
  const apiBreakdown: Record<ApiType, number> = {
    'storefront': 0,
    'customer-account': 0,
    'admin': 0,
  };

  // Analyze output paths to determine API breakdown
  Object.keys(config.generates).forEach((outputPath) => {
    match(outputPath)
      .when(
        (path) => path.includes('/storefront/'),
        () => apiBreakdown.storefront++,
      )
      .when(
        (path) => path.includes('/customer-account/'),
        () => apiBreakdown['customer-account']++,
      )
      .when(
        (path) => path.includes('/admin/'),
        () => apiBreakdown.admin++,
      )
      .otherwise(() => {});
  });

  // Find duplicate configurations
  const configHashes = new Map<string, string[]>();
  Object.entries(config.generates).forEach(([path, outputConfig]) => {
    const configHash = JSON.stringify(outputConfig.config);
    if (!configHashes.has(configHash)) {
      configHashes.set(configHash, []);
    }
    configHashes.get(configHash)?.push(path);
  });

  const duplicateConfigs = Array.from(configHashes.entries())
    .filter(([, paths]) => paths.length > 1)
    .map(([, paths]) => `Duplicate config used by: ${paths.join(', ')}`);

  // Generate optimization recommendations
  const recommendations: string[] = [];

  if (duplicateConfigs.length > 0) {
    recommendations.push(
      'Consider extracting common configurations to reduce duplication',
    );
  }

  if (totalOutputs > 20) {
    recommendations.push(
      'Large number of outputs - consider parallel generation',
    );
  }

  const hasLargeApis = Object.values(apiBreakdown).some((count) => count > 8);
  if (hasLargeApis) {
    recommendations.push(
      'Consider API-specific generation scripts for better performance',
    );
  }

  return {
    totalOutputs,
    apiBreakdown,
    duplicateConfigs,
    recommendedOptimizations: recommendations,
  };
}
