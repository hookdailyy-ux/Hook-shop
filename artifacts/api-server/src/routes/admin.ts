import { Router, type IRouter } from "express";
import { db, productsTable, looksTable, newsletterTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [{ count: totalProducts }] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable);
    const [{ count: totalLooks }] = await db.select({ count: sql<number>`count(*)::int` }).from(looksTable);
    const [{ count: totalSubscribers }] = await db.select({ count: sql<number>`count(*)::int` }).from(newsletterTable);

    const categoryCounts = await db
      .select({ category: productsTable.category, count: sql<number>`count(*)::int` })
      .from(productsTable)
      .groupBy(productsTable.category);

    const byCat: Record<string, number> = { women: 0, men: 0, electronics: 0, home: 0 };
    for (const row of categoryCounts) {
      byCat[row.category] = row.count;
    }

    const [{ count: featuredCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.featured, true));

    const [{ count: trendingCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.trending, true));

    res.json({
      totalProducts,
      totalLooks,
      totalSubscribers,
      productsByCategory: byCat,
      featuredCount,
      trendingCount,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/products", requireAdmin, async (req, res) => {
  try {
    const products = await db.select().from(productsTable);
    res.json(products.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to list admin products");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
