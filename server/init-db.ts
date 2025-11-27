import "dotenv/config";
import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";

// Determine if we're using Turso (remote) or local SQLite
const hasTursoUrl = process.env.DATABASE_URL?.startsWith("libsql://");

let client;
let dbLocation: string;

if (hasTursoUrl) {
  // Production: Use Turso (remote SQLite)
  client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  dbLocation = process.env.DATABASE_URL!;
  console.log(`📡 Initializing Turso database at: ${dbLocation}`);
} else {
  // Development: Use local SQLite file
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, "skillnet.db");
  
  client = createClient({
    url: `file:${dbPath}`,
  });
  dbLocation = dbPath;
  console.log(`📦 Initializing local database at: ${dbLocation}`);
}

// Create tables
const createTables = async () => {
  console.log("📋 Creating tables...");

  // Users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('student', 'client', 'admin')),
      university_email TEXT,
      university_verified INTEGER NOT NULL DEFAULT 0,
      verification_code TEXT,
      phone TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("  ✓ users");

  // Profiles table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      bio TEXT,
      intro_video_url TEXT,
      skills TEXT DEFAULT '[]',
      portfolio TEXT DEFAULT '[]',
      rate REAL,
      availability TEXT DEFAULT 'available' CHECK(availability IN ('available', 'busy')),
      languages TEXT DEFAULT '[]',
      rating REAL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0
    )
  `);
  console.log("  ✓ profiles");

  // Services table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price_basic REAL,
      price_standard REAL,
      price_premium REAL,
      description_basic TEXT,
      description_standard TEXT,
      description_premium TEXT,
      delivery_days INTEGER,
      sample_urls TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("  ✓ services");

  // Projects table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      budget_min REAL,
      budget_max REAL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled')),
      accepted_proposal_id TEXT,
      escrow_amount REAL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("  ✓ projects");

  // Proposals table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      provider_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cover_letter TEXT NOT NULL,
      price REAL NOT NULL,
      delivery_days INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("  ✓ proposals");

  // Messages table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      attachments TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("  ✓ messages");

  // Transactions table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      from_user TEXT REFERENCES users(id),
      to_user TEXT REFERENCES users(id),
      amount REAL NOT NULL,
      platform_fee REAL DEFAULT 0,
      type TEXT NOT NULL CHECK(type IN ('deposit', 'release', 'withdrawal')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
      gateway_tx_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("  ✓ transactions");

  // Reviews table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("  ✓ reviews");

  // Disputes table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      opener_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_review', 'resolved', 'closed')),
      evidence TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("  ✓ disputes");

  // Create indexes for better query performance
  console.log("\n📇 Creating indexes...");
  
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_services_category ON services(category)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_proposals_provider_id ON proposals(provider_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_target_user_id ON reviews(target_user_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_disputes_project_id ON disputes(project_id)`);
  
  console.log("  ✓ All indexes created");
};

// Run initialization
const main = async () => {
  try {
    await createTables();
    console.log("\n✅ Database initialized successfully!");
    console.log(`   Location: ${dbLocation}`);
  } catch (error) {
    console.error("\n❌ Failed to initialize database:", error);
    process.exit(1);
  } finally {
    client.close();
  }
};

main();