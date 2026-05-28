import { Router, type IRouter } from "express";
import { db, newsletterTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

router.post("/newsletter", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
    });
    const data = schema.parse(req.body);

    const [existing] = await db
      .select()
      .from(newsletterTable)
      .where(eq(newsletterTable.email, data.email));

    if (existing) {
      return res.status(201).json({ ...existing, createdAt: existing.createdAt.toISOString() });
    }

    const [subscriber] = await db
      .insert(newsletterTable)
      .values({ email: data.email })
      .returning();

    res.status(201).json({ ...subscriber, createdAt: subscriber.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to subscribe");
    res.status(400).json({ error: "Invalid email" });
  }
});

export default router;
