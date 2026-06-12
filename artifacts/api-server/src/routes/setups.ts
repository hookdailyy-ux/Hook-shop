import { Router, type IRouter } from "express";
import { db, setupsTable, setupProductsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

async function getSetupWithProducts(setupId: number) {
  const [setup] = await db.select().from(setupsTable).where(eq(setupsTable.id, setupId));
  if (!setup) return null;
  const { asc } = await import("drizzle-orm");
  const linkRows = await db.select().from(setupProductsTable)
    .where(eq(setupProductsTable.setupId, setupId))
    .orderBy(asc(setupProductsTable.sortOrder));
  const products = await Promise.all(
    linkRows.map((lr) => db.select().from(productsTable).where(eq(productsTable.id, lr.productId)).then(([p]) => p))
  );
  return {
    ...setup,
    createdAt: setup.createdAt.toISOString(),
    products: products.filter(Boolean).map((p) => ({ ...p, createdAt: p!.createdAt.toISOString() })),
  };
}

router.get("/setups", async (req, res) => {
  try {
    const { limit } = req.query;
    let allSetups = await db.select().from(setupsTable);
    if (limit) allSetups = allSetups.slice(0, parseInt(limit as string));
    const results = await Promise.all(allSetups.map((s) => getSetupWithProducts(s.id)));
    res.json(results.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Failed to list setups");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/setups", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      imagePosX: z.number().int().min(0).max(100).optional(),
      imagePosY: z.number().int().min(0).max(100).optional(),
      imageScale: z.number().int().min(50).max(200).optional(),
      productIds: z.array(z.number()).optional(),
    });
    const data = schema.parse(req.body);
    const [setup] = await db.insert(setupsTable).values({
      title: data.title,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      images: data.images ?? [],
      imagePosX: data.imagePosX ?? 50,
      imagePosY: data.imagePosY ?? 50,
      imageScale: data.imageScale ?? 100,
    }).returning();
    if (data.productIds && data.productIds.length > 0) {
      await db.insert(setupProductsTable).values(
        data.productIds.map((pid, i) => ({ setupId: setup.id, productId: pid, sortOrder: i }))
      );
    }
    const result = await getSetupWithProducts(setup.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to create setup");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/setups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await getSetupWithProducts(id);
    if (!result) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get setup");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/setups/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      imagePosX: z.number().int().min(0).max(100).optional(),
      imagePosY: z.number().int().min(0).max(100).optional(),
      imageScale: z.number().int().min(50).max(200).optional(),
      productIds: z.array(z.number()).optional(),
    });
    const data = schema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.imagePosX !== undefined) updateData.imagePosX = data.imagePosX;
    if (data.imagePosY !== undefined) updateData.imagePosY = data.imagePosY;
    if (data.imageScale !== undefined) updateData.imageScale = data.imageScale;
    if (Object.keys(updateData).length > 0) {
      await db.update(setupsTable).set(updateData).where(eq(setupsTable.id, id));
    }
    if (data.productIds !== undefined) {
      await db.delete(setupProductsTable).where(eq(setupProductsTable.setupId, id));
      if (data.productIds.length > 0) {
        await db.insert(setupProductsTable).values(
          data.productIds.map((pid, i) => ({ setupId: id, productId: pid, sortOrder: i }))
        );
      }
    }
    const result = await getSetupWithProducts(id);
    if (!result) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to update setup");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/setups/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(setupProductsTable).where(eq(setupProductsTable.setupId, id));
    await db.delete(setupsTable).where(eq(setupsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete setup");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
