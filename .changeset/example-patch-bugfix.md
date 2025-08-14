---
'@juanpprieto/shopify-api-types': patch
---

Fix TypeScript declaration generation for JSON imports

- Fixed issue where JSON schema imports were stripped during declaration
  generation
- Improved error handling in schema validation
- Updated build process to handle import attributes correctly

This patch resolves TypeScript compilation errors when importing schema JSON
files.
