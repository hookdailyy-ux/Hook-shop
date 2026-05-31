import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamMembersTable } from "./team";
import { productsTable } from "./products";

export const looksTable = pgTable("looks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  imagePosX: integer("image_pos_x").notNull().default(50),
  imagePosY: integer("image_pos_y").notNull().default(50),
  imageScale: integer("image_scale").notNull().default(100),
  imageObjectFit: text("image_object_fit").notNull().default("cover"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lookProductsTable = pgTable("look_products", {
  id: serial("id").primaryKey(),
  lookId: integer("look_id").notNull(),
  productId: integer("product_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertLookSchema = createInsertSchema(looksTable).omit({ id: true, createdAt: true });
export type InsertLook = z.infer<typeof insertLookSchema>;
export type Look = typeof looksTable.$inferSelect;

// ─── Team Member Looks (separate from admin looks) ────────────────────────────

export const teamLooksTable = pgTable("team_looks", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id")
    .notNull()
    .references(() => teamMembersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  coverImageUrl: text("cover_image_url"),
  coverImagePosX: integer("cover_image_pos_x").notNull().default(50),
  coverImagePosY: integer("cover_image_pos_y").notNull().default(50),
  coverImageScale: integer("cover_image_scale").notNull().default(100),
  coverImageObjectFit: text("cover_image_object_fit").notNull().default("cover"),
  price: text("price"),
  status: text("status").notNull().default("active"),
  shareToken: text("share_token").notNull().unique(),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamLookProductsTable = pgTable("team_look_products", {
  id: serial("id").primaryKey(),
  lookId: integer("look_id")
    .notNull()
    .references(() => teamLooksTable.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TeamLook = typeof teamLooksTable.$inferSelect;
export type TeamLookProduct = typeof teamLookProductsTable.$inferSelect;
