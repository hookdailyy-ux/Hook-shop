import { Router, type IRouter } from "express";
import { db, teamMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { z } from "zod";

const router: IRouter = Router();

function hashPassword(password: string, username: string): string {
  return createHash("sha256").update(`${username}:${password}`).digest("hex");
}

router.post("/team/auth/login", async (req, res) => {
  try {
    const { username, password } = z
      .object({ username: z.string().min(1), password: z.string().min(1) })
      .parse(req.body);

    const [member] = await db
      .select()
      .from(teamMembersTable)
      .where(eq(teamMembersTable.username, username))
      .limit(1);

    if (!member) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    if (member.status === "disabled") {
      res.status(403).json({ error: "Account disabled. Contact your admin." });
      return;
    }
    if (hashPassword(password, username) !== member.passwordHash) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    await db
      .update(teamMembersTable)
      .set({ lastActiveAt: new Date() })
      .where(eq(teamMembersTable.id, member.id));

    req.session.teamMemberId = member.id;
    req.session.teamMemberForcePasswordChange = member.forcePasswordChange;

    res.json({
      ok: true,
      forcePasswordChange: member.forcePasswordChange,
      member: {
        id: member.id,
        fullName: member.fullName,
        username: member.username,
        whatsapp: member.whatsapp ?? "",
        status: member.status,
        createdAt: member.createdAt.toISOString(),
        displayName: member.displayName ?? null,
        bio: member.bio ?? null,
        profilePhotoUrl: member.profilePhotoUrl ?? null,
        coverImageUrl: member.coverImageUrl ?? null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Team member login failed");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/team/auth/me", async (req, res) => {
  const memberId = req.session?.teamMemberId;
  if (!memberId) {
    res.status(401).json({ authenticated: false });
    return;
  }
  try {
    const [member] = await db
      .select()
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, memberId))
      .limit(1);

    if (!member || member.status === "disabled") {
      req.session.destroy(() => undefined);
      res.status(401).json({ authenticated: false });
      return;
    }

    await db
      .update(teamMembersTable)
      .set({ lastActiveAt: new Date() })
      .where(eq(teamMembersTable.id, member.id));

    res.json({
      authenticated: true,
      forcePasswordChange: member.forcePasswordChange,
      member: {
        id: member.id,
        fullName: member.fullName,
        username: member.username,
        whatsapp: member.whatsapp ?? "",
        status: member.status,
        createdAt: member.createdAt.toISOString(),
        displayName: member.displayName ?? null,
        bio: member.bio ?? null,
        profilePhotoUrl: member.profilePhotoUrl ?? null,
        coverImageUrl: member.coverImageUrl ?? null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Team me check failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/team/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// ─── PROFILE ─────────────────────────────────────────────────────────────────

router.get("/team/profile", async (req, res) => {
  const memberId = req.session?.teamMemberId;
  if (!memberId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [member] = await db.select().from(teamMembersTable).where(eq(teamMembersTable.id, memberId)).limit(1);
    if (!member) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      id: member.id,
      fullName: member.fullName,
      username: member.username,
      whatsapp: member.whatsapp ?? "",
      displayName: member.displayName ?? null,
      bio: member.bio ?? null,
      profilePhotoUrl: member.profilePhotoUrl ?? null,
      coverImageUrl: member.coverImageUrl ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get team profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/team/profile", async (req, res) => {
  const memberId = req.session?.teamMemberId;
  if (!memberId) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const schema = z.object({
      displayName: z.string().max(80).nullable().optional(),
      bio: z.string().max(500).nullable().optional(),
      profilePhotoUrl: z.string().nullable().optional(),
      coverImageUrl: z.string().nullable().optional(),
      whatsapp: z.string().max(30).nullable().optional(),
    });
    const data = schema.parse(req.body);
    const [updated] = await db
      .update(teamMembersTable)
      .set({
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.profilePhotoUrl !== undefined ? { profilePhotoUrl: data.profilePhotoUrl } : {}),
        ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
        ...(data.whatsapp !== undefined ? { whatsapp: data.whatsapp } : {}),
      })
      .where(eq(teamMembersTable.id, memberId))
      .returning();
    res.json({
      id: updated.id,
      fullName: updated.fullName,
      username: updated.username,
      whatsapp: updated.whatsapp ?? "",
      displayName: updated.displayName ?? null,
      bio: updated.bio ?? null,
      profilePhotoUrl: updated.profilePhotoUrl ?? null,
      coverImageUrl: updated.coverImageUrl ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update team profile");
    res.status(400).json({ error: "Invalid input" });
  }
});

// ─── PASSWORD ─────────────────────────────────────────────────────────────────

router.put("/team/auth/password", async (req, res) => {
  const memberId = req.session?.teamMemberId;
  if (!memberId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().optional().default(""),
        newPassword: z.string().min(6),
      })
      .parse(req.body);

    const [member] = await db
      .select()
      .from(teamMembersTable)
      .where(eq(teamMembersTable.id, memberId))
      .limit(1);

    if (!member) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (!member.forcePasswordChange) {
      if (!currentPassword || hashPassword(currentPassword, member.username) !== member.passwordHash) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
    }

    await db
      .update(teamMembersTable)
      .set({ passwordHash: hashPassword(newPassword, member.username), forcePasswordChange: false })
      .where(eq(teamMembersTable.id, memberId));

    req.session.teamMemberForcePasswordChange = false;
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Team password change failed");
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
