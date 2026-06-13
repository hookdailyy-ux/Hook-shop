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

  // Idempotent full-sync: keep subcategories exactly matching the canonical list.
  // Safe to run on every startup — deletes stale rows, inserts missing ones.
  void db.execute(sql`
    DO $$
    BEGIN
      -- Rename legacy labels before any delete/insert pass
      UPDATE subcategories SET name = 'Tech'  WHERE name = 'Phone'      AND category = 'electronics';
      UPDATE subcategories SET name = 'Setup' WHERE name = 'Desk Setup' AND category = 'electronics';

      -- Remove subcategories not in the canonical set
      DELETE FROM subcategories
      WHERE (category, name) NOT IN (
        ('accessories','Bags'),('accessories','Belts'),('accessories','Hats'),
        ('accessories','Jewelry'),('accessories','Socks'),('accessories','Sunglasses'),
        ('accessories','Watches'),
        ('electronics','Car Accessories'),('electronics','Gaming'),('electronics','Setup'),
        ('electronics','Smart Home'),('electronics','Tech'),
        ('home','Bedroom'),('home','Decor'),('home','Organization'),('home','Storage'),
        ('kids','Clothing'),('kids','Shoes'),
        ('men','Outfits'),('men','Pajamas'),('men','Pants'),('men','Shirts'),
        ('men','Shoes'),('men','Sport'),('men','Swimwear'),('men','T-Shirts'),
        ('men','Underwear'),
        ('women','Dresses'),('women','Outfits'),('women','Pajamas'),('women','Pants'),
        ('women','Shoes'),('women','Skirts'),('women','Sport'),('women','Swimwear'),
        ('women','Tops'),('women','Underwear')
      );

      -- Insert any missing canonical subcategories
      INSERT INTO subcategories (category, name)
      SELECT v.category, v.name FROM (VALUES
        ('accessories','Bags'),('accessories','Belts'),('accessories','Hats'),
        ('accessories','Jewelry'),('accessories','Socks'),('accessories','Sunglasses'),
        ('accessories','Watches'),
        ('electronics','Car Accessories'),('electronics','Gaming'),('electronics','Setup'),
        ('electronics','Smart Home'),('electronics','Tech'),
        ('home','Bedroom'),('home','Decor'),('home','Organization'),('home','Storage'),
        ('kids','Clothing'),('kids','Shoes'),
        ('men','Outfits'),('men','Pajamas'),('men','Pants'),('men','Shirts'),
        ('men','Shoes'),('men','Sport'),('men','Swimwear'),('men','T-Shirts'),
        ('men','Underwear'),
        ('women','Dresses'),('women','Outfits'),('women','Pajamas'),('women','Pants'),
        ('women','Shoes'),('women','Skirts'),('women','Sport'),('women','Swimwear'),
        ('women','Tops'),('women','Underwear')
      ) AS v(category, name)
      WHERE NOT EXISTS (
        SELECT 1 FROM subcategories s WHERE s.category = v.category AND s.name = v.name
      );
    END $$;
  `).catch((migrateErr: Error) =>
    logger.warn({ err: migrateErr }, "Subcategory sync skipped"),
  );
});
