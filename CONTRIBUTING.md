# Contributing to @juanpprieto/shopify-api-types

This package ships TypeScript types, GraphQL schemas, and schema comparisons for
the Shopify Storefront, Customer Account, and Admin APIs. It has no runtime
code. Releases follow Shopify's quarterly API versions.

## Setup

You need Node.js 22 or later.

```bash
npm install
npm run validate
```

`npm run validate` runs the type check, the linter, and the unit tests. Run it
before every commit.

To fetch schemas, copy `.env.example` to `.env` and add the Shopify tokens. To
generate the README, also add `OPENCODE_GO_API_KEY`.

## Repository layout

```
src/
  admin/ storefront/ customer-account/   Generated types, one dir per version
  graphql-schemas/                        Introspection JSON from Shopify
  index.ts                                Root entry point
scripts/                                  Build, generation, and release code
  lib/                                    Shared helpers (not shipped)
  ci/                                     Build and output checks
tests/                                    Unit tests
tests/e2e/test-app/                       Consumer app that installs the packed tarball
demo/                                     React demo that uses the latest npm release
decisions/                                Architecture decision records
```

Only `src/` compiles into `dist/`. Code in `scripts/` runs at build time and
never reaches the published package.

## npm scripts

| Script                    | What it does                                                |
| ------------------------- | ----------------------------------------------------------- |
| `validate`                | Type check, lint, and unit tests                            |
| `check`                   | Type check and lint                                         |
| `build`                   | Clean, generate exports, compile, then run `postbuild`      |
| `build:ci`                | Same as `build`, with a memory limit for CI runners         |
| `fetch-schemas`           | Download the schemas for the version set from Shopify       |
| `generate-types`          | Generate types from the schemas, then the index files       |
| `generate:exports`        | Write the `exports` map in `package.json`                   |
| `generate:comparisons`    | Write `dist/comparisons` for every adjacent version pair    |
| `docs`                    | Generate `README.md` with OpenCode Go                       |
| `ci:validate-build`       | Check the files in `dist/`                                  |
| `ci:validate-types`       | Compile a test file that imports the latest generated types |
| `ci:validate-schemas`     | Check the schema files in `src/graphql-schemas/`            |
| `ci:validate-system`      | Check the version model and the comparison files            |
| `count-types`             | Count types, queries, and mutations per API and version     |
| `deadcode`, `knip:strict` | Find unused files, exports, and dependencies                |
| `test:coverage`           | Run the unit tests with a coverage report                   |

`postbuild` runs these steps in order: fix the `.js` import extensions, remove
the `dist/` dirs outside the version set, copy the schemas, generate the
comparisons, and check the version model.

## Version support principle

Each package release ships every API version that Shopify still supports.

Shopify supports each stable API version for at least 12 months, with at least 9
months of overlap between versions
([versioning docs](https://shopify.dev/docs/api/usage/versioning)). So the 4
most recent stable quarters are live at any time. A request for a retired
version "falls forward" to the oldest supported version. The
`x-shopify-api-version` response header shows the version that Shopify served.

The version set has 6 versions:

| Role              | Example (Q4 2026)    | Import alias |
| ----------------- | -------------------- | ------------ |
| current           | `2026-10`            | `current`    |
| previous          | `2026-07`            | `previous`   |
| 2 older quarters  | `2026-04`, `2026-01` | none         |
| release candidate | `2027-01`            | `next`       |
| unstable          | `unstable`           | `unstable`   |

Every version also has a versioned path, for example `admin/2026-04`.
Comparisons ship for every adjacent pair, so users on any supported version have
an upgrade path. A user on a retired version installs the older package release
whose window contains it. Package versions map one-to-one to Shopify quarters:
`2026.10.0` ships API `2026-10` as current.

`scripts/version-utils.ts` calculates the set from the date. The `RELEASE_DATE`
variable (`YYYY-MM-DD`) changes that date. CI and the pre-push hook set it from
the package version, so a rebuild of a release commit always uses the set of
that release.

## Quarterly release

Shopify publishes a new stable version on the first day of January, April, July,
and October. Every Monday, the `API Version Check` workflow compares the
packaged version with Shopify's current version. When the package is behind, the
workflow opens one issue.

Do these steps on a branch named `release/<version>`, for example
`release/2026.10.0`.

1. Set the new version. Use the year and the first month of the quarter.

   ```bash
   npm version 2026.10.0 --no-git-tag-version
   ```

2. Fetch the schemas. Then check them.

   ```bash
   npm run fetch-schemas
   npm run ci:validate-schemas
   ```

3. Generate the types and the exports.

   ```bash
   npm run generate-types
   npm run generate:exports
   ```

4. Build. Then run all checks.

   ```bash
   npm run build
   npm run ci:validate-build
   npm run ci:validate-types
   npm run validate
   ```

5. Write the `## 2026.10.0` section at the top of `CHANGELOG.md` by hand. Use
   `dist/comparisons/` for the breaking changes. The Release workflow copies
   this section into the GitHub release.

6. Commit. Push the branch. Then start the `Docs` workflow on that branch. It
   opens a PR with the new README. Read the text, then merge it into the release
   branch.

7. Open a PR from the release branch to `main`. Merge it when CI is green.

8. Start the `Release` workflow on `main`. Set `version` to `2026.10.0` and keep
   `dry_run` on. Make sure that the run passes.

9. Start the `Release` workflow again with `dry_run` off.

10. Check the result on npm. The version page must show the provenance
    statement.

    ```bash
    npm view @juanpprieto/shopify-api-types@2026.10.0 dist.attestations
    ```

11. Close the issue from the `API Version Check` workflow.

The Release workflow does these steps in this order:

- It stops if the version does not match `package.json`, or if `CHANGELOG.md`
  has no section for the version, or if CI did not pass for the commit.
- It builds once, packs one tarball, and tests that tarball in
  `tests/e2e/test-app`.
- It publishes that exact tarball with `--provenance` through npm trusted
  publishing (OIDC). The workflow uses no npm token.
- It checks that the registry integrity hash equals the tarball hash, and that
  npm shows a provenance attestation.
- It creates the tag `v2026.10.0` and the GitHub release.

## Release rules

These rules settle the decisions that come up in each release. Most come from
the 2026-09 catch-up releases (see `decisions/011`).

1. **Do not rename `release.yml` or its `main` environment.** The npm trusted
   publisher matches both names. A different name stops the publish.
2. **Publish only through the Release workflow.** A local `npm publish` has no
   provenance. Use it only when the workflow cannot publish, with
   `npm publish --otp=<code>`, and write the reason in the release notes.
3. **Never delete retired schema files from `src/`.** When Shopify retires a
   version, `src/graphql-schemas/<api>/<version>.json` is the only copy. Two
   guards protect these files during `fetch-schemas`:
   - Storefront and Admin: the `x-shopify-api-version` header must equal the
     requested version. If not, the script keeps the existing file.
   - Customer Account: Shopify sends no version header. If a dated version has
     the same content as a newer version, the script treats it as fall-forward
     and keeps the existing file.
4. **`dist/` ships only the version set.** The build compiles every version dir
   in `src/`. Then `prune-dist` removes the dirs outside the set. Remove files
   from `dist/` only, never from `src/`.
5. **A back-dated release sets `RELEASE_DATE` on every local command.** Use a
   mid-month day, for example `RELEASE_DATE=2026-01-15`. A missing value builds
   the set for today and gives wrong artifacts. CI derives the value by itself.
6. **The README generator runs last and must pass the style gate.**
   `npm run docs` calls OpenCode Go (`OPENCODE_GO_API_KEY`). The default model
   is `glm-5.3`; `OPENCODE_GO_MODEL` changes it. The script stops when the text
   has emojis, em dashes, or listed filler words, or when it does not end with
   the License section.
7. **No patch releases.** The package releases once per quarter, in step with
   Shopify. A fix waits for the next quarterly release.
8. **Node support follows the Node release schedule.** CI tests only Node
   versions that have not reached end of life (now 22, 24, and 26).
   `engines.node` is the oldest tested version.
9. **The e2e app never hardcodes versions.** It reads every export path from the
   installed `package.json` at test time. A new version set cannot break it.
10. **No emojis in any file.** A CI step fails when a tracked file has one.
11. **Open: the first OIDC publish.** The 2026.10.0 release is the first one
    through trusted publishing. After it passes, remove this rule. Then consider
    the npm setting that blocks token publishing.

## Pull requests

Before you open a PR:

1. Run `npm run validate`.
2. Run `npm run build` when you change code in `scripts/` or `src/`.
3. Add or change tests for changed behavior in `scripts/`.

CI runs the type check, lint, format check, dead-code check, and emoji check. It
runs the unit tests on Node 22, 24, and 26 on Linux, macOS, and Windows. It
builds the package and tests the packed tarball in the e2e app.

## Troubleshooting

| Problem                                 | Action                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `fetch-schemas` reports a missing token | Add the token to `.env`. The scripts load it with `--env-file-if-exists`             |
| `fetch-schemas` keeps an existing file  | Shopify served another version (fall-forward). This is expected for retired versions |
| The build runs out of memory            | Use `npm run build:ci`, which sets a higher memory limit                             |
| `npm run docs` fails the style gate     | Run it again, or try another model with `OPENCODE_GO_MODEL`                          |
| A release commit builds the wrong set   | Set `RELEASE_DATE` to the mid-month date of that release                             |

## Reporting issues

Include the Node.js version, the package version, the import path, and the full
error message. A minimal reproduction helps most.
