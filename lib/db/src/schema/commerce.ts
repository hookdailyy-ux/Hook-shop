import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { teamMembersTable } from "./team";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembersTable.id),
  orderRef: text("order_ref").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  shippingAddress: text("shipping_address"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id"),
  productTitle: text("product_title").notNull(),
  productImageUrl: text("product_image_url"),
  displayPrice: text("display_price"),
  quantity: integer("quantity").notNull().default(1),
  affiliateUrl: text("affiliate_url"),
  brand: text("brand"),
});

export const orderProofsTable = pgTable("order_proofs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  proofType: text("proof_type").notNull().default("confirmation"),
  platformOrderRef: text("platform_order_ref"),
  orderValue: text("order_value"),
  memberNotes: text("member_notes"),
  adminReviewed: boolean("admin_reviewed").notNull().default(false),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analyticsEventsTable = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembersTable.id),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  eventType: text("event_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rewardsTable = pgTable("rewards", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembersTable.id),
  title: text("title").notNull(),
  description: text("description"),
  amount: text("amount"),
  rewardType: text("reward_type").notNull().default("bonus"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const memberBadgesTable = pgTable("member_badges", {
  id: serial("id").primaryKey(),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembersTable.id),
  badgeType: text("badge_type").notNull(),
  period: text("period").notNull().default("all-time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sharedBasketsTable = pgTable("shared_baskets", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  memberUsername: text("member_username").notNull(),
  memberName: text("member_name").notNull(),
  itemsJson: text("items_json").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SharedBasket = typeof sharedBasketsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type OrderProof = typeof orderProofsTable.$inferSelect;
export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect;
export type Reward = typeof rewardsTable.$inferSelect;
export type MemberBadge = typeof memberBadgesTable.$inferSelect;
