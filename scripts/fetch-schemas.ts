import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { match } from 'ts-pattern';
import { getLastFourVersions } from './version-utils.js';
import type { ApiType, ApiVersion } from '../src/lib/schemas.js';
import {
  matchApiEndpoint,
  matchAuthHeaders,
  validateEnvironment,
} from '../src/lib/patterns.js';

async function fetchApiSchema(
  apiType: ApiType,
  version: ApiVersion,
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

  const url = matchApiEndpoint(
    apiType,
    version,
    process.env['SHOPIFY_STORE_DOMAIN'],
  );
  const headers = matchAuthHeaders(apiType, token);

  // eslint-disable-next-line no-console -- CLI output for user feedback during schema fetching
  console.log(`Fetching ${apiType} schema for version ${version}...`);

  try {
    const query = `
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
        inputFields {
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

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = (await response.json()) as {
      data?: unknown;
      errors?: unknown;
    };

    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    // Save schema
    const outputDir = path.join('src', 'schemas', apiType);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, `${version}.json`);
    await fs.writeFile(outputPath, JSON.stringify(json.data, null, 2));

    // eslint-disable-next-line no-console -- CLI output for success feedback
    console.log(`✓ Saved ${apiType} schema to ${outputPath}`);
  } catch (error) {
    console.error(
      `✗ Failed to fetch ${apiType} schema for ${version}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

async function fetchSchemas(): Promise<void> {
  const env = validateEnvironment(process.env);

  if (!env.hasValidTokens) {
    console.error('No valid API tokens found in environment');
    env.warnings.forEach((warning) => console.error(`- ${warning}`));
    process.exit(1);
  }

  // eslint-disable-next-line no-console -- CLI output for operation start
  console.log('Fetching GraphQL schemas for configured APIs...\n');

  const versions = getLastFourVersions();
  const fetchPromises: Promise<void>[] = [];

  for (const api of env.availableApis) {
    for (const version of versions) {
      fetchPromises.push(fetchApiSchema(api, version));
    }
  }

  try {
    await Promise.all(fetchPromises);
    // eslint-disable-next-line no-console -- CLI output for operation success
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
