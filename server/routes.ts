import { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import {
  insertUserSchema,
  loginSchema,
  verifyEmailSchema,
  updateProfileSchema,
  insertServiceSchema,
  updateServiceSchema,
  insertProjectSchema,
  updateProjectSchema,
  insertProposalSchema,
  updateProposalSchema,
  insertMessageSchema,
  insertReviewSchema,
  insertDisputeSchema,
  updateDisputeSchema,
  type User,
  type SafeUser,
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "skillnet-dev-secret-change-in-production";
const SALT_ROUNDS = 10;

// Extended Request type with user
interface AuthRequest extends Request {
  user?: User;
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization token required" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

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

// Optional auth - doesn't fail if no token
async function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
}

// Admin only middleware
async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

// Helper to sanitize user for response
function sanitizeUser(user: User): SafeUser {
  const { passwordHash, verificationCode, ...safeUser } = user;
  return safeUser;
}

// Helper to generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

export function registerRoutes(app: Express): void {
  // ==========================================================================
  // AUTHENTICATION ROUTES
  // ==========================================================================

  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { password, ...userData } = parsed.data;

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }

      // Validate student requires university email
      if (userData.role === "student" && !userData.universityEmail) {
        res.status(400).json({ error: "University email required for students" });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await storage.createUser({
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role as "student" | "client" | "admin",
        universityEmail: userData.universityEmail,
        phone: userData.phone,
      });

      // Log verification code for students (mock email)
      if (user.role === "student" && user.verificationCode) {
        console.log(`[SkillNet] Verification code for ${user.email}: ${user.verificationCode}`);
      }

      const token = generateToken(user.id);

      res.status(201).json({
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
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
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Verify university email
  app.post(
    "/api/auth/verify-email",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const parsed = verifyEmailSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: parsed.error.errors[0].message });
          return;
        }

        if (req.user!.role !== "student") {
          res.status(400).json({ error: "Only students can verify university email" });
          return;
        }

        if (req.user!.universityVerified) {
          res.status(400).json({ error: "Email already verified" });
          return;
        }

        const user = await storage.verifyUniversityEmail(req.user!.id, parsed.data.code);
        if (!user) {
          res.status(400).json({ error: "Invalid verification code" });
          return;
        }

        res.json({ user: sanitizeUser(user) });
      } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ error: "Failed to verify email" });
      }
    }
  );

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    res.json({ user: sanitizeUser(req.user!) });
  });

  // ==========================================================================
  // PROFILE ROUTES
  // ==========================================================================

  // Get current user's profile
  app.get("/api/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userWithProfile = await storage.getUserWithProfile(req.user!.id);
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

  // Update current user's profile
  app.patch("/api/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "student") {
        res.status(403).json({ error: "Only students have profiles to update" });
        return;
      }

      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const profile = await storage.updateProfile(req.user!.id, parsed.data);
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

  // Get another user's public profile
  app.get("/api/users/:userId/profile", async (req: Request, res: Response) => {
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

  // ==========================================================================
  // SERVICE ROUTES
  // ==========================================================================

  // Get all services with filters
  app.get("/api/services", async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        providerId: req.query.providerId as string | undefined,
        search: req.query.search as string | undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      };

      const services = await storage.getServices(filters);
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ error: "Failed to get services" });
    }
  });

  // Get single service
  app.get("/api/services/:id", async (req: Request, res: Response) => {
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

  // Create service
  app.post("/api/services", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "student") {
        res.status(403).json({ error: "Only students can create services" });
        return;
      }

      const parsed = insertServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const service = await storage.createService(req.user!.id, parsed.data);
      res.status(201).json(service);
    } catch (error) {
      console.error("Create service error:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  // Update service
  app.patch("/api/services/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        res.status(404).json({ error: "Service not found" });
        return;
      }

      if (service.providerId !== req.user!.id) {
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

  // Delete service
  app.delete("/api/services/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        res.status(404).json({ error: "Service not found" });
        return;
      }

      if (service.providerId !== req.user!.id) {
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

  // Request a service (creates project + auto-proposal)
  app.post("/api/services/:id/request", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      console.log("[Service Request] Starting request for service:", req.params.id);
      console.log("[Service Request] User:", req.user?.id, "Role:", req.user?.role);
      
      if (req.user!.role !== "client") {
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

      const { tier, requirements, customBudget } = req.body as {
        tier: "basic" | "standard" | "premium";
        requirements: string;
        customBudget?: number;
      };

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

      // Get price based on tier
      let price: number;
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

      // Calculate delivery days based on tier
      const baseDelivery = service.deliveryDays || 7;
      let deliveryDays: number;
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

      // Use custom budget if provided, otherwise use tier price
      const budgetAmount = customBudget || price;
      console.log("[Service Request] Budget amount:", budgetAmount);

      // Create the project
      console.log("[Service Request] Creating project...");
      let project;
      try {
        project = await storage.createProject(req.user!.id, {
          title: `Service Request: ${service.title}`,
          description: `**Service Requested:** ${service.title}\n**Tier:** ${tier.charAt(0).toUpperCase() + tier.slice(1)}\n**Listed Price:** $${price}\n\n---\n\n**Client Requirements:**\n${requirements}`,
          budgetMin: budgetAmount,
          budgetMax: budgetAmount,
        });
        console.log("[Service Request] Project created:", project.id);
      } catch (projectError) {
        console.error("[Service Request] Failed to create project:", projectError);
        res.status(500).json({ error: "Failed to create project" });
        return;
      }

      // Auto-create a proposal from the service provider
      console.log("[Service Request] Creating proposal from provider:", service.providerId);
      let proposal;
      try {
        proposal = await storage.createProposal(service.providerId, {
          projectId: project.id,
          coverLetter: `This is an automatic proposal for the "${service.title}" service you requested.\n\n**Tier:** ${tier.charAt(0).toUpperCase() + tier.slice(1)}\n**Price:** $${price}\n**Estimated Delivery:** ${deliveryDays} days\n\nI'll review your requirements and follow up shortly. Feel free to message me with any questions!`,
          price: price,
          deliveryDays: deliveryDays,
        });
        console.log("[Service Request] Proposal created:", proposal.id);
      } catch (proposalError) {
        console.error("[Service Request] Failed to create proposal:", proposalError);
        res.status(500).json({ error: "Failed to create proposal" });
        return;
      }

      // Return the created project with details
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
        message: "Service request created successfully",
      });
      return;
    } catch (error) {
      console.error("[Service Request] Unhandled error:", error);
      res.status(500).json({ error: "Failed to request service" });
    }
  });

  // ==========================================================================
  // PROJECT ROUTES
  // ==========================================================================

  // Get projects
  app.get("/api/projects", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const filters: { clientId?: string; providerId?: string; status?: string } = {};

      // If status is "open", show all open projects (for marketplace)
      if (req.query.status === "open") {
        filters.status = "open";
      } else if (req.user!.role === "client") {
        // Clients see their own projects
        filters.clientId = req.user!.id;
        if (req.query.status) filters.status = req.query.status as string;
      } else if (req.user!.role === "student") {
        // Students see projects they have proposals for
        filters.providerId = req.user!.id;
        if (req.query.status) filters.status = req.query.status as string;
      }

      const projects = await storage.getProjects(filters);
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ error: "Failed to get projects" });
    }
  });

  // Get single project
  app.get("/api/projects/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
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

  // Create project
  app.post("/api/projects", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "client") {
        res.status(403).json({ error: "Only clients can create projects" });
        return;
      }

      const parsed = insertProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const project = await storage.createProject(req.user!.id, parsed.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      // Check authorization
      const isClient = project.clientId === req.user!.id;
      const isAcceptedProvider =
        project.acceptedProposal?.providerId === req.user!.id;

      if (!isClient && !isAcceptedProvider) {
        res.status(403).json({ error: "Not authorized to update this project" });
        return;
      }

      const parsed = updateProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      // Validate status transitions
      if (parsed.data.status) {
        const currentStatus = project.status;
        const newStatus = parsed.data.status;

        // Only provider can mark as delivered
        if (newStatus === "delivered" && !isAcceptedProvider) {
          res.status(403).json({ error: "Only the accepted provider can mark as delivered" });
          return;
        }

        // Only client can mark as completed (release funds)
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

  // Accept proposal
  app.post(
    "/api/projects/:id/accept",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }

        if (project.clientId !== req.user!.id) {
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

        // Verify proposal belongs to this project
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

  // Get project messages
  app.get(
    "/api/projects/:id/messages",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }

        // Check user is participant
        const isClient = project.clientId === req.user!.id;
        const hasProposal = project.proposals.some(
          (p) => p.providerId === req.user!.id
        );

        if (!isClient && !hasProposal) {
          res.status(403).json({ error: "Not authorized to view messages" });
          return;
        }

        const messages = await storage.getMessages(req.params.id);
        res.json(messages);
      } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ error: "Failed to get messages" });
      }
    }
  );

  // Send message
  app.post(
    "/api/projects/:id/messages",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }

        // Check user is participant
        const isClient = project.clientId === req.user!.id;
        const hasProposal = project.proposals.some(
          (p) => p.providerId === req.user!.id
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
          req.user!.id,
          parsed.data
        );
        res.status(201).json(message);
      } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  );

  // Submit review for project
  app.post(
    "/api/projects/:id/review",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
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

        const isClient = project.clientId === req.user!.id;
        const isProvider = project.acceptedProposal?.providerId === req.user!.id;

        if (!isClient && !isProvider) {
          res.status(403).json({ error: "Only project participants can review" });
          return;
        }

        // Determine target user
        let targetUserId: string;
        if (isClient) {
          // Client reviews provider
          if (!project.acceptedProposal) {
            res.status(400).json({ error: "No provider to review" });
            return;
          }
          targetUserId = project.acceptedProposal.providerId;
        } else {
          // Provider reviews client
          targetUserId = project.clientId;
        }

        // Check if already reviewed
        const existingReviews = await storage.getProjectReviews(req.params.id);
        const alreadyReviewed = existingReviews.some(
          (r) => r.authorId === req.user!.id
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
          req.user!.id,
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

  // Get project reviews
  app.get(
    "/api/projects/:id/reviews",
    async (req: Request, res: Response) => {
      try {
        const reviews = await storage.getProjectReviews(req.params.id);
        res.json(reviews);
      } catch (error) {
        console.error("Get project reviews error:", error);
        res.status(500).json({ error: "Failed to get reviews" });
      }
    }
  );

  // ==========================================================================
  // PROPOSAL ROUTES
  // ==========================================================================

  // Get proposals
  app.get("/api/proposals", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        projectId: req.query.projectId as string | undefined,
        providerId: req.query.providerId as string | undefined,
      };

      const proposals = await storage.getProposals(filters);
      res.json(proposals);
    } catch (error) {
      console.error("Get proposals error:", error);
      res.status(500).json({ error: "Failed to get proposals" });
    }
  });

  // Get single proposal
  app.get("/api/proposals/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
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

  // Create proposal
  app.post("/api/proposals", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "student") {
        res.status(403).json({ error: "Only students can submit proposals" });
        return;
      }

      const parsed = insertProposalSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      // Check project exists and is open
      const project = await storage.getProject(parsed.data.projectId);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      if (project.status !== "open") {
        res.status(400).json({ error: "Project is not accepting proposals" });
        return;
      }

      // Check if already submitted proposal
      const existingProposals = await storage.getProposals({
        projectId: parsed.data.projectId,
        providerId: req.user!.id,
      });

      if (existingProposals.length > 0) {
        res.status(400).json({ error: "You have already submitted a proposal" });
        return;
      }

      const proposal = await storage.createProposal(req.user!.id, parsed.data);
      res.status(201).json(proposal);
    } catch (error) {
      console.error("Create proposal error:", error);
      res.status(500).json({ error: "Failed to create proposal" });
    }
  });

  // Update proposal
  app.patch(
    "/api/proposals/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const proposal = await storage.getProposal(req.params.id);
        if (!proposal) {
          res.status(404).json({ error: "Proposal not found" });
          return;
        }

        if (proposal.providerId !== req.user!.id) {
          res.status(403).json({ error: "You can only edit your own proposals" });
          return;
        }

        // Check project is still open
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

  // Delete proposal
  app.delete(
    "/api/proposals/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const proposal = await storage.getProposal(req.params.id);
        if (!proposal) {
          res.status(404).json({ error: "Proposal not found" });
          return;
        }

        if (proposal.providerId !== req.user!.id) {
          res.status(403).json({ error: "You can only delete your own proposals" });
          return;
        }

        // Check project is still open
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

  // ==========================================================================
  // PAYMENT ROUTES
  // ==========================================================================

  // Release payment
  app.post(
    "/api/payments/release",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
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

        if (project.clientId !== req.user!.id) {
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

  // Get transactions
  app.get(
    "/api/payments/transactions",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const filters = {
          projectId: req.query.projectId as string | undefined,
          userId: req.user!.id,
        };

        const transactions = await storage.getTransactions(filters);
        res.json(transactions);
      } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({ error: "Failed to get transactions" });
      }
    }
  );

  // ==========================================================================
  // DISPUTE ROUTES
  // ==========================================================================

  // Create dispute
  app.post("/api/disputes", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const parsed = insertDisputeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      // Verify user is participant in project
      const project = await storage.getProject(parsed.data.projectId);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const isClient = project.clientId === req.user!.id;
      const isProvider = project.acceptedProposal?.providerId === req.user!.id;

      if (!isClient && !isProvider) {
        res.status(403).json({ error: "Only project participants can open disputes" });
        return;
      }

      if (project.status === "completed" || project.status === "cancelled") {
        res.status(400).json({ error: "Cannot dispute completed or cancelled projects" });
        return;
      }

      const dispute = await storage.createDispute(req.user!.id, parsed.data);
      res.status(201).json(dispute);
    } catch (error) {
      console.error("Create dispute error:", error);
      res.status(500).json({ error: "Failed to create dispute" });
    }
  });

  // Get disputes (admin only)
  app.get(
    "/api/disputes",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const filters = {
          status: req.query.status as string | undefined,
        };

        const disputes = await storage.getDisputes(filters);
        res.json(disputes);
      } catch (error) {
        console.error("Get disputes error:", error);
        res.status(500).json({ error: "Failed to get disputes" });
      }
    }
  );

  // Get single dispute
  app.get(
    "/api/disputes/:id",
    authMiddleware,
    async (req: AuthRequest, res: Response) => {
      try {
        const dispute = await storage.getDispute(req.params.id);
        if (!dispute) {
          res.status(404).json({ error: "Dispute not found" });
          return;
        }

        // Check authorization - admin or dispute opener or project participants
        const project = await storage.getProject(dispute.projectId);
        const isAdmin = req.user!.role === "admin";
        const isOpener = dispute.openerId === req.user!.id;
        const isClient = project?.clientId === req.user!.id;
        const isProvider = project?.acceptedProposal?.providerId === req.user!.id;

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

  // Update dispute (admin only)
  app.patch(
    "/api/disputes/:id",
    authMiddleware,
    adminMiddleware,
    async (req: AuthRequest, res: Response) => {
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

  // ==========================================================================
  // REVIEW ROUTES (for user profiles)
  // ==========================================================================

  // Get reviews for a user
  app.get("/api/users/:userId/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getReviews(req.params.userId);
      res.json(reviews);
    } catch (error) {
      console.error("Get user reviews error:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // ==========================================================================
  // CATEGORY LIST (for service filtering)
  // ==========================================================================

  app.get("/api/categories", async (_req: Request, res: Response) => {
    // Static categories for MVP
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
      "Other",
    ];
    res.json(categories);
  });

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}