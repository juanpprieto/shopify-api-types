---
'@juanpprieto/shopify-api-types': patch
---

Phase 1 critical fixes and cleanup

- Move @changesets/get-github-info and graphql to production dependencies for
  build compatibility
- Add @vitest/coverage-v8 as dev dependency for test coverage
- Update CI build configuration with memory limits to prevent out-of-memory
  errors
- Fix knip configuration for production mode dependency checking
- Simplify patterns.ts by removing 21 unused exports
- Streamline claude-sdk.ts from 250+ lines to 54 lines
- Remove unused test-codegen.ts and inline readme utilities
- Update tsconfig.build.json to only compile index files for better performance
  EOF < /dev/null
