import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // One-time idempotent migration: populate placements for legacy products
  void db.execute(sql`
    UPDATE products
    SET placements = CASE
      WHEN category NOT IN ('none','') AND subcategory IS NOT NULL AND subcategory != ''
        THEN jsonb_build_array(category, category || ':' || subcategory)
      WHEN category NOT IN ('none','')
        THEN jsonb_build_array(category)
      ELSE '[]'::jsonb
    END
    WHERE placements IS NULL OR jsonb_array_length(placements) = 0
  `).catch((migrateErr: Error) =>
    logger.warn({ err: migrateErr }, "Placement migration skipped"),
  );

  // Idempotent: rename stale electronics subcategories
  void db.execute(sql`
    UPDATE subcategories SET name = 'Tech'  WHERE name = 'Phone'      AND category = 'electronics';
    UPDATE subcategories SET name = 'Setup' WHERE name = 'Desk Setup' AND category = 'electronics';
  `).catch((migrateErr: Error) =>
    logger.warn({ err: migrateErr }, "Subcategory rename skipped"),
  );
});
