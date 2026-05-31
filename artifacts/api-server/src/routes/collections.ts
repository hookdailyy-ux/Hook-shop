import { Router, type IRouter } from "express";
import {
  db,
  collectionsTable,
  teamMembersTable,
  collectionProductsTable,
  productsTable,
} from "@workspace/db";
import { eq, desc, and, sql, asc, getTableColumns } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireTeamMember } from "../middlewares/requireTeamMember";

const router: IRouter = Router();

function generateShareToken(): string {
  return randomBytes(8).toString("hex");
}

function fmtCollection(
  c: typeof collectionsTable.$inferSelect,
  productCount = 0,
) {
  return {
    id: c.id,
    teamMemberId: c.teamMemberId,
    title: c.title,
    description: c.description ?? "",
    coverImageUrl: c.coverImageUrl ?? null,
    status: c.status,
    shareToken: c.shareToken,
    views: c.views,
    productCount,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function fmtCollectionProduct(row: {
  id: number;
  productId: number;
  collectionPrice: string | null;
  sortOrder: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  hookPrice: string | null;
  imageUrl: string | null;
  brand: string | null;
  affiliateUrl: string;
  category: string;
}) {
  return {
    id: row.id,
    productId: row.productId,
    collectionPrice: row.collectionPrice ?? null,
    sortOrder: row.sortOrder,
    views: row.views,
    title: row.title,
    hookPrice: row.hookPrice ?? null,
    imageUrl: row.imageUrl ?? null,
    brand: row.brand ?? null,
    affiliateUrl: row.affiliateUrl,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const collectionSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  status: z.enum(["active", "hidden"]).default("active"),
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function getCollectionWithCount(id: number, memberId: number) {
  const [row] = await db
    .select({
      ...getTableColumns(collectionsTable),
      productCount: sql<number>`CAST(COUNT(${collectionProductsTable.id}) AS INTEGER)`,
    })
    .from(collectionsTable)
    .leftJoin(
      collectionProductsTable,
      eq(collectionProductsTable.collectionId, collectionsTable.id),
    )
    .where(
      and(
        eq(collectionsTable.id, id),
        eq(collectionsTable.teamMemberId, memberId),
      ),
    )
    .groupBy(collectionsTable.id)
    .limit(1);
  return row ?? null;
}

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

    void db
      .update(collectionsTable)
      .set({ views: sql`${collectionsTable.views} + 1` })
      .where(eq(collectionsTable.shareToken, String(req.params.token)));

    // Fetch products for public page
    const products = await db
      .select({
        id: collectionProductsTable.id,
        productId: collectionProductsTable.productId,
        collectionPrice: collectionProductsTable.collectionPrice,
        sortOrder: collectionProductsTable.sortOrder,
        title: productsTable.title,
        hookPrice: productsTable.price,
        imageUrl: productsTable.imageUrl,
        brand: productsTable.brand,
        affiliateUrl: productsTable.affiliateUrl,
        category: productsTable.category,
      })
      .from(collectionProductsTable)
      .innerJoin(productsTable, eq(collectionProductsTable.productId, productsTable.id))
      .where(eq(collectionProductsTable.collectionId, row.id))
      .orderBy(asc(collectionProductsTable.sortOrder), asc(collectionProductsTable.id));

    res.json({
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      coverImageUrl: row.coverImageUrl ?? null,
      shareToken: row.shareToken,
      createdAt: row.createdAt.toISOString(),
      member: { fullName: row.memberFullName, username: row.memberUsername },
      products: products.map((p) => ({
        id: p.id,
        productId: p.productId,
        title: p.title,
        // Public page shows collectionPrice if set, else hookPrice
        displayPrice: p.collectionPrice ?? p.hookPrice ?? null,
        imageUrl: p.imageUrl ?? null,
        brand: p.brand ?? null,
        affiliateUrl: p.affiliateUrl,
        category: p.category,
        sortOrder: p.sortOrder,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get public collection");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── TEAM MEMBER — COLLECTIONS CRUD ──────────────────────────────────────────

router.get("/collections", requireTeamMember, async (req, res) => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(collectionsTable),
        productCount: sql<number>`CAST(COUNT(${collectionProductsTable.id}) AS INTEGER)`,
      })
      .from(collectionsTable)
      .leftJoin(
        collectionProductsTable,
        eq(collectionProductsTable.collectionId, collectionsTable.id),
      )
      .where(eq(collectionsTable.teamMemberId, req.session.teamMemberId!))
      .groupBy(collectionsTable.id)
      .orderBy(desc(collectionsTable.createdAt));

    res.json(rows.map((r) => fmtCollection(r, r.productCount)));
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
    res.status(201).json(fmtCollection(collection, 0));
  } catch (err) {
    req.log.error({ err }, "Failed to create collection");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/collections/:id", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const row = await getCollectionWithCount(id, req.session.teamMemberId!);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtCollection(row, row.productCount));
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
    const row = await getCollectionWithCount(id, req.session.teamMemberId!);
    res.json(fmtCollection(updated, row?.productCount ?? 0));
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

// ─── TEAM MEMBER — COLLECTION PRODUCTS ───────────────────────────────────────

/**
 * GET /api/collections/:id/products
 * List products in a collection (owned by current team member).
 */
router.get("/collections/:id/products", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    // Verify ownership
    const [col] = await db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(and(eq(collectionsTable.id, id), eq(collectionsTable.teamMemberId, req.session.teamMemberId!)))
      .limit(1);
    if (!col) { res.status(404).json({ error: "Collection not found" }); return; }

    const rows = await db
      .select({
        id: collectionProductsTable.id,
        productId: collectionProductsTable.productId,
        collectionPrice: collectionProductsTable.collectionPrice,
        sortOrder: collectionProductsTable.sortOrder,
        views: collectionProductsTable.views,
        createdAt: collectionProductsTable.createdAt,
        updatedAt: collectionProductsTable.updatedAt,
        title: productsTable.title,
        hookPrice: productsTable.price,
        imageUrl: productsTable.imageUrl,
        brand: productsTable.brand,
        affiliateUrl: productsTable.affiliateUrl,
        category: productsTable.category,
      })
      .from(collectionProductsTable)
      .innerJoin(productsTable, eq(collectionProductsTable.productId, productsTable.id))
      .where(eq(collectionProductsTable.collectionId, id))
      .orderBy(asc(collectionProductsTable.sortOrder), asc(collectionProductsTable.id));

    res.json(rows.map(fmtCollectionProduct));
  } catch (err) {
    req.log.error({ err }, "Failed to list collection products");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/collections/:id/products
 * Add a product to a collection. Body: { productId: number }
 */
router.post("/collections/:id/products", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const { productId } = z.object({ productId: z.number().int().positive() }).parse(req.body);

    // Verify ownership
    const [col] = await db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(and(eq(collectionsTable.id, id), eq(collectionsTable.teamMemberId, req.session.teamMemberId!)))
      .limit(1);
    if (!col) { res.status(404).json({ error: "Collection not found" }); return; }

    // Check product exists and is active
    const [product] = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    // Check not already in collection
    const [existing] = await db
      .select({ id: collectionProductsTable.id })
      .from(collectionProductsTable)
      .where(and(eq(collectionProductsTable.collectionId, id), eq(collectionProductsTable.productId, productId)))
      .limit(1);
    if (existing) { res.status(409).json({ error: "Product already in collection" }); return; }

    // Get next sort order
    const [maxRow] = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${collectionProductsTable.sortOrder}), -1)` })
      .from(collectionProductsTable)
      .where(eq(collectionProductsTable.collectionId, id));

    const sortOrder = (maxRow?.maxOrder ?? -1) + 1;

    const [entry] = await db
      .insert(collectionProductsTable)
      .values({ collectionId: id, productId, sortOrder, views: 0 })
      .returning();

    // Fetch full product data for response
    const [fullRow] = await db
      .select({
        id: collectionProductsTable.id,
        productId: collectionProductsTable.productId,
        collectionPrice: collectionProductsTable.collectionPrice,
        sortOrder: collectionProductsTable.sortOrder,
        views: collectionProductsTable.views,
        createdAt: collectionProductsTable.createdAt,
        updatedAt: collectionProductsTable.updatedAt,
        title: productsTable.title,
        hookPrice: productsTable.price,
        imageUrl: productsTable.imageUrl,
        brand: productsTable.brand,
        affiliateUrl: productsTable.affiliateUrl,
        category: productsTable.category,
      })
      .from(collectionProductsTable)
      .innerJoin(productsTable, eq(collectionProductsTable.productId, productsTable.id))
      .where(eq(collectionProductsTable.id, entry.id))
      .limit(1);

    res.status(201).json(fmtCollectionProduct(fullRow));
  } catch (err) {
    req.log.error({ err }, "Failed to add product to collection");
    res.status(400).json({ error: "Invalid input" });
  }
});

/**
 * PATCH /api/collections/:id/products/:entryId
 * Update collection price for a product entry.
 * Body: { collectionPrice: string | null }
 */
router.patch("/collections/:id/products/:entryId", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const entryId = parseInt(String(req.params.entryId), 10);
    if (isNaN(id) || isNaN(entryId)) { res.status(400).json({ error: "Invalid ID" }); return; }

    // Verify ownership via collection
    const [col] = await db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(and(eq(collectionsTable.id, id), eq(collectionsTable.teamMemberId, req.session.teamMemberId!)))
      .limit(1);
    if (!col) { res.status(404).json({ error: "Collection not found" }); return; }

    const { collectionPrice } = z
      .object({ collectionPrice: z.string().nullable() })
      .parse(req.body);

    const [updated] = await db
      .update(collectionProductsTable)
      .set({ collectionPrice: collectionPrice || null, updatedAt: new Date() })
      .where(and(eq(collectionProductsTable.id, entryId), eq(collectionProductsTable.collectionId, id)))
      .returning();

    if (!updated) { res.status(404).json({ error: "Entry not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update collection price");
    res.status(400).json({ error: "Invalid input" });
  }
});

/**
 * DELETE /api/collections/:id/products/:entryId
 * Remove a product from a collection. entryId = collection_products.id
 */
router.delete("/collections/:id/products/:entryId", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const entryId = parseInt(String(req.params.entryId), 10);
    if (isNaN(id) || isNaN(entryId)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [col] = await db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(and(eq(collectionsTable.id, id), eq(collectionsTable.teamMemberId, req.session.teamMemberId!)))
      .limit(1);
    if (!col) { res.status(404).json({ error: "Collection not found" }); return; }

    await db
      .delete(collectionProductsTable)
      .where(and(eq(collectionProductsTable.id, entryId), eq(collectionProductsTable.collectionId, id)));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to remove product from collection");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/collections/:id/products/reorder
 * Reorder products in a collection. Body: { items: [{ id, sortOrder }] }
 */
router.put("/collections/:id/products/reorder", requireTeamMember, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const { items } = z
      .object({ items: z.array(z.object({ id: z.number(), sortOrder: z.number() })) })
      .parse(req.body);

    const [col] = await db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(and(eq(collectionsTable.id, id), eq(collectionsTable.teamMemberId, req.session.teamMemberId!)))
      .limit(1);
    if (!col) { res.status(404).json({ error: "Collection not found" }); return; }

    await Promise.all(
      items.map(({ id: entryId, sortOrder }) =>
        db
          .update(collectionProductsTable)
          .set({ sortOrder, updatedAt: new Date() })
          .where(and(eq(collectionProductsTable.id, entryId), eq(collectionProductsTable.collectionId, id))),
      ),
    );

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to reorder collection products");
    res.status(400).json({ error: "Invalid input" });
  }
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────

router.get("/admin/collections/members", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        memberId: teamMembersTable.id,
        fullName: teamMembersTable.fullName,
        username: teamMembersTable.username,
        totalCollections: sql<number>`CAST(COUNT(DISTINCT ${collectionsTable.id}) AS INTEGER)`,
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
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get member collection summaries");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/collections/member/:memberId", requireAdmin, async (req, res) => {
  try {
    const memberId = parseInt(String(req.params.memberId), 10);
    if (isNaN(memberId)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [member] = await db
      .select({ id: teamMembersTable.id, fullName: teamMembersTable.fullName, username: teamMembersTable.username })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, memberId))
      .limit(1);
    if (!member) { res.status(404).json({ error: "Member not found" }); return; }

    const collections = await db
      .select({
        ...getTableColumns(collectionsTable),
        productCount: sql<number>`CAST(COUNT(${collectionProductsTable.id}) AS INTEGER)`,
      })
      .from(collectionsTable)
      .leftJoin(collectionProductsTable, eq(collectionProductsTable.collectionId, collectionsTable.id))
      .where(eq(collectionsTable.teamMemberId, memberId))
      .groupBy(collectionsTable.id)
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
        productCount: c.productCount,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get member collections detail");
    res.status(500).json({ error: "Internal server error" });
  }
});

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
        productCount: sql<number>`CAST(COUNT(${collectionProductsTable.id}) AS INTEGER)`,
      })
      .from(collectionsTable)
      .innerJoin(teamMembersTable, eq(collectionsTable.teamMemberId, teamMembersTable.id))
      .leftJoin(collectionProductsTable, eq(collectionProductsTable.collectionId, collectionsTable.id))
      .groupBy(
        collectionsTable.id,
        collectionsTable.title,
        collectionsTable.description,
        collectionsTable.coverImageUrl,
        collectionsTable.status,
        collectionsTable.shareToken,
        collectionsTable.views,
        collectionsTable.teamMemberId,
        collectionsTable.createdAt,
        teamMembersTable.fullName,
        teamMembersTable.username,
      )
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
        productCount: c.productCount,
        createdAt: c.createdAt.toISOString(),
        member: { fullName: c.memberFullName, username: c.memberUsername },
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list all collections");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/admin/collections/:id/products
 * Admin view of a collection's products — shows both hookPrice and collectionPrice.
 */
router.get("/admin/collections/:id/products", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const rows = await db
      .select({
        id: collectionProductsTable.id,
        productId: collectionProductsTable.productId,
        collectionPrice: collectionProductsTable.collectionPrice,
        sortOrder: collectionProductsTable.sortOrder,
        views: collectionProductsTable.views,
        createdAt: collectionProductsTable.createdAt,
        updatedAt: collectionProductsTable.updatedAt,
        title: productsTable.title,
        hookPrice: productsTable.price,
        imageUrl: productsTable.imageUrl,
        brand: productsTable.brand,
        affiliateUrl: productsTable.affiliateUrl,
        category: productsTable.category,
      })
      .from(collectionProductsTable)
      .innerJoin(productsTable, eq(collectionProductsTable.productId, productsTable.id))
      .where(eq(collectionProductsTable.collectionId, id))
      .orderBy(asc(collectionProductsTable.sortOrder));

    res.json(rows.map((r) => ({
      ...fmtCollectionProduct(r),
      // Admin sees both prices explicitly
      hookPrice: r.hookPrice ?? null,
      collectionPrice: r.collectionPrice ?? null,
      displayPrice: r.collectionPrice ?? r.hookPrice ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get admin collection products");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
