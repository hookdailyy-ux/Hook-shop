import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsletterTable = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsletterSchema = createInsertSchema(newsletterTable).omit({ id: true, createdAt: true });
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type NewsletterSubscriber = typeof newsletterTable.$inferSelect;

export const newsletterCampaignsTable = pgTable("newsletter_campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull().default(""),
  senderName: text("sender_name").notNull().default("HOOK"),
  senderEmail: text("sender_email").notNull().default(""),
  content: jsonb("content").$type<object[]>().notNull().default([]),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type NewsletterCampaign = typeof newsletterCampaignsTable.$inferSelect;
