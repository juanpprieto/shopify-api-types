# E2E Test Application

Tests the package as if installed from npm.

## Running Tests

```bash
# From root
npm run build
npm pack

# In test app
cd tests/e2e/test-app
npm install
npm install ../../../juanpprieto-shopify-api-types-*.tgz
npm test
```

## Tests

1. Basic imports from all APIs
2. Version aliases (/current, /previous, /next)
3. Root API exports with namespaces
4. Tree-shaking compatibility
5. NodeNext module resolution
6. Package structure validation
