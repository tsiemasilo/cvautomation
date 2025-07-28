import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  plan: text("plan").default("free").notNull(), // free, starter, professional, enterprise
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cvs = pgTable("cvs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  parsedData: jsonb("parsed_data"), // Extracted CV data
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const jobPreferences = pgTable("job_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  industries: jsonb("industries").$type<string[]>().default([]).notNull(),
  locations: jsonb("locations").$type<string[]>().default([]).notNull(),
  keywords: text("keywords"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  jobTypes: jsonb("job_types").$type<string[]>().default([]).notNull(), // full-time, part-time, contract, remote
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  jobDescription: text("job_description"),
  jobUrl: text("job_url"),
  applicationMethod: text("application_method").notNull(), // email, form, api
  status: text("status").default("sent").notNull(), // sent, pending, responded, failed
  appliedVia: text("applied_via").notNull(), // adzuna, jooble, email, manual
  applicationData: jsonb("application_data"), // Store email details, form data, etc.
  responseData: jsonb("response_data"), // Store any responses received
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  responseAt: timestamp("response_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cvs: many(cvs),
  jobPreferences: many(jobPreferences),
  applications: many(applications),
}));

export const cvsRelations = relations(cvs, ({ one }) => ({
  user: one(users, {
    fields: [cvs.userId],
    references: [users.id],
  }),
}));

export const jobPreferencesRelations = relations(jobPreferences, ({ one }) => ({
  user: one(users, {
    fields: [jobPreferences.userId],
    references: [users.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCvSchema = createInsertSchema(cvs).omit({
  id: true,
  uploadedAt: true,
});

export const insertJobPreferencesSchema = createInsertSchema(jobPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  responseAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCv = z.infer<typeof insertCvSchema>;
export type Cv = typeof cvs.$inferSelect;
export type InsertJobPreferences = z.infer<typeof insertJobPreferencesSchema>;
export type JobPreferences = typeof jobPreferences.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
