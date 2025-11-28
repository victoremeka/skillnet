import { eq, and, or, desc, sql, like, lt } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  profiles,
  services,
  projects,
  proposals,
  messages,
  transactions,
  reviews,
  disputes,
  serviceRequests,
  notifications,
  type User,
  type SafeUser,
  type Profile,
  type Service,
  type ServiceWithProvider,
  type Project,
  type ProjectWithDetails,
  type Proposal,
  type ProposalWithProvider,
  type Message,
  type MessageWithSender,
  type Transaction,
  type Review,
  type ReviewWithAuthor,
  type Dispute,
  type InsertProfile,
  type UpdateProfile,
  type InsertService,
  type UpdateService,
  type InsertProject,
  type UpdateProject,
  type InsertProposal,
  type InsertMessage,
  type InsertReview,
  type InsertDispute,
  type UpdateDispute,
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

// Platform fee percentage (10%)
const PLATFORM_FEE_PERCENTAGE = 0.10;

// Helper to remove sensitive fields from user objects
function sanitizeUser(user: User): SafeUser {
  const { passwordHash, verificationCode, ...safeUser } = user;
  return safeUser;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: "student" | "client" | "admin";
  universityEmail?: string | null;
  phone?: string | null;
}): Promise<User> {
  const id = uuidv4();
  const verificationCode = data.role === "student" ? generateVerificationCode() : null;

  const [user] = await db
    .insert(users)
    .values({
      id,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      universityEmail: data.universityEmail || null,
      verificationCode,
      phone: data.phone || null,
    })
    .returning();

  // Create profile for students
  if (data.role === "student") {
    await db.insert(profiles).values({
      id: uuidv4(),
      userId: id,
    });
  }

  return user;
}

export async function getUser(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user || null;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  const [user] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return user || null;
}

export async function verifyUniversityEmail(userId: string, code: string): Promise<User | null> {
  const user = await getUser(userId);
  if (!user || user.verificationCode !== code) {
    return null;
  }

  const [updated] = await db
    .update(users)
    .set({
      universityVerified: true,
      verificationCode: null,
    })
    .where(eq(users.id, userId))
    .returning();

  return updated || null;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================================================
// PROFILE OPERATIONS
// ============================================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile || null;
}

export async function updateProfile(
  userId: string,
  data: UpdateProfile
): Promise<Profile | null> {
  const [profile] = await db
    .update(profiles)
    .set(data as any)
    .where(eq(profiles.userId, userId))
    .returning();
  return profile || null;
}

export async function getUserWithProfile(
  userId: string
): Promise<(SafeUser & { profile: Profile | null }) | null> {
  const user = await getUser(userId);
  if (!user) return null;

  const profile = await getProfile(userId);
  return { ...sanitizeUser(user), profile };
}

// ============================================================================
// SERVICE OPERATIONS
// ============================================================================

export async function createService(
  providerId: string,
  data: InsertService
): Promise<Service> {
  const id = uuidv4();

  const [service] = await db
    .insert(services)
    .values({
      id,
      providerId,
      title: data.title,
      description: data.description,
      category: data.category,
      priceBasic: data.priceBasic ? Number(data.priceBasic) : null,
      priceStandard: data.priceStandard ? Number(data.priceStandard) : null,
      pricePremium: data.pricePremium ? Number(data.pricePremium) : null,
      descriptionBasic: data.descriptionBasic || null,
      descriptionStandard: data.descriptionStandard || null,
      descriptionPremium: data.descriptionPremium || null,
      deliveryDays: data.deliveryDays || null,
      sampleUrls: (data.sampleUrls || []) as string[],
    })
    .returning();

  return service;
}

export async function getService(id: string): Promise<ServiceWithProvider | null> {
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!service) return null;

  const provider = await getUserWithProfile(service.providerId);
  if (!provider) return null;

  return { ...service, provider };
}

export async function getServices(filters?: {
  category?: string;
  providerId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<ServiceWithProvider[]> {
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
    query = query.where(and(...conditions)) as typeof query;
  }

  const serviceList = await query.orderBy(desc(services.createdAt));

  // Get providers for all services
  const result: ServiceWithProvider[] = [];
  for (const service of serviceList) {
    const provider = await getUserWithProfile(service.providerId);
    if (provider) {
      // Apply price filters after fetching
      if (filters?.minPrice && service.priceBasic) {
        if (Number(service.priceBasic) < filters.minPrice) continue;
      }
      if (filters?.maxPrice && service.priceBasic) {
        if (Number(service.priceBasic) > filters.maxPrice) continue;
      }
      result.push({ ...service, provider });
    }
  }

  return result;
}

export async function updateService(
  id: string,
  data: Partial<InsertService>
): Promise<Service | null> {
  const updateData: Record<string, any> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.priceBasic !== undefined) updateData.priceBasic = data.priceBasic ? Number(data.priceBasic) : null;
  if (data.priceStandard !== undefined) updateData.priceStandard = data.priceStandard ? Number(data.priceStandard) : null;
  if (data.pricePremium !== undefined) updateData.pricePremium = data.pricePremium ? Number(data.pricePremium) : null;
  if (data.descriptionBasic !== undefined) updateData.descriptionBasic = data.descriptionBasic || null;
  if (data.descriptionStandard !== undefined) updateData.descriptionStandard = data.descriptionStandard || null;
  if (data.descriptionPremium !== undefined) updateData.descriptionPremium = data.descriptionPremium || null;
  if (data.deliveryDays !== undefined) updateData.deliveryDays = data.deliveryDays;
  if (data.sampleUrls !== undefined) updateData.sampleUrls = data.sampleUrls;

  const [service] = await db
    .update(services)
    .set(updateData)
    .where(eq(services.id, id))
    .returning();

  return service || null;
}

export async function deleteService(id: string): Promise<boolean> {
  const result = await db.delete(services).where(eq(services.id, id));
  return true;
}

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export async function createProject(
  clientId: string,
  data: InsertProject
): Promise<Project> {
  const id = uuidv4();

  const [project] = await db
    .insert(projects)
    .values({
      id,
      clientId,
      title: data.title,
      description: data.description,
      budgetMin: data.budgetMin ? Number(data.budgetMin) : null,
      budgetMax: data.budgetMax ? Number(data.budgetMax) : null,
    })
    .returning();

  return project;
}

export async function getProject(id: string): Promise<ProjectWithDetails | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) return null;

  const client = await getUser(project.clientId);
  if (!client) return null;

  const proposalList = await getProposals({ projectId: id });

  let acceptedProposal: ProposalWithProvider | null = null;
  if (project.acceptedProposalId) {
    acceptedProposal = await getProposal(project.acceptedProposalId);
  }

  return {
    ...project,
    client: sanitizeUser(client),
    proposals: proposalList,
    acceptedProposal,
  };
}

export async function getProjects(filters?: {
  clientId?: string;
  providerId?: string;
  status?: string;
}): Promise<ProjectWithDetails[]> {
  let projectList: Project[];

  if (filters?.providerId) {
    // Get projects where the provider has a proposal
    const providerProposals = await db
      .select()
      .from(proposals)
      .where(eq(proposals.providerId, filters.providerId));

    const projectIds = [...new Set(providerProposals.map((p) => p.projectId))];

    if (projectIds.length === 0) return [];

    // Fetch all projects and filter in memory for SQLite compatibility
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

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
      conditions.push(eq(projects.status, filters.status as typeof projects.status.enumValues[number]));
    }

    projectList = await db
      .select()
      .from(projects)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(projects.createdAt));
  }

  const result: ProjectWithDetails[] = [];
  for (const project of projectList) {
    const details = await getProject(project.id);
    if (details) result.push(details);
  }

  return result;
}

export async function updateProject(
  id: string,
  data: UpdateProject
): Promise<Project | null> {
  const [project] = await db
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning();

  return project || null;
}

export async function acceptProposal(
  projectId: string,
  proposalId: string
): Promise<Project | null> {
  const proposal = await getProposal(proposalId);
  if (!proposal) return null;

  const [project] = await db
    .update(projects)
    .set({
      acceptedProposalId: proposalId,
      status: "in_progress",
      escrowAmount: Number(proposal.price),
    })
    .where(eq(projects.id, projectId))
    .returning();

  if (!project) return null;

  // Create deposit transaction
  await createTransaction({
    projectId,
    fromUser: project.clientId,
    toUser: null,
    amount: String(proposal.price),
    type: "deposit",
    status: "completed",
  });

  return project;
}

// ============================================================================
// PROPOSAL OPERATIONS
// ============================================================================

export async function createProposal(
  providerId: string,
  data: InsertProposal
): Promise<Proposal> {
  const id = uuidv4();

  const [proposal] = await db
    .insert(proposals)
    .values({
      id,
      projectId: data.projectId,
      providerId,
      coverLetter: data.coverLetter,
      price: Number(data.price),
      deliveryDays: data.deliveryDays,
    })
    .returning();

  return proposal;
}

export async function getProposal(id: string): Promise<ProposalWithProvider | null> {
  const [proposal] = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, id))
    .limit(1);

  if (!proposal) return null;

  const provider = await getUserWithProfile(proposal.providerId);
  if (!provider) return null;

  return { ...proposal, provider };
}

export async function getProposals(filters?: {
  projectId?: string;
  providerId?: string;
}): Promise<ProposalWithProvider[]> {
  const conditions = [];

  if (filters?.projectId) {
    conditions.push(eq(proposals.projectId, filters.projectId));
  }

  if (filters?.providerId) {
    conditions.push(eq(proposals.providerId, filters.providerId));
  }

  const proposalList = await db
    .select()
    .from(proposals)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(proposals.createdAt));

  const result: ProposalWithProvider[] = [];
  for (const proposal of proposalList) {
    const provider = await getUserWithProfile(proposal.providerId);
    if (provider) {
      result.push({ ...proposal, provider });
    }
  }

  return result;
}

export async function updateProposal(
  id: string,
  data: Partial<InsertProposal>
): Promise<Proposal | null> {
  const updateData: Record<string, any> = {};

  if (data.coverLetter !== undefined) updateData.coverLetter = data.coverLetter;
  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.deliveryDays !== undefined) updateData.deliveryDays = data.deliveryDays;

  const [proposal] = await db
    .update(proposals)
    .set(updateData)
    .where(eq(proposals.id, id))
    .returning();

  return proposal || null;
}

export async function deleteProposal(id: string): Promise<boolean> {
  await db.delete(proposals).where(eq(proposals.id, id));
  return true;
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

export async function createMessage(
  projectId: string,
  senderId: string,
  data: InsertMessage
): Promise<Message> {
  const id = uuidv4();

  const [message] = await db
    .insert(messages)
    .values({
      id,
      projectId,
      senderId,
      body: data.body,
      attachments: data.attachments || [],
    })
    .returning();

  return message;
}

export async function getMessages(projectId: string): Promise<MessageWithSender[]> {
  const messageList = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, projectId))
    .orderBy(messages.createdAt);

  const result: MessageWithSender[] = [];
  for (const message of messageList) {
    const sender = await getUser(message.senderId);
    if (sender) {
      result.push({ ...message, sender: sanitizeUser(sender) });
    }
  }

  return result;
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

export async function createTransaction(data: {
  projectId: string;
  fromUser: string | null;
  toUser: string | null;
  amount: string;
  platformFee?: number;
  type: "deposit" | "release" | "withdrawal";
  status?: "pending" | "completed" | "failed";
  gatewayTxId?: string | null;
}): Promise<Transaction> {
  const id = uuidv4();

  const [transaction] = await db
    .insert(transactions)
    .values({
      id,
      projectId: data.projectId,
      fromUser: data.fromUser,
      toUser: data.toUser,
      amount: Number(data.amount),
      platformFee: data.platformFee || 0,
      type: data.type,
      status: data.status || "pending",
      gatewayTxId: data.gatewayTxId || null,
    })
    .returning();

  return transaction;
}

// ============================================================================
// SERVICE REQUESTS & NOTIFICATIONS
// ============================================================================

export async function createServiceRequest(
  clientId: string,
  data: {
    serviceId: string;
    providerId: string;
    tier?: string | null;
    requirements: string;
    price?: number | null;
    deliveryDays?: number | null;
    expiresAt?: Date | null;
  }
): Promise<any> {
  const id = uuidv4();
  const expires = data.expiresAt ? Math.floor(data.expiresAt.getTime() / 1000) : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

  const [req] = await db
    .insert(serviceRequests)
    .values({
      id,
      serviceId: data.serviceId,
      clientId,
      providerId: data.providerId,
      tier: data.tier || null,
      requirements: data.requirements,
      price: data.price ?? null,
      deliveryDays: data.deliveryDays ?? null,
      expiresAt: new Date(expires * 1000),
    })
    .returning();

  return req;
}

export async function getServiceRequests(filters?: {
  userId?: string; // either provider or client
  role?: "provider" | "client";
  status?: string;
}): Promise<any[]> {
  // Expire old requests on read
  const now = new Date();
  await db
    .update(serviceRequests)
    .set({ status: "expired" })
    .where(
      and(
        lt(serviceRequests.expiresAt, now),
        eq(serviceRequests.status, "pending")
      )
    );

  const conditions: any[] = [];
  if (filters?.userId && filters?.role === "provider") {
    conditions.push(eq(serviceRequests.providerId, filters.userId));
  }
  if (filters?.userId && filters?.role === "client") {
    conditions.push(eq(serviceRequests.clientId, filters.userId));
  }
  if (filters?.status) {
    conditions.push(eq(serviceRequests.status, filters.status as any));
  }

  const list = await db.select().from(serviceRequests).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(serviceRequests.createdAt));
  return list;
}

export async function updateServiceRequest(id: string, data: Partial<any>): Promise<any | null> {
  const [updated] = await db.update(serviceRequests).set(data as any).where(eq(serviceRequests.id, id)).returning();
  return updated || null;
}

export async function createNotification(userId: string, data: { type?: string; title: string; message: string; linkUrl?: string | null; }): Promise<any> {
  const id = uuidv4();
  const [n] = await db.insert(notifications).values({ id, userId, type: data.type || null, title: data.title, message: data.message, linkUrl: data.linkUrl || null }).returning();
  return n;
}

export async function getNotifications(userId: string): Promise<any[]> {
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(id: string): Promise<boolean> {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  return true;
}

export async function getTransactions(filters?: {
  projectId?: string;
  userId?: string;
}): Promise<Transaction[]> {
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

  return db
    .select()
    .from(transactions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.createdAt));
}

export async function releasePayment(
  projectId: string,
  providerId: string
): Promise<Transaction | null> {
  const project = await getProject(projectId);
  if (!project || !project.escrowAmount) return null;

  const escrowAmount = Number(project.escrowAmount);
  const platformFee = escrowAmount * PLATFORM_FEE_PERCENTAGE;
  const providerAmount = escrowAmount - platformFee;

  const [transaction] = await db
    .insert(transactions)
    .values({
      id: uuidv4(),
      projectId,
      fromUser: null, // from escrow
      toUser: providerId,
      amount: providerAmount,
      platformFee: platformFee,
      type: "release",
      status: "completed",
    })
    .returning();

  // Update project status
  await updateProject(projectId, { status: "completed" });

  return transaction;
}

// ============================================================================
// REVIEW OPERATIONS
// ============================================================================

export async function createReview(
  projectId: string,
  authorId: string,
  targetUserId: string,
  data: InsertReview
): Promise<Review> {
  const id = uuidv4();

  const [review] = await db
    .insert(reviews)
    .values({
      id,
      projectId,
      authorId,
      targetUserId,
      rating: data.rating,
      comment: data.comment || null,
    })
    .returning();

  // Update target user's profile rating
  await updateUserRating(targetUserId);

  return review;
}

export async function getReviews(targetUserId: string): Promise<ReviewWithAuthor[]> {
  const reviewList = await db
    .select()
    .from(reviews)
    .where(eq(reviews.targetUserId, targetUserId))
    .orderBy(desc(reviews.createdAt));

  const result: ReviewWithAuthor[] = [];
  for (const review of reviewList) {
    const author = await getUser(review.authorId);
    if (author) {
      result.push({ ...review, author: sanitizeUser(author) });
    }
  }

  return result;
}

export async function getProjectReviews(projectId: string): Promise<ReviewWithAuthor[]> {
  const reviewList = await db
    .select()
    .from(reviews)
    .where(eq(reviews.projectId, projectId))
    .orderBy(desc(reviews.createdAt));

  const result: ReviewWithAuthor[] = [];
  for (const review of reviewList) {
    const author = await getUser(review.authorId);
    if (author) {
      result.push({ ...review, author: sanitizeUser(author) });
    }
  }

  return result;
}

async function updateUserRating(userId: string): Promise<void> {
  const userReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.targetUserId, userId));

  if (userReviews.length === 0) return;

  const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / userReviews.length;

  await db
    .update(profiles)
    .set({
      rating: averageRating,
      reviewCount: userReviews.length,
    })
    .where(eq(profiles.userId, userId));
}

// ============================================================================
// DISPUTE OPERATIONS
// ============================================================================

export async function createDispute(
  openerId: string,
  data: InsertDispute
): Promise<Dispute> {
  const id = uuidv4();

  const [dispute] = await db
    .insert(disputes)
    .values({
      id,
      projectId: data.projectId,
      openerId,
      reason: data.reason,
    })
    .returning();

  // Update project status
  await updateProject(data.projectId, { status: "disputed" });

  return dispute;
}

export async function getDispute(id: string): Promise<Dispute | null> {
  const [dispute] = await db
    .select()
    .from(disputes)
    .where(eq(disputes.id, id))
    .limit(1);

  return dispute || null;
}

export async function getDisputes(filters?: {
  status?: string;
}): Promise<Dispute[]> {
  if (filters?.status) {
    return db
      .select()
      .from(disputes)
      .where(eq(disputes.status, filters.status as typeof disputes.status.enumValues[number]))
      .orderBy(desc(disputes.createdAt));
  }

  return db.select().from(disputes).orderBy(desc(disputes.createdAt));
}

export async function updateDispute(
  id: string,
  data: UpdateDispute
): Promise<Dispute | null> {
  const [dispute] = await db
    .update(disputes)
    .set(data)
    .where(eq(disputes.id, id))
    .returning();

  return dispute || null;
}

// ============================================================================
// STORAGE INTERFACE (for potential mock implementations)
// ============================================================================

export const storage = {
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

  // Service Requests
  createServiceRequest,
  getServiceRequests,
  updateServiceRequest,

  // Notifications
  createNotification,
  getNotifications,
  markNotificationRead,

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
  updateDispute,
};

export default storage;