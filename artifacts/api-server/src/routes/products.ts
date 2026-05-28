import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

router.get("/products", async (req, res) => {
  try {
    const { category, featured, trending, limit } = req.query;
    let query = db.select().from(productsTable);
    const conditions = [];
    if (category && typeof category === "string") {
      conditions.push(eq(productsTable.category, category));
    }
    if (featured === "true") {
      conditions.push(eq(productsTable.featured, true));
    }
    if (trending === "true") {
      conditions.push(eq(productsTable.trending, true));
    }
    let results;
    if (conditions.length > 0) {
      results = await db.select().from(productsTable).where(and(...conditions));
    } else {
      results = await db.select().from(productsTable);
    }
    if (limit) {
      results = results.slice(0, parseInt(limit as string));
    }
    const mapped = results.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    }));
    res.json(mapped);
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
      category: z.enum(["women", "men", "electronics", "home"]),
      price: z.string().optional(),
      originalPrice: z.string().optional(),
      imageUrl: z.string().optional(),
      affiliateUrl: z.string().min(1),
      brand: z.string().optional(),
      featured: z.boolean().optional(),
      trending: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const [product] = await db.insert(productsTable).values({
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      price: data.price ?? null,
      originalPrice: data.originalPrice ?? null,
      imageUrl: data.imageUrl ?? null,
      affiliateUrl: data.affiliateUrl,
      brand: data.brand ?? null,
      featured: data.featured ?? false,
      trending: data.trending ?? false,
    }).returning();
    res.status(201).json({ ...product, createdAt: product.createdAt.toISOString() });
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
    res.json({ ...product, createdAt: product.createdAt.toISOString() });
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
      category: z.enum(["women", "men", "electronics", "home"]).optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional(),
      imageUrl: z.string().optional(),
      affiliateUrl: z.string().optional(),
      brand: z.string().optional(),
      featured: z.boolean().optional(),
      trending: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json({ ...product, createdAt: product.createdAt.toISOString() });
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
