import fs from 'fs/promises';
import { match } from 'ts-pattern';
import { getSupportedVersions } from './version-utils.js';
import {
  ApiTypeSchema,
  ExtendedApiVersionSchema,
  GraphQLSchemaSchema,
  type ApiType,
  type ApiVersion,
  type GraphQLSchema,
  SUPPORTED_APIS,
} from './lib/zod.js';
import {
  createFileOperationHandler,
  createFilePathResolver,
  handleOperationResult,
} from './lib/patterns.js';

interface TypeCount {
  api: ApiType;
  version: ApiVersion;
  types: number;
  queries: number;
  mutations: number;
  subscriptions: number;
  enums: number;
  interfaces: number;
  unions: number;
  scalars: number;
}

interface TypeAnalysis {
  totalCounts: TypeCount[];
  summary: {
    totalTypes: number;
    averagePerApi: Record<ApiType, number>;
    latestVersionCounts: Record<ApiType, number>;
  };
}

/**
 * Count types in a GraphQL schema using pattern matching
 */
function countTypesInSchema(
  schema: GraphQLSchema,
  api: ApiType,
  version: ApiVersion,
): TypeCount {
  const types = (schema.__schema.types || []) as Array<{
    kind: string;
    name: string;
    fields?: unknown[];
  }>;

  type CountAccumulator = {
    types: number;
    enums: number;
    interfaces: number;
    unions: number;
    scalars: number;
  };

  const counts: CountAccumulator = types.reduce<CountAccumulator>(
    (acc, type) => {
      return match(type)
        .with({ kind: 'OBJECT' }, () => ({ ...acc, types: acc.types + 1 }))
        .with({ kind: 'ENUM' }, () => ({ ...acc, enums: acc.enums + 1 }))
        .with({ kind: 'INTERFACE' }, () => ({
          ...acc,
          interfaces: acc.interfaces + 1,
        }))
        .with({ kind: 'UNION' }, () => ({ ...acc, unions: acc.unions + 1 }))
        .with({ kind: 'SCALAR' }, () => ({ ...acc, scalars: acc.scalars + 1 }))
        .otherwise(() => acc);
    },
    {
      types: 0,
      enums: 0,
      interfaces: 0,
      unions: 0,
      scalars: 0,
    },
  );

  // Count root type fields (queries, mutations, subscriptions)
  const queryType = types.find(
    (t) => t.name === schema.__schema.queryType?.name,
  );
  const mutationType = types.find(
    (t) => t.name === schema.__schema.mutationType?.name,
  );
  const subscriptionType = types.find(
    (t) => t.name === schema.__schema.subscriptionType?.name,
  );

  return {
    api,
    version,
    types: counts.types,
    queries: queryType?.fields?.length || 0,
    mutations: mutationType?.fields?.length || 0,
    subscriptions: subscriptionType?.fields?.length || 0,
    enums: counts.enums,
    interfaces: counts.interfaces,
    unions: counts.unions,
    scalars: counts.scalars,
  };
}

/**
 * Count types across all supported API versions
 */
async function countTypes(): Promise<TypeAnalysis> {
  console.log('Counting types across all API versions...\n');

  const versions = getSupportedVersions();
  const pathResolver = createFilePathResolver(process.cwd());
  const fileHandler = createFileOperationHandler();
  const totalCounts: TypeCount[] = [];

  // Validate input data
  for (const api of SUPPORTED_APIS) {
    const apiValidation = ApiTypeSchema.safeParse(api);
    if (!apiValidation.success) {
      throw new Error(`Invalid API: ${api}`);
    }
  }

  for (const version of versions) {
    const versionValidation = ExtendedApiVersionSchema.safeParse(version);
    if (!versionValidation.success) {
      throw new Error(`Invalid version: ${version}`);
    }
  }

  // Process each API and version combination
  for (const api of SUPPORTED_APIS) {
    console.log(`\nAnalyzing ${api} API...`);

    for (const version of versions) {
      const schemaPath = pathResolver.resolve(
        'src',
        'graphql-schemas',
        api,
        `${version}.json`,
      );

      try {
        // Read schema file
        const readResult = await fileHandler(
          { operation: 'read', target: schemaPath },
          async () => {
            const content = await fs.readFile(schemaPath, 'utf-8');
            return { content, size: Buffer.byteLength(content, 'utf-8') };
          },
        );

        await handleOperationResult(readResult, {
          onSuccess: (data) => {
            // Parse and validate schema
            const schemaData = JSON.parse(data.content);

            // Normalize customer-account schema structure (it's wrapped in a "data" object)
            const normalizedSchema = schemaData.data?.__schema
              ? schemaData.data
              : schemaData;

            const schemaValidation =
              GraphQLSchemaSchema.safeParse(normalizedSchema);

            if (!schemaValidation.success) {
              console.warn(`Invalid schema format: ${api}/${version}`);
              return;
            }

            // Count types in this schema
            const typeCounts = countTypesInSchema(
              schemaValidation.data,
              api,
              version,
            );
            totalCounts.push(typeCounts);

            console.log(
              `  ${api}/${version}: ${typeCounts.types} types, ${typeCounts.queries} queries, ${typeCounts.mutations} mutations`,
            );
          },
          onError: (error) => {
            console.warn(`Could not read schema ${api}/${version}: ${error}`);
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(`Error processing ${api}/${version}: ${errorMessage}`);
      }
    }
  }

  // Generate summary analysis
  const latestVersion = versions[0]; // Assuming versions are sorted newest first
  const latestVersionCounts = totalCounts
    .filter((count) => count.version === latestVersion)
    .reduce(
      (acc, count) => {
        acc[count.api] = count.types;
        return acc;
      },
      {} as Record<ApiType, number>,
    );

  const averagePerApi = SUPPORTED_APIS.reduce(
    (acc, api) => {
      const apiCounts = totalCounts.filter((count) => count.api === api);
      const average =
        apiCounts.length > 0
          ? Math.round(
              apiCounts.reduce((sum, count) => sum + count.types, 0) /
                apiCounts.length,
            )
          : 0;
      acc[api] = average;
      return acc;
    },
    {} as Record<ApiType, number>,
  );

  const totalTypes = totalCounts.reduce((sum, count) => sum + count.types, 0);

  return {
    totalCounts,
    summary: {
      totalTypes,
      averagePerApi,
      latestVersionCounts,
    },
  };
}

/**
 * Display type analysis results
 */
function displayResults(analysis: TypeAnalysis): void {
  console.log('\nType Analysis Results');
  console.log('========================\n');

  console.log(
    `Total types across all versions: ${analysis.summary.totalTypes}`,
  );
  console.log(`\nLatest version (per API):`);

  Object.entries(analysis.summary.latestVersionCounts).forEach(
    ([api, count]) => {
      console.log(`  ${api}: ${count} types`);
    },
  );

  console.log(`\nAverage types per API:`);
  Object.entries(analysis.summary.averagePerApi).forEach(([api, average]) => {
    console.log(`  ${api}: ~${average} types`);
  });

  console.log('\nDetailed breakdown by version:');
  const sortedCounts = [...analysis.totalCounts].sort((a, b) => {
    if (a.api !== b.api) return a.api.localeCompare(b.api);
    return b.version.localeCompare(a.version); // Newest first
  });

  let currentApi: ApiType | null = null;
  for (const count of sortedCounts) {
    if (count.api !== currentApi) {
      console.log(`\n${count.api.toUpperCase()} API:`);
      currentApi = count.api;
    }

    console.log(
      `  ${count.version}: ${count.types} types (${count.queries} queries, ${count.mutations} mutations, ${count.enums} enums)`,
    );
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): { api?: ApiType } {
  const args = process.argv.slice(2);
  const apiIndex = args.indexOf('--api');

  if (apiIndex !== -1 && args[apiIndex + 1]) {
    const apiArg = args[apiIndex + 1];
    // Validate API type
    const result = ApiTypeSchema.safeParse(apiArg);
    if (result.success) {
      return { api: result.data };
    }
  }

  return {};
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { api } = parseArgs();

  countTypes()
    .then((analysis) => {
      if (api) {
        // Filter and display only for specific API
        const latestCount = analysis.summary.latestVersionCounts[api];
        console.log(`\nType count for ${api} API`);
        console.log(`Total: ${latestCount}`);
      } else {
        // Default behavior - display all
        displayResults(analysis);
      }
    })
    .catch((error) => {
      console.error('Type counting failed:', error);
      process.exit(1);
    });
}

export { countTypes, type TypeAnalysis };
