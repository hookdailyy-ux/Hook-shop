import { Router, type IRouter } from "express";
import { db, teamMembersTable, ordersTable, analyticsEventsTable, memberBadgesTable } from "@workspace/db";
import { eq, gte, count, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/rankings", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [members, monthlyOrders, allTimeOrders, monthlyViews, badges] = await Promise.all([
      db.select({
        id: teamMembersTable.id,
        fullName: teamMembersTable.fullName,
        displayName: teamMembersTable.displayName,
        username: teamMembersTable.username,
        profilePhotoUrl: teamMembersTable.profilePhotoUrl,
        createdAt: teamMembersTable.createdAt,
        status: teamMembersTable.status,
      }).from(teamMembersTable).where(eq(teamMembersTable.status, "active")),

      db.select({ teamMemberId: ordersTable.teamMemberId, count: count() })
        .from(ordersTable)
        .where(gte(ordersTable.createdAt, thirtyDaysAgo))
        .groupBy(ordersTable.teamMemberId),

      db.select({ teamMemberId: ordersTable.teamMemberId, count: count() })
        .from(ordersTable)
        .groupBy(ordersTable.teamMemberId),

      db.select({ teamMemberId: analyticsEventsTable.teamMemberId, count: count() })
        .from(analyticsEventsTable)
        .where(gte(analyticsEventsTable.createdAt, thirtyDaysAgo))
        .groupBy(analyticsEventsTable.teamMemberId),

      db.select().from(memberBadgesTable),
    ]);

    const monthlyOrderMap = new Map(monthlyOrders.map((o) => [o.teamMemberId, o.count]));
    const allTimeOrderMap = new Map(allTimeOrders.map((o) => [o.teamMemberId, o.count]));
    const viewMap = new Map(monthlyViews.map((v) => [v.teamMemberId, v.count]));
    const badgeMap = new Map<number, string[]>();
    for (const b of badges) {
      if (!badgeMap.has(b.teamMemberId)) badgeMap.set(b.teamMemberId, []);
      badgeMap.get(b.teamMemberId)!.push(b.badgeType);
    }

    const ranked = members
      .map((m) => ({
        id: m.id,
        fullName: m.fullName,
        displayName: m.displayName ?? null,
        username: m.username,
        profilePhotoUrl: m.profilePhotoUrl ?? null,
        monthlyOrders: monthlyOrderMap.get(m.id) ?? 0,
        allTimeOrders: allTimeOrderMap.get(m.id) ?? 0,
        monthlyViews: viewMap.get(m.id) ?? 0,
        badges: badgeMap.get(m.id) ?? [],
      }))
      .sort((a, b) => b.monthlyOrders - a.monthlyOrders || b.monthlyViews - a.monthlyViews);

    const allTimeSorted = [...ranked].sort((a, b) => b.allTimeOrders - a.allTimeOrders);

    res.json({
      monthly: ranked.map((m, i) => ({ ...m, rank: i + 1 })),
      allTime: allTimeSorted.map((m, i) => ({ ...m, rank: i + 1 })),
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get rankings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Team member: get own rank
router.get("/team/rankings", async (req, res) => {
  const memberId = req.session?.teamMemberId;
  if (!memberId) { res.status(401).json({ error: "Unauthorized" }); return; }
  // delegate to public endpoint data
  req.url = "/rankings";
  res.redirect(307, `${req.baseUrl}/rankings`);
});

export default router;
