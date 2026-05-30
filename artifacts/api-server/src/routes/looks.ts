import { Router, type IRouter } from "express";
import { db, looksTable, lookProductsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

async function getLookWithProducts(lookId: number) {
  const [look] = await db.select().from(looksTable).where(eq(looksTable.id, lookId));
  if (!look) return null;
  const { asc } = await import("drizzle-orm");
  const linkRows = await db.select().from(lookProductsTable)
    .where(eq(lookProductsTable.lookId, lookId))
    .orderBy(asc(lookProductsTable.sortOrder));
  const products = await Promise.all(
    linkRows.map((lr) => db.select().from(productsTable).where(eq(productsTable.id, lr.productId)).then(([p]) => p))
  );
  return {
    ...look,
    createdAt: look.createdAt.toISOString(),
    products: products.filter(Boolean).map((p) => ({ ...p, createdAt: p!.createdAt.toISOString() })),
  };
}

router.get("/looks", async (req, res) => {
  try {
    const { limit } = req.query;
    let allLooks = await db.select().from(looksTable);
    if (limit) allLooks = allLooks.slice(0, parseInt(limit as string));
    const results = await Promise.all(allLooks.map((l) => getLookWithProducts(l.id)));
    res.json(results.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Failed to list looks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/looks", async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      productIds: z.array(z.number()).optional(),
    });
    const data = schema.parse(req.body);
    const [look] = await db.insert(looksTable).values({
      title: data.title,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
    }).returning();
    if (data.productIds && data.productIds.length > 0) {
      await db.insert(lookProductsTable).values(
        data.productIds.map((pid, i) => ({ lookId: look.id, productId: pid, sortOrder: i }))
      );
    }
    const result = await getLookWithProducts(look.id);
    res.status(201).json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to create look");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/looks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await getLookWithProducts(id);
    if (!result) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get look");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/looks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      productIds: z.array(z.number()).optional(),
    });
    const data = schema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (Object.keys(updateData).length > 0) {
      await db.update(looksTable).set(updateData).where(eq(looksTable.id, id));
    }
    if (data.productIds !== undefined) {
      await db.delete(lookProductsTable).where(eq(lookProductsTable.lookId, id));
      if (data.productIds.length > 0) {
        await db.insert(lookProductsTable).values(
          data.productIds.map((pid, i) => ({ lookId: id, productId: pid, sortOrder: i }))
        );
      }
    }
    const result = await getLookWithProducts(id);
    if (!result) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to update look");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/looks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(lookProductsTable).where(eq(lookProductsTable.lookId, id));
    await db.delete(looksTable).where(eq(looksTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete look");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
