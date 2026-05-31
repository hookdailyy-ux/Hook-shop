import { Router, type IRouter } from "express";
import { db, teamMembersTable, ordersTable, orderItemsTable, orderProofsTable, analyticsEventsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// ─── PUBLIC: Submit order from store page ─────────────────────────────────────

router.post("/store/:username/order", async (req, res) => {
  try {
    const username = String(req.params.username).toLowerCase();

    const [member] = await db
      .select({ id: teamMembersTable.id, status: teamMembersTable.status })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.username, username))
      .limit(1);

    if (!member || member.status === "disabled") {
      res.status(404).json({ error: "Store not found" });
      return;
    }

    const schema = z.object({
      customerName: z.string().min(1).max(120),
      customerPhone: z.string().min(1).max(30),
      customerEmail: z.string().email().nullable().optional(),
      shippingAddress: z.string().max(500).nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
      items: z.array(z.object({
        productId: z.number().int().nullable().optional(),
        productTitle: z.string().min(1).max(300),
        productImageUrl: z.string().nullable().optional(),
        displayPrice: z.string().nullable().optional(),
        quantity: z.number().int().min(1).max(99).default(1),
        affiliateUrl: z.string().nullable().optional(),
        brand: z.string().nullable().optional(),
      })).min(1).max(50),
    });

    const data = schema.parse(req.body);
    const orderRef = `ORD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    const [order] = await db
      .insert(ordersTable)
      .values({
        teamMemberId: member.id,
        orderRef,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail ?? null,
        shippingAddress: data.shippingAddress ?? null,
        notes: data.notes ?? null,
        status: "pending",
      })
      .returning();

    await db.insert(orderItemsTable).values(
      data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId ?? null,
        productTitle: item.productTitle,
        productImageUrl: item.productImageUrl ?? null,
        displayPrice: item.displayPrice ?? null,
        quantity: item.quantity,
        affiliateUrl: item.affiliateUrl ?? null,
        brand: item.brand ?? null,
      }))
    );

    // track order_submit event
    await db.insert(analyticsEventsTable).values({
      teamMemberId: member.id,
      entityType: "profile",
      entityId: member.id,
      eventType: "order_submit",
    });

    res.status(201).json({ ok: true, orderRef: order.orderRef });
  } catch (err) {
    req.log.error({ err }, "Failed to submit order");
    res.status(400).json({ error: "Invalid order data" });
  }
});

// ─── TEAM: My orders ──────────────────────────────────────────────────────────

function requireTeam(req: Parameters<Parameters<typeof router.get>[1]>[0], res: Parameters<Parameters<typeof router.get>[1]>[1]): number | null {
  const id = req.session?.teamMemberId;
  if (!id) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return id;
}

router.get("/team/orders", async (req, res) => {
  const memberId = requireTeam(req, res);
  if (!memberId) return;
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.teamMemberId, memberId))
      .orderBy(desc(ordersTable.createdAt));

    const orderIds = orders.map((o) => o.id);
    const allItems = orderIds.length
      ? await db.select().from(orderItemsTable)
      : [];

    const itemsByOrder = new Map<number, typeof allItems>();
    for (const item of allItems) {
      if (!orderIds.includes(item.orderId)) continue;
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
      itemsByOrder.get(item.orderId)!.push(item);
    }

    const proofs = orderIds.length
      ? await db.select().from(orderProofsTable)
      : [];
    const proofsByOrder = new Map<number, typeof proofs>();
    for (const proof of proofs) {
      if (!orderIds.includes(proof.orderId)) continue;
      if (!proofsByOrder.has(proof.orderId)) proofsByOrder.set(proof.orderId, []);
      proofsByOrder.get(proof.orderId)!.push(proof);
    }

    res.json(orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: (itemsByOrder.get(o.id) ?? []).map((i) => ({ ...i })),
      proofs: (proofsByOrder.get(o.id) ?? []).map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get team orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/team/orders/:id/status", async (req, res) => {
  const memberId = requireTeam(req, res);
  if (!memberId) return;
  try {
    const orderId = parseInt(String(req.params.id));
    const { status } = z.object({
      status: z.enum(["pending", "pending_review", "approved", "rejected", "paid"]),
    }).parse(req.body);

    const [order] = await db
      .select({ id: ordersTable.id, teamMemberId: ordersTable.teamMemberId })
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.teamMemberId, memberId)))
      .limit(1);

    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    await db.update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, orderId));

    res.json({ ok: true, status });
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/team/orders/:id/proof", async (req, res) => {
  const memberId = requireTeam(req, res);
  if (!memberId) return;
  try {
    const orderId = parseInt(String(req.params.id));
    const { imageUrl, proofType, platformOrderRef, orderValue, memberNotes } = z.object({
      imageUrl: z.string().min(1),
      proofType: z.string().default("confirmation"),
      platformOrderRef: z.string().optional().nullable(),
      orderValue: z.string().optional().nullable(),
      memberNotes: z.string().optional().nullable(),
    }).parse(req.body);

    const [order] = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.teamMemberId, memberId)))
      .limit(1);

    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const [proof] = await db.insert(orderProofsTable)
      .values({ orderId, imageUrl, proofType, platformOrderRef, orderValue, memberNotes })
      .returning();

    res.status(201).json({ ...proof, createdAt: proof.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to add order proof");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/team/orders/:id/proof/:proofId", async (req, res) => {
  const memberId = requireTeam(req, res);
  if (!memberId) return;
  try {
    const orderId = parseInt(String(req.params.id));
    const proofId = parseInt(String(req.params.proofId));

    const [order] = await db.select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.teamMemberId, memberId)))
      .limit(1);
    if (!order) { res.status(404).json({ error: "Not found" }); return; }

    await db.delete(orderProofsTable)
      .where(and(eq(orderProofsTable.id, proofId), eq(orderProofsTable.orderId, orderId)));

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete proof");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
