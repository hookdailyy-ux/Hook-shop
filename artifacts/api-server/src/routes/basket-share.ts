import { Router, type IRouter } from "express";
import { db, sharedBasketsTable, analyticsEventsTable, teamMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

router.post("/basket/share", async (req, res) => {
  try {
    const schema = z.object({
      memberUsername: z.string().min(1).max(60),
      memberName: z.string().min(1).max(120),
      items: z.array(z.unknown()).min(1).max(100),
    });
    const data = schema.parse(req.body);
    const token = (crypto.randomUUID() as string).replace(/-/g, "").substring(0, 20);

    await db.insert(sharedBasketsTable).values({
      token,
      memberUsername: data.memberUsername,
      memberName: data.memberName,
      itemsJson: JSON.stringify(data.items),
    });

    // Track shared_basket analytics event
    let memberId: number | null = null;
    if (data.memberUsername) {
      const [found] = await db
        .select({ id: teamMembersTable.id })
        .from(teamMembersTable)
        .where(eq(teamMembersTable.username, data.memberUsername))
        .limit(1);
      memberId = found?.id ?? null;
    }
    await db.insert(analyticsEventsTable).values({
      teamMemberId: memberId,
      entityType: "profile",
      entityId: null,
      eventType: "shared_basket",
    });

    res.status(201).json({ token });
  } catch (err) {
    req.log.error({ err }, "Failed to create shared basket");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/basket/:token", async (req, res) => {
  try {
    const token = String(req.params.token);
    const [row] = await db
      .select()
      .from(sharedBasketsTable)
      .where(eq(sharedBasketsTable.token, token))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Basket not found" }); return; }

    let items: unknown[] = [];
    try { items = JSON.parse(row.itemsJson) as unknown[]; } catch { /* ignore */ }

    res.json({
      token: row.token,
      memberUsername: row.memberUsername,
      memberName: row.memberName,
      items,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get shared basket");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
