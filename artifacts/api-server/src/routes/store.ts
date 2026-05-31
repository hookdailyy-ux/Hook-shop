import { Router, type IRouter } from "express";
import { db, teamMembersTable, collectionsTable, teamLooksTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

const router: IRouter = Router();

/**
 * GET /api/store/:username
 * Public store page for a team member.
 * Returns profile + active collections + active looks.
 */
router.get("/store/:username", async (req, res) => {
  try {
    const username = String(req.params.username).toLowerCase();

    const [member] = await db
      .select({
        id: teamMembersTable.id,
        fullName: teamMembersTable.fullName,
        displayName: teamMembersTable.displayName,
        username: teamMembersTable.username,
        bio: teamMembersTable.bio,
        profilePhotoUrl: teamMembersTable.profilePhotoUrl,
        coverImageUrl: teamMembersTable.coverImageUrl,
        whatsapp: teamMembersTable.whatsapp,
        status: teamMembersTable.status,
      })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.username, username))
      .limit(1);

    if (!member || member.status === "disabled") {
      res.status(404).json({ error: "Store not found" });
      return;
    }

    const [collections, looks] = await Promise.all([
      db
        .select({
          id: collectionsTable.id,
          title: collectionsTable.title,
          coverImageUrl: collectionsTable.coverImageUrl,
          shareToken: collectionsTable.shareToken,
          views: collectionsTable.views,
          status: collectionsTable.status,
          createdAt: collectionsTable.createdAt,
        })
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.teamMemberId, member.id),
            eq(collectionsTable.status, "active")
          )
        ),
      db
        .select({
          id: teamLooksTable.id,
          title: teamLooksTable.title,
          coverImageUrl: teamLooksTable.coverImageUrl,
          price: teamLooksTable.price,
          shareToken: teamLooksTable.shareToken,
          views: teamLooksTable.views,
          status: teamLooksTable.status,
          createdAt: teamLooksTable.createdAt,
        })
        .from(teamLooksTable)
        .where(
          and(
            eq(teamLooksTable.teamMemberId, member.id),
            eq(teamLooksTable.status, "active")
          )
        ),
    ]);

    const totalViews =
      collections.reduce((s, c) => s + c.views, 0) +
      looks.reduce((s, l) => s + l.views, 0);

    res.json({
      member: {
        id: member.id,
        fullName: member.fullName,
        displayName: member.displayName ?? null,
        username: member.username,
        bio: member.bio ?? null,
        profilePhotoUrl: member.profilePhotoUrl ?? null,
        coverImageUrl: member.coverImageUrl ?? null,
        whatsapp: member.whatsapp ?? null,
      },
      stats: {
        collections: collections.length,
        looks: looks.length,
        totalViews,
      },
      collections: collections.map((c) => ({
        id: c.id,
        title: c.title,
        coverImageUrl: c.coverImageUrl ?? null,
        shareToken: c.shareToken,
        views: c.views,
        createdAt: c.createdAt.toISOString(),
      })),
      looks: looks.map((l) => ({
        id: l.id,
        title: l.title,
        coverImageUrl: l.coverImageUrl ?? null,
        price: l.price ?? null,
        shareToken: l.shareToken,
        views: l.views,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get store page");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
