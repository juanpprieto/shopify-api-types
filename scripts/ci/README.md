# CI Validation Scripts

This directory contains scripts specifically designed for Continuous Integration
validation and quality assurance. All scripts follow the `ci:` prefix naming
convention for easy identification.

## Directory Structure

```
scripts/ci/
├── README.md                    # This file
├── validate-version-model.ts    # Version model validation
├── validate-comparisons.js      # Schema comparison validation
├── validate-build.ts           # Build output validation
├── validate-schemas.ts         # Schema file validation
└── validate-types.ts           # TypeScript types validation
```

## Scripts Overview

### Core Validation Scripts

- **`validate-version-model.ts`** - Validates the 4-version model (current,
  previous, RC, unstable)
- **`validate-comparisons.js`** - Validates schema comparison manifest and
  generated files
- **`validate-build.ts`** - Validates build output and package integrity
- **`validate-schemas.ts`** - Validates GraphQL schema files and structure
- **`validate-types.ts`** - Validates generated TypeScript types

## NPM Scripts

All CI validation scripts are accessible via npm scripts with the `ci:` prefix:

```bash
# Individual validations
npm run ci:validate-version-model  # Version model validation
npm run ci:validate-comparisons    # Schema comparison validation
npm run ci:validate-build          # Build output validation
npm run ci:validate-schemas        # Schema file validation
npm run ci:validate-types          # TypeScript types validation

# Combined validations
npm run ci:validate-system         # Core system validation (version model + comparisons)
npm run ci:validate-all           # Full validation suite (all scripts)

# Utility commands
npm run ci:list                   # List all available ci: commands
```

## CI Workflow Integration

These scripts are integrated into GitHub Actions workflows:

- **Main CI** (`.github/workflows/ci.yml`) - Uses all validation scripts
- **Release** (`.github/workflows/release.yml`) - Uses build and system
  validation
- **API Version Check** (`.github/workflows/api-version-check.yml`) - Uses
  version model validation

## Exit Codes

All scripts follow standard exit code conventions:

- `0` - Success
- `1` - Validation failure or error

## Error Handling

Scripts provide clear error messages and validation feedback with emoji
indicators:

- ✅ Success indicators
- ❌ Error indicators
- 🔍 Process indicators
- 📋 Information indicators
