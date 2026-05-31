import { Router, type IRouter } from "express";
import {
  db, teamMembersTable, ordersTable, orderItemsTable, orderProofsTable,
  rewardsTable, memberBadgesTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin as requireAdminMiddleware } from "../middlewares/requireAdmin";

const router: IRouter = Router();

function requireAdmin(req: Parameters<Parameters<typeof router.get>[1]>[0], res: Parameters<Parameters<typeof router.get>[1]>[1]): boolean {
  if (req.session?.adminAuthenticated !== true) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

router.get("/admin/orders", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        orderRef: ordersTable.orderRef,
        teamMemberId: ordersTable.teamMemberId,
        memberName: teamMembersTable.fullName,
        memberUsername: teamMembersTable.username,
        customerName: ordersTable.customerName,
        customerPhone: ordersTable.customerPhone,
        customerEmail: ordersTable.customerEmail,
        shippingAddress: ordersTable.shippingAddress,
        notes: ordersTable.notes,
        status: ordersTable.status,
        createdAt: ordersTable.createdAt,
        updatedAt: ordersTable.updatedAt,
      })
      .from(ordersTable)
      .innerJoin(teamMembersTable, eq(ordersTable.teamMemberId, teamMembersTable.id))
      .orderBy(desc(ordersTable.createdAt));

    const orderIds = orders.map((o) => o.id);

    const [allItems, allProofs] = await Promise.all([
      orderIds.length ? db.select().from(orderItemsTable) : Promise.resolve([]),
      orderIds.length ? db.select().from(orderProofsTable) : Promise.resolve([]),
    ]);

    type ItemRow = (typeof allItems)[number];
    type ProofRow = (typeof allProofs)[number];
    const itemsByOrder = new Map<number, ItemRow[]>();
    const proofsByOrder = new Map<number, ProofRow[]>();
    for (const item of allItems) {
      if (!orderIds.includes(item.orderId)) continue;
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
      itemsByOrder.get(item.orderId)!.push(item);
    }
    for (const proof of allProofs) {
      if (!orderIds.includes(proof.orderId)) continue;
      if (!proofsByOrder.has(proof.orderId)) proofsByOrder.set(proof.orderId, []);
      proofsByOrder.get(proof.orderId)!.push(proof);
    }

    res.json(orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: itemsByOrder.get(o.id) ?? [],
      proofs: (proofsByOrder.get(o.id) ?? []).map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get admin orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/orders/:id/status", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const orderId = parseInt(String(req.params.id));
    const { status } = z.object({
      status: z.enum(["pending", "pending_review", "approved", "rejected", "paid"]),
    }).parse(req.body);

    await db.update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, orderId));

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/admin/orders/:id/proof/:proofId", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const proofId = parseInt(String(req.params.proofId));
    const { adminReviewed, adminNote } = z.object({
      adminReviewed: z.boolean().optional(),
      adminNote: z.string().max(500).nullable().optional(),
    }).parse(req.body);

    await db.update(orderProofsTable)
      .set({
        ...(adminReviewed !== undefined ? { adminReviewed } : {}),
        ...(adminNote !== undefined ? { adminNote } : {}),
      })
      .where(eq(orderProofsTable.id, proofId));

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to review proof");
    res.status(400).json({ error: "Invalid request" });
  }
});

// ─── REWARDS ──────────────────────────────────────────────────────────────────

router.get("/admin/rewards", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rewards = await db
      .select({
        id: rewardsTable.id,
        teamMemberId: rewardsTable.teamMemberId,
        memberName: teamMembersTable.fullName,
        memberUsername: teamMembersTable.username,
        title: rewardsTable.title,
        description: rewardsTable.description,
        amount: rewardsTable.amount,
        rewardType: rewardsTable.rewardType,
        status: rewardsTable.status,
        adminNote: rewardsTable.adminNote,
        createdAt: rewardsTable.createdAt,
        updatedAt: rewardsTable.updatedAt,
      })
      .from(rewardsTable)
      .innerJoin(teamMembersTable, eq(rewardsTable.teamMemberId, teamMembersTable.id))
      .orderBy(desc(rewardsTable.createdAt));

    res.json(rewards.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get rewards");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/rewards", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const schema = z.object({
      teamMemberId: z.number().int().positive(),
      title: z.string().min(1).max(200),
      description: z.string().max(500).nullable().optional(),
      amount: z.string().max(50).nullable().optional(),
      rewardType: z.enum(["bonus", "commission", "voucher", "achievement"]).default("bonus"),
      adminNote: z.string().max(500).nullable().optional(),
    });
    const data = schema.parse(req.body);

    const [reward] = await db.insert(rewardsTable).values({
      ...data,
      description: data.description ?? null,
      amount: data.amount ?? null,
      adminNote: data.adminNote ?? null,
      status: "pending",
    }).returning();

    res.status(201).json({ ...reward, createdAt: reward.createdAt.toISOString(), updatedAt: reward.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create reward");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.put("/admin/rewards/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rewardId = parseInt(String(req.params.id));
    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(500).nullable().optional(),
      amount: z.string().max(50).nullable().optional(),
      rewardType: z.enum(["bonus", "commission", "voucher", "achievement"]).optional(),
      status: z.enum(["pending", "approved", "paid"]).optional(),
      adminNote: z.string().max(500).nullable().optional(),
    });
    const data = schema.parse(req.body);

    await db.update(rewardsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rewardsTable.id, rewardId));

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update reward");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/admin/rewards/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rewardId = parseInt(String(req.params.id));
    await db.delete(rewardsTable).where(eq(rewardsTable.id, rewardId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete reward");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── BADGES ───────────────────────────────────────────────────────────────────

router.get("/admin/members/:id/badges", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const memberId = parseInt(String(req.params.id));
    const badges = await db.select().from(memberBadgesTable)
      .where(eq(memberBadgesTable.teamMemberId, memberId))
      .orderBy(desc(memberBadgesTable.createdAt));
    res.json(badges.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to get badges");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/members/:id/badges", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const memberId = parseInt(String(req.params.id));
    const { badgeType, period } = z.object({
      badgeType: z.enum(["top_seller", "most_viewed", "most_followed", "trending"]),
      period: z.string().default("all-time"),
    }).parse(req.body);

    const [badge] = await db.insert(memberBadgesTable)
      .values({ teamMemberId: memberId, badgeType, period })
      .returning();

    res.status(201).json({ ...badge, createdAt: badge.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create badge");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/admin/badges/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const badgeId = parseInt(String(req.params.id));
    await db.delete(memberBadgesTable).where(eq(memberBadgesTable.id, badgeId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete badge");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
