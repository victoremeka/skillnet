var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel-handler.ts
import express from "express";

// server/routes.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// server/storage.ts
import { eq, and, or, desc, like } from "drizzle-orm";

// server/db.ts
import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  disputes: () => disputes,
  disputesRelations: () => disputesRelations,
  insertDisputeSchema: () => insertDisputeSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertProposalSchema: () => insertProposalSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertServiceSchema: () => insertServiceSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  profiles: () => profiles,
  profilesRelations: () => profilesRelations,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  proposals: () => proposals,
  proposalsRelations: () => proposalsRelations,
  reviews: () => reviews,
  reviewsRelations: () => reviewsRelations,
  selectUserSchema: () => selectUserSchema,
  services: () => services,
  servicesRelations: () => servicesRelations,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  updateDisputeSchema: () => updateDisputeSchema,
  updateProfileSchema: () => updateProfileSchema,
  updateProjectSchema: () => updateProjectSchema,
  updateProposalSchema: () => updateProposalSchema,
  updateServiceSchema: () => updateServiceSchema,
  users: () => users,
  usersRelations: () => usersRelations,
  verifyEmailSchema: () => verifyEmailSchema
});
import {
  sqliteTable,
  text,
  integer,
  real
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
var users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["student", "client", "admin"] }).notNull().default("client"),
  universityEmail: text("university_email"),
  universityVerified: integer("university_verified", { mode: "boolean" }).notNull().default(false),
  verificationCode: text("verification_code"),
  phone: text("phone"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId]
  }),
  services: many(services),
  projects: many(projects),
  proposals: many(proposals),
  sentMessages: many(messages),
  reviewsWritten: many(reviews, { relationName: "author" }),
  reviewsReceived: many(reviews, { relationName: "target" }),
  disputesOpened: many(disputes)
}));
var profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  introVideoUrl: text("intro_video_url"),
  skills: text("skills", { mode: "json" }).$type().default([]),
  portfolio: text("portfolio", { mode: "json" }).$type().default([]),
  rate: real("rate"),
  availability: text("availability", { enum: ["available", "busy"] }).default("available"),
  languages: text("languages", { mode: "json" }).$type().default([]),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").notNull().default(0)
});
var profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id]
  })
}));
var services = sqliteTable("services", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  sampleUrls: text("sample_urls", { mode: "json" }).$type().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var servicesRelations = relations(services, ({ one }) => ({
  provider: one(users, {
    fields: [services.providerId],
    references: [users.id]
  })
}));
var projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budgetMin: real("budget_min"),
  budgetMax: real("budget_max"),
  status: text("status", {
    enum: ["open", "in_progress", "delivered", "completed", "disputed", "cancelled"]
  }).notNull().default("open"),
  acceptedProposalId: text("accepted_proposal_id"),
  escrowAmount: real("escrow_amount"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(users, {
    fields: [projects.clientId],
    references: [users.id]
  }),
  acceptedProposal: one(proposals, {
    fields: [projects.acceptedProposalId],
    references: [proposals.id]
  }),
  proposals: many(proposals),
  messages: many(messages),
  transactions: many(transactions),
  reviews: many(reviews),
  disputes: many(disputes)
}));
var proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  coverLetter: text("cover_letter").notNull(),
  price: real("price").notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var proposalsRelations = relations(proposals, ({ one }) => ({
  project: one(projects, {
    fields: [proposals.projectId],
    references: [projects.id]
  }),
  provider: one(users, {
    fields: [proposals.providerId],
    references: [users.id]
  })
}));
var messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  attachments: text("attachments", { mode: "json" }).$type().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id]
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id]
  })
}));
var transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fromUser: text("from_user").references(() => users.id),
  toUser: text("to_user").references(() => users.id),
  amount: real("amount").notNull(),
  platformFee: real("platform_fee").default(0),
  type: text("type", { enum: ["deposit", "release", "withdrawal"] }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull().default("pending"),
  gatewayTxId: text("gateway_tx_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var transactionsRelations = relations(transactions, ({ one }) => ({
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id]
  }),
  from: one(users, {
    fields: [transactions.fromUser],
    references: [users.id],
    relationName: "fromUser"
  }),
  to: one(users, {
    fields: [transactions.toUser],
    references: [users.id],
    relationName: "toUser"
  })
}));
var reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var reviewsRelations = relations(reviews, ({ one }) => ({
  project: one(projects, {
    fields: [reviews.projectId],
    references: [projects.id]
  }),
  author: one(users, {
    fields: [reviews.authorId],
    references: [users.id],
    relationName: "author"
  }),
  target: one(users, {
    fields: [reviews.targetUserId],
    references: [users.id],
    relationName: "target"
  })
}));
var disputes = sqliteTable("disputes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  openerId: text("opener_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["open", "in_review", "resolved", "closed"] }).notNull().default("open"),
  evidence: text("evidence", { mode: "json" }).$type().default([]),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
var disputesRelations = relations(disputes, ({ one }) => ({
  project: one(projects, {
    fields: [disputes.projectId],
    references: [projects.id]
  }),
  opener: one(users, {
    fields: [disputes.openerId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  verificationCode: true,
  universityVerified: true
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  universityEmail: z.string().email().optional().nullable()
});
var selectUserSchema = createSelectSchema(users).omit({
  passwordHash: true,
  verificationCode: true
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
var verifyEmailSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits")
});
var insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  userId: true,
  rating: true,
  reviewCount: true
});
var updateProfileSchema = insertProfileSchema.partial();
var insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  providerId: true,
  createdAt: true
}).extend({
  priceBasic: z.number().positive().optional().nullable(),
  priceStandard: z.number().positive().optional().nullable(),
  pricePremium: z.number().positive().optional().nullable()
});
var updateServiceSchema = insertServiceSchema.partial();
var insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  clientId: true,
  status: true,
  acceptedProposalId: true,
  escrowAmount: true,
  createdAt: true
}).extend({
  budgetMin: z.number().positive().optional().nullable(),
  budgetMax: z.number().positive().optional().nullable()
});
var updateProjectSchema = z.object({
  status: z.enum(["open", "in_progress", "delivered", "completed", "disputed", "cancelled"]).optional(),
  title: z.string().optional(),
  description: z.string().optional()
});
var insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  providerId: true,
  createdAt: true
}).extend({
  price: z.number().positive(),
  deliveryDays: z.number().int().positive()
});
var updateProposalSchema = insertProposalSchema.partial().omit({ projectId: true });
var insertMessageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty"),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number()
  })).optional()
});
var insertReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters").optional()
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true
});
var insertDisputeSchema = z.object({
  projectId: z.string(),
  reason: z.string().min(10, "Please provide more details about the dispute")
});
var updateDisputeSchema = z.object({
  status: z.enum(["open", "in_review", "resolved", "closed"])
});

// server/db.ts
import path from "path";
import fs from "fs";
console.log("[DB] DATABASE_URL present:", !!process.env.DATABASE_URL);
console.log("[DB] DATABASE_URL starts with libsql://:", process.env.DATABASE_URL?.startsWith("libsql://"));
console.log("[DB] TURSO_AUTH_TOKEN present:", !!process.env.TURSO_AUTH_TOKEN);
var hasTursoUrl = process.env.DATABASE_URL?.startsWith("libsql://");
var client;
if (hasTursoUrl) {
  client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  console.log("\u{1F4E1} Connected to Turso database");
} else {
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, "skillnet.db");
  client = createClient({
    url: `file:${dbPath}`
  });
  console.log(`\u{1F4E6} Using local database: ${dbPath}`);
}
var db = drizzle(client, { schema: schema_exports });

// server/storage.ts
import { v4 as uuidv4 } from "uuid";
var PLATFORM_FEE_PERCENTAGE = 0.1;
function sanitizeUser(user) {
  const { passwordHash, verificationCode, ...safeUser } = user;
  return safeUser;
}
async function createUser(data) {
  const id = uuidv4();
  const verificationCode = data.role === "student" ? generateVerificationCode() : null;
  const [user] = await db.insert(users).values({
    id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role,
    universityEmail: data.universityEmail || null,
    verificationCode,
    phone: data.phone || null
  }).returning();
  if (data.role === "student") {
    await db.insert(profiles).values({
      id: uuidv4(),
      userId: id
    });
  }
  return user;
}
async function getUser(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}
async function getUserByEmail(email) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user || null;
}
async function updateUser(id, data) {
  const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
  return user || null;
}
async function verifyUniversityEmail(userId, code) {
  const user = await getUser(userId);
  if (!user || user.verificationCode !== code) {
    return null;
  }
  const [updated] = await db.update(users).set({
    universityVerified: true,
    verificationCode: null
  }).where(eq(users.id, userId)).returning();
  return updated || null;
}
function generateVerificationCode() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
async function getProfile(userId) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return profile || null;
}
async function updateProfile(userId, data) {
  const [profile] = await db.update(profiles).set(data).where(eq(profiles.userId, userId)).returning();
  return profile || null;
}
async function getUserWithProfile(userId) {
  const user = await getUser(userId);
  if (!user)
    return null;
  const profile = await getProfile(userId);
  return { ...sanitizeUser(user), profile };
}
async function createService(providerId, data) {
  const id = uuidv4();
  const [service] = await db.insert(services).values({
    id,
    providerId,
    title: data.title,
    description: data.description,
    category: data.category,
    priceBasic: data.priceBasic ? Number(data.priceBasic) : null,
    priceStandard: data.priceStandard ? Number(data.priceStandard) : null,
    pricePremium: data.pricePremium ? Number(data.pricePremium) : null,
    deliveryDays: data.deliveryDays || null,
    sampleUrls: data.sampleUrls || []
  }).returning();
  return service;
}
async function getService(id) {
  const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  if (!service)
    return null;
  const provider = await getUserWithProfile(service.providerId);
  if (!provider)
    return null;
  return { ...service, provider };
}
async function getServices(filters) {
  let query = db.select().from(services);
  const conditions = [];
  if (filters?.category) {
    conditions.push(eq(services.category, filters.category));
  }
  if (filters?.providerId) {
    conditions.push(eq(services.providerId, filters.providerId));
  }
  if (filters?.search) {
    const searchLower = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      or(
        like(services.title, searchLower),
        like(services.description, searchLower)
      )
    );
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  const serviceList = await query.orderBy(desc(services.createdAt));
  const result = [];
  for (const service of serviceList) {
    const provider = await getUserWithProfile(service.providerId);
    if (provider) {
      if (filters?.minPrice && service.priceBasic) {
        if (Number(service.priceBasic) < filters.minPrice)
          continue;
      }
      if (filters?.maxPrice && service.priceBasic) {
        if (Number(service.priceBasic) > filters.maxPrice)
          continue;
      }
      result.push({ ...service, provider });
    }
  }
  return result;
}
async function updateService(id, data) {
  const updateData = {};
  if (data.title !== void 0)
    updateData.title = data.title;
  if (data.description !== void 0)
    updateData.description = data.description;
  if (data.category !== void 0)
    updateData.category = data.category;
  if (data.priceBasic !== void 0)
    updateData.priceBasic = data.priceBasic ? Number(data.priceBasic) : null;
  if (data.priceStandard !== void 0)
    updateData.priceStandard = data.priceStandard ? Number(data.priceStandard) : null;
  if (data.pricePremium !== void 0)
    updateData.pricePremium = data.pricePremium ? Number(data.pricePremium) : null;
  if (data.deliveryDays !== void 0)
    updateData.deliveryDays = data.deliveryDays;
  if (data.sampleUrls !== void 0)
    updateData.sampleUrls = data.sampleUrls;
  const [service] = await db.update(services).set(updateData).where(eq(services.id, id)).returning();
  return service || null;
}
async function deleteService(id) {
  const result = await db.delete(services).where(eq(services.id, id));
  return true;
}
async function createProject(clientId, data) {
  const id = uuidv4();
  const [project] = await db.insert(projects).values({
    id,
    clientId,
    title: data.title,
    description: data.description,
    budgetMin: data.budgetMin ? Number(data.budgetMin) : null,
    budgetMax: data.budgetMax ? Number(data.budgetMax) : null
  }).returning();
  return project;
}
async function getProject(id) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project)
    return null;
  const client2 = await getUser(project.clientId);
  if (!client2)
    return null;
  const proposalList = await getProposals({ projectId: id });
  let acceptedProposal = null;
  if (project.acceptedProposalId) {
    acceptedProposal = await getProposal(project.acceptedProposalId);
  }
  return {
    ...project,
    client: sanitizeUser(client2),
    proposals: proposalList,
    acceptedProposal
  };
}
async function getProjects(filters) {
  let projectList;
  if (filters?.providerId) {
    const providerProposals = await db.select().from(proposals).where(eq(proposals.providerId, filters.providerId));
    const projectIds = [...new Set(providerProposals.map((p) => p.projectId))];
    if (projectIds.length === 0)
      return [];
    const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
    projectList = allProjects.filter((p) => {
      const matchesId = projectIds.includes(p.id);
      const matchesStatus = filters.status ? p.status === filters.status : true;
      return matchesId && matchesStatus;
    });
  } else {
    const conditions = [];
    if (filters?.clientId) {
      conditions.push(eq(projects.clientId, filters.clientId));
    }
    if (filters?.status) {
      conditions.push(eq(projects.status, filters.status));
    }
    projectList = await db.select().from(projects).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(projects.createdAt));
  }
  const result = [];
  for (const project of projectList) {
    const details = await getProject(project.id);
    if (details)
      result.push(details);
  }
  return result;
}
async function updateProject(id, data) {
  const [project] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
  return project || null;
}
async function acceptProposal(projectId, proposalId) {
  const proposal = await getProposal(proposalId);
  if (!proposal)
    return null;
  const [project] = await db.update(projects).set({
    acceptedProposalId: proposalId,
    status: "in_progress",
    escrowAmount: Number(proposal.price)
  }).where(eq(projects.id, projectId)).returning();
  if (!project)
    return null;
  await createTransaction({
    projectId,
    fromUser: project.clientId,
    toUser: null,
    amount: String(proposal.price),
    type: "deposit",
    status: "completed"
  });
  return project;
}
async function createProposal(providerId, data) {
  const id = uuidv4();
  const [proposal] = await db.insert(proposals).values({
    id,
    projectId: data.projectId,
    providerId,
    coverLetter: data.coverLetter,
    price: Number(data.price),
    deliveryDays: data.deliveryDays
  }).returning();
  return proposal;
}
async function getProposal(id) {
  const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  if (!proposal)
    return null;
  const provider = await getUserWithProfile(proposal.providerId);
  if (!provider)
    return null;
  return { ...proposal, provider };
}
async function getProposals(filters) {
  const conditions = [];
  if (filters?.projectId) {
    conditions.push(eq(proposals.projectId, filters.projectId));
  }
  if (filters?.providerId) {
    conditions.push(eq(proposals.providerId, filters.providerId));
  }
  const proposalList = await db.select().from(proposals).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(proposals.createdAt));
  const result = [];
  for (const proposal of proposalList) {
    const provider = await getUserWithProfile(proposal.providerId);
    if (provider) {
      result.push({ ...proposal, provider });
    }
  }
  return result;
}
async function updateProposal(id, data) {
  const updateData = {};
  if (data.coverLetter !== void 0)
    updateData.coverLetter = data.coverLetter;
  if (data.price !== void 0)
    updateData.price = Number(data.price);
  if (data.deliveryDays !== void 0)
    updateData.deliveryDays = data.deliveryDays;
  const [proposal] = await db.update(proposals).set(updateData).where(eq(proposals.id, id)).returning();
  return proposal || null;
}
async function deleteProposal(id) {
  await db.delete(proposals).where(eq(proposals.id, id));
  return true;
}
async function createMessage(projectId, senderId, data) {
  const id = uuidv4();
  const [message] = await db.insert(messages).values({
    id,
    projectId,
    senderId,
    body: data.body,
    attachments: data.attachments || []
  }).returning();
  return message;
}
async function getMessages(projectId) {
  const messageList = await db.select().from(messages).where(eq(messages.projectId, projectId)).orderBy(messages.createdAt);
  const result = [];
  for (const message of messageList) {
    const sender = await getUser(message.senderId);
    if (sender) {
      result.push({ ...message, sender: sanitizeUser(sender) });
    }
  }
  return result;
}
async function createTransaction(data) {
  const id = uuidv4();
  const [transaction] = await db.insert(transactions).values({
    id,
    projectId: data.projectId,
    fromUser: data.fromUser,
    toUser: data.toUser,
    amount: Number(data.amount),
    platformFee: data.platformFee || 0,
    type: data.type,
    status: data.status || "pending",
    gatewayTxId: data.gatewayTxId || null
  }).returning();
  return transaction;
}
async function getTransactions(filters) {
  const conditions = [];
  if (filters?.projectId) {
    conditions.push(eq(transactions.projectId, filters.projectId));
  }
  if (filters?.userId) {
    conditions.push(
      or(
        eq(transactions.fromUser, filters.userId),
        eq(transactions.toUser, filters.userId)
      )
    );
  }
  return db.select().from(transactions).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(transactions.createdAt));
}
async function releasePayment(projectId, providerId) {
  const project = await getProject(projectId);
  if (!project || !project.escrowAmount)
    return null;
  const escrowAmount = Number(project.escrowAmount);
  const platformFee = escrowAmount * PLATFORM_FEE_PERCENTAGE;
  const providerAmount = escrowAmount - platformFee;
  const [transaction] = await db.insert(transactions).values({
    id: uuidv4(),
    projectId,
    fromUser: null,
    // from escrow
    toUser: providerId,
    amount: providerAmount,
    platformFee,
    type: "release",
    status: "completed"
  }).returning();
  await updateProject(projectId, { status: "completed" });
  return transaction;
}
async function createReview(projectId, authorId, targetUserId, data) {
  const id = uuidv4();
  const [review] = await db.insert(reviews).values({
    id,
    projectId,
    authorId,
    targetUserId,
    rating: data.rating,
    comment: data.comment || null
  }).returning();
  await updateUserRating(targetUserId);
  return review;
}
async function getReviews(targetUserId) {
  const reviewList = await db.select().from(reviews).where(eq(reviews.targetUserId, targetUserId)).orderBy(desc(reviews.createdAt));
  const result = [];
  for (const review of reviewList) {
    const author = await getUser(review.authorId);
    if (author) {
      result.push({ ...review, author: sanitizeUser(author) });
    }
  }
  return result;
}
async function getProjectReviews(projectId) {
  const reviewList = await db.select().from(reviews).where(eq(reviews.projectId, projectId)).orderBy(desc(reviews.createdAt));
  const result = [];
  for (const review of reviewList) {
    const author = await getUser(review.authorId);
    if (author) {
      result.push({ ...review, author: sanitizeUser(author) });
    }
  }
  return result;
}
async function updateUserRating(userId) {
  const userReviews = await db.select().from(reviews).where(eq(reviews.targetUserId, userId));
  if (userReviews.length === 0)
    return;
  const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / userReviews.length;
  await db.update(profiles).set({
    rating: averageRating,
    reviewCount: userReviews.length
  }).where(eq(profiles.userId, userId));
}
async function createDispute(openerId, data) {
  const id = uuidv4();
  const [dispute] = await db.insert(disputes).values({
    id,
    projectId: data.projectId,
    openerId,
    reason: data.reason
  }).returning();
  await updateProject(data.projectId, { status: "disputed" });
  return dispute;
}
async function getDispute(id) {
  const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
  return dispute || null;
}
async function getDisputes(filters) {
  if (filters?.status) {
    return db.select().from(disputes).where(eq(disputes.status, filters.status)).orderBy(desc(disputes.createdAt));
  }
  return db.select().from(disputes).orderBy(desc(disputes.createdAt));
}
async function updateDispute(id, data) {
  const [dispute] = await db.update(disputes).set(data).where(eq(disputes.id, id)).returning();
  return dispute || null;
}
var storage = {
  // Users
  createUser,
  getUser,
  getUserByEmail,
  updateUser,
  verifyUniversityEmail,
  // Profiles
  getProfile,
  updateProfile,
  getUserWithProfile,
  // Services
  createService,
  getService,
  getServices,
  updateService,
  deleteService,
  // Projects
  createProject,
  getProject,
  getProjects,
  updateProject,
  acceptProposal,
  // Proposals
  createProposal,
  getProposal,
  getProposals,
  updateProposal,
  deleteProposal,
  // Messages
  createMessage,
  getMessages,
  // Transactions
  createTransaction,
  getTransactions,
  releasePayment,
  // Reviews
  createReview,
  getReviews,
  getProjectReviews,
  // Disputes
  createDispute,
  getDispute,
  getDisputes,
  updateDispute
};

// server/routes.ts
var JWT_SECRET = process.env.JWT_SECRET || "skillnet-dev-secret-change-in-production";
var SALT_ROUNDS = 10;
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization token required" });
      return;
    }
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
async function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
function sanitizeUser2(user) {
  const { passwordHash, verificationCode, ...safeUser } = user;
  return safeUser;
}
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      const { password, ...userData } = parsed.data;
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }
      if (userData.role === "student" && !userData.universityEmail) {
        res.status(400).json({ error: "University email required for students" });
        return;
      }
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await storage.createUser({
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role,
        universityEmail: userData.universityEmail,
        phone: userData.phone
      });
      if (user.role === "student" && user.verificationCode) {
        console.log(`[SkillNet] Verification code for ${user.email}: ${user.verificationCode}`);
      }
      const token = generateToken(user.id);
      res.status(201).json({
        token,
        user: sanitizeUser2(user)
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const token = generateToken(user.id);
      res.json({
        token,
        user: sanitizeUser2(user)
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });
  app2.post(
    "/api/auth/verify-email",
    authMiddleware,
    async (req, res) => {
      try {
        const parsed = verifyEmailSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: parsed.error.errors[0].message });
          return;
        }
        if (req.user.role !== "student") {
          res.status(400).json({ error: "Only students can verify university email" });
          return;
        }
        if (req.user.universityVerified) {
          res.status(400).json({ error: "Email already verified" });
          return;
        }
        const user = await storage.verifyUniversityEmail(req.user.id, parsed.data.code);
        if (!user) {
          res.status(400).json({ error: "Invalid verification code" });
          return;
        }
        res.json({ user: sanitizeUser2(user) });
      } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ error: "Failed to verify email" });
      }
    }
  );
  app2.get("/api/auth/me", authMiddleware, async (req, res) => {
    res.json({ user: sanitizeUser2(req.user) });
  });
  app2.get("/api/profile", authMiddleware, async (req, res) => {
    try {
      const userWithProfile = await storage.getUserWithProfile(req.user.id);
      if (!userWithProfile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      res.json(userWithProfile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });
  app2.patch("/api/profile", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "student") {
        res.status(403).json({ error: "Only students have profiles to update" });
        return;
      }
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      const profile = await storage.updateProfile(req.user.id, parsed.data);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.get("/api/users/:userId/profile", async (req, res) => {
    try {
      const userWithProfile = await storage.getUserWithProfile(req.params.userId);
      if (!userWithProfile) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(userWithProfile);
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  });
  app2.get("/api/services", async (req, res) => {
    try {
      const filters = {
        category: req.query.category,
        providerId: req.query.providerId,
        search: req.query.search,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : void 0,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : void 0
      };
      const services2 = await storage.getServices(filters);
      res.json(services2);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ error: "Failed to get services" });
    }
  });
  app2.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        res.status(404).json({ error: "Service not found" });
        return;
      }
      res.json(service);
    } catch (error) {
      console.error("Get service error:", error);
      res.status(500).json({ error: "Failed to get service" });
    }
  });
  app2.post("/api/services", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "student") {
        res.status(403).json({ error: "Only students can create services" });
        return;
      }
      const parsed = insertServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      const service = await storage.createService(req.user.id, parsed.data);
      res.status(201).json(service);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });
  app2.patch("/api/services/:id", authMiddleware, async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        res.status(404).json({ error: "Service not found" });
        return;
      }
      if (service.providerId !== req.user.id) {
        res.status(403).json({ error: "You can only edit your own services" });
        return;
      }
      const parsed = updateServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      const updated = await storage.updateService(req.params.id, parsed.data);
      res.json(updated);
    } catch (error) {
      console.error("Update service error:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });
  app2.delete("/api/services/:id", authMiddleware, async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        res.status(404).json({ error: "Service not found" });
        return;
      }
      if (service.providerId !== req.user.id) {
        res.status(403).json({ error: "You can only delete your own services" });
        return;
      }
      await storage.deleteService(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });
  app2.post("/api/services/:id/request", authMiddleware, async (req, res) => {
    try {
      console.log("[Service Request] Starting request for service:", req.params.id);
      console.log("[Service Request] User:", req.user?.id, "Role:", req.user?.role);
      if (req.user.role !== "client") {
        console.log("[Service Request] Rejected: User is not a client");
        res.status(403).json({ error: "Only clients can request services" });
        return;
      }
      console.log("[Service Request] Fetching service...");
      const service = await storage.getService(req.params.id);
      if (!service) {
        console.log("[Service Request] Service not found:", req.params.id);
        res.status(404).json({ error: "Service not found" });
        return;
      }
      console.log("[Service Request] Service found:", service.title, "Provider:", service.providerId);
      const { tier, requirements, customBudget } = req.body;
      console.log("[Service Request] Request data - Tier:", tier, "Requirements length:", requirements?.length);
      if (!tier || !requirements) {
        console.log("[Service Request] Missing tier or requirements");
        res.status(400).json({ error: "Tier and requirements are required" });
        return;
      }
      if (requirements.length < 20) {
        console.log("[Service Request] Requirements too short:", requirements.length);
        res.status(400).json({ error: "Please provide more detail about your requirements (at least 20 characters)" });
        return;
      }
      let price;
      switch (tier) {
        case "basic":
          price = service.priceBasic || 0;
          break;
        case "standard":
          price = service.priceStandard || 0;
          break;
        case "premium":
          price = service.pricePremium || 0;
          break;
        default:
          console.log("[Service Request] Invalid tier:", tier);
          res.status(400).json({ error: "Invalid tier selected" });
          return;
      }
      console.log("[Service Request] Price for tier", tier, ":", price);
      if (price === 0) {
        console.log("[Service Request] Tier not available (price is 0)");
        res.status(400).json({ error: "Selected tier is not available for this service" });
        return;
      }
      const baseDelivery = service.deliveryDays || 7;
      let deliveryDays;
      switch (tier) {
        case "basic":
          deliveryDays = baseDelivery;
          break;
        case "standard":
          deliveryDays = Math.ceil(baseDelivery * 1.5);
          break;
        case "premium":
          deliveryDays = baseDelivery * 2;
          break;
        default:
          deliveryDays = baseDelivery;
      }
      console.log("[Service Request] Delivery days:", deliveryDays);
      const budgetAmount = customBudget || price;
      console.log("[Service Request] Budget amount:", budgetAmount);
      console.log("[Service Request] Creating project...");
      let project;
      try {
        project = await storage.createProject(req.user.id, {
          title: `Service Request: ${service.title}`,
          description: `**Service Requested:** ${service.title}
**Tier:** ${tier.charAt(0).toUpperCase() + tier.slice(1)}
**Listed Price:** $${price}

---

**Client Requirements:**
${requirements}`,
          budgetMin: budgetAmount,
          budgetMax: budgetAmount
        });
        console.log("[Service Request] Project created:", project.id);
      } catch (projectError) {
        console.error("[Service Request] Failed to create project:", projectError);
        res.status(500).json({ error: "Failed to create project" });
        return;
      }
      console.log("[Service Request] Creating proposal from provider:", service.providerId);
      let proposal;
      try {
        proposal = await storage.createProposal(service.providerId, {
          projectId: project.id,
          coverLetter: `This is an automatic proposal for the "${service.title}" service you requested.

**Tier:** ${tier.charAt(0).toUpperCase() + tier.slice(1)}
**Price:** $${price}
**Estimated Delivery:** ${deliveryDays} days

I'll review your requirements and follow up shortly. Feel free to message me with any questions!`,
          price,
          deliveryDays
        });
        console.log("[Service Request] Proposal created:", proposal.id);
      } catch (proposalError) {
        console.error("[Service Request] Failed to create proposal:", proposalError);
        res.status(500).json({ error: "Failed to create proposal" });
        return;
      }
      console.log("[Service Request] Fetching project details...");
      let projectWithDetails;
      try {
        projectWithDetails = await storage.getProject(project.id);
        if (!projectWithDetails) {
          console.error("[Service Request] Project not found after creation:", project.id);
          res.status(500).json({ error: "Failed to retrieve created project" });
          return;
        }
        console.log("[Service Request] Project details fetched successfully");
      } catch (fetchError) {
        console.error("[Service Request] Failed to fetch project details:", fetchError);
        res.status(500).json({ error: "Failed to retrieve project details" });
        return;
      }
      console.log("[Service Request] Success! Returning response");
      res.status(201).json({
        project: projectWithDetails,
        proposal,
        message: "Service request created successfully"
      });
      return;
    } catch (error) {
      console.error("[Service Request] Unhandled error:", error);
      res.status(500).json({ error: "Failed to request service" });
    }
  });
  app2.get("/api/projects", authMiddleware, async (req, res) => {
    try {
      const filters = {};
      if (req.query.status === "open") {
        filters.status = "open";
      } else if (req.user.role === "client") {
        filters.clientId = req.user.id;
        if (req.query.status)
          filters.status = req.query.status;
      } else if (req.user.role === "student") {
        filters.providerId = req.user.id;
        if (req.query.status)
          filters.status = req.query.status;
      }
      const projects2 = await storage.getProjects(filters);
      res.json(projects2);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ error: "Failed to get projects" });
    }
  });
  app2.get("/api/projects/:id", authMiddleware, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({ error: "Failed to get project" });
    }
  });
  app2.post("/api/projects", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "client") {
        res.status(403).json({ error: "Only clients can create projects" });
        return;
      }
      const parsed = insertProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      const project = await storage.createProject(req.user.id, parsed.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });
  app2.patch("/api/projects/:id", authMiddleware, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      const isClient = project.clientId === req.user.id;
      const isAcceptedProvider = project.acceptedProposal?.providerId === req.user.id;
      if (!isClient && !isAcceptedProvider) {
        res.status(403).json({ error: "Not authorized to update this project" });
        return;
      }
      const parsed = updateProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      if (parsed.data.status) {
        const currentStatus = project.status;
        const newStatus = parsed.data.status;
        if (newStatus === "delivered" && !isAcceptedProvider) {
          res.status(403).json({ error: "Only the accepted provider can mark as delivered" });
          return;
        }
        if (newStatus === "completed" && !isClient) {
          res.status(403).json({ error: "Only the client can complete the project" });
          return;
        }
      }
      const updated = await storage.updateProject(req.params.id, parsed.data);
      res.json(updated);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });
  app2.post(
    "/api/projects/:id/accept",
    authMiddleware,
    async (req, res) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }
        if (project.clientId !== req.user.id) {
          res.status(403).json({ error: "Only the project owner can accept proposals" });
          return;
        }
        if (project.status !== "open") {
          res.status(400).json({ error: "Project is not open for proposals" });
          return;
        }
        const { proposalId } = req.body;
        if (!proposalId) {
          res.status(400).json({ error: "Proposal ID is required" });
          return;
        }
        const proposal = await storage.getProposal(proposalId);
        if (!proposal || proposal.projectId !== req.params.id) {
          res.status(400).json({ error: "Invalid proposal" });
          return;
        }
        const updated = await storage.acceptProposal(req.params.id, proposalId);
        res.json(updated);
      } catch (error) {
        console.error("Accept proposal error:", error);
        res.status(500).json({ error: "Failed to accept proposal" });
      }
    }
  );
  app2.get(
    "/api/projects/:id/messages",
    authMiddleware,
    async (req, res) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }
        const isClient = project.clientId === req.user.id;
        const hasProposal = project.proposals.some(
          (p) => p.providerId === req.user.id
        );
        if (!isClient && !hasProposal) {
          res.status(403).json({ error: "Not authorized to view messages" });
          return;
        }
        const messages2 = await storage.getMessages(req.params.id);
        res.json(messages2);
      } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ error: "Failed to get messages" });
      }
    }
  );
  app2.post(
    "/api/projects/:id/messages",
    authMiddleware,
    async (req, res) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }
        const isClient = project.clientId === req.user.id;
        const hasProposal = project.proposals.some(
          (p) => p.providerId === req.user.id
        );
        if (!isClient && !hasProposal) {
          res.status(403).json({ error: "Not authorized to send messages" });
          return;
        }
        const parsed = insertMessageSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: parsed.error.errors[0].message });
          return;
        }
        const message = await storage.createMessage(
          req.params.id,
          req.user.id,
          parsed.data
        );
        res.status(201).json(message);
      } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  );
  app2.post(
    "/api/projects/:id/review",
    authMiddleware,
    async (req, res) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }
        if (project.status !== "completed" && project.status !== "delivered") {
          res.status(400).json({ error: "Can only review completed projects" });
          return;
        }
        const isClient = project.clientId === req.user.id;
        const isProvider = project.acceptedProposal?.providerId === req.user.id;
        if (!isClient && !isProvider) {
          res.status(403).json({ error: "Only project participants can review" });
          return;
        }
        let targetUserId;
        if (isClient) {
          if (!project.acceptedProposal) {
            res.status(400).json({ error: "No provider to review" });
            return;
          }
          targetUserId = project.acceptedProposal.providerId;
        } else {
          targetUserId = project.clientId;
        }
        const existingReviews = await storage.getProjectReviews(req.params.id);
        const alreadyReviewed = existingReviews.some(
          (r) => r.authorId === req.user.id
        );
        if (alreadyReviewed) {
          res.status(400).json({ error: "You have already reviewed this project" });
          return;
        }
        const parsed = insertReviewSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: parsed.error.errors[0].message });
          return;
        }
        const review = await storage.createReview(
          req.params.id,
          req.user.id,
          targetUserId,
          parsed.data
        );
        res.status(201).json(review);
      } catch (error) {
        console.error("Create review error:", error);
        res.status(500).json({ error: "Failed to create review" });
      }
    }
  );
  app2.get(
    "/api/projects/:id/reviews",
    async (req, res) => {
      try {
        const reviews2 = await storage.getProjectReviews(req.params.id);
        res.json(reviews2);
      } catch (error) {
        console.error("Get project reviews error:", error);
        res.status(500).json({ error: "Failed to get reviews" });
      }
    }
  );
  app2.get("/api/proposals", authMiddleware, async (req, res) => {
    try {
      const filters = {
        projectId: req.query.projectId,
        providerId: req.query.providerId
      };
      const proposals2 = await storage.getProposals(filters);
      res.json(proposals2);
    } catch (error) {
      console.error("Get proposals error:", error);
      res.status(500).json({ error: "Failed to get proposals" });
    }
  });
  app2.get("/api/proposals/:id", authMiddleware, async (req, res) => {
    try {
      const proposal = await storage.getProposal(req.params.id);
      if (!proposal) {
        res.status(404).json({ error: "Proposal not found" });
        return;
      }
      res.json(proposal);
    } catch (error) {
      console.error("Get proposal error:", error);
      res.status(500).json({ error: "Failed to get proposal" });
    }
  });
  app2.post("/api/proposals", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "student") {
        res.status(403).json({ error: "Only students can submit proposals" });
        return;
      }
      const parsed = insertProposalSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      const project = await storage.getProject(parsed.data.projectId);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      if (project.status !== "open") {
        res.status(400).json({ error: "Project is not accepting proposals" });
        return;
      }
      const existingProposals = await storage.getProposals({
        projectId: parsed.data.projectId,
        providerId: req.user.id
      });
      if (existingProposals.length > 0) {
        res.status(400).json({ error: "You have already submitted a proposal" });
        return;
      }
      const proposal = await storage.createProposal(req.user.id, parsed.data);
      res.status(201).json(proposal);
    } catch (error) {
      console.error("Create proposal error:", error);
      res.status(500).json({ error: "Failed to create proposal" });
    }
  });
  app2.patch(
    "/api/proposals/:id",
    authMiddleware,
    async (req, res) => {
      try {
        const proposal = await storage.getProposal(req.params.id);
        if (!proposal) {
          res.status(404).json({ error: "Proposal not found" });
          return;
        }
        if (proposal.providerId !== req.user.id) {
          res.status(403).json({ error: "You can only edit your own proposals" });
          return;
        }
        const project = await storage.getProject(proposal.projectId);
        if (!project || project.status !== "open") {
          res.status(400).json({ error: "Cannot edit proposal for non-open project" });
          return;
        }
        const parsed = updateProposalSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: parsed.error.errors[0].message });
          return;
        }
        const updated = await storage.updateProposal(req.params.id, parsed.data);
        res.json(updated);
      } catch (error) {
        console.error("Update proposal error:", error);
        res.status(500).json({ error: "Failed to update proposal" });
      }
    }
  );
  app2.delete(
    "/api/proposals/:id",
    authMiddleware,
    async (req, res) => {
      try {
        const proposal = await storage.getProposal(req.params.id);
        if (!proposal) {
          res.status(404).json({ error: "Proposal not found" });
          return;
        }
        if (proposal.providerId !== req.user.id) {
          res.status(403).json({ error: "You can only delete your own proposals" });
          return;
        }
        const project = await storage.getProject(proposal.projectId);
        if (!project || project.status !== "open") {
          res.status(400).json({ error: "Cannot delete proposal for non-open project" });
          return;
        }
        await storage.deleteProposal(req.params.id);
        res.json({ success: true });
      } catch (error) {
        console.error("Delete proposal error:", error);
        res.status(500).json({ error: "Failed to delete proposal" });
      }
    }
  );
  app2.post(
    "/api/payments/release",
    authMiddleware,
    async (req, res) => {
      try {
        const { projectId } = req.body;
        if (!projectId) {
          res.status(400).json({ error: "Project ID is required" });
          return;
        }
        const project = await storage.getProject(projectId);
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }
        if (project.clientId !== req.user.id) {
          res.status(403).json({ error: "Only the client can release payment" });
          return;
        }
        if (project.status !== "delivered") {
          res.status(400).json({ error: "Project must be delivered before releasing payment" });
          return;
        }
        if (!project.acceptedProposal) {
          res.status(400).json({ error: "No accepted proposal" });
          return;
        }
        const transaction = await storage.releasePayment(
          projectId,
          project.acceptedProposal.providerId
        );
        if (!transaction) {
          res.status(500).json({ error: "Failed to release payment" });
          return;
        }
        res.json(transaction);
      } catch (error) {
        console.error("Release payment error:", error);
        res.status(500).json({ error: "Failed to release payment" });
      }
    }
  );
  app2.get(
    "/api/payments/transactions",
    authMiddleware,
    async (req, res) => {
      try {
        const filters = {
          projectId: req.query.projectId,
          userId: req.user.id
        };
        const transactions2 = await storage.getTransactions(filters);
        res.json(transactions2);
      } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({ error: "Failed to get transactions" });
      }
    }
  );
  app2.post("/api/disputes", authMiddleware, async (req, res) => {
    try {
      const parsed = insertDisputeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }
      const project = await storage.getProject(parsed.data.projectId);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
      const isClient = project.clientId === req.user.id;
      const isProvider = project.acceptedProposal?.providerId === req.user.id;
      if (!isClient && !isProvider) {
        res.status(403).json({ error: "Only project participants can open disputes" });
        return;
      }
      if (project.status === "completed" || project.status === "cancelled") {
        res.status(400).json({ error: "Cannot dispute completed or cancelled projects" });
        return;
      }
      const dispute = await storage.createDispute(req.user.id, parsed.data);
      res.status(201).json(dispute);
    } catch (error) {
      console.error("Create dispute error:", error);
      res.status(500).json({ error: "Failed to create dispute" });
    }
  });
  app2.get(
    "/api/disputes",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
      try {
        const filters = {
          status: req.query.status
        };
        const disputes2 = await storage.getDisputes(filters);
        res.json(disputes2);
      } catch (error) {
        console.error("Get disputes error:", error);
        res.status(500).json({ error: "Failed to get disputes" });
      }
    }
  );
  app2.get(
    "/api/disputes/:id",
    authMiddleware,
    async (req, res) => {
      try {
        const dispute = await storage.getDispute(req.params.id);
        if (!dispute) {
          res.status(404).json({ error: "Dispute not found" });
          return;
        }
        const project = await storage.getProject(dispute.projectId);
        const isAdmin = req.user.role === "admin";
        const isOpener = dispute.openerId === req.user.id;
        const isClient = project?.clientId === req.user.id;
        const isProvider = project?.acceptedProposal?.providerId === req.user.id;
        if (!isAdmin && !isOpener && !isClient && !isProvider) {
          res.status(403).json({ error: "Not authorized to view this dispute" });
          return;
        }
        res.json(dispute);
      } catch (error) {
        console.error("Get dispute error:", error);
        res.status(500).json({ error: "Failed to get dispute" });
      }
    }
  );
  app2.patch(
    "/api/disputes/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
      try {
        const parsed = updateDisputeSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: parsed.error.errors[0].message });
          return;
        }
        const dispute = await storage.updateDispute(req.params.id, parsed.data);
        if (!dispute) {
          res.status(404).json({ error: "Dispute not found" });
          return;
        }
        res.json(dispute);
      } catch (error) {
        console.error("Update dispute error:", error);
        res.status(500).json({ error: "Failed to update dispute" });
      }
    }
  );
  app2.get("/api/users/:userId/reviews", async (req, res) => {
    try {
      const reviews2 = await storage.getReviews(req.params.userId);
      res.json(reviews2);
    } catch (error) {
      console.error("Get user reviews error:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });
  app2.get("/api/categories", async (_req, res) => {
    const categories = [
      "Web Development",
      "Mobile Development",
      "Graphic Design",
      "Writing & Translation",
      "Video & Animation",
      "Music & Audio",
      "Digital Marketing",
      "Data Science",
      "Tutoring",
      "Other"
    ];
    res.json(categories);
  });
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
}

// server/vercel-handler.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
registerRoutes(app);
var vercel_handler_default = app;
export {
  vercel_handler_default as default
};
