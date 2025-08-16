# End-to-End Testing

E2E tests that simulate real npm package usage.

## Structure

```
test-app/
├── src/           # Test files
├── tests/         # Test runner
├── package.json
└── tsconfig.json
```

## Running Tests

```bash
# Build and pack
npm run build
npm pack

# Install and test
cd tests/e2e/test-app
npm install
npm install ../../../juanpprieto-shopify-api-types-*.tgz
npm test
```

## Coverage

- Package installation
- Import resolution
- TypeScript compilation
- Version aliases
- Tree shaking
- NodeNext compatibility
