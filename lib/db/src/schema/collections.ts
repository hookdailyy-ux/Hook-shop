import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { teamMembersTable } from "./team";
import { productsTable } from "./products";

export const collectionsTable = pgTable("collections", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id")
    .notNull()
    .references(() => teamMembersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  status: text("status").notNull().default("active"),
  shareToken: text("share_token").notNull().unique(),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const collectionProductsTable = pgTable("collection_products", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id")
    .notNull()
    .references(() => collectionsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  collectionPrice: text("collection_price"),
  sortOrder: integer("sort_order").notNull().default(0),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Collection = typeof collectionsTable.$inferSelect;
export type CollectionProduct = typeof collectionProductsTable.$inferSelect;
