---
name: HOOK commerce tables
description: Schema and route patterns for the 6 commerce tables added to HOOK.
---

## Tables (lib/db/src/schema/commerce.ts)
- `ordersTable` — one per customer checkout (linked to teamMemberId)
- `orderItemsTable` — line items, cascade delete from order
- `orderProofsTable` — images uploaded by team member to prove order (adminReviewed flag)
- `analyticsEventsTable` — entityType: profile/collection/look/product; eventType: view/click/add_to_basket/order_submit
- `rewardsTable` — admin-created, status: pending/approved/paid
- `memberBadgesTable` — admin-assigned, badgeType: top_seller/most_viewed/most_followed/trending

## Performance cycles
Computed server-side: `getMemberCycle(createdAt)` — uses member's registration day-of-month as the recurring cycle boundary.

## API route files
- `routes/orders.ts` — `POST /api/store/:username/order` (public), team order management
- `routes/analytics.ts` — `POST /api/analytics/event` (public, takes memberId), `GET /api/team/analytics`
- `routes/rewards.ts` — `GET /api/team/rewards`
- `routes/rankings.ts` — `GET /api/rankings` (public leaderboard, last 30 days)
- `routes/admin-commerce.ts` — admin orders/proofs/rewards/badges CRUD

## Drizzle IN-clause workaround
For fetching items by a list of order IDs, we fetch all items then filter in JS (not using Drizzle `inArray` to avoid import issues). If the table grows large, switch to `inArray` from drizzle-orm.

**Why:** Drizzle's `inArray` requires a non-empty array; JS filter avoids the conditional overhead for MVP scale.

## Basket state (frontend)
Basket lives as `useState<BasketItem[]>` local to `StorePage`, persisted to `localStorage` keyed by `hook_basket_{username}`. On checkout success, `saveBasket([])` clears it.
