---
'@juanpprieto/shopify-api-types': minor
---

Align the version model with Shopify's 12-month support window. Each release now
ships 6 versions: current, previous, 2 older supported quarters, the release
candidate, and unstable. Comparisons cover every adjacent version pair. A
`RELEASE_DATE` env override enables back-dated catch-up builds, and schema
fetches are guarded against Shopify's fall-forward behavior.
