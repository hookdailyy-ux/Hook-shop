import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
import { z } from "zod";

const router: IRouter = Router();

const DEFAULTS: Record<string, string> = {
  hero_image_url: "",
  hero_title: "Timeless Essentials",
  hero_subtitle: "Curated pieces for everyday life.",
  hero_cta_text: "Shop Now",
  hero_cta_link: "/women",
  discover_more_url: "",
};

async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

router.get("/site-settings", async (req, res) => {
  try {
    const all = await getAllSettings();
    res.json({
      heroImageUrl: all["hero_image_url"] ?? "",
      heroTitle: all["hero_title"] ?? DEFAULTS["hero_title"],
      heroSubtitle: all["hero_subtitle"] ?? DEFAULTS["hero_subtitle"],
      heroCtaText: all["hero_cta_text"] ?? DEFAULTS["hero_cta_text"],
      heroCtaLink: all["hero_cta_link"] ?? DEFAULTS["hero_cta_link"],
      discoverMoreUrl: all["discover_more_url"] ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get site settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/site-settings", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      heroImageUrl: z.string().optional(),
      heroTitle: z.string().optional(),
      heroSubtitle: z.string().optional(),
      heroCtaText: z.string().optional(),
      heroCtaLink: z.string().optional(),
      discoverMoreUrl: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const updates: { key: string; value: string }[] = [];
    if (data.heroImageUrl !== undefined) updates.push({ key: "hero_image_url", value: data.heroImageUrl });
    if (data.heroTitle !== undefined) updates.push({ key: "hero_title", value: data.heroTitle });
    if (data.heroSubtitle !== undefined) updates.push({ key: "hero_subtitle", value: data.heroSubtitle });
    if (data.heroCtaText !== undefined) updates.push({ key: "hero_cta_text", value: data.heroCtaText });
    if (data.heroCtaLink !== undefined) updates.push({ key: "hero_cta_link", value: data.heroCtaLink });
    if (data.discoverMoreUrl !== undefined) updates.push({ key: "discover_more_url", value: data.discoverMoreUrl });

    for (const { key, value } of updates) {
      await db
        .insert(settingsTable)
        .values({ key, value })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
    }

    const all = await getAllSettings();
    res.json({
      heroImageUrl: all["hero_image_url"] ?? "",
      heroTitle: all["hero_title"] ?? DEFAULTS["hero_title"],
      heroSubtitle: all["hero_subtitle"] ?? DEFAULTS["hero_subtitle"],
      heroCtaText: all["hero_cta_text"] ?? DEFAULTS["hero_cta_text"],
      heroCtaLink: all["hero_cta_link"] ?? DEFAULTS["hero_cta_link"],
      discoverMoreUrl: all["discover_more_url"] ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update site settings");
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
