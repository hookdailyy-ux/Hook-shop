import { Router, type IRouter } from "express";
import { db, subcategoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const categoryEnum = ["women", "men", "electronics", "home"] as const;

router.get("/subcategories", async (req, res) => {
  try {
    const { category } = req.query;
    let results;
    if (category && typeof category === "string") {
      results = await db.select().from(subcategoriesTable).where(eq(subcategoriesTable.category, category));
    } else {
      results = await db.select().from(subcategoriesTable);
    }
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to list subcategories");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/subcategories", async (req, res) => {
  try {
    const schema = z.object({
      category: z.enum(categoryEnum),
      name: z.string().min(1),
    });
    const data = schema.parse(req.body);
    const [sub] = await db.insert(subcategoriesTable).values(data).returning();
    res.status(201).json(sub);
  } catch (err) {
    req.log.error({ err }, "Failed to create subcategory");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/subcategories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const schema = z.object({
      category: z.enum(categoryEnum).optional(),
      name: z.string().min(1).optional(),
    });
    const data = schema.parse(req.body);
    const [sub] = await db.update(subcategoriesTable).set(data).where(eq(subcategoriesTable.id, id)).returning();
    if (!sub) return res.status(404).json({ error: "Not found" });
    res.json(sub);
  } catch (err) {
    req.log.error({ err }, "Failed to update subcategory");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/subcategories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(subcategoriesTable).where(eq(subcategoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete subcategory");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
