import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();
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
    const conditions = [];
    if (category && typeof category === "string") conditions.push(eq(productsTable.category, category));
    if (subcategory && typeof subcategory === "string") conditions.push(eq(productsTable.subcategory, subcategory));
    if (featured === "true") conditions.push(eq(productsTable.featured, true));
    if (trending === "true") conditions.push(eq(productsTable.trending, true));

    let results = conditions.length > 0
      ? await db.select().from(productsTable).where(and(...conditions))
      : await db.select().from(productsTable);

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
      category: z.enum(categoryEnum),
      subcategory: z.string().optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      affiliateUrl: z.string().min(1),
      brand: z.string().optional(),
      material: z.string().optional(),
      colors: z.array(z.string()).optional(),
      sizes: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      trending: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const [product] = await db.insert(productsTable).values({
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      subcategory: data.subcategory ?? null,
      price: data.price ?? null,
      originalPrice: data.originalPrice ?? null,
      imageUrl: data.imageUrl ?? null,
      images: data.images ?? [],
      affiliateUrl: data.affiliateUrl,
      brand: data.brand ?? null,
      material: data.material ?? null,
      colors: data.colors ?? [],
      sizes: data.sizes ?? [],
      featured: data.featured ?? false,
      trending: data.trending ?? false,
    }).returning();
    res.status(201).json(serializeProduct(product));
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) return res.status(404).json({ error: "Not found" });
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
      category: z.enum(categoryEnum).optional(),
      subcategory: z.string().optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      affiliateUrl: z.string().optional(),
      brand: z.string().optional(),
      material: z.string().optional(),
      colors: z.array(z.string()).optional(),
      sizes: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      trending: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
    if (!product) return res.status(404).json({ error: "Not found" });
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
