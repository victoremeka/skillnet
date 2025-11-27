import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Determine if we're using Turso (remote) or local SQLite
const hasTursoUrl = process.env.DATABASE_URL?.startsWith("libsql://");

let client;

if (hasTursoUrl) {
  // Production: Use Turso (remote SQLite)
  client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  console.log("📡 Connected to Turso database");
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
  console.log(`📦 Using local database: ${dbPath}`);
}

// Create drizzle instance
export const db = drizzle(client, { schema });

export type Database = typeof db;