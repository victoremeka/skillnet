import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: `file:${process.env.DATABASE_URL || "./data/skillnet.db"}`,
  },
  verbose: true,
  strict: true,
} satisfies Config;