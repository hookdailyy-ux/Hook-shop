import { Router, type IRouter } from "express";
import { db, rewardsTable, teamMembersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/team/rewards", async (req, res) => {
  const memberId = req.session?.teamMemberId;
  if (!memberId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const rewards = await db
      .select()
      .from(rewardsTable)
      .where(eq(rewardsTable.teamMemberId, memberId))
      .orderBy(desc(rewardsTable.createdAt));

    res.json(rewards.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get rewards");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
