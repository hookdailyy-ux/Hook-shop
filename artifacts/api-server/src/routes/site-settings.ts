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
  footer_links: "[]",
  whatsapp_text: "Contact Us",
  whatsapp_number: "",
  whatsapp_message: "Hi, I have a question about your products!",
  favicon_url: "",
  apple_touch_icon_url: "",
  pwa_icon_192_url: "",
  pwa_icon_512_url: "",
  shein_general_url: "",
  amazon_general_url: "",
};

async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildResponse(all: Record<string, string>) {
  return {
    heroImageUrl: all["hero_image_url"] ?? "",
    heroTitle: all["hero_title"] ?? DEFAULTS["hero_title"],
    heroSubtitle: all["hero_subtitle"] ?? DEFAULTS["hero_subtitle"],
    heroCtaText: all["hero_cta_text"] ?? DEFAULTS["hero_cta_text"],
    heroCtaLink: all["hero_cta_link"] ?? DEFAULTS["hero_cta_link"],
    discoverMoreUrl: all["discover_more_url"] ?? "",
    footerLinks: safeParseJson(all["footer_links"] ?? "[]", []),
    whatsappText: all["whatsapp_text"] ?? DEFAULTS["whatsapp_text"],
    whatsappNumber: all["whatsapp_number"] ?? "",
    whatsappMessage: all["whatsapp_message"] ?? DEFAULTS["whatsapp_message"],
    faviconUrl: all["favicon_url"] ?? "",
    appleTouchIconUrl: all["apple_touch_icon_url"] ?? "",
    pwaIcon192Url: all["pwa_icon_192_url"] ?? "",
    pwaIcon512Url: all["pwa_icon_512_url"] ?? "",
    sheinGeneralUrl: all["shein_general_url"] ?? "",
    amazonGeneralUrl: all["amazon_general_url"] ?? "",
  };
}

router.get("/site-settings", async (req, res) => {
  try {
    const all = await getAllSettings();
    res.json(buildResponse(all));
  } catch (err) {
    req.log.error({ err }, "Failed to get site settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

const footerLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
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
      footerLinks: z.array(footerLinkSchema).optional(),
      whatsappText: z.string().optional(),
      whatsappNumber: z.string().optional(),
      whatsappMessage: z.string().optional(),
      faviconUrl: z.string().optional(),
      appleTouchIconUrl: z.string().optional(),
      pwaIcon192Url: z.string().optional(),
      pwaIcon512Url: z.string().optional(),
      sheinGeneralUrl: z.string().optional(),
      amazonGeneralUrl: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const updates: { key: string; value: string }[] = [];
    if (data.heroImageUrl !== undefined) updates.push({ key: "hero_image_url", value: data.heroImageUrl });
    if (data.heroTitle !== undefined) updates.push({ key: "hero_title", value: data.heroTitle });
    if (data.heroSubtitle !== undefined) updates.push({ key: "hero_subtitle", value: data.heroSubtitle });
    if (data.heroCtaText !== undefined) updates.push({ key: "hero_cta_text", value: data.heroCtaText });
    if (data.heroCtaLink !== undefined) updates.push({ key: "hero_cta_link", value: data.heroCtaLink });
    if (data.discoverMoreUrl !== undefined) updates.push({ key: "discover_more_url", value: data.discoverMoreUrl });
    if (data.footerLinks !== undefined) updates.push({ key: "footer_links", value: JSON.stringify(data.footerLinks) });
    if (data.whatsappText !== undefined) updates.push({ key: "whatsapp_text", value: data.whatsappText });
    if (data.whatsappNumber !== undefined) updates.push({ key: "whatsapp_number", value: data.whatsappNumber });
    if (data.whatsappMessage !== undefined) updates.push({ key: "whatsapp_message", value: data.whatsappMessage });
    if (data.faviconUrl !== undefined) updates.push({ key: "favicon_url", value: data.faviconUrl });
    if (data.appleTouchIconUrl !== undefined) updates.push({ key: "apple_touch_icon_url", value: data.appleTouchIconUrl });
    if (data.pwaIcon192Url !== undefined) updates.push({ key: "pwa_icon_192_url", value: data.pwaIcon192Url });
    if (data.pwaIcon512Url !== undefined) updates.push({ key: "pwa_icon_512_url", value: data.pwaIcon512Url });
    if (data.sheinGeneralUrl !== undefined) updates.push({ key: "shein_general_url", value: data.sheinGeneralUrl });
    if (data.amazonGeneralUrl !== undefined) updates.push({ key: "amazon_general_url", value: data.amazonGeneralUrl });

    for (const { key, value } of updates) {
      await db
        .insert(settingsTable)
        .values({ key, value })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
    }

    const all = await getAllSettings();
    res.json(buildResponse(all));
  } catch (err) {
    req.log.error({ err }, "Failed to update site settings");
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
