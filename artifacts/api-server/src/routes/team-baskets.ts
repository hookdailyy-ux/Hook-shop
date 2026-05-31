import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { teamMembersTable, sharedBasketsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/team/basket-shares", async (req, res) => {
  const memberId = req.session?.teamMemberId;
  if (!memberId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [member] = await db
    .select({ username: teamMembersTable.username })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.id, memberId))
    .limit(1);

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const baskets = await db
    .select()
    .from(sharedBasketsTable)
    .where(eq(sharedBasketsTable.memberUsername, member.username))
    .orderBy(desc(sharedBasketsTable.createdAt));

  res.json(
    baskets.map((b) => {
      let items: unknown[] = [];
      try {
        items = JSON.parse(b.itemsJson) as unknown[];
      } catch {
        /* ignore */
      }
      return {
        id: b.id,
        token: b.token,
        memberUsername: b.memberUsername,
        memberName: b.memberName,
        items,
        createdAt: b.createdAt,
      };
    })
  );
});

export default router;
