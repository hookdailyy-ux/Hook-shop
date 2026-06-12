import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const setupsTable = pgTable("setups", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  imagePosX: integer("image_pos_x").notNull().default(50),
  imagePosY: integer("image_pos_y").notNull().default(50),
  imageScale: integer("image_scale").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const setupProductsTable = pgTable("setup_products", {
  id: serial("id").primaryKey(),
  setupId: integer("setup_id").notNull(),
  productId: integer("product_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertSetupSchema = createInsertSchema(setupsTable).omit({ id: true, createdAt: true });
export type InsertSetup = z.infer<typeof insertSetupSchema>;
export type Setup = typeof setupsTable.$inferSelect;
