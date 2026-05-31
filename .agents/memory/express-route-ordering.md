---
name: Express router ordering — catalog vs :id conflict
description: Why GET /products/catalog must be registered before GET /products/:id in products.ts
---

## Rule
Literal-path routes (`/products/catalog`) must always be declared **before** wildcard param routes (`/products/:id`) in the same router file. If they are in different router files (e.g., catalog in `collections.ts`, `:id` in `products.ts`), and `products.ts` is mounted first in `index.ts`, Express will match `:id` with `id = "catalog"` — which then fails when parsed as an integer.

**Why:** Express matches routes in registration order, first within a router file, then across the files in the order they are `use()`d in `index.ts`.

**How to apply:** Keep all `/products/*` routes in `products.ts`. When adding a new literal sub-route (e.g., `/products/catalog`, `/products/featured`), place it before any `GET /products/:id` handler in that file.
