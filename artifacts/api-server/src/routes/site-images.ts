import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { like, eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
import { z } from "zod";

const router: IRouter = Router();

const VALID_KEYS = ["hero", "women", "men", "accessories", "home", "electronics", "look", "setup"] as const;
type ImageKey = (typeof VALID_KEYS)[number];

function isValidKey(key: string): key is ImageKey {
  return (VALID_KEYS as readonly string[]).includes(key);
}

function toDbKey(key: ImageKey): string {
  return `site_image_${key}`;
}

const imageSchema = z.object({
  imageUrl: z.string(),
  posX: z.number().int().min(0).max(100),
  posY: z.number().int().min(0).max(100),
  scale: z.number().int().min(50).max(200),
  objectFit: z.enum(["cover", "contain"]).optional().default("cover"),
});

type SiteImageData = z.infer<typeof imageSchema>;

router.get("/site-images", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(settingsTable)
      .where(like(settingsTable.key, "site_image_%"));

    const result: Record<string, SiteImageData> = {};
    for (const row of rows) {
      const key = row.key.replace("site_image_", "");
      try {
        result[key] = JSON.parse(row.value) as SiteImageData;
      } catch {
        // skip malformed entries
      }
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get site images");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/site-images/:key", requireAdmin, async (req, res) => {
  try {
    const key = String(req.params.key);
    if (!isValidKey(key)) {
      res.status(400).json({ error: "Invalid key" });
      return;
    }
    const data = imageSchema.parse(req.body);
    const dbKey = toDbKey(key);
    const value = JSON.stringify(data);

    await db
      .insert(settingsTable)
      .values({ key: dbKey, value })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value } });

    res.json({ key, ...data });
  } catch (err) {
    req.log.error({ err }, "Failed to upsert site image");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/site-images/:key", requireAdmin, async (req, res) => {
  try {
    const key = String(req.params.key);
    if (!isValidKey(key)) {
      res.status(400).json({ error: "Invalid key" });
      return;
    }
    await db.delete(settingsTable).where(eq(settingsTable.key, toDbKey(key)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete site image");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
