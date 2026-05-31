import { Router, type IRouter } from "express";
import { db, newsletterTable, newsletterCampaignsTable } from "@workspace/db";
import { eq, ilike, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

// ─── PUBLIC: Subscribe ────────────────────────────────────────────────────────

router.post("/newsletter", async (req, res) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const data = schema.parse(req.body);

    const [existing] = await db
      .select()
      .from(newsletterTable)
      .where(eq(newsletterTable.email, data.email));

    if (existing) {
      res.status(201).json({ ok: true });
      return;
    }

    await db
      .insert(newsletterTable)
      .values({ email: data.email });

    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to subscribe");
    res.status(400).json({ error: "Invalid email" });
  }
});

// ─── ADMIN: Subscriber Management ────────────────────────────────────────────

router.get("/admin/newsletter/subscribers", requireAdmin, async (req, res) => {
  try {
    const { search, limit = "200", offset = "0" } = req.query;
    let query = db.select().from(newsletterTable).$dynamic();
    if (search && typeof search === "string" && search.trim()) {
      query = query.where(ilike(newsletterTable.email, `%${search.trim()}%`));
    }
    const rows = await query
      .orderBy(desc(newsletterTable.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(newsletterTable);

    res.json({
      subscribers: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      total: count,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list subscribers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/newsletter/subscribers/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(newsletterTable).where(eq(newsletterTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete subscriber");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/newsletter/subscribers/export", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(newsletterTable)
      .orderBy(desc(newsletterTable.createdAt));

    const csv = [
      "id,email,subscribed_at",
      ...rows.map((r) => `${r.id},"${r.email}",${r.createdAt.toISOString()}`),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="subscribers-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Failed to export subscribers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: Campaign Management ───────────────────────────────────────────────

function fmtCampaign(c: typeof newsletterCampaignsTable.$inferSelect) {
  return {
    ...c,
    sentAt: c.sentAt ? c.sentAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/admin/newsletter/campaigns", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(newsletterCampaignsTable)
      .orderBy(desc(newsletterCampaignsTable.createdAt));
    res.json(rows.map(fmtCampaign));
  } catch (err) {
    req.log.error({ err }, "Failed to list campaigns");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/newsletter/campaigns", requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200),
      subject: z.string().max(300).default(""),
      senderName: z.string().max(100).default("HOOK"),
      senderEmail: z.string().email().optional().or(z.literal("")),
      content: z.array(z.object({}).passthrough()).default([]),
    });
    const data = schema.parse(req.body);
    const [campaign] = await db
      .insert(newsletterCampaignsTable)
      .values({
        title: data.title,
        subject: data.subject,
        senderName: data.senderName,
        senderEmail: data.senderEmail ?? "",
        content: data.content,
        status: "draft",
      })
      .returning();
    res.status(201).json(fmtCampaign(campaign));
  } catch (err) {
    req.log.error({ err }, "Failed to create campaign");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/admin/newsletter/campaigns/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const [campaign] = await db
      .select()
      .from(newsletterCampaignsTable)
      .where(eq(newsletterCampaignsTable.id, id));
    if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtCampaign(campaign));
  } catch (err) {
    req.log.error({ err }, "Failed to get campaign");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/newsletter/campaigns/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      subject: z.string().max(300).optional(),
      senderName: z.string().max(100).optional(),
      senderEmail: z.string().optional(),
      content: z.array(z.object({}).passthrough()).optional(),
    });
    const data = schema.parse(req.body);
    const [campaign] = await db
      .update(newsletterCampaignsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(newsletterCampaignsTable.id, id))
      .returning();
    if (!campaign) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmtCampaign(campaign));
  } catch (err) {
    req.log.error({ err }, "Failed to update campaign");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/admin/newsletter/campaigns/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(newsletterCampaignsTable).where(eq(newsletterCampaignsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete campaign");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: Email Sending ─────────────────────────────────────────────────────

function buildEmailHtml(blocks: object[], subject: string): string {
  const blockHtml = (blocks as Array<{ type: string; [k: string]: unknown }>)
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h2 style="font-family:'Georgia',serif;font-size:26px;font-weight:400;color:#111;margin:32px 0 12px;letter-spacing:0.02em;">${escHtml(String(block.text ?? ""))}</h2>`;
        case "text":
          return `<p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#444;margin:0 0 20px;">${escHtml(String(block.text ?? "")).replace(/\n/g, "<br>")}</p>`;
        case "image":
          return block.imageUrl
            ? `<div style="margin:24px 0;text-align:center;"><img src="${escHtml(String(block.imageUrl))}" alt="${escHtml(String(block.imageAlt ?? ""))}" style="max-width:100%;border-radius:2px;display:inline-block;" /></div>`
            : "";
        case "button":
          return `<div style="margin:28px 0;text-align:center;"><a href="${escHtml(String(block.url ?? "#"))}" style="display:inline-block;background:#111;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;padding:14px 36px;text-decoration:none;border-radius:1px;">${escHtml(String(block.label ?? "Shop Now"))}</a></div>`;
        case "divider":
          return `<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0;" />`;
        case "product":
          return `<div style="margin:20px 0;padding:16px;border:1px solid #e5e5e5;border-radius:2px;">
            ${block.productImageUrl ? `<img src="${escHtml(String(block.productImageUrl))}" alt="${escHtml(String(block.productTitle ?? ""))}" style="width:100%;max-height:240px;object-fit:cover;display:block;margin-bottom:12px;" />` : ""}
            <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#111;margin:0 0 4px;">${escHtml(String(block.productTitle ?? ""))}</p>
            ${block.productPrice ? `<p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#666;margin:0 0 12px;">${escHtml(String(block.productPrice))}</p>` : ""}
            ${block.productAffiliateUrl ? `<a href="${escHtml(String(block.productAffiliateUrl))}" style="display:inline-block;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#111;text-decoration:underline;">View Product</a>` : ""}
          </div>`;
        case "spacer":
          return `<div style="height:${escHtml(String(block.height ?? "24"))}px;"></div>`;
        default:
          return "";
      }
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e5e5e5;">
        <tr><td style="padding:32px 40px 12px;border-bottom:2px solid #111;">
          <p style="font-family:'Georgia',serif;font-size:22px;font-weight:400;letter-spacing:0.15em;text-transform:uppercase;color:#111;margin:0;">HOOK</p>
        </td></tr>
        <tr><td style="padding:32px 40px 40px;">
          ${blockHtml}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e5e5e5;text-align:center;">
          <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#999;margin:0;">You received this email because you subscribed at HOOK. <a href="{{unsubscribe_url}}" style="color:#999;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function sendEmailViaResend(opts: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured. Add it in Settings → Environment." };
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

router.post("/admin/newsletter/campaigns/:id/send-test", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const schema = z.object({ testEmail: z.string().email() });
    const { testEmail } = schema.parse(req.body);

    const [campaign] = await db
      .select()
      .from(newsletterCampaignsTable)
      .where(eq(newsletterCampaignsTable.id, id));
    if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

    const html = buildEmailHtml(campaign.content as object[], campaign.subject);
    const from = campaign.senderEmail
      ? `${campaign.senderName} <${campaign.senderEmail}>`
      : `HOOK <noreply@hook.app>`;

    const result = await sendEmailViaResend({
      from,
      to: testEmail,
      subject: `[TEST] ${campaign.subject}`,
      html,
    });

    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ ok: true, sentTo: testEmail });
  } catch (err) {
    req.log.error({ err }, "Failed to send test email");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.post("/admin/newsletter/campaigns/:id/send", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    const [campaign] = await db
      .select()
      .from(newsletterCampaignsTable)
      .where(eq(newsletterCampaignsTable.id, id));
    if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
    if (campaign.status === "sent") {
      res.status(400).json({ error: "Campaign already sent" });
      return;
    }

    const subscribers = await db.select().from(newsletterTable);
    if (subscribers.length === 0) {
      res.status(400).json({ error: "No subscribers to send to" });
      return;
    }

    const html = buildEmailHtml(campaign.content as object[], campaign.subject);
    const from = campaign.senderEmail
      ? `${campaign.senderName} <${campaign.senderEmail}>`
      : `HOOK <noreply@hook.app>`;

    const emails = subscribers.map((s) => s.email);

    const result = await sendEmailViaResend({
      from,
      to: emails,
      subject: campaign.subject,
      html,
    });

    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    await db
      .update(newsletterCampaignsTable)
      .set({ status: "sent", sentAt: new Date(), recipientCount: subscribers.length, updatedAt: new Date() })
      .where(eq(newsletterCampaignsTable.id, id));

    res.json({ ok: true, recipientCount: subscribers.length });
  } catch (err) {
    req.log.error({ err }, "Failed to send campaign");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
