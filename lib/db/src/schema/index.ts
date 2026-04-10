import { pgTable, text, serial, timestamp, boolean, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);
export const documentTypeEnum = pgEnum("document_type", ["birth_certificate", "good_moral", "psa", "tor"]);
export const documentStatusEnum = pgEnum("document_status", ["missing", "uploaded", "approved", "revision_needed"]);
export const submissionStatusEnum = pgEnum("submission_status", ["draft", "pending_review", "approved", "revisions_needed", "enrolled"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  studentId: text("student_id"),
});

export const portfoliosTable = pgTable("portfolios", {
  userId: integer("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  submissionStatus: submissionStatusEnum("submission_status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  adminNote: text("admin_note"),
});

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull().references(() => portfoliosTable.userId, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  uri: text("uri"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at"),
  status: documentStatusEnum("status").notNull().default("missing"),
  adminNote: text("admin_note"),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  type: text("type").notNull().default("info"), // info, success, warning, error
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(usersTable) as any;
export const insertPortfolioSchema = createInsertSchema(portfoliosTable) as any;
export const insertDocumentSchema = createInsertSchema(documentsTable) as any;
export const insertNotificationSchema = createInsertSchema(notificationsTable) as any;

// Types
export type User = typeof usersTable.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Portfolio = typeof portfoliosTable.$inferSelect;
export type Document = typeof documentsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;