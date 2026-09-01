# 011 — Support-Window Version Model

**Date:** 2026-09-01 **Status:** Accepted

## Context

The package previously shipped a 4-version set: current, previous, release
candidate, and unstable. Shopify supports each stable API version for a minimum
of 12 months, with at least 9 months of overlap. In practice the 4 most recent
stable quarters are callable at any time. Live probes on 2026-09-01 confirmed
this: versions 2025-10 through 2026-10 were served as requested, while 2025-07
and older "fell forward" to 2025-10.

The 2-stable-version model left a gap: a user on a still-supported API version 2
or 3 quarters old found no types for it in the latest package release.

## Decision

1. **Ship every Shopify-supported version.** The version set becomes: current,
   previous, olderSupported (2 quarters), releaseCandidate, unstable — 6
   versions total.
2. **Keep the alias set unchanged.** `current`, `previous`, `next`, `unstable`.
   Older supported versions get versioned export paths only (e.g.
   `./sfapi/2025-10`).
3. **Ship comparisons for every adjacent pair** plus the `current` and `next`
   aliases, so users on any supported version have an upgrade path.
4. **Add a `RELEASE_DATE` env override** to `getCurrentVersionSet()` so
   back-dated catch-up releases can build historical version sets.
5. **Guard schema fetches against fall-forward.** The fetch script compares the
   `x-shopify-api-version` response header with the requested version. On
   mismatch it keeps the existing repo schema instead of silently saving the
   wrong one.

## Consequences

- Package size grows (6 versions × 3 APIs instead of 4 × 3).
- Retired versions cannot be re-fetched from Shopify. Their schemas live only in
  `src/graphql-schemas/` and in published package releases.
- Test isolation: generator integration tests run in a temp directory with a
  pinned `RELEASE_DATE` so they never write into the repo tree.

## Alternatives considered

- **Keep the 4-version model.** Users on older supported versions install an
  older package release. Rejected: the latest release should cover the full
  window Shopify actually supports.
- **Derive the version set from package.json version.** More refactoring risk
  for the same outcome; the date-based model with an override is simpler.
