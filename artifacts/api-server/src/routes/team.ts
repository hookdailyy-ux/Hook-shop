import { Router, type IRouter } from "express";
import { db, teamMembersTable, teamMemberActivityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { createHash } from "crypto";
import { requireAdmin } from "../middlewares/requireAdmin";
import { z } from "zod";

const router: IRouter = Router();

function hashPassword(password: string, username: string): string {
  return createHash("sha256").update(`${username}:${password}`).digest("hex");
}

function isOnline(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return lastActiveAt > new Date(Date.now() - 5 * 60 * 1000);
}

function formatMember(m: typeof teamMembersTable.$inferSelect) {
  return {
    id: m.id,
    fullName: m.fullName,
    username: m.username,
    whatsapp: m.whatsapp ?? "",
    notes: m.notes ?? "",
    status: m.status,
    forcePasswordChange: m.forcePasswordChange,
    isOnline: isOnline(m.lastActiveAt),
    lastActiveAt: m.lastActiveAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    totalCollections: 0,
    totalLooks: 0,
    monthOrdersValue: 0,
    estimatedRewards: 0,
  };
}

router.get("/team", requireAdmin, async (req, res) => {
  try {
    const members = await db
      .select()
      .from(teamMembersTable)
      .orderBy(desc(teamMembersTable.createdAt));
    res.json(members.map(formatMember));
  } catch (err) {
    req.log.error({ err }, "Failed to list team members");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/team", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      fullName: z.string().min(1),
      username: z
        .string()
        .min(2)
        .max(32)
        .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers and underscores"),
      password: z.string().min(6),
      whatsapp: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["active", "disabled"]).default("active"),
    });
    const data = schema.parse(req.body);

    const existing = await db
      .select({ id: teamMembersTable.id })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.username, data.username))
      .limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    const [member] = await db
      .insert(teamMembersTable)
      .values({
        fullName: data.fullName,
        username: data.username,
        passwordHash: hashPassword(data.password, data.username),
        whatsapp: data.whatsapp ?? null,
        notes: data.notes ?? null,
        status: data.status,
        forcePasswordChange: true,
      })
      .returning();
    res.status(201).json(formatMember(member));
  } catch (err) {
    req.log.error({ err }, "Failed to create team member");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/team/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [member] = await db
      .select()
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, id))
      .limit(1);
    if (!member) { res.status(404).json({ error: "Not found" }); return; }

    const activity = await db
      .select()
      .from(teamMemberActivityTable)
      .where(eq(teamMemberActivityTable.memberId, id))
      .orderBy(desc(teamMemberActivityTable.createdAt))
      .limit(20);

    res.json({
      ...formatMember(member),
      activity: activity.map((a) => ({
        id: a.id,
        action: a.action,
        details: a.details ?? "",
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get team member");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/team/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const schema = z.object({
      fullName: z.string().min(1).optional(),
      whatsapp: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["active", "disabled"]).optional(),
    });
    const data = schema.parse(req.body);

    const updates: Partial<typeof teamMembersTable.$inferInsert> = {};
    if (data.fullName !== undefined) updates.fullName = data.fullName;
    if (data.whatsapp !== undefined) updates.whatsapp = data.whatsapp;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.status !== undefined) updates.status = data.status;

    const [updated] = await db
      .update(teamMembersTable)
      .set(updates)
      .where(eq(teamMembersTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatMember(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update team member");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.put("/team/:id/password", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const { newPassword } = z.object({ newPassword: z.string().min(6) }).parse(req.body);

    const [member] = await db
      .select({ username: teamMembersTable.username })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, id))
      .limit(1);
    if (!member) { res.status(404).json({ error: "Not found" }); return; }

    await db
      .update(teamMembersTable)
      .set({ passwordHash: hashPassword(newPassword, member.username), forcePasswordChange: true })
      .where(eq(teamMembersTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to reset password");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/team/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(teamMembersTable).where(eq(teamMembersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete team member");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
