import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["student", "client", "admin"] }).notNull().default("client"),
  universityEmail: text("university_email"),
  universityVerified: integer("university_verified", { mode: "boolean" }).notNull().default(false),
  verificationCode: text("verification_code"),
  phone: text("phone"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  services: many(services),
  projects: many(projects),
  proposals: many(proposals),
  sentMessages: many(messages),
  reviewsWritten: many(reviews, { relationName: "author" }),
  reviewsReceived: many(reviews, { relationName: "target" }),
  disputesOpened: many(disputes),
}));

// ============================================================================
// PROFILES TABLE
// ============================================================================

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  introVideoUrl: text("intro_video_url"),
  skills: text("skills", { mode: "json" }).$type<Array<{ name: string; level: string }>>().default([]),
  portfolio: text("portfolio", { mode: "json" })
    .$type<Array<{ title: string; description: string; url: string }>>()
    .default([]),
  rate: real("rate"),
  availability: text("availability", { enum: ["available", "busy"] }).default("available"),
  languages: text("languages", { mode: "json" }).$type<string[]>().default([]),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").notNull().default(0),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// SERVICES TABLE
// ============================================================================

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priceBasic: real("price_basic"),
  priceStandard: real("price_standard"),
  pricePremium: real("price_premium"),
  descriptionBasic: text("description_basic"),
  descriptionStandard: text("description_standard"),
  descriptionPremium: text("description_premium"),
  deliveryDays: integer("delivery_days"),
  sampleUrls: text("sample_urls", { mode: "json" }).$type<string[]>().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const servicesRelations = relations(services, ({ one }) => ({
  provider: one(users, {
    fields: [services.providerId],
    references: [users.id],
  }),
}));

// ============================================================================
// PROJECTS TABLE
// ============================================================================

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budgetMin: real("budget_min"),
  budgetMax: real("budget_max"),
  status: text("status", {
    enum: ["open", "in_progress", "delivered", "completed", "disputed", "cancelled"],
  })
    .notNull()
    .default("open"),
  acceptedProposalId: text("accepted_proposal_id"),
  escrowAmount: real("escrow_amount"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(users, {
    fields: [projects.clientId],
    references: [users.id],
  }),
  acceptedProposal: one(proposals, {
    fields: [projects.acceptedProposalId],
    references: [proposals.id],
  }),
  proposals: many(proposals),
  messages: many(messages),
  transactions: many(transactions),
  reviews: many(reviews),
  disputes: many(disputes),
}));

// ============================================================================
// PROPOSALS TABLE
// ============================================================================

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  providerId: text("provider_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  coverLetter: text("cover_letter").notNull(),
  price: real("price").notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const proposalsRelations = relations(proposals, ({ one }) => ({
  project: one(projects, {
    fields: [proposals.projectId],
    references: [projects.id],
  }),
  provider: one(users, {
    fields: [proposals.providerId],
    references: [users.id],
  }),
}));

// ============================================================================
// MESSAGES TABLE
// ============================================================================

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  attachments: text("attachments", { mode: "json" })
    .$type<Array<{ url: string; filename: string; size: number }>>()
    .default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// ============================================================================
// TRANSACTIONS TABLE
// ============================================================================

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  fromUser: text("from_user").references(() => users.id),
  toUser: text("to_user").references(() => users.id),
  amount: real("amount").notNull(),
  platformFee: real("platform_fee").default(0),
  type: text("type", { enum: ["deposit", "release", "withdrawal"] }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] })
    .notNull()
    .default("pending"),
  gatewayTxId: text("gateway_tx_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  from: one(users, {
    fields: [transactions.fromUser],
    references: [users.id],
    relationName: "fromUser",
  }),
  to: one(users, {
    fields: [transactions.toUser],
    references: [users.id],
    relationName: "toUser",
  }),
}));

// ============================================================================
// REVIEWS TABLE
// ============================================================================

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, {
    fields: [reviews.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [reviews.authorId],
    references: [users.id],
    relationName: "author",
  }),
  target: one(users, {
    fields: [reviews.targetUserId],
    references: [users.id],
    relationName: "target",
  }),
}));

// ============================================================================
// DISPUTES TABLE
// ============================================================================

export const disputes = sqliteTable("disputes", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  openerId: text("opener_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["open", "in_review", "resolved", "closed"] })
    .notNull()
    .default("open"),
  evidence: text("evidence", { mode: "json" }).$type<Array<{ url: string; note: string }>>().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const disputesRelations = relations(disputes, ({ one }) => ({
  project: one(projects, {
    fields: [disputes.projectId],
    references: [projects.id],
  }),
  opener: one(users, {
    fields: [disputes.openerId],
    references: [users.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  verificationCode: true,
  universityVerified: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  universityEmail: z.string().email().optional().nullable(),
});

export const selectUserSchema = createSelectSchema(users).omit({
  passwordHash: true,
  verificationCode: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Profile schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  userId: true,
  rating: true,
  reviewCount: true,
});

export const updateProfileSchema = insertProfileSchema.partial();

// Service schemas
export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  providerId: true,
  createdAt: true,
}).extend({
  priceBasic: z.number().positive().optional().nullable(),
  priceStandard: z.number().positive().optional().nullable(),
  pricePremium: z.number().positive().optional().nullable(),
});

export const updateServiceSchema = insertServiceSchema.partial();

// Project schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  clientId: true,
  status: true,
  acceptedProposalId: true,
  escrowAmount: true,
  createdAt: true,
}).extend({
  budgetMin: z.number().positive().optional().nullable(),
  budgetMax: z.number().positive().optional().nullable(),
});

export const updateProjectSchema = z.object({
  status: z.enum(["open", "in_progress", "delivered", "completed", "disputed", "cancelled"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

// Proposal schemas
export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  providerId: true,
  createdAt: true,
}).extend({
  price: z.number().positive(),
  deliveryDays: z.number().int().positive(),
});

export const updateProposalSchema = insertProposalSchema.partial().omit({ projectId: true });

// Message schemas
export const insertMessageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty"),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number(),
  })).optional(),
});

// Review schemas
export const insertReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters").optional(),
});

// Transaction schemas
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Dispute schemas
export const insertDisputeSchema = z.object({
  projectId: z.string(),
  reason: z.string().min(10, "Please provide more details about the dispute"),
});

export const updateDisputeSchema = z.object({
  status: z.enum(["open", "in_review", "resolved", "closed"]),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SafeUser = z.infer<typeof selectUserSchema>;

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type UpdateService = z.infer<typeof updateServiceSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type UpdateProposal = z.infer<typeof updateProposalSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type UpdateDispute = z.infer<typeof updateDisputeSchema>;

// ============================================================================
// EXTENDED TYPES FOR API RESPONSES
// ============================================================================

export type ServiceWithProvider = Service & {
  provider: SafeUser & { profile: Profile | null };
};

export type ProjectWithDetails = Project & {
  client: SafeUser;
  proposals: (Proposal & { provider: SafeUser & { profile: Profile | null } })[];
  acceptedProposal: (Proposal & { provider: SafeUser & { profile: Profile | null } }) | null;
};

export type ProposalWithProvider = Proposal & {
  provider: SafeUser & { profile: Profile | null };
};

export type MessageWithSender = Message & {
  sender: SafeUser;
};

export type ReviewWithAuthor = Review & {
  author: SafeUser;
};