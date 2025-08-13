# Shopify-api-types

## GOAL:

PRODUCE A DETAILED TECHNICAL PLAN WITH PHASES AND SMALL MILESTONES

## BRIEF:

This project we will create an npm package with a full build system and deployment workflows to publish to
npm.

The package main goal is to provide Shopify Storefront API, Customer Account API and Admin API Typescript types and
schemas for the last 4 API versions of each API.

For typescript config, tooling and npm publishing reference deeply research this repository github workflows
https://github.com/Shopify/shopify-app-js
but we won't need a complex monorepo as this will be a single package that will live on a src folder like
traditional single packages.

We will want specific export for each API types e.g

// Types example imports we should support
import type { Order } from "@juanpprieto/shopify-api-types/sfapi/2024-10"
import type { Product } from "@juanpprieto/shopify-api-types/sfapi/2025-01"
import type { Customer } from "@juanpprieto/shopify-api-types/caapi/2025-01"
// Schemas example import we should support (json)
import { CustomerAccountApiSchema } from "@juanpprieto/shopify-api-types/caapi/2025-01"

https://github.com/Shopify/hydrogen/blob/315ebe2c2772bb4b13457f19377a8b5e2d180123/packages/hydrogen-react/package.js
on#L20 Provides an example of how to provide multiple exports In terms of how to generate types and schemas we
will rely on the codegen package
Deeply follow and investigate the call stack of this script in this repository and you will find the core logi
https://github.com/Shopify/hydrogen/blob/315ebe2c2772bb4b13457f19377a8b5e2d180123/packages/hydrogen-react/package.js
on#L124

Core types and schema generation for APIs:
https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen-react/codegen.ts

We want to follow codeine.ts as much as possible but we will want to do a few things differently. We will want to
add support also for Shopify Admin API types https://shopify.dev/docs/api/admin-graphql

And more importantly we wil want to export types and schemas not only the latest available api version but 3 more
versions going backwards. Luckily Shopify API release cycle is consistent for all apis and very simple. 4 releases
per year. On month 01, month 04, month 07 and month 10. So if the current api version is 2025-07 we should be able
to generate and export types for 2025-04, 2025-01, 2024-10

Let’s do a deep dive on the hydrogen-react to really get a full picture of all the requirements
Example of customer account
schemahttps://github.com/Shopify/hydrogen/blob/main/packages/hydrogen-react/customer-account.schema.json

Example of storefront api schema
https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen-react/storefront.schema.json

Example of generated storefront api types
https://github.com/Shopify/hydrogen/blob/315ebe2c2772bb4b13457f19377a8b5e2d180123/packages/hydrogen-react/package.js
on#L92

And customer account types
https://github.com/Shopify/hydrogen/blob/315ebe2c2772bb4b13457f19377a8b5e2d180123/packages/hydrogen-react/package.js
on#L55
