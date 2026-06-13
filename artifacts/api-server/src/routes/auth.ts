import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, invalidateAdminTokenCache } from "../middlewares/requireAdmin";

const router: IRouter = Router();

const DEFAULT_PASSWORD = "rog369";
const ADMIN_PASSWORD_KEY = "admin_password_hash";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function getAdminPasswordHash(): Promise<string> {
  const rows = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, ADMIN_PASSWORD_KEY))
    .limit(1);

  if (rows.length === 0) {
    const defaultHash = hashPassword(DEFAULT_PASSWORD);
    await db
      .insert(settingsTable)
      .values({ key: ADMIN_PASSWORD_KEY, value: defaultHash })
      .onConflictDoNothing();
    return defaultHash;
  }

  return rows[0].value;
}

router.post("/auth/login", async (req, res) => {
  try {
    const { password } = req.body as { password?: string };
    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "Password required" });
      return;
    }

    const storedHash = await getAdminPasswordHash();
    const inputHash = hashPassword(password);

    if (inputHash !== storedHash) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    req.session.adminAuthenticated = true;
    const token = createHash("sha256").update(storedHash + "hook-admin-v1").digest("hex");
    res.json({ ok: true, token });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid", { httpOnly: true, secure: process.env["NODE_ENV"] === "production", path: "/" });
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res) => {
  if (req.session?.adminAuthenticated === true) {
    res.json({ authenticated: true });
    return;
  }
  const header = req.headers["x-hook-admin"] as string | undefined;
  if (header) {
    const storedHash = await getAdminPasswordHash();
    const expected = createHash("sha256").update(storedHash + "hook-admin-v1").digest("hex");
    if (header === expected) {
      res.json({ authenticated: true });
      return;
    }
  }
  res.status(401).json({ authenticated: false });
});

router.put("/auth/password", requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Both currentPassword and newPassword are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }

    const storedHash = await getAdminPasswordHash();
    if (hashPassword(currentPassword) !== storedHash) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const newHash = hashPassword(newPassword);
    await db
      .insert(settingsTable)
      .values({ key: ADMIN_PASSWORD_KEY, value: newHash })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value: newHash } });

    invalidateAdminTokenCache();
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Password change failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
