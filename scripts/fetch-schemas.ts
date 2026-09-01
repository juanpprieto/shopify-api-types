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
 * Thrown when Shopify serves a different version than requested
 * (fall-forward), which means the requested version is retired.
 */
class VersionRetiredError extends Error {
  constructor(requested: string, served: string) {
    super(
      `Version fell forward: requested ${requested}, Shopify served ${served}. ` +
        `The requested version is retired.`,
    );
    this.name = 'VersionRetiredError';
  }
}

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

    // Guard against Shopify's fall-forward behavior: a request for a retired
    // version returns 200 with the oldest supported version's schema. The
    // x-shopify-api-version header reports the version that was served.
    const servedVersion = response.headers.get('x-shopify-api-version');
    if (
      version !== 'unstable' &&
      servedVersion !== null &&
      servedVersion !== version
    ) {
      throw new VersionRetiredError(version, servedVersion);
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
    // Keep the existing repo file ONLY for the explicit fall-forward signal
    // (version retired on Shopify's side). Every other failure (bad token,
    // network, outage) must fail loudly - a silent keep would mask real
    // problems and leave stale schemas.
    if (error instanceof VersionRetiredError) {
      const existingPath = path.join(
        'src',
        'graphql-schemas',
        apiType,
        `${version}.json`,
      );
      const existingFile = await fs
        .stat(existingPath)
        .then(() => true)
        .catch(() => false);

      if (existingFile) {
        console.warn(`⚠ ${error.message} Keeping existing ${existingPath}.`);
        return;
      }

      console.error(
        `✗ ${error.message} No existing schema file at ${existingPath}.`,
      );
      throw error;
    }

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
    ...versionSet.olderSupported,
    versionSet.releaseCandidate,
    versionSet.unstable,
  ];

  console.log(`📋 Fetching schemas for:`);
  console.log(`   Current: ${versionSet.current}`);
  console.log(`   Previous: ${versionSet.previous}`);
  console.log(`   Older supported: ${versionSet.olderSupported.join(', ')}`);
  console.log(`   Release Candidate: ${versionSet.releaseCandidate}`);
  console.log(`   Unstable: ${versionSet.unstable}\n`);

  const apis: ApiType[] = ['storefront', 'customer-account', 'admin'];

  // Backup existing schema files before fetching. The customer-account
  // endpoint sends no x-shopify-api-version header, so its fall-forward
  // responses can only be detected AFTER download (see below) - and then
  // the original file must be restorable.
  const backups = new Map<string, string>();
  for (const api of apis) {
    for (const version of allVersions) {
      const filePath = path.join(
        'src',
        'graphql-schemas',
        api,
        `${version}.json`,
      );
      const content = await fs.readFile(filePath, 'utf-8').catch(() => null);
      if (content !== null) {
        backups.set(`${api}/${version}`, content);
      }
    }
  }

  const fetchPromises: Promise<void>[] = [];

  for (const api of apis) {
    for (const version of allVersions) {
      fetchPromises.push(fetchApiSchema(api, version));
    }
  }

  try {
    await Promise.all(fetchPromises);
  } catch {
    console.error('\nSome schemas failed to fetch');
    process.exit(1);
  }

  // Fall-forward detection by content: when an endpoint gives no version
  // header, a retired version is served as the oldest supported version -
  // byte-identical to a newer version's schema. Distinct quarters are never
  // byte-identical, so equality means fall-forward.
  const datedVersions = allVersions
    .filter((v): v is string => v !== 'unstable')
    .sort()
    .reverse(); // newest first

  let restoredCount = 0;
  for (const api of apis) {
    const contents = new Map<string, string>();
    for (const version of datedVersions) {
      const filePath = path.join(
        'src',
        'graphql-schemas',
        api,
        `${version}.json`,
      );
      const content = await fs.readFile(filePath, 'utf-8').catch(() => null);
      if (content !== null) {
        contents.set(version, content);
      }
    }

    for (let i = 1; i < datedVersions.length; i++) {
      const older = datedVersions[i];
      if (older === undefined) continue;
      const olderContent = contents.get(older);
      if (olderContent === undefined) continue;

      const duplicateOf = datedVersions
        .slice(0, i)
        .find((newer) => contents.get(newer) === olderContent);
      if (duplicateOf === undefined) continue;

      const filePath = path.join(
        'src',
        'graphql-schemas',
        api,
        `${older}.json`,
      );
      const backup = backups.get(`${api}/${older}`);

      if (backup !== undefined && backup !== olderContent) {
        await fs.writeFile(filePath, backup, 'utf-8');
        console.warn(
          `⚠ ${api}/${older} content is identical to ${duplicateOf} (fall-forward). ` +
            `Restored the previous ${filePath}.`,
        );
        restoredCount++;
      } else if (backup === undefined) {
        console.error(
          `✗ ${api}/${older} content is identical to ${duplicateOf} (fall-forward) ` +
            `and no previous file exists to restore.`,
        );
        process.exit(1);
      }
    }
  }

  console.log(
    `\nAll schemas fetched successfully!${restoredCount > 0 ? ` (${restoredCount} retired version(s) restored from existing files)` : ''}`,
  );
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchSchemas().catch(console.error);
}
