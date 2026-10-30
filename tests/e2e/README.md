# End-to-end tests

`test-app/` is a small consumer project. It installs the packed tarball the same
way that a user installs the package from npm, then type-checks and runs its
tests.

The tests read every export path from the installed `package.json` and import
each one. They also check that every API has the `current`, `previous`, `next`,
and `unstable` aliases. No version is hardcoded. A new quarter cannot break
them.

## Run the tests

From the repository root:

```bash
npm run build
npm pack
cd tests/e2e/test-app
npm install
npm install --no-save ../../../juanpprieto-shopify-api-types-*.tgz
npm run typecheck
npm test
```

CI runs these steps on Node 22, 24, and 26. The `Release` workflow runs them on
the exact tarball that it then publishes to npm, so a broken archive never
reaches users.
