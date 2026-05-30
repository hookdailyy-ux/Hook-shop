import { Router, type IRouter } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
import { z } from "zod";

const router: IRouter = Router();

const DEFAULT_CATEGORIES = [
  { slug: "women", name: "Women", sortOrder: 0 },
  { slug: "men", name: "Men", sortOrder: 1 },
  { slug: "electronics", name: "Electronics", sortOrder: 2 },
  { slug: "home", name: "Home Essentials", sortOrder: 3 },
];

async function ensureDefaultCategories() {
  const existing = await db.select().from(categoriesTable);
  if (existing.length === 0) {
    await db.insert(categoriesTable).values(DEFAULT_CATEGORIES);
  }
}

router.get("/categories", async (req, res) => {
  try {
    await ensureDefaultCategories();
    const cats = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder));
    res.json(cats);
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
    });
    const data = schema.parse(req.body);
    const existing = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder));
    const nextOrder = data.sortOrder ?? existing.length;
    const [cat] = await db
      .insert(categoriesTable)
      .values({ slug: data.slug, name: data.name, imageUrl: data.imageUrl ?? null, sortOrder: nextOrder })
      .returning();
    res.status(201).json(cat);
  } catch (err) {
    req.log.error({ err }, "Failed to create category");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const schema = z.object({
      name: z.string().optional(),
      imageUrl: z.string().optional().nullable(),
      sortOrder: z.number().optional(),
    });
    const data = schema.parse(req.body);
    const [cat] = await db.update(categoriesTable).set(data).where(eq(categoriesTable.id, id)).returning();
    if (!cat) { res.status(404).json({ error: "Not found" }); return; }
    res.json(cat);
  } catch (err) {
    req.log.error({ err }, "Failed to update category");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete category");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/categories/reorder", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({ ids: z.array(z.number()) });
    const { ids } = schema.parse(req.body);
    await Promise.all(
      ids.map((id, index) =>
        db.update(categoriesTable).set({ sortOrder: index }).where(eq(categoriesTable.id, id))
      )
    );
    const cats = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder));
    res.json(cats);
  } catch (err) {
    req.log.error({ err }, "Failed to reorder categories");
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
