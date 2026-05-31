import { Router, type IRouter } from "express";
import {
  db,
  teamMembersTable,
  collectionsTable,
  teamLooksTable,
  collectionProductsTable,
  productsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

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
        whyShopWithMe: teamMembersTable.whyShopWithMe,
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

    const [collections, looks, productCountResult, featuredProducts] = await Promise.all([
      db
        .select({
          id: collectionsTable.id,
          title: collectionsTable.title,
          coverImageUrl: collectionsTable.coverImageUrl,
          shareToken: collectionsTable.shareToken,
          views: collectionsTable.views,
          createdAt: collectionsTable.createdAt,
        })
        .from(collectionsTable)
        .where(and(eq(collectionsTable.teamMemberId, member.id), eq(collectionsTable.status, "active"))),

      db
        .select({
          id: teamLooksTable.id,
          title: teamLooksTable.title,
          coverImageUrl: teamLooksTable.coverImageUrl,
          price: teamLooksTable.price,
          shareToken: teamLooksTable.shareToken,
          views: teamLooksTable.views,
          createdAt: teamLooksTable.createdAt,
        })
        .from(teamLooksTable)
        .where(and(eq(teamLooksTable.teamMemberId, member.id), eq(teamLooksTable.status, "active"))),

      db
        .select({ count: sql<number>`count(distinct ${collectionProductsTable.productId})::int` })
        .from(collectionProductsTable)
        .innerJoin(collectionsTable, eq(collectionProductsTable.collectionId, collectionsTable.id))
        .where(and(eq(collectionsTable.teamMemberId, member.id), eq(collectionsTable.status, "active"))),

      db
        .selectDistinctOn([productsTable.id], {
          id: productsTable.id,
          title: productsTable.title,
          imageUrl: productsTable.imageUrl,
          brand: productsTable.brand,
          affiliateUrl: productsTable.affiliateUrl,
          category: productsTable.category,
          hookPrice: productsTable.price,
          collectionPrice: collectionProductsTable.collectionPrice,
        })
        .from(productsTable)
        .innerJoin(collectionProductsTable, eq(collectionProductsTable.productId, productsTable.id))
        .innerJoin(collectionsTable, eq(collectionProductsTable.collectionId, collectionsTable.id))
        .where(and(eq(collectionsTable.teamMemberId, member.id), eq(collectionsTable.status, "active")))
        .limit(12),
    ]);

    const productCount = productCountResult[0]?.count ?? 0;
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
        whyShopWithMe: member.whyShopWithMe ?? null,
        profilePhotoUrl: member.profilePhotoUrl ?? null,
        coverImageUrl: member.coverImageUrl ?? null,
        whatsapp: member.whatsapp ?? null,
      },
      stats: {
        products: productCount,
        collections: collections.length,
        looks: looks.length,
        followers: 0,
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
      featuredProducts: featuredProducts.map((p) => ({
        id: p.id,
        title: p.title,
        imageUrl: p.imageUrl ?? null,
        brand: p.brand ?? null,
        affiliateUrl: p.affiliateUrl,
        category: p.category,
        displayPrice: p.collectionPrice ?? p.hookPrice ?? null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get store page");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
