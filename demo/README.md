# Demo

A React app with two tabs, Storefront API and Admin API. Each tab types a
Shopify GraphQL client with `@juanpprieto/shopify-api-types`.

The demo installs the latest release from npm, not the code in this repository.
It imports the `current` aliases, so it does not need changes when a new quarter
starts. `vite.config.ts` reads the installed package version and sets the client
API version to match it (package `2026.7.0` uses API `2026-07`).

## Run the demo

```bash
cd demo
npm install
npm run dev
```

To get the newest release, run
`npm install @juanpprieto/shopify-api-types@latest`.

The clients use placeholder store domains and tokens, so the requests fail until
you put your own values in `src/StorefrontDemo.tsx` and `src/AdminDemo.tsx`.
