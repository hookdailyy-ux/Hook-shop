import { Router, type IRouter } from "express";
import {
  db, teamMembersTable, analyticsEventsTable, ordersTable,
  collectionsTable, teamLooksTable,
} from "@workspace/db";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// ─── PUBLIC: Track an event ───────────────────────────────────────────────────

router.post("/analytics/event", async (req, res) => {
  try {
    const schema = z.object({
      memberId: z.number().int().positive(),
      entityType: z.enum(["profile", "collection", "look", "product"]),
      entityId: z.number().int().nullable().optional(),
      eventType: z.enum(["view", "click", "add_to_basket", "order_submit"]),
    });
    const data = schema.parse(req.body);

    await db.insert(analyticsEventsTable).values({
      teamMemberId: data.memberId,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      eventType: data.eventType,
    });

    res.status(201).json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid event" });
  }
});

// ─── TEAM: Analytics dashboard ────────────────────────────────────────────────

function getMemberCycle(createdAt: Date): { start: Date; end: Date } {
  const day = createdAt.getDate();
  const now = new Date();
  let cycleStart = new Date(now.getFullYear(), now.getMonth(), day);
  if (cycleStart > now) {
    cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, day);
  }
  const cycleEnd = new Date(cycleStart);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);
  return { start: cycleStart, end: cycleEnd };
}

router.get("/team/analytics", async (req, res) => {
  const memberId = req.session?.teamMemberId;
  if (!memberId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [member] = await db
      .select({ id: teamMembersTable.id, createdAt: teamMembersTable.createdAt })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, memberId))
      .limit(1);

    if (!member) { res.status(404).json({ error: "Not found" }); return; }

    const cycle = getMemberCycle(member.createdAt);

    const [events, cycleOrders, allTimeOrders, collections, looks] = await Promise.all([
      // Analytics events in current cycle
      db.select()
        .from(analyticsEventsTable)
        .where(and(
          eq(analyticsEventsTable.teamMemberId, memberId),
          gte(analyticsEventsTable.createdAt, cycle.start),
        )),

      // Orders in current cycle
      db.select({ id: ordersTable.id, status: ordersTable.status })
        .from(ordersTable)
        .where(and(
          eq(ordersTable.teamMemberId, memberId),
          gte(ordersTable.createdAt, cycle.start),
        )),

      // All-time orders
      db.select({ count: count() })
        .from(ordersTable)
        .where(eq(ordersTable.teamMemberId, memberId)),

      // Collections for best performer
      db.select({ id: collectionsTable.id, title: collectionsTable.title, views: collectionsTable.views })
        .from(collectionsTable)
        .where(and(eq(collectionsTable.teamMemberId, memberId), eq(collectionsTable.status, "active"))),

      // Looks for best performer
      db.select({ id: teamLooksTable.id, title: teamLooksTable.title, views: teamLooksTable.views })
        .from(teamLooksTable)
        .where(and(eq(teamLooksTable.teamMemberId, memberId), eq(teamLooksTable.status, "active"))),
    ]);

    const profileViews = events.filter((e) => e.entityType === "profile" && e.eventType === "view").length;
    const productClicks = events.filter((e) => e.entityType === "product" && e.eventType === "click").length;
    const basketAdds = events.filter((e) => e.eventType === "add_to_basket").length;
    const orderSubmits = events.filter((e) => e.eventType === "order_submit").length;
    const confirmedOrders = cycleOrders.filter((o) => !["pending", "cancelled"].includes(o.status)).length;
    const conversionRate = profileViews > 0 ? ((orderSubmits / profileViews) * 100).toFixed(1) : "0.0";

    const bestCollection = collections.sort((a, b) => b.views - a.views)[0] ?? null;
    const bestLook = looks.sort((a, b) => b.views - a.views)[0] ?? null;

    // Best product by click events
    const productClickCounts = new Map<number, number>();
    for (const e of events) {
      if (e.entityType === "product" && e.entityId && (e.eventType === "click" || e.eventType === "add_to_basket")) {
        productClickCounts.set(e.entityId, (productClickCounts.get(e.entityId) ?? 0) + 1);
      }
    }
    const topProductId = [...productClickCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    res.json({
      cycle: {
        start: cycle.start.toISOString(),
        end: cycle.end.toISOString(),
      },
      metrics: {
        profileViews,
        productClicks,
        basketAdds,
        orderSubmits,
        confirmedOrders,
        conversionRate: parseFloat(conversionRate),
        allTimeOrders: allTimeOrders[0]?.count ?? 0,
        collectionViews: collections.reduce((s, c) => s + c.views, 0),
        lookViews: looks.reduce((s, l) => s + l.views, 0),
      },
      bestPerformers: {
        collection: bestCollection ? { id: bestCollection.id, title: bestCollection.title, views: bestCollection.views } : null,
        look: bestLook ? { id: bestLook.id, title: bestLook.title, views: bestLook.views } : null,
        topProductId,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
