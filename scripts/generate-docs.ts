import fs from 'fs/promises';
import { match } from 'ts-pattern';
import { getLastFourVersions, getLatestVersion } from './version-utils.js';
import { DocsConfigSchema, SUPPORTED_APIS } from '../src/lib/zod.js';
import {
  createDocsConfig,
  generateImportExamples,
  generateHistoricalReleaseTables,
  createMockReleaseHistory,
  createFileOperationHandler,
  handleOperationResult,
} from '../src/lib/patterns.js';

const README_TEMPLATE = `# Shopify API Types

TypeScript definitions for all Shopify APIs, generated from the latest GraphQL schemas.

## Supported API Versions

{HISTORICAL_TABLES}

---

*Showing last 4 releases (1 year history). Install specific version: \`npm install @juanpprieto/shopify-api-types@<version>\`*

## Installation

\`\`\`bash
npm install @juanpprieto/shopify-api-types
\`\`\`

## Usage Examples

### Storefront API
{STOREFRONT_DESCRIPTION} (~{STOREFRONT_COUNT} types available)

\`\`\`typescript
{STOREFRONT_EXAMPLES}
\`\`\`

### Customer Account API  
{CUSTOMER_ACCOUNT_DESCRIPTION} (~{CUSTOMER_ACCOUNT_COUNT} types available)

\`\`\`typescript
{CUSTOMER_ACCOUNT_EXAMPLES}
\`\`\`

### Admin API
{ADMIN_DESCRIPTION} (~{ADMIN_COUNT} types available)

\`\`\`typescript
{ADMIN_EXAMPLES}
\`\`\`

## Schema Access

Access the raw GraphQL schemas:

\`\`\`typescript
import { schema } from '@juanpprieto/shopify-api-types/storefront/v{LATEST_VERSION_VAR}';
// schema contains the full GraphQL introspection result
\`\`\`

## API Documentation

- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Shopify Customer Account API](https://shopify.dev/docs/api/customer)  
- [Shopify Admin API](https://shopify.dev/docs/api/admin-graphql)

## Release Process

This package uses **Calendar Versioning (CalVer)** aligned with Shopify's quarterly API releases.

### Version Format: \`YYYY.M.PATCH\`

- **YYYY**: Full year (2025)
- **M**: Month without zero padding (7, not 07)
- **PATCH**: Incremental patches (0, 1, 2...)

### Release Types

#### 🚀 **Major Releases** (API Updates)
Released quarterly when Shopify publishes new API versions:

\`\`\`bash
# Create changeset for new API version
npm run changeset
# Select "major" and describe API changes

# Release new API version
npm run release
# 2025.7.0 → 2025.10.0
\`\`\`

#### 🐛 **Patch Releases** (Bug Fixes)
Released as needed for bug fixes and improvements:

\`\`\`bash
# Create changeset for bug fix
npm run changeset
# Select "patch" and describe the fix

# Release patch
npm run release
# 2025.7.0 → 2025.7.1
\`\`\`

### Development Workflow

#### 1. **Making Changes**
\`\`\`bash
# Create a new changeset
npm run changeset

# Preview what would be released
npm run release:dry

# Run tests and validation
npm test && npm run build
\`\`\`

#### 2. **Testing Releases**
\`\`\`bash
# Validate version format
npm run version validate 2025.7.0

# Get version information
npm run version info 2025.7.0

# Count types in schemas
npm run count-types
\`\`\`

#### 3. **Publishing**
\`\`\`bash
# Full release process
npm run release

# Manual steps (if needed)
git push origin main --tags
npm publish
\`\`\`

### Automated Releases

The release process is automated via GitHub Actions:
- **Quarterly**: Auto-detects new Shopify API versions
- **On-demand**: Triggered by changesets in pull requests
- **Validation**: All tests, builds, and type checks must pass

### Release Schedule

| Quarter | API Version | Expected Release |
|---------|-------------|------------------|
| Q1      | YYYY-01     | January 15       |
| Q2      | YYYY-04     | April 15         |
| Q3      | YYYY-07     | July 15          |
| Q4      | YYYY-10     | October 15       |

*Patch releases are published as needed between quarterly releases.*

### Support Policy

- **4 versions supported** (1 year rolling window)
- **Latest version** receives all updates
- **Previous 3 versions** receive critical patches only
- **Older versions** are deprecated and removed

## License

MIT

---

*Last updated: {GENERATED_AT}*
*Package version: {PACKAGE_VERSION}*
`;

async function generateDocs(): Promise<void> {
  console.log('Generating documentation...\n');

  const packageJsonPath = './package.json';
  const readmePath = './README.md';
  const fileHandler = createFileOperationHandler();

  try {
    // Read package.json to get current version
    const packageResult = await fileHandler(
      { operation: 'read', target: packageJsonPath },
      async () => {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        return { content, size: Buffer.byteLength(content, 'utf-8') };
      },
    );

    if (!packageResult.success) {
      throw new Error(`Failed to read package.json: ${packageResult.error}`);
    }

    const packageJson = JSON.parse(packageResult.data.content);
    const currentVersion = packageJson.version;

    // Get version information
    const supportedVersions = getLastFourVersions();
    const latestApiVersion = getLatestVersion();

    // Create documentation configuration
    const configResult = createDocsConfig(
      currentVersion,
      latestApiVersion,
      supportedVersions,
    );

    if (!configResult.success) {
      throw new Error(`Failed to create docs config: ${configResult.error}`);
    }

    const config = configResult.data;

    // Validate configuration
    const configValidation = DocsConfigSchema.safeParse(config);
    if (!configValidation.success) {
      throw new Error('Invalid documentation configuration');
    }

    // Generate import examples
    const importExamples = generateImportExamples(config);

    // Generate historical release tables
    const releaseHistory = createMockReleaseHistory(
      currentVersion,
      supportedVersions,
    );
    const historicalTables = generateHistoricalReleaseTables(releaseHistory);

    // Process template with pattern matching for different sections
    const readmeContent = match(config)
      .with({ supportedVersions: [] }, () => {
        throw new Error('No supported versions available');
      })
      .otherwise((validConfig) => {
        const latestVersionVar = validConfig.latestShopifyApiVersion.replace(
          '-',
          '_',
        );

        return README_TEMPLATE.replace('{HISTORICAL_TABLES}', historicalTables)
          .replace(
            '{STOREFRONT_DESCRIPTION}',
            validConfig.representativeTypes.storefront.description,
          )
          .replace(
            '{STOREFRONT_COUNT}',
            validConfig.representativeTypes.storefront.total.toString(),
          )
          .replace(
            '{STOREFRONT_EXAMPLES}',
            importExamples.storefront.slice(0, 2).join('\n'),
          )
          .replace(
            '{CUSTOMER_ACCOUNT_DESCRIPTION}',
            validConfig.representativeTypes['customer-account'].description,
          )
          .replace(
            '{CUSTOMER_ACCOUNT_COUNT}',
            validConfig.representativeTypes[
              'customer-account'
            ].total.toString(),
          )
          .replace(
            '{CUSTOMER_ACCOUNT_EXAMPLES}',
            importExamples['customer-account'].slice(0, 2).join('\n'),
          )
          .replace(
            '{ADMIN_DESCRIPTION}',
            validConfig.representativeTypes.admin.description,
          )
          .replace(
            '{ADMIN_COUNT}',
            validConfig.representativeTypes.admin.total.toString(),
          )
          .replace(
            '{ADMIN_EXAMPLES}',
            importExamples.admin.slice(0, 2).join('\n'),
          )
          .replace('{LATEST_VERSION_VAR}', latestVersionVar)
          .replace(
            '{GENERATED_AT}',
            new Date(validConfig.generatedAt).toLocaleDateString(),
          )
          .replace('{PACKAGE_VERSION}', validConfig.currentPackageVersion);
      });

    // Write README with error handling
    const writeResult = await fileHandler(
      {
        operation: 'write',
        target: readmePath,
        metadata: { contentLength: readmeContent.length },
      },
      async () => {
        await fs.writeFile(readmePath, readmeContent, 'utf-8');
        return { size: Buffer.byteLength(readmeContent, 'utf-8') };
      },
    );

    handleOperationResult(writeResult, {
      onSuccess: (data) => {
        console.log(`✅ Documentation generated successfully!`);
        console.log(`   📄 Updated: ${readmePath} (${data.size} bytes)`);
        console.log(
          `   📊 Version table: ${supportedVersions.length} versions`,
        );
        console.log(`   📚 API examples: ${SUPPORTED_APIS.length} APIs`);
        console.log(`   🕒 Generated at: ${new Date().toLocaleString()}\n`);
      },
      onError: (error) => {
        throw new Error(`Failed to write README: ${error}`);
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Documentation generation failed:', errorMessage);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateDocs().catch(console.error);
}

export { generateDocs };
