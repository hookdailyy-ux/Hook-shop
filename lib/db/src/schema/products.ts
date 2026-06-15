import { pgTable, text, serial, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  source: text("source").notNull().default("SHEIN"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  price: text("price"),
  originalPrice: text("original_price"),
  imageUrl: text("image_url"),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  affiliateUrl: text("affiliate_url").notNull(),
  brand: text("brand"),
  material: text("material"),
  externalId: text("external_id"),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  trending: boolean("trending").notNull().default(false),
  status: text("status").notNull().default("active"),
  imagePosX: integer("image_pos_x").notNull().default(50),
  imagePosY: integer("image_pos_y").notNull().default(50),
  imageScale: integer("image_scale").notNull().default(100),
  imageObjectFit: text("image_object_fit").notNull().default("cover"),
  noonUrl: text("noon_url"),
  noonPrice: text("noon_price"),
  amazonUrl: text("amazon_url"),
  amazonPrice: text("amazon_price"),
  placements: jsonb("placements").$type<string[]>().notNull().default([]),
  deliveredBy: text("delivered_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
