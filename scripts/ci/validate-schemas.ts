import fs from 'fs/promises';
import path from 'path';
import { match } from 'ts-pattern';
import { getLastFourVersions } from '../version-utils.js';
import {
  type ApiType,
  type ValidationResult,
  GraphQLSchemaSchema,
  SUPPORTED_APIS,
} from '../../src/lib/zod.js';
import { processValidationResults } from '../../src/lib/patterns.js';

const APIS = SUPPORTED_APIS;

async function validateSingleSchema(
  apiType: ApiType,
  version: string,
): Promise<ValidationResult> {
  const filePath = path.join('src', 'schemas', apiType, `${version}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(content);
    const schemaValidation = GraphQLSchemaSchema.safeParse(json);

    if (!schemaValidation.success) {
      return {
        apiType,
        version,
        filePath,
        isValid: false,
        error: `Invalid GraphQL schema structure: ${schemaValidation.error.message}`,
      };
    }

    return {
      apiType,
      version,
      filePath,
      isValid: true,
    };
  } catch (error) {
    const errorMessage = match(error)
      .when(
        (e): e is Error => e instanceof Error && e.message.includes('ENOENT'),
        () => 'File not found',
      )
      .when(
        (e): e is Error => e instanceof Error && e.message.includes('JSON'),
        (e) => `JSON parse error: ${e.message}`,
      )
      .otherwise((e) => (e instanceof Error ? e.message : String(e)));

    return {
      apiType,
      version,
      filePath,
      isValid: false,
      error: errorMessage,
    };
  }
}

async function validateSchemas(): Promise<void> {
  console.log('Validating GraphQL schemas...\n');

  const versions = getLastFourVersions();
  const validationPromises: Promise<ValidationResult>[] = [];

  for (const api of APIS) {
    for (const version of versions) {
      validationPromises.push(validateSingleSchema(api, version));
    }
  }

  const results = await Promise.all(validationPromises);
  const { allValid, validCount, totalCount } =
    processValidationResults(results);

  console.log(
    `\nValidation complete: ${validCount}/${totalCount} schemas valid`,
  );

  if (!allValid) {
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateSchemas().catch(console.error);
}
