import { Router, type IRouter } from "express";
import { db, collectionsTable, teamMembersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireTeamMember } from "../middlewares/requireTeamMember";

const router: IRouter = Router();

function generateShareToken(): string {
  return randomBytes(8).toString("hex");
}

function fmt(c: typeof collectionsTable.$inferSelect) {
  return {
    id: c.id,
    teamMemberId: c.teamMemberId,
    title: c.title,
    description: c.description ?? "",
    coverImageUrl: c.coverImageUrl ?? null,
    status: c.status,
    shareToken: c.shareToken,
    views: c.views,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

const collectionSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  status: z.enum(["active", "hidden"]).default("active"),
});

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

router.get("/collections/public/:token", async (req, res) => {
  try {
    const [row] = await db
      .select({
        id: collectionsTable.id,
        title: collectionsTable.title,
        description: collectionsTable.description,
        coverImageUrl: collectionsTable.coverImageUrl,
        status: collectionsTable.status,
        shareToken: collectionsTable.shareToken,
        createdAt: collectionsTable.createdAt,
        memberFullName: teamMembersTable.fullName,
        memberUsername: teamMembersTable.username,
      })
      .from(collectionsTable)
      .innerJoin(teamMembersTable, eq(collectionsTable.teamMemberId, teamMembersTable.id))
      .where(eq(collectionsTable.shareToken, String(req.params.token)))
      .limit(1);

    if (!row || row.status !== "active") {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    // Increment view count (fire-and-forget)
    void db
      .update(collectionsTable)
      .set({ views: sql`${collectionsTable.views} + 1` })
      .where(eq(collectionsTable.shareToken, String(req.params.token)));

    res.json({
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      coverImageUrl: row.coverImageUrl ?? null,
      shareToken: row.shareToken,
      createdAt: row.createdAt.toISOString(),
      member: { fullName: row.memberFullName, username: row.memberUsername },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get public collection");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── TEAM MEMBER ─────────────────────────────────────────────────────────────

router.get("/collections", requireTeamMember, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.teamMemberId, req.session.teamMemberId!))
      .orderBy(desc(collectionsTable.createdAt));
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "Failed to list collections");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/collections", requireTeamMember, async (req, res) => {
  try {
    const data = collectionSchema.parse(req.body);
    const [collection] = await db
      .insert(collectionsTable)
      .values({
        teamMemberId: req.session.teamMemberId!,
        title: data.title,
        description: data.description ?? null,
        coverImageUrl: data.coverImageUrl || null,
        status: data.status,
        shareToken: generateShareToken(),
        views: 0,
      })
      .returning();
    res.status(201).json(fmt(collection));
  } catch (err) {
    req.log.error({ err }, "Failed to create collection");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/collections/:id", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [row] = await db
      .select()
      .from(collectionsTable)
      .where(and(eq(collectionsTable.id, id), eq(collectionsTable.teamMemberId, req.session.teamMemberId!)))
      .limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "Failed to get collection");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/collections/:id", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const data = collectionSchema.partial().parse(req.body);
    const updates: Partial<typeof collectionsTable.$inferInsert> = { updatedAt: new Date() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.coverImageUrl !== undefined) updates.coverImageUrl = data.coverImageUrl || null;
    if (data.status !== undefined) updates.status = data.status;
    const [updated] = await db
      .update(collectionsTable)
      .set(updates)
      .where(and(eq(collectionsTable.id, id), eq(collectionsTable.teamMemberId, req.session.teamMemberId!)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update collection");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/collections/:id", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db
      .delete(collectionsTable)
      .where(and(eq(collectionsTable.id, id), eq(collectionsTable.teamMemberId, req.session.teamMemberId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete collection");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/collections/members
 * Returns per-member summary: total collections + total views (for ranking).
 */
router.get("/admin/collections/members", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        memberId: teamMembersTable.id,
        fullName: teamMembersTable.fullName,
        username: teamMembersTable.username,
        totalCollections: sql<number>`CAST(COUNT(${collectionsTable.id}) AS INTEGER)`,
        totalViews: sql<number>`CAST(COALESCE(SUM(${collectionsTable.views}), 0) AS INTEGER)`,
      })
      .from(teamMembersTable)
      .leftJoin(collectionsTable, eq(collectionsTable.teamMemberId, teamMembersTable.id))
      .groupBy(teamMembersTable.id, teamMembersTable.fullName, teamMembersTable.username)
      .orderBy(desc(sql`COALESCE(SUM(${collectionsTable.views}), 0)`));

    res.json(
      rows.map((r) => ({
        memberId: r.memberId,
        fullName: r.fullName,
        username: r.username,
        totalCollections: r.totalCollections,
        totalViews: r.totalViews,
        totalLooks: 0,
        totalLookViews: 0,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get member collection summaries");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/admin/collections/member/:memberId
 * Returns all collections for a specific team member (admin view).
 */
router.get("/admin/collections/member/:memberId", requireAdmin, async (req, res) => {
  try {
    const memberId = parseInt(String(req.params.memberId), 10);
    if (isNaN(memberId)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [member] = await db
      .select({
        id: teamMembersTable.id,
        fullName: teamMembersTable.fullName,
        username: teamMembersTable.username,
      })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, memberId))
      .limit(1);

    if (!member) { res.status(404).json({ error: "Member not found" }); return; }

    const collections = await db
      .select({
        id: collectionsTable.id,
        title: collectionsTable.title,
        coverImageUrl: collectionsTable.coverImageUrl,
        status: collectionsTable.status,
        views: collectionsTable.views,
        shareToken: collectionsTable.shareToken,
        createdAt: collectionsTable.createdAt,
      })
      .from(collectionsTable)
      .where(eq(collectionsTable.teamMemberId, memberId))
      .orderBy(desc(collectionsTable.views));

    res.json({
      member: { id: member.id, fullName: member.fullName, username: member.username },
      collections: collections.map((c) => ({
        id: c.id,
        title: c.title,
        coverImageUrl: c.coverImageUrl ?? null,
        status: c.status,
        views: c.views,
        shareToken: c.shareToken,
        productCount: 0,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get member collections detail");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/admin/collections
 * Returns flat list of all collections with member info.
 */
router.get("/admin/collections", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: collectionsTable.id,
        title: collectionsTable.title,
        description: collectionsTable.description,
        coverImageUrl: collectionsTable.coverImageUrl,
        status: collectionsTable.status,
        shareToken: collectionsTable.shareToken,
        views: collectionsTable.views,
        teamMemberId: collectionsTable.teamMemberId,
        createdAt: collectionsTable.createdAt,
        memberFullName: teamMembersTable.fullName,
        memberUsername: teamMembersTable.username,
      })
      .from(collectionsTable)
      .innerJoin(teamMembersTable, eq(collectionsTable.teamMemberId, teamMembersTable.id))
      .orderBy(desc(collectionsTable.createdAt));
    res.json(
      rows.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description ?? "",
        coverImageUrl: c.coverImageUrl ?? null,
        status: c.status,
        shareToken: c.shareToken,
        views: c.views,
        teamMemberId: c.teamMemberId,
        createdAt: c.createdAt.toISOString(),
        member: { fullName: c.memberFullName, username: c.memberUsername },
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list all collections");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
