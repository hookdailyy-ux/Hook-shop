---
name: DB lib rebuild rule
description: After schema column additions, typecheck:libs must be run before api-server typecheck will pass.
---

# DB Lib Rebuild Rule

**Rule:** After adding columns to a schema table in `lib/db/src/schema/`, run `pnpm run typecheck:libs` (which runs `tsc --build`) before running `pnpm --filter @workspace/api-server run typecheck`.

**Why:** The api-server imports types from the compiled lib declarations. Without rebuilding the lib, the api-server's TypeScript sees the old column set and errors like "Property 'displayName' does not exist on type 'PgTableWithColumns<...>'".

**How to apply:**
1. Edit schema file
2. `pnpm --filter @workspace/db run push` — apply migration to DB
3. `pnpm run typecheck:libs` — rebuild lib declarations
4. `pnpm --filter @workspace/api-server run typecheck` — now sees new columns
