import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { teamMembersTable } from "./team";

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

export type Collection = typeof collectionsTable.$inferSelect;
