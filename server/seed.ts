import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  users,
  profiles,
  services,
  projects,
  proposals,
  reviews,
  messages,
  transactions,
  disputes,
  serviceRequests,
  notifications,
} from "@shared/schema";

const SALT_ROUNDS = 10;

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Helper to create a date in the past
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockStudents = [
  {
    name: "Alex Chen",
    email: "alex@student.edu",
    universityEmail: "alex.chen@stanford.edu",
    phone: "555-0101",
    bio: "Full-stack developer with 3 years of experience. Specializing in React, Node.js, and cloud architecture. Currently pursuing CS degree at Stanford.",
    skills: [
      { name: "React", level: "expert" },
      { name: "Node.js", level: "advanced" },
      { name: "TypeScript", level: "advanced" },
      { name: "PostgreSQL", level: "intermediate" },
      { name: "AWS", level: "intermediate" },
    ],
    rate: 8000,
    languages: ["English", "Mandarin"],
  },
  {
    name: "Sarah Johnson",
    email: "sarah@student.edu",
    universityEmail: "sarah.j@mit.edu",
    phone: "555-0102",
    bio: "UI/UX designer passionate about creating beautiful, intuitive interfaces. Experienced with Figma, Adobe Creative Suite, and front-end development.",
    skills: [
      { name: "UI Design", level: "expert" },
      { name: "UX Research", level: "advanced" },
      { name: "Figma", level: "expert" },
      { name: "CSS/Tailwind", level: "advanced" },
      { name: "Prototyping", level: "advanced" },
    ],
    rate: 7000,
    languages: ["English", "Spanish"],
  },
  {
    name: "Marcus Williams",
    email: "marcus@student.edu",
    universityEmail: "mwilliams@berkeley.edu",
    phone: "555-0103",
    bio: "Mobile app developer specializing in React Native and Flutter. Published 5 apps on the App Store with 100k+ downloads combined.",
    skills: [
      { name: "React Native", level: "expert" },
      { name: "Flutter", level: "advanced" },
      { name: "iOS Development", level: "intermediate" },
      { name: "Firebase", level: "advanced" },
      { name: "App Store Optimization", level: "intermediate" },
    ],
    rate: 10000,
    languages: ["English"],
  },
  {
    name: "Emily Park",
    email: "emily@student.edu",
    universityEmail: "epark@ucla.edu",
    phone: "555-0104",
    bio: "Data scientist and ML enthusiast. Experience with Python, TensorFlow, and data visualization. Love turning complex data into actionable insights.",
    skills: [
      { name: "Python", level: "expert" },
      { name: "Machine Learning", level: "advanced" },
      { name: "Data Analysis", level: "expert" },
      { name: "TensorFlow", level: "intermediate" },
      { name: "SQL", level: "advanced" },
    ],
    rate: 12000,
    languages: ["English", "Korean"],
  },
  {
    name: "Jordan Rivera",
    email: "jordan@student.edu",
    universityEmail: "jrivera@nyu.edu",
    phone: "555-0105",
    bio: "Content writer and copywriter with a journalism background. Skilled in SEO, blog writing, and social media content creation.",
    skills: [
      { name: "Copywriting", level: "expert" },
      { name: "SEO Writing", level: "advanced" },
      { name: "Content Strategy", level: "intermediate" },
      { name: "Social Media", level: "advanced" },
      { name: "Research", level: "expert" },
    ],
    rate: 5000,
    languages: ["English", "Portuguese"],
  },
];

const mockClients = [
  {
    name: "TechStart Inc.",
    email: "hiring@techstart.io",
    phone: "555-0201",
  },
  {
    name: "Green Gardens Co.",
    email: "projects@greengardens.com",
    phone: "555-0202",
  },
  {
    name: "David Mitchell",
    email: "david.m@gmail.com",
    phone: "555-0203",
  },
  {
    name: "Luna Creative Agency",
    email: "work@lunacreative.co",
    phone: "555-0204",
  },
  {
    name: "FitLife App",
    email: "dev@fitlifeapp.com",
    phone: "555-0205",
  },
];

const mockServices = [
  // Alex's services
  {
    studentIndex: 0,
    title: "Full-Stack Web Application Development",
    description:
      "I'll build a complete web application from scratch using React, Node.js, and your choice of database. Includes responsive design, authentication, and deployment assistance.",
    category: "Web Development",
    priceBasic: 80000,
    priceStandard: 150000,
    pricePremium: 300000,
    descriptionBasic: "Simple web app with up to 5 pages, basic authentication, responsive design, and 1 revision. Deployed to your hosting platform.",
    descriptionStandard: "Medium-complexity app with up to 10 pages, user authentication & authorization, database integration, API endpoints, 2 revisions, and deployment with SSL setup.",
    descriptionPremium: "Complex full-stack application with unlimited pages, advanced features (real-time updates, payment integration, admin dashboard), 3 revisions, comprehensive documentation, 30-day post-launch support.",
    deliveryDays: 14,
  },
  {
    studentIndex: 0,
    title: "REST API Development",
    description:
      "Custom REST API built with Node.js/Express or Python/FastAPI. Includes documentation, authentication, rate limiting, and comprehensive testing.",
    category: "Backend Development",
    priceBasic: 50000,
    priceStandard: 100000,
    pricePremium: 200000,
    descriptionBasic: "Basic REST API with up to 5 endpoints, JWT authentication, basic error handling, and API documentation. 1 revision included.",
    descriptionStandard: "Comprehensive API with up to 15 endpoints, authentication & authorization, rate limiting, input validation, database integration, Postman collection, and 2 revisions.",
    descriptionPremium: "Enterprise-grade API with unlimited endpoints, advanced security (OAuth2, API keys), comprehensive testing suite, CI/CD pipeline setup, detailed documentation, performance optimization, and 3 revisions.",
    deliveryDays: 7,
  },
  // Sarah's services
  {
    studentIndex: 1,
    title: "Complete UI/UX Design Package",
    description:
      "End-to-end design for your web or mobile app. Includes user research, wireframes, high-fidelity mockups, and interactive prototypes in Figma.",
    category: "Design",
    priceBasic: 60000,
    priceStandard: 120000,
    pricePremium: 250000,
    descriptionBasic: "Design for up to 5 screens, basic wireframes, high-fidelity mockups in Figma, style guide (colors & typography), and 2 revision rounds.",
    descriptionStandard: "Design for up to 12 screens, detailed wireframes, high-fidelity mockups, clickable prototype, comprehensive style guide, basic user research, and 3 revision rounds.",
    descriptionPremium: "Design for up to 25 screens, user research & personas, user journey mapping, wireframes, high-fidelity mockups, interactive prototype with animations, complete design system, accessibility review, and unlimited revisions.",
    deliveryDays: 10,
  },
  {
    studentIndex: 1,
    title: "Website Redesign",
    description:
      "Transform your outdated website with a modern, user-friendly design. Includes competitor analysis, new visual direction, and complete page designs.",
    category: "Design",
    priceBasic: 55000,
    priceStandard: 110000,
    pricePremium: 200000,
    descriptionBasic: "Redesign for up to 3 pages (homepage, about, contact), modern visual refresh, mobile-responsive mockups, and 2 revisions.",
    descriptionStandard: "Redesign for up to 7 pages, competitor analysis, new visual identity, mobile & tablet mockups, style guide, and 3 revisions.",
    descriptionPremium: "Complete website redesign (up to 15 pages), in-depth competitor analysis, brand refresh recommendations, responsive designs for all devices, interactive prototypes, accessibility compliance, SEO-friendly layouts, and unlimited revisions.",
    deliveryDays: 7,
  },
  // Marcus's services
  {
    studentIndex: 2,
    title: "Cross-Platform Mobile App",
    description:
      "Build your mobile app for both iOS and Android using React Native. Includes app store submission assistance and post-launch support.",
    category: "Mobile Development",
    priceBasic: 120000,
    priceStandard: 250000,
    pricePremium: 500000,
    descriptionBasic: "Simple mobile app with up to 5 screens, basic navigation, local storage, and 1 revision. Source code provided.",
    descriptionStandard: "Feature-rich app with up to 12 screens, API integration, push notifications, offline support, app store submission guide, 2 revisions, and 2-week bug fix support.",
    descriptionPremium: "Complex mobile app with unlimited screens, advanced features (real-time chat, payment integration, maps, camera), backend integration, full app store submission assistance, 3 revisions, app store optimization, and 60-day priority support.",
    deliveryDays: 21,
  },
  // Emily's services
  {
    studentIndex: 3,
    title: "Data Analysis & Visualization",
    description:
      "Turn your raw data into actionable insights. Includes data cleaning, statistical analysis, and beautiful visualizations with interactive dashboards.",
    category: "Data Science",
    priceBasic: 40000,
    priceStandard: 80000,
    pricePremium: 160000,
    descriptionBasic: "Analysis of 1 dataset, basic data cleaning, descriptive statistics, 3-5 static visualizations (charts/graphs), and summary report (PDF).",
    descriptionStandard: "Analysis of up to 3 datasets, advanced cleaning & preprocessing, statistical tests, 8-10 interactive visualizations, correlation analysis, insights report with recommendations.",
    descriptionPremium: "Comprehensive analysis of unlimited datasets, advanced statistical modeling, predictive analytics, fully interactive dashboard (Tableau/PowerBI), automated reporting setup, data pipeline recommendations, and presentation-ready materials.",
    deliveryDays: 5,
  },
  {
    studentIndex: 3,
    title: "Machine Learning Model Development",
    description:
      "Custom ML models for prediction, classification, or recommendation systems. Includes model training, optimization, and deployment guidance.",
    category: "Data Science",
    priceBasic: 100000,
    priceStandard: 200000,
    pricePremium: 400000,
    descriptionBasic: "Simple ML model (linear/logistic regression or basic classification), model training & evaluation, basic performance metrics, Python notebook with code, and 1 revision.",
    descriptionStandard: "Advanced ML model (random forest, gradient boosting, or neural networks), feature engineering, hyperparameter tuning, cross-validation, detailed performance report, deployment-ready code, and 2 revisions.",
    descriptionPremium: "Production-grade ML solution with multiple model comparison, advanced feature engineering, ensemble methods, model interpretability analysis, API deployment (Flask/FastAPI), monitoring setup, comprehensive documentation, retraining pipeline, and 3 revisions with ongoing consultation.",
    deliveryDays: 14,
  },
  // Jordan's services
  {
    studentIndex: 4,
    title: "SEO Blog Content Writing",
    description:
      "High-quality, SEO-optimized blog posts that drive traffic and engage readers. Includes keyword research and meta descriptions.",
    category: "Writing",
    priceBasic: 15000,
    priceStandard: 40000,
    pricePremium: 80000,
    descriptionBasic: "1 blog post (800-1000 words), basic keyword research, SEO-optimized content, meta description, and 1 revision.",
    descriptionStandard: "3 blog posts (1200-1500 words each), comprehensive keyword research, SEO optimization, meta descriptions, internal linking suggestions, and 2 revisions per post.",
    descriptionPremium: "5 blog posts (1500-2000 words each), advanced keyword research with competitor analysis, SEO-optimized content with headers & formatting, custom meta descriptions, internal/external linking strategy, featured image suggestions, content calendar planning, and unlimited revisions.",
    deliveryDays: 3,
  },
  {
    studentIndex: 4,
    title: "Website Copywriting",
    description:
      "Compelling website copy that converts visitors into customers. Includes homepage, about page, and service/product pages.",
    category: "Writing",
    priceBasic: 30000,
    priceStandard: 65000,
    pricePremium: 130000,
    descriptionBasic: "Copy for 3 pages (homepage, about, contact), compelling headlines, clear CTAs, and 2 revision rounds.",
    descriptionStandard: "Copy for 6 pages, brand voice development, SEO keywords integration, meta descriptions, engaging headlines & CTAs, social proof sections, and 3 revision rounds.",
    descriptionPremium: "Copy for up to 12 pages, comprehensive brand messaging framework, competitor analysis, full SEO optimization, compelling storytelling, conversion-focused CTAs, email newsletter template, social media copy adaptations, and unlimited revisions.",
    deliveryDays: 5,
  },
];

const mockProjects = [
  {
    clientIndex: 0,
    title: "E-commerce Platform MVP",
    description:
      "We need a minimum viable product for our new e-commerce platform. Should include product listings, shopping cart, checkout flow, and basic admin dashboard. Looking for someone experienced with React and Node.js.",
    budgetMin: 250000,
    budgetMax: 500000,
    status: "open" as const,
    daysAgo: 2,
  },
  {
    clientIndex: 1,
    title: "Mobile App for Plant Care Reminders",
    description:
      "Looking for a developer to create a simple but beautiful mobile app that helps users track their plant watering schedules. Need push notifications, plant database, and photo tracking features.",
    budgetMin: 150000,
    budgetMax: 300000,
    status: "open" as const,
    daysAgo: 5,
  },
  {
    clientIndex: 2,
    title: "Personal Portfolio Website",
    description:
      "I'm a photographer and need a stunning portfolio website to showcase my work. Should be minimalist, fast-loading, and have a contact form. Bonus if it has a blog section.",
    budgetMin: 65000,
    budgetMax: 130000,
    status: "open" as const,
    daysAgo: 1,
  },
  {
    clientIndex: 3,
    title: "Brand Identity Refresh",
    description:
      "Our agency needs a brand refresh for a client in the fitness industry. Looking for a designer to create new logo concepts, color palette, typography guidelines, and basic brand book.",
    budgetMin: 100000,
    budgetMax: 200000,
    status: "open" as const,
    daysAgo: 3,
  },
  {
    clientIndex: 4,
    title: "Fitness App Data Dashboard",
    description:
      "We have a fitness tracking app and need someone to build an analytics dashboard for our users. Should visualize workout history, progress charts, and goal tracking. Data is in PostgreSQL.",
    budgetMin: 130000,
    budgetMax: 250000,
    status: "open" as const,
    daysAgo: 4,
  },
  {
    clientIndex: 0,
    title: "Landing Page for Product Launch",
    description:
      "Need a high-converting landing page for our upcoming SaaS product launch. Should be responsive, have animations, and integrate with our email marketing tool (Mailchimp).",
    budgetMin: 50000,
    budgetMax: 100000,
    status: "open" as const,
    daysAgo: 0,
  },
  {
    clientIndex: 3,
    title: "Blog Content Series - Tech Trends",
    description:
      "Looking for a skilled writer to create a 10-article blog series about emerging tech trends for 2024. Each article should be 1500-2000 words, well-researched, and SEO-optimized.",
    budgetMin: 80000,
    budgetMax: 160000,
    status: "open" as const,
    daysAgo: 6,
  },
  // Some in-progress projects
  {
    clientIndex: 2,
    title: "Recipe Sharing Website",
    description:
      "Need a full-stack web app where users can share and discover recipes. Features: user accounts, recipe upload with photos, search/filter, favorites, and comments.",
    budgetMin: 1200,
    budgetMax: 2000,
    status: "in_progress" as const,
    daysAgo: 14,
  },
  {
    clientIndex: 4,
    title: "App Store Screenshots & Graphics",
    description:
      "Need professional app store screenshots and promotional graphics for our fitness app on both iOS and Android stores.",
    budgetMin: 250,
    budgetMax: 500,
    status: "completed" as const,
    daysAgo: 30,
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // --------------------------------------------------------------------------
  // Clear existing data (in correct order due to foreign keys)
  // --------------------------------------------------------------------------
  console.log("🧹 Clearing existing data...");
  await db.delete(notifications);
  await db.delete(serviceRequests);
  await db.delete(disputes);
  await db.delete(reviews);
  await db.delete(messages);
  await db.delete(transactions);
  await db.delete(proposals);
  await db.delete(projects);
  await db.delete(services);
  await db.delete(profiles);
  await db.delete(users);
  console.log("   ✓ All tables cleared\n");

  const defaultPassword = await hashPassword("password123");
  const studentIds: string[] = [];
  const clientIds: string[] = [];
  const projectIds: string[] = [];
  const serviceIds: string[] = [];

  // --------------------------------------------------------------------------
  // Create Students
  // --------------------------------------------------------------------------
  console.log("👨‍🎓 Creating students...");
  for (const student of mockStudents) {
    const id = uuidv4();
    studentIds.push(id);

    await db.insert(users).values({
      id,
      name: student.name,
      email: student.email,
      passwordHash: defaultPassword,
      role: "student",
      universityEmail: student.universityEmail,
      universityVerified: true,
      phone: student.phone,
      createdAt: daysAgo(Math.floor(Math.random() * 60) + 30),
    });

    // Create profile for student
    await db.insert(profiles).values({
      id: uuidv4(),
      userId: id,
      bio: student.bio,
      skills: student.skills,
      rate: student.rate,
      availability: "available",
      languages: student.languages,
      rating: 4 + Math.random(),
      reviewCount: Math.floor(Math.random() * 15) + 3,
    });

    console.log(`   ✓ ${student.name}`);
  }

  // --------------------------------------------------------------------------
  // Create Clients
  // --------------------------------------------------------------------------
  console.log("\n💼 Creating clients...");
  for (const client of mockClients) {
    const id = uuidv4();
    clientIds.push(id);

    await db.insert(users).values({
      id,
      name: client.name,
      email: client.email,
      passwordHash: defaultPassword,
      role: "client",
      phone: client.phone,
      createdAt: daysAgo(Math.floor(Math.random() * 60) + 30),
    });

    console.log(`   ✓ ${client.name}`);
  }

  // --------------------------------------------------------------------------
  // Create Services
  // --------------------------------------------------------------------------
  console.log("\n🛠️  Creating services...");
  for (const service of mockServices) {
    const id = uuidv4();
    serviceIds.push(id);

    await db.insert(services).values({
      id,
      providerId: studentIds[service.studentIndex],
      title: service.title,
      description: service.description,
      category: service.category,
      priceBasic: service.priceBasic,
      priceStandard: service.priceStandard,
      pricePremium: service.pricePremium,
      descriptionBasic: service.descriptionBasic,
      descriptionStandard: service.descriptionStandard,
      descriptionPremium: service.descriptionPremium,
      deliveryDays: service.deliveryDays,
      sampleUrls: [],
      createdAt: daysAgo(Math.floor(Math.random() * 20) + 5),
    });

    console.log(`   ✓ ${service.title}`);
  }

  // --------------------------------------------------------------------------
  // Create Projects
  // --------------------------------------------------------------------------
  console.log("\n📋 Creating projects...");
  for (const project of mockProjects) {
    const id = uuidv4();
    projectIds.push(id);

    await db.insert(projects).values({
      id,
      clientId: clientIds[project.clientIndex],
      title: project.title,
      description: project.description,
      budgetMin: project.budgetMin,
      budgetMax: project.budgetMax,
      status: project.status,
      createdAt: daysAgo(project.daysAgo),
    });

    console.log(`   ✓ ${project.title}`);
  }

  // --------------------------------------------------------------------------
  // Create Proposals (for open projects)
  // --------------------------------------------------------------------------
  console.log("\n📝 Creating proposals...");

  const proposalData = [
    // Proposals for E-commerce Platform MVP (project 0)
    {
      projectIndex: 0,
      studentIndex: 0, // Alex
      coverLetter:
        "Hi! I'd love to help build your e-commerce MVP. I've built 3 similar platforms using React and Node.js, including one that now processes $50k/month in transactions. I can deliver a solid, scalable foundation within your timeline.",
      price: 2500,
      deliveryDays: 14,
    },
    // Proposals for Mobile App for Plant Care (project 1)
    {
      projectIndex: 1,
      studentIndex: 2, // Marcus
      coverLetter:
        "This sounds like a fun project! I've published 5 apps on the App Store and have experience with push notifications and local databases. I'd use React Native to ensure it works great on both iOS and Android.",
      price: 1800,
      deliveryDays: 18,
    },
    // Proposals for Personal Portfolio Website (project 2)
    {
      projectIndex: 2,
      studentIndex: 0, // Alex
      coverLetter:
        "I specialize in creating fast, beautiful portfolio sites. For photographers, image optimization and loading performance is crucial - I'll ensure your work looks stunning without sacrificing speed.",
      price: 600,
      deliveryDays: 7,
    },
    {
      projectIndex: 2,
      studentIndex: 1, // Sarah (design + dev)
      coverLetter:
        "As a UI/UX designer who also codes, I can deliver both the design and development. I'll create a unique visual identity that complements your photography style and build it with modern web technologies.",
      price: 750,
      deliveryDays: 10,
    },
    // Proposals for Brand Identity Refresh (project 3)
    {
      projectIndex: 3,
      studentIndex: 1, // Sarah
      coverLetter:
        "Brand identity is my passion! I've completed 12 brand refresh projects and understand how to balance fresh ideas with maintaining brand recognition. I'll provide multiple concepts for you to choose from.",
      price: 1000,
      deliveryDays: 12,
    },
    // Proposals for Fitness App Data Dashboard (project 4)
    {
      projectIndex: 4,
      studentIndex: 3, // Emily
      coverLetter:
        "Data visualization is my specialty! I can create an intuitive dashboard using React with D3.js or Chart.js. I have experience with PostgreSQL and can write efficient queries for real-time data updates.",
      price: 1200,
      deliveryDays: 10,
    },
    {
      projectIndex: 4,
      studentIndex: 0, // Alex
      coverLetter:
        "I've built several analytics dashboards for web applications. I can integrate with your PostgreSQL database and create interactive charts that help users understand their fitness progress at a glance.",
      price: 1100,
      deliveryDays: 8,
    },
    // Proposals for Landing Page (project 5)
    {
      projectIndex: 5,
      studentIndex: 0, // Alex
      coverLetter:
        "I can build a high-converting landing page with smooth animations and Mailchimp integration. I've worked on several SaaS landing pages and know what converts - clear CTAs, social proof, and fast load times.",
      price: 450,
      deliveryDays: 5,
    },
    {
      projectIndex: 5,
      studentIndex: 1, // Sarah
      coverLetter:
        "I'll design and build a landing page that captures your brand perfectly. My approach combines beautiful design with conversion optimization principles. Mailchimp integration is straightforward - I've done it many times.",
      price: 500,
      deliveryDays: 6,
    },
    // Proposals for Blog Content Series (project 6)
    {
      projectIndex: 6,
      studentIndex: 4, // Jordan
      coverLetter:
        "Tech writing is my forte! I stay up-to-date with emerging tech trends and can write engaging, well-researched articles that rank well on Google. I'll include keyword research and meta descriptions for each post.",
      price: 800,
      deliveryDays: 21,
    },
  ];

  for (const proposal of proposalData) {
    const id = uuidv4();

    await db.insert(proposals).values({
      id,
      projectId: projectIds[proposal.projectIndex],
      providerId: studentIds[proposal.studentIndex],
      coverLetter: proposal.coverLetter,
      price: proposal.price,
      deliveryDays: proposal.deliveryDays,
      createdAt: daysAgo(Math.max(0, mockProjects[proposal.projectIndex].daysAgo - 1)),
    });

    console.log(
      `   ✓ ${mockStudents[proposal.studentIndex].name} → "${mockProjects[proposal.projectIndex].title.slice(0, 30)}..."`
    );
  }

  // --------------------------------------------------------------------------
  // Create some reviews for completed project
  // --------------------------------------------------------------------------
  console.log("\n⭐ Creating reviews...");
  
  // Review for completed project (App Store Screenshots)
  const completedProjectId = projectIds[8];
  await db.insert(reviews).values({
    id: uuidv4(),
    projectId: completedProjectId,
    authorId: clientIds[4], // FitLife App
    targetUserId: studentIds[1], // Sarah (designer)
    rating: 5,
    comment: "Sarah delivered absolutely stunning app store graphics! The screenshots really make our app stand out. Very professional and quick communication throughout.",
    createdAt: daysAgo(25),
  });
  console.log("   ✓ Review from FitLife App → Sarah Johnson");

  await db.insert(reviews).values({
    id: uuidv4(),
    projectId: completedProjectId,
    authorId: studentIds[1], // Sarah
    targetUserId: clientIds[4], // FitLife App
    rating: 5,
    comment: "Great client to work with! Clear requirements, quick feedback, and prompt payment. Would love to work together again.",
    createdAt: daysAgo(24),
  });
  console.log("   ✓ Review from Sarah Johnson → FitLife App");

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n" + "=".repeat(50));
  console.log("✅ Database seeded successfully!\n");
  console.log("📊 Summary:");
  console.log(`   • ${mockStudents.length} students`);
  console.log(`   • ${mockClients.length} clients`);
  console.log(`   • ${mockServices.length} services`);
  console.log(`   • ${mockProjects.length} projects`);
  console.log(`   • ${proposalData.length} proposals`);
  console.log(`   • 2 reviews`);
  console.log("\n🔐 All accounts use password: password123");
  console.log("\n📧 Student emails:");
  mockStudents.forEach((s) => console.log(`   • ${s.email}`));
  console.log("\n📧 Client emails:");
  mockClients.forEach((c) => console.log(`   • ${c.email}`));
}

// Run the seed
seed()
  .then(() => {
    console.log("\n👋 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  });