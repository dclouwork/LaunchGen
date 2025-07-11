import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const launchPlans = pgTable("launch_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  businessInfo: text("business_info").notNull(),
  generatedPlan: jsonb("generated_plan").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  shareToken: text("share_token").unique(),
  isEditable: boolean("is_editable").notNull().default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  launchPlans: many(launchPlans),
}));

export const launchPlansRelations = relations(launchPlans, ({ one }) => ({
  user: one(users, {
    fields: [launchPlans.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLaunchPlanSchema = createInsertSchema(launchPlans).pick({
  userId: true,
  businessInfo: true,
  generatedPlan: true,
  createdAt: true,
  updatedAt: true,
  shareToken: true,
  isEditable: true,
});

export const businessInfoSchema = z.object({
  businessIdea: z.string().min(10, "Business idea must be at least 10 characters"),
  industry: z.string().min(2, "Industry is required"),
  targetMarket: z.string().min(2, "Target market is required"),
  timeCommitment: z.string().default("10 hours/week"),
  budget: z.string().default("$0 (Zero-budget)"),
  additionalDetails: z.string().optional(),
});

export const launchPlanResponse = z.object({
  overview: z.string(),
  weeklyPlan: z.array(z.object({
    title: z.string(),
    goal: z.string(),
    dailyTasks: z.array(z.object({
      day: z.string(),
      description: z.string(),
      timeEstimate: z.string(),
      tool: z.string(),
      kpi: z.string(),
    })),
    redditTips: z.array(z.string()),
  })),
  recommendedTools: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    pricing: z.string(),
    setupSteps: z.array(z.string()).optional(),
  })),
  kpis: z.array(z.object({
    metric: z.string(),
    target: z.string(),
    tracking: z.string(),
  })),
  nextActions: z.array(z.string()).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLaunchPlan = z.infer<typeof insertLaunchPlanSchema>;
export type LaunchPlan = typeof launchPlans.$inferSelect;
export type BusinessInfo = z.infer<typeof businessInfoSchema>;
export type LaunchPlanResponse = z.infer<typeof launchPlanResponse>;
