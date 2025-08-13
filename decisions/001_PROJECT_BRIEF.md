# Shopify API Types Package: Technical Implementation Plan

## Objective

Deliver a single npm package providing robust TypeScript types and JSON schemas
for Shopify’s Storefront, Customer Account, and Admin APIs. Each export covers
the four latest API versions per Shopify’s quarterly release cycle.

## Requirements

- Package must support:
  - **Storefront API**
  - **Customer Account API**
  - **Admin API (GraphQL)**
- Types and schemas will be versioned, with exports for the four latest releases
  (e.g., `2025-07`, `2025-04`, `2025-01`, `2024-10`).
- Each API and version receives clear, modular exports for both TypeScript types
  and JSON schemas.
- Use a single, traditional src-based package structure. No monorepo.
- Publish all outputs to npm via automated CI/CD workflows.
- Use deep reference implementations from Shopify’s `hydrogen-react`, and
  codegen infrastructure.
- Prioritize clarity, maintainability, and compatibility for technical
  consumers.

## Reference Implementations

- [Shopify Hydrogen codegen.ts](https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen-react/codegen.ts)
- [Shopify hydrogen-react package.js configuration](https://github.com/Shopify/hydrogen/blob/315ebe2c2772bb4b13457f19377a8b5e2d180123/packages/hydrogen-react/package.json)
- [Shopify admin API docs](https://shopify.dev/docs/api/admin-graphql)
- [Storefront Types and Schemas Examples](https://shopify.dev/docs/api/hydrogen/2023-07/utilities/storefront-api-types)

## Deliverables

- Modular import pattern for consumers:
  - `import type { Order } from "@juanpprieto/shopify-api-types/sfapi/2024-10"`
  - `import { CustomerAccountApiSchema } from "@juanpprieto/shopify-api-types/caapi/2025-01"`
- Typed exports and schema for each API and version.
- Fully automated version roll-forward process.

## Implementation Plan

### Phase 1: Setup & Build System

- Scaffold the package in a clean src directory structure.
- Configure TypeScript, linting, formatting, and testing infrastructure.
- Integrate deep npm workflows using GitHub Actions, referencing best practices
  from Shopify’s `shopify-app-js`.

#### Milestones

- Directory and project scaffolding reviewed.
- TypeScript, Prettier, ESLint, Jest configured.
- Initial npm publish test with placeholder exports.

---

### Phase 2: Schema and Type Generation

- Implement codegen based on Shopify’s `hydrogen-codegen` and @graphql-codegen
  tooling[2][6].
- Fetch and cache GraphQL schemas for Storefront, Admin, and Customer Account
  APIs for the last four versions.
- Automate GraphQL code generation for:
  - Base TypeScript types
  - Types for specific operations (queries/mutations)
  - JSON schemas for outbound validation

#### Milestones

- Automated schema extraction scripted (supports parameterized API version).
- Types and JSON schemas generated for `2025-07`, `2025-04`, `2025-01`, and
  `2024-10`.
- Fully validated types match Shopify API reference implementations.

---

### Phase 3: Modular Export and Versioning Architecture

- Design clear paths for importing types and schemas.
- Structure build outputs so each API/version supports deep imports (e.g.,
  `/sfapi/2025-01`).
- Document supported exports in README and inline comments.

#### Milestones

- Consumer import tests validated for all APIs and recent versions.
- Internal CI pipeline checks for missing/broken exports per release.

---

### Phase 4: CI/CD Workflows and Publishing

- Build out robust GitHub Actions for lint, test, build, and publish[7].
- Automate quarterly API version roll-forward:
  - Schema pull for new release
  - Regenerate types/schemas
  - Automated npm publish with updated versions

#### Milestones

- CI/CD pipeline triggers and recovers from edge build/test failures.
- New API version exported within 24 hours of Shopify’s upstream release.

---

### Phase 5: Documentation and Maintenance

- Write concise README referencing API coverage, usage examples, versioning
  details.
- Create upgrade and troubleshooting guide with reference to upstream changes.
- Maintain changelog and forecast compatibility impacts.

---

## Key Technical Decisions

- **Single-package model:** No monorepo complexity; source-of-truth is `src/`.
- **Automated schema-fetch/codegen:** Eliminates manual updates and reduces
  risk[2][5][15].
- **Versioned exports:** Supports legacy migration and immediate adoption for
  major upgrades.
- **Interface clarity:** All exports typed and documented for deep
  integration[1][12].

---

## Risks & Mitigations

| **Risk**                                | **Mitigation**                                |
| --------------------------------------- | --------------------------------------------- |
| Shopify API schema changes              | Automated codegen pipeline, quarterly sync    |
| Type drift between codegen and live API | Schema validation tests per version cycle     |
| CI/CD publish errors                    | Lint, test, build gates, rollback routines    |
| Consumers using outdated versions       | Document support channels, encourage upgrades |

---

## Next Steps

- Review base scaffold.
- Approve initial codegen strategy and output verification protocol.
- Align on quarterly update cadence.

---

Contact for technical review and architecture updates. n#L55
