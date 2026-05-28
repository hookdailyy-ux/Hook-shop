import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const looksTable = pgTable("looks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lookProductsTable = pgTable("look_products", {
  id: serial("id").primaryKey(),
  lookId: integer("look_id").notNull(),
  productId: integer("product_id").notNull(),
});

export const insertLookSchema = createInsertSchema(looksTable).omit({ id: true, createdAt: true });
export type InsertLook = z.infer<typeof insertLookSchema>;
export type Look = typeof looksTable.$inferSelect;
