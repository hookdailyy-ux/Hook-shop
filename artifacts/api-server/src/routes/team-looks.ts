import { Router, type IRouter } from "express";
import { db, teamLooksTable, teamLookProductsTable, productsTable, teamMembersTable } from "@workspace/db";
import { eq, asc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireTeamMember } from "../middlewares/requireTeamMember";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generateShareToken(): string {
  return randomBytes(8).toString("hex");
}

function serializeLook(look: typeof teamLooksTable.$inferSelect) {
  return {
    id: look.id,
    teamMemberId: look.teamMemberId,
    title: look.title,
    coverImageUrl: look.coverImageUrl ?? null,
    coverImagePosX: look.coverImagePosX,
    coverImagePosY: look.coverImagePosY,
    coverImageScale: look.coverImageScale,
    coverImageObjectFit: look.coverImageObjectFit,
    price: look.price ?? null,
    status: look.status,
    shareToken: look.shareToken,
    views: look.views,
    createdAt: look.createdAt.toISOString(),
    updatedAt: look.updatedAt.toISOString(),
  };
}

async function getLookProducts(lookId: number) {
  const rows = await db
    .select({
      id: teamLookProductsTable.id,
      productId: teamLookProductsTable.productId,
      sortOrder: teamLookProductsTable.sortOrder,
      title: productsTable.title,
      price: productsTable.price,
      imageUrl: productsTable.imageUrl,
      brand: productsTable.brand,
      affiliateUrl: productsTable.affiliateUrl,
      category: productsTable.category,
    })
    .from(teamLookProductsTable)
    .innerJoin(productsTable, eq(teamLookProductsTable.productId, productsTable.id))
    .where(eq(teamLookProductsTable.lookId, lookId))
    .orderBy(asc(teamLookProductsTable.sortOrder), asc(teamLookProductsTable.id));

  return rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    sortOrder: r.sortOrder,
    title: r.title,
    hookPrice: r.price ?? null,
    imageUrl: r.imageUrl ?? null,
    brand: r.brand ?? null,
    affiliateUrl: r.affiliateUrl,
    category: r.category,
  }));
}

// ─── TEAM LOOKS CRUD ─────────────────────────────────────────────────────────

router.get("/team/looks", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const looks = await db
      .select()
      .from(teamLooksTable)
      .where(eq(teamLooksTable.teamMemberId, memberId))
      .orderBy(asc(teamLooksTable.createdAt));
    res.json(looks.map(serializeLook));
  } catch (err) {
    req.log.error({ err }, "Failed to list team looks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/team/looks", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const schema = z.object({
      title: z.string().min(1).max(120),
      coverImageUrl: z.string().nullable().optional(),
      coverImagePosX: z.number().int().min(0).max(100).optional(),
      coverImagePosY: z.number().int().min(0).max(100).optional(),
      coverImageScale: z.number().int().min(50).max(200).optional(),
      coverImageObjectFit: z.enum(["cover", "contain"]).optional(),
      price: z.string().nullable().optional(),
      status: z.enum(["active", "hidden"]).optional(),
    });
    const data = schema.parse(req.body);
    const [look] = await db
      .insert(teamLooksTable)
      .values({
        teamMemberId: memberId,
        title: data.title,
        coverImageUrl: data.coverImageUrl ?? null,
        coverImagePosX: data.coverImagePosX ?? 50,
        coverImagePosY: data.coverImagePosY ?? 50,
        coverImageScale: data.coverImageScale ?? 100,
        coverImageObjectFit: data.coverImageObjectFit ?? "cover",
        price: data.price ?? null,
        status: data.status ?? "active",
        shareToken: generateShareToken(),
      })
      .returning();
    res.status(201).json(serializeLook(look));
  } catch (err) {
    req.log.error({ err }, "Failed to create look");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/team/looks/:id", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const id = parseInt(String(req.params.id));
    const [look] = await db
      .select()
      .from(teamLooksTable)
      .where(eq(teamLooksTable.id, id))
      .limit(1);
    if (!look || look.teamMemberId !== memberId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const products = await getLookProducts(id);
    res.json({ ...serializeLook(look), products });
  } catch (err) {
    req.log.error({ err }, "Failed to get look");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/team/looks/:id", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const id = parseInt(String(req.params.id));
    const [existing] = await db.select().from(teamLooksTable).where(eq(teamLooksTable.id, id)).limit(1);
    if (!existing || existing.teamMemberId !== memberId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const schema = z.object({
      title: z.string().min(1).max(120),
      coverImageUrl: z.string().nullable().optional(),
      coverImagePosX: z.number().int().min(0).max(100).optional(),
      coverImagePosY: z.number().int().min(0).max(100).optional(),
      coverImageScale: z.number().int().min(50).max(200).optional(),
      coverImageObjectFit: z.enum(["cover", "contain"]).optional(),
      price: z.string().nullable().optional(),
      status: z.enum(["active", "hidden"]).optional(),
    });
    const data = schema.parse(req.body);
    const [updated] = await db
      .update(teamLooksTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teamLooksTable.id, id))
      .returning();
    res.json(serializeLook(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update look");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/team/looks/:id", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const id = parseInt(String(req.params.id));
    const [existing] = await db.select().from(teamLooksTable).where(eq(teamLooksTable.id, id)).limit(1);
    if (!existing || existing.teamMemberId !== memberId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await db.delete(teamLooksTable).where(eq(teamLooksTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete look");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── LOOK PRODUCTS ────────────────────────────────────────────────────────────

router.get("/team/looks/:id/products", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const id = parseInt(String(req.params.id));
    const [look] = await db.select().from(teamLooksTable).where(eq(teamLooksTable.id, id)).limit(1);
    if (!look || look.teamMemberId !== memberId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(await getLookProducts(id));
  } catch (err) {
    req.log.error({ err }, "Failed to list look products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/team/looks/:id/products", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const lookId = parseInt(String(req.params.id));
    const [look] = await db.select().from(teamLooksTable).where(eq(teamLooksTable.id, lookId)).limit(1);
    if (!look || look.teamMemberId !== memberId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { productId } = z.object({ productId: z.number().int().positive() }).parse(req.body);

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    const allEntries = await db
      .select()
      .from(teamLookProductsTable)
      .where(eq(teamLookProductsTable.lookId, lookId));
    if (allEntries.some((e) => e.productId === productId)) {
      res.status(409).json({ error: "Product already in look" });
      return;
    }
    const sortOrder = allEntries.length;

    const [entry] = await db
      .insert(teamLookProductsTable)
      .values({ lookId, productId, sortOrder })
      .returning();

    res.status(201).json({
      id: entry.id,
      productId: entry.productId,
      sortOrder: entry.sortOrder,
      title: product.title,
      hookPrice: product.price ?? null,
      imageUrl: product.imageUrl ?? null,
      brand: product.brand ?? null,
      affiliateUrl: product.affiliateUrl,
      category: product.category,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add product to look");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/team/looks/:id/products/:entryId", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const lookId = parseInt(String(req.params.id));
    const entryId = parseInt(String(req.params.entryId));
    const [look] = await db.select().from(teamLooksTable).where(eq(teamLooksTable.id, lookId)).limit(1);
    if (!look || look.teamMemberId !== memberId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await db.delete(teamLookProductsTable).where(eq(teamLookProductsTable.id, entryId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove product from look");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/team/looks/:id/products/reorder", requireTeamMember, async (req, res) => {
  try {
    const memberId = req.session.teamMemberId!;
    const lookId = parseInt(String(req.params.id));
    const [look] = await db.select().from(teamLooksTable).where(eq(teamLooksTable.id, lookId)).limit(1);
    if (!look || look.teamMemberId !== memberId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { items } = z.object({
      items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
    }).parse(req.body);
    await Promise.all(
      items.map((item) =>
        db.update(teamLookProductsTable).set({ sortOrder: item.sortOrder }).where(eq(teamLookProductsTable.id, item.id))
      )
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to reorder look products");
    res.status(400).json({ error: "Invalid input" });
  }
});

// ─── PUBLIC LOOK PAGE ─────────────────────────────────────────────────────────

router.get("/looks/public/:token", async (req, res) => {
  try {
    const [look] = await db
      .select({
        id: teamLooksTable.id,
        title: teamLooksTable.title,
        coverImageUrl: teamLooksTable.coverImageUrl,
        price: teamLooksTable.price,
        status: teamLooksTable.status,
        shareToken: teamLooksTable.shareToken,
        views: teamLooksTable.views,
        createdAt: teamLooksTable.createdAt,
        memberFullName: teamMembersTable.fullName,
        memberDisplayName: teamMembersTable.displayName,
        memberUsername: teamMembersTable.username,
      })
      .from(teamLooksTable)
      .innerJoin(teamMembersTable, eq(teamLooksTable.teamMemberId, teamMembersTable.id))
      .where(eq(teamLooksTable.shareToken, String(req.params.token)))
      .limit(1);

    if (!look || look.status !== "active") {
      res.status(404).json({ error: "Look not found" });
      return;
    }

    void db
      .update(teamLooksTable)
      .set({ views: sql`${teamLooksTable.views} + 1` })
      .where(eq(teamLooksTable.shareToken, String(req.params.token)));

    const products = await getLookProducts(look.id);

    res.json({
      id: look.id,
      title: look.title,
      coverImageUrl: look.coverImageUrl ?? null,
      price: look.price ?? null,
      shareToken: look.shareToken,
      views: look.views + 1,
      productCount: products.length,
      createdAt: look.createdAt.toISOString(),
      member: {
        fullName: look.memberDisplayName ?? look.memberFullName,
        username: look.memberUsername,
      },
      products,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get public look");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
