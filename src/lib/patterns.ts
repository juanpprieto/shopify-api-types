import { match, P } from 'ts-pattern';
import type {
  ApiType,
  ApiVersion,
  OperationResult,
  SchemaFetchResult,
  ValidationResult,
  BatchValidationResult,
  GraphQLSchema,
} from './schemas.js';

// =============================================================================
// API Type Patterns
// =============================================================================

/**
 * Match API type for endpoint generation
 */
export function matchApiEndpoint(
  apiType: ApiType,
  version: ApiVersion,
  storeDomain?: string,
): string {
  return match(apiType)
    .with(
      'storefront',
      () =>
        `https://hydrogen-preview.myshopify.com/api/${version}/graphql.json`,
    )
    .with(
      'customer-account',
      () => 'https://app.myshopify.com/services/graphql/introspection/customer',
    )
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
