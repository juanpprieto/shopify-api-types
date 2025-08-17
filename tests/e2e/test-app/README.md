# E2E Test App for @juanpprieto/shopify-api-types

This is a test application used to validate the package exports and TypeScript
types of the `@juanpprieto/shopify-api-types` package.

## What it tests

- Import resolution for all exported paths
- TypeScript type checking
- Schema file imports
- Version aliasing (current, previous, next)
- Comparison data exports

## How it works

The E2E workflow:

1. Builds the main package
2. Creates a tarball (`npm pack`)
3. Installs the tarball in this test app
4. Runs TypeScript type checking
5. Runs the test suite

This ensures that the package works correctly when installed by consumers.
