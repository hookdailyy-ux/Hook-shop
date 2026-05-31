import { Router, type IRouter } from "express";
import {
  db, teamMembersTable, analyticsEventsTable, ordersTable,
  collectionsTable, teamLooksTable, sharedBasketsTable,
} from "@workspace/db";
import { eq, and, gte, count, isNull, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// ─── PUBLIC: Track an event ───────────────────────────────────────────────────

router.post("/analytics/event", async (req, res) => {
  try {
    const schema = z.object({
      memberId: z.number().int().positive().optional().nullable(),
      entityType: z.enum(["profile", "collection", "look", "product"]),
      entityId: z.number().int().nullable().optional(),
      eventType: z.enum(["view", "click", "add_to_basket", "order_submit", "shared_basket"]),
    });
    const data = schema.parse(req.body);

    await db.insert(analyticsEventsTable).values({
      teamMemberId: data.memberId ?? null,
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
      .select({ id: teamMembersTable.id, username: teamMembersTable.username, createdAt: teamMembersTable.createdAt })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, memberId))
      .limit(1);

    if (!member) { res.status(404).json({ error: "Not found" }); return; }

    const cycle = getMemberCycle(member.createdAt);

    const [events, cycleOrders, allTimeOrders, collections, looks, sharedBaskets] = await Promise.all([
      db.select()
        .from(analyticsEventsTable)
        .where(and(
          eq(analyticsEventsTable.teamMemberId, memberId),
          gte(analyticsEventsTable.createdAt, cycle.start),
        )),

      db.select({ id: ordersTable.id, status: ordersTable.status })
        .from(ordersTable)
        .where(and(
          eq(ordersTable.teamMemberId, memberId),
          gte(ordersTable.createdAt, cycle.start),
        )),

      db.select({ count: count() })
        .from(ordersTable)
        .where(eq(ordersTable.teamMemberId, memberId)),

      db.select({ id: collectionsTable.id, title: collectionsTable.title, views: collectionsTable.views })
        .from(collectionsTable)
        .where(and(eq(collectionsTable.teamMemberId, memberId), eq(collectionsTable.status, "active"))),

      db.select({ id: teamLooksTable.id, title: teamLooksTable.title, views: teamLooksTable.views })
        .from(teamLooksTable)
        .where(and(eq(teamLooksTable.teamMemberId, memberId), eq(teamLooksTable.status, "active"))),

      db.select({ count: count() })
        .from(sharedBasketsTable)
        .where(eq(sharedBasketsTable.memberUsername, member.username)),
    ]);

    const profileViews = events.filter((e) => e.entityType === "profile" && e.eventType === "view").length;
    const productClicks = events.filter((e) => e.entityType === "product" && e.eventType === "click").length;
    const basketAdds = events.filter((e) => e.eventType === "add_to_basket").length;
    const orderSubmits = events.filter((e) => e.eventType === "order_submit").length;
    const confirmedOrders = cycleOrders.filter((o) => !["pending", "cancelled"].includes(o.status)).length;
    const conversionRate = profileViews > 0 ? ((orderSubmits / profileViews) * 100).toFixed(1) : "0.0";

    const bestCollection = collections.sort((a, b) => b.views - a.views)[0] ?? null;
    const bestLook = looks.sort((a, b) => b.views - a.views)[0] ?? null;

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
        sharedBaskets: sharedBaskets[0]?.count ?? 0,
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

// ─── ADMIN: Global analytics ───────────────────────────────────────────────────

router.get("/admin/analytics", async (req, res) => {
  if (!req.session?.adminAuthenticated) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [members, eventRows, sharedBasketRows, confirmedOrderRows, collectionViewRows, lookViewRows] = await Promise.all([
      db.select({
        id: teamMembersTable.id,
        username: teamMembersTable.username,
        displayName: teamMembersTable.displayName,
      }).from(teamMembersTable).where(eq(teamMembersTable.status, "active")),

      db.select({
        teamMemberId: analyticsEventsTable.teamMemberId,
        eventType: analyticsEventsTable.eventType,
        entityType: analyticsEventsTable.entityType,
        cnt: count(),
      })
        .from(analyticsEventsTable)
        .groupBy(analyticsEventsTable.teamMemberId, analyticsEventsTable.eventType, analyticsEventsTable.entityType),

      db.select({
        memberUsername: sharedBasketsTable.memberUsername,
        cnt: count(),
      })
        .from(sharedBasketsTable)
        .groupBy(sharedBasketsTable.memberUsername),

      db.select({
        teamMemberId: ordersTable.teamMemberId,
        cnt: count(),
      })
        .from(ordersTable)
        .where(sql`${ordersTable.status} NOT IN ('pending', 'cancelled')`)
        .groupBy(ordersTable.teamMemberId),

      db.select({
        teamMemberId: collectionsTable.teamMemberId,
        total: sql<number>`SUM(${collectionsTable.views})`,
      })
        .from(collectionsTable)
        .where(eq(collectionsTable.status, "active"))
        .groupBy(collectionsTable.teamMemberId),

      db.select({
        teamMemberId: teamLooksTable.teamMemberId,
        total: sql<number>`SUM(${teamLooksTable.views})`,
      })
        .from(teamLooksTable)
        .where(eq(teamLooksTable.status, "active"))
        .groupBy(teamLooksTable.teamMemberId),
    ]);

    const usernameToId = new Map(members.map((m) => [m.username, m.id]));

    function memberEvents(memberId: number | null, eventType: string, entityType?: string) {
      return eventRows
        .filter((r) => {
          const idMatch = r.teamMemberId === memberId;
          const etMatch = r.eventType === eventType;
          const entMatch = entityType ? r.entityType === entityType : true;
          return idMatch && etMatch && entMatch;
        })
        .reduce((s, r) => s + r.cnt, 0);
    }

    const memberStats = members.map((m) => {
      const sharedBasketsEntry = sharedBasketRows.find((r) => r.memberUsername === m.username);
      const confirmedOrdersEntry = confirmedOrderRows.find((r) => r.teamMemberId === m.id);
      const collectionViewsEntry = collectionViewRows.find((r) => r.teamMemberId === m.id);
      const lookViewsEntry = lookViewRows.find((r) => r.teamMemberId === m.id);
      return {
        id: m.id,
        username: m.username,
        displayName: m.displayName,
        profileViews: memberEvents(m.id, "view", "profile"),
        collectionViews: Number(collectionViewsEntry?.total ?? 0),
        lookViews: Number(lookViewsEntry?.total ?? 0),
        productClicks: memberEvents(m.id, "click", "product"),
        basketAdds: memberEvents(m.id, "add_to_basket"),
        sharedBaskets: sharedBasketsEntry?.cnt ?? 0,
        orderSubmits: memberEvents(m.id, "order_submit"),
        confirmedOrders: confirmedOrdersEntry?.cnt ?? 0,
      };
    });

    const directProfileViews = memberEvents(null, "view", "profile");
    const directProductClicks = memberEvents(null, "click", "product");
    const directBasketAdds = memberEvents(null, "add_to_basket");
    const directSharedBaskets = sharedBasketRows.find((r) => r.memberUsername === "")?.cnt ?? 0;
    const directOrderSubmits = memberEvents(null, "order_submit");

    const totals = {
      profileViews: memberStats.reduce((s, m) => s + m.profileViews, directProfileViews),
      productClicks: memberStats.reduce((s, m) => s + m.productClicks, directProductClicks),
      basketAdds: memberStats.reduce((s, m) => s + m.basketAdds, directBasketAdds),
      sharedBaskets: sharedBasketRows.reduce((s, r) => s + r.cnt, 0),
      orderSubmits: memberStats.reduce((s, m) => s + m.orderSubmits, directOrderSubmits),
      confirmedOrders: confirmedOrderRows.reduce((s, r) => s + r.cnt, 0),
    };

    res.json({
      totals,
      directHook: {
        profileViews: directProfileViews,
        productClicks: directProductClicks,
        basketAdds: directBasketAdds,
        sharedBaskets: directSharedBaskets,
        orderSubmits: directOrderSubmits,
      },
      members: memberStats,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin analytics");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
