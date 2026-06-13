import { createHash } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_PASSWORD = "rog369";
const ADMIN_PASSWORD_KEY = "admin_password_hash";
const TOKEN_SUFFIX = "hook-admin-v1";

function hashPassword(p: string): string {
  return createHash("sha256").update(p).digest("hex");
}

let _cachedToken: string | undefined;

async function getExpectedToken(): Promise<string> {
  if (_cachedToken) return _cachedToken;
  const rows = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, ADMIN_PASSWORD_KEY))
    .limit(1);
  const pwHash = rows[0]?.value ?? hashPassword(DEFAULT_PASSWORD);
  _cachedToken = createHash("sha256").update(pwHash + TOKEN_SUFFIX).digest("hex");
  return _cachedToken;
}

export function invalidateAdminTokenCache(): void {
  _cachedToken = undefined;
}

export async function checkAdminToken(token: string): Promise<boolean> {
  const expected = await getExpectedToken();
  return token === expected;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.adminAuthenticated === true) {
    return next();
  }
  const header = req.headers["x-hook-admin"] as string | undefined;
  if (header) {
    const expected = await getExpectedToken();
    if (header === expected) {
      return next();
    }
  }
  res.status(401).json({ error: "Unauthorized" });
}
