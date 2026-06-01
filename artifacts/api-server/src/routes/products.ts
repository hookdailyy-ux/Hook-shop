import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, and, ne, asc } from "drizzle-orm";
import { z } from "zod";
import { requireTeamMember } from "../middlewares/requireTeamMember";

const router: IRouter = Router();

const categoryEnum = ["women", "men", "couples", "kids", "electronics", "home", "accessories"] as const;
const sourceEnum = ["SHEIN", "Amazon"] as const;
const statusEnum = ["active", "hidden"] as const;

function serializeProduct(p: typeof productsTable.$inferSelect) {
  return {
    ...p,
    images: Array.isArray(p.images) ? p.images : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res) => {
  try {
    const { category, subcategory, featured, trending, limit } = req.query;
    const conditions: ReturnType<typeof eq>[] = [];
    // Always exclude hidden products on the public endpoint
    conditions.push(ne(productsTable.status, "hidden"));
    if (category && typeof category === "string") conditions.push(eq(productsTable.category, category));
    if (subcategory && typeof subcategory === "string") conditions.push(eq(productsTable.subcategory, subcategory));
    if (featured === "true") conditions.push(eq(productsTable.featured, true));
    if (trending === "true") conditions.push(eq(productsTable.trending, true));

    let results = await db.select().from(productsTable).where(and(...conditions));
    if (limit) results = results.slice(0, parseInt(limit as string));
    res.json(results.map(serializeProduct));
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      source: z.enum(sourceEnum).default("SHEIN"),
      category: z.enum(categoryEnum),
      subcategory: z.string().optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      affiliateUrl: z.string().min(1),
      brand: z.string().optional(),
      material: z.string().optional(),
      externalId: z.string().optional(),
      colors: z.array(z.string()).optional(),
      sizes: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      trending: z.boolean().optional(),
      status: z.enum(statusEnum).default("active"),
      imagePosX: z.number().int().min(0).max(100).optional(),
      imagePosY: z.number().int().min(0).max(100).optional(),
      imageScale: z.number().int().min(50).max(200).optional(),
      imageObjectFit: z.enum(["cover", "contain"]).optional(),
      noonUrl: z.string().optional(),
      amazonUrl: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const [product] = await db.insert(productsTable).values({
      title: data.title,
      description: data.description ?? null,
      source: data.source,
      category: data.category,
      subcategory: data.subcategory ?? null,
      price: data.price ?? null,
      originalPrice: data.originalPrice ?? null,
      imageUrl: data.imageUrl ?? null,
      images: data.images ?? [],
      affiliateUrl: data.affiliateUrl,
      brand: data.brand ?? null,
      material: data.material ?? null,
      externalId: data.externalId ?? null,
      colors: data.colors ?? [],
      sizes: data.sizes ?? [],
      featured: data.featured ?? false,
      trending: data.trending ?? false,
      status: data.status,
      imagePosX: data.imagePosX ?? 50,
      imagePosY: data.imagePosY ?? 50,
      imageScale: data.imageScale ?? 100,
      imageObjectFit: data.imageObjectFit ?? "cover",
      noonUrl: data.noonUrl ?? null,
      amazonUrl: data.amazonUrl ?? null,
    }).returning();
    res.status(201).json(serializeProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(400).json({ error: "Invalid input" });
  }
});

/**
 * GET /api/products/catalog
 * Slim product list for team members to browse when adding to collections.
 * Must be registered BEFORE /products/:id to avoid "catalog" being parsed as an ID.
 */
router.get("/products/catalog", requireTeamMember, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: productsTable.id,
        title: productsTable.title,
        price: productsTable.price,
        imageUrl: productsTable.imageUrl,
        brand: productsTable.brand,
        category: productsTable.category,
        subcategory: productsTable.subcategory,
      })
      .from(productsTable)
      .where(eq(productsTable.status, "active"))
      .orderBy(asc(productsTable.title));

    res.json(
      rows.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price ?? null,
        imageUrl: p.imageUrl ?? null,
        brand: p.brand ?? null,
        category: p.category,
        subcategory: p.subcategory ?? null,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get product catalog");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      source: z.enum(sourceEnum).optional(),
      category: z.enum(categoryEnum).optional(),
      subcategory: z.string().optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      affiliateUrl: z.string().optional(),
      brand: z.string().optional(),
      material: z.string().optional(),
      externalId: z.string().optional(),
      colors: z.array(z.string()).optional(),
      sizes: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      trending: z.boolean().optional(),
      status: z.enum(statusEnum).optional(),
      imagePosX: z.number().int().min(0).max(100).optional(),
      imagePosY: z.number().int().min(0).max(100).optional(),
      imageScale: z.number().int().min(50).max(200).optional(),
      imageObjectFit: z.enum(["cover", "contain"]).optional(),
      noonUrl: z.string().optional(),
      amazonUrl: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
