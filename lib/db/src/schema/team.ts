import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const teamMembersTable = pgTable("team_members", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  whatsapp: text("whatsapp"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  forcePasswordChange: boolean("force_password_change").notNull().default(true),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teamMemberActivityTable = pgTable("team_member_activity", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => teamMembersTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TeamMember = typeof teamMembersTable.$inferSelect;
export type TeamMemberActivity = typeof teamMemberActivityTable.$inferSelect;
