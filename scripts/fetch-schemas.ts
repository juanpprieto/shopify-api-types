import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { match } from 'ts-pattern';
import { getCurrentVersionSet } from './version-utils.js';
import type { ApiType, ExtendedApiVersion } from '../src/lib/zod.js';
import {
  matchApiEndpoint,
  matchAuthHeaders,
  validateEnvironment,
  classifyFileSystemError,
  createFileOperationHandler,
} from '../src/lib/patterns.js';

/**
 * GraphQL introspection query - single source of truth
 * Standard introspection query that works across all Shopify GraphQL APIs
 */
const GRAPHQL_INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
        args {
          ...InputValue
        }
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields(includeDeprecated: true) {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchApiSchema(
  apiType: ApiType,
  version: ExtendedApiVersion,
): Promise<void> {
  const token = match(apiType)
    .with(
      'storefront',
      () => process.env['SHOPIFY_STOREFRONT_ACCESS_TOKEN'] || '',
    )
    .with(
      'customer-account',
      () => process.env['SHOPIFY_CUSTOMER_ACCOUNT_ACCESS_TOKEN'] || '',
    )
    .with('admin', () => process.env['SHOPIFY_ADMIN_ACCESS_TOKEN'] || '')
    .exhaustive();

  if (!token) {
    throw new Error(`No access token configured for ${apiType} API`);
  }

  let url = matchApiEndpoint(
    apiType,
    version,
    process.env['SHOPIFY_STORE_DOMAIN'],
  );

  const isCustomerAccount = apiType === 'customer-account';

  // Customer Account API needs special query parameters
  if (apiType === 'customer-account') {
    url = `${url}?api_client_api_key=${token}&api_version=${version}`;
  }
  const headers = matchAuthHeaders(apiType, token);

  console.log(`Fetching ${apiType} schema for version ${version}...`);

  try {
    // Use standardized introspection query
    const query = GRAPHQL_INTROSPECTION_QUERY;

    const fetchOptions: RequestInit = {
      method: isCustomerAccount ? 'GET' : 'POST',
      headers,
    };

    if (!isCustomerAccount) {
      fetchOptions.body = JSON.stringify({ query });
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const isRetryable = [408, 429, 502, 503, 504].includes(response.status);
      const category = response.status >= 500 ? 'server' : 'client';
      throw new Error(
        `HTTP ${response.status} (${category}): ${response.statusText}${isRetryable ? ' - Retryable' : ''}`,
      );
    }

    let schemaData: unknown;

    if (isCustomerAccount) {
      // Customer Account API returns schema directly
      schemaData = await response.json();
    } else {
      // Storefront and Admin APIs return GraphQL response with data field
      const json = (await response.json()) as {
        data?: unknown;
        errors?: unknown;
      };

      if (json.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
      }

      schemaData = json.data;
    }

    // Save schema using enhanced file operation handler
    const fileHandler = createFileOperationHandler();
    const outputDir = path.join('src', 'graphql-schemas', apiType);
    const outputPath = path.join(outputDir, `${version}.json`);
    const schemaJson = JSON.stringify(schemaData, null, 2);

    const result = await fileHandler(
      {
        operation: 'write',
        target: outputPath,
        metadata: { apiType, version, schemaSize: schemaJson.length },
      },
      async () => {
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputPath, schemaJson, 'utf-8');
        return { size: Buffer.byteLength(schemaJson, 'utf-8') };
      },
    );

    if (result.success) {
      console.log(
        `✓ Saved ${apiType}/${version}.json (${result.data.size} bytes)`,
      );
    } else {
      throw new Error(`Failed to save schema: ${result.error}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      const { category } = classifyFileSystemError(error);
      console.error(
        `✗ Failed to fetch ${apiType}/${version} (${category}):`,
        error.message,
      );
    } else {
      console.error(`✗ Failed to fetch ${apiType}/${version}:`, String(error));
    }
    throw error;
  }
}

async function fetchSchemas(): Promise<void> {
  const env = validateEnvironment(process.env);

  if (!env.success) {
    console.error('Environment validation failed:');
    if (env.error) {
      console.error(`- ${env.error}`);
    }
    process.exit(1);
  }

  console.log('🔄 Fetching GraphQL schemas for all version types...\n');

  const versionSet = getCurrentVersionSet();
  const allVersions: ExtendedApiVersion[] = [
    versionSet.current,
    versionSet.previous,
    versionSet.releaseCandidate,
    versionSet.unstable,
  ];

  console.log(`📋 Fetching schemas for:`);
  console.log(`   Current: ${versionSet.current}`);
  console.log(`   Previous: ${versionSet.previous}`);
  console.log(`   Release Candidate: ${versionSet.releaseCandidate}`);
  console.log(`   Unstable: ${versionSet.unstable}\n`);

  const fetchPromises: Promise<void>[] = [];

  for (const api of ['storefront', 'customer-account', 'admin'] as ApiType[]) {
    for (const version of allVersions) {
      fetchPromises.push(fetchApiSchema(api, version));
    }
  }

  try {
    await Promise.all(fetchPromises);

    console.log('\nAll schemas fetched successfully!');
  } catch {
    console.error('\nSome schemas failed to fetch');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchSchemas().catch(console.error);
}
