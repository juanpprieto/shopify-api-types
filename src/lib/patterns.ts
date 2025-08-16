import { match, P } from 'ts-pattern';
import type {
  ApiType,
  ExtendedApiVersion,
  OperationResult,
  BatchValidationResult,
  FileOperationResult,
} from './zod.js';
import { FilePathSchema } from './zod.js';

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

// =============================================================================
// Validation Patterns
// =============================================================================

/**
 * Process validation results and log appropriate messages
 */
export function processValidationResults(
  results: BatchValidationResult,
): boolean {
  const totalChecks = results.results.length;
  const failures = results.results.filter((v) => !v.isValid);

  if (results.allValid) {
    // Silent success - no console output needed
    return true;
  }

  console.error(
    `\n❌ Validation failed: ${failures.length}/${totalChecks} checks failed\n`,
  );

  failures.forEach((validation) => {
    console.error(
      `  ❌ ${validation.apiType}/${validation.version}: ${validation.error || 'Invalid'}`,
    );
  });

  return false;
}

// =============================================================================
// Error Classification Patterns
// =============================================================================

/**
 * TypeScript error categorizer for better error handling
 */
export function classifyTypeScriptError(output: string): {
  category: 'syntax' | 'type' | 'module' | 'config' | 'unknown';
  errorCount: number;
  warnings: number;
} {
  const errorCount = (output.match(/error TS\d+:/g) || []).length;
  const warnings = (output.match(/warning/gi) || []).length;

  const category = match(output)
    .when(
      (text) =>
        /Cannot find module|Could not find a declaration file/i.test(text),
      () => 'module' as const,
    )
    .when(
      (text) =>
        /Type '.*' is not assignable to type|Property '.*' does not exist/i.test(
          text,
        ),
      () => 'type' as const,
    )
    .when(
      (text) => /Unexpected token|Expected/i.test(text),
      () => 'syntax' as const,
    )
    .when(
      (text) => /tsconfig\.json|compilerOptions/i.test(text),
      () => 'config' as const,
    )
    .otherwise(() => 'unknown' as const);

  return { category, errorCount, warnings };
}

/**
 * File system error categorizer
 */
export function classifyFileSystemError(error: unknown): {
  category: 'not_found' | 'permission' | 'disk_space' | 'network' | 'unknown';
  userActionRequired: boolean;
  suggestion?: string;
} {
  return match(error)
    .with({ code: 'ENOENT' }, () => ({
      category: 'not_found' as const,
      userActionRequired: true,
      suggestion: 'Check if the file path is correct',
    }))
    .with({ code: 'EACCES' }, () => ({
      category: 'permission' as const,
      userActionRequired: true,
      suggestion: 'Check file permissions or run with appropriate access',
    }))
    .with({ code: 'ENOSPC' }, () => ({
      category: 'disk_space' as const,
      userActionRequired: true,
      suggestion: 'Free up disk space',
    }))
    .with({ code: P.string.includes('ENETWORK') }, () => ({
      category: 'network' as const,
      userActionRequired: true,
      suggestion: 'Check network connection',
    }))
    .otherwise(() => ({
      category: 'unknown' as const,
      userActionRequired: false,
    }));
}

/**
 * Build error classifier
 */
export function classifyBuildError(error: unknown): {
  category: 'typescript' | 'missing_file' | 'permission' | 'config' | 'unknown';
  recoverable: boolean;
} {
  return match(error)
    .when(
      (e) => String(e).includes('tsc') || String(e).includes('TS'),
      () => ({
        category: 'typescript' as const,
        recoverable: false,
      }),
    )
    .when(
      (e) => String(e).includes('ENOENT'),
      () => ({
        category: 'missing_file' as const,
        recoverable: true,
      }),
    )
    .when(
      (e) => String(e).includes('EACCES'),
      () => ({
        category: 'permission' as const,
        recoverable: false,
      }),
    )
    .when(
      (e) =>
        String(e).includes('tsconfig') || String(e).includes('package.json'),
      () => ({
        category: 'config' as const,
        recoverable: false,
      }),
    )
    .otherwise(() => ({
      category: 'unknown' as const,
      recoverable: false,
    }));
}

// =============================================================================
// Environment Validation
// =============================================================================

/**
 * Validate environment variables
 */
export function validateEnvironment(env: NodeJS.ProcessEnv): {
  success: boolean;
  error?: string;
} {
  const requiredVars = ['SHOPIFY_STOREFRONT_TOKEN'];
  const missing = requiredVars.filter((v) => !env[v]);

  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }

  return {
    success: true,
  };
}

// =============================================================================
// File Operation Patterns
// =============================================================================

/**
 * File path resolver with validation
 */
export function createFilePathResolver(basePath: string): {
  resolve: (...segments: string[]) => string;
  relative: (from: string, to: string) => string;
} {
  // Validate base path
  const validatedBase = FilePathSchema.parse(basePath);

  return {
    resolve: (...segments: string[]): string => {
      const fullPath = [validatedBase, ...segments]
        .join('/')
        .replace(/\/+/g, '/');
      return FilePathSchema.parse(fullPath);
    },
    relative: (from: string, to: string): string => {
      const fromParts = from.split('/').filter(Boolean);
      const toParts = to.split('/').filter(Boolean);

      let common = 0;
      while (
        common < fromParts.length &&
        common < toParts.length &&
        fromParts[common] === toParts[common]
      ) {
        common++;
      }

      const up = fromParts.length - common - 1;
      const down = toParts.slice(common);

      return [...Array(up).fill('..'), ...down].join('/') || '.';
    },
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
 * Analyze file operation results for summary reporting
 */
export function analyzeFileOperations(results: FileOperationResult[]): {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ path: string; error: string; code?: string }>;
  executionTime: number;
} {
  const total = results.length;
  const successful = results.filter((r) => r.success).length;
  const failed = total - successful;
  const errors = results
    .filter((r): r is FileOperationResult & { success: false } => !r.success)
    .map((r) => ({
      path: r.filePath || 'unknown',
      error: r.error || 'Unknown error',
    }));

  const executionTime = 0; // Not available in FileOperationResult

  return { total, successful, failed, errors, executionTime };
}
