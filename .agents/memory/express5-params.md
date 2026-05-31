---
name: Express 5 req.params types
description: In Express 5, req.params values are typed as string | string[]; must cast before use.
---

# Express 5 req.params Types

**Rule:** `req.params.x` is typed `string | string[]` in Express 5. Always cast before passing to:
- `parseInt(String(req.params.id))`
- `eq(table.col, String(req.params.token))`

**Why:** Express 5 changed the params type signature vs Express 4. TypeScript will error with "Argument of type 'string | string[]' is not assignable to parameter of type 'string'" on every use of a param value.

**How to apply:** In every new route handler, wrap param access with `String(req.params.x)`. Use sed for batch fixes: `sed -i 's/parseInt(req\.params\.id)/parseInt(String(req.params.id))/g'`.
