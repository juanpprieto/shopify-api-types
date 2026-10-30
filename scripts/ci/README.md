# CI checks

These scripts check the build output and the version model. Exit code 0 means
pass.

| Script                      | npm script                  | What it checks                                                   |
| --------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `validate-build.ts`         | `ci:validate-build`         | Root, API, version, and schema files exist in `dist/`            |
| `validate-types.ts`         | `ci:validate-types`         | A test file that imports the latest generated types compiles     |
| `validate-schemas.ts`       | `ci:validate-schemas`       | The files in `src/graphql-schemas/` are valid introspection JSON |
| `validate-version-model.ts` | `ci:validate-version-model` | The version set has the expected roles and valid versions        |
| `validate-comparisons.ts`   | `ci:validate-comparisons`   | `dist/comparisons/` has a valid file for each adjacent pair      |

`postbuild` runs `ci:validate-system`, which is the version model check plus the
comparison check, so a bad comparison file stops every build.

The `CI` and `Release` workflows run `ci:validate-build` and `ci:validate-types`
after the build. Nothing runs `ci:validate-schemas` for you. Run it after
`npm run fetch-schemas`.
