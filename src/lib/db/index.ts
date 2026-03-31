import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

// Connection pool (production-safe)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

// Drizzle instance
export const db = drizzle(pool)

// Export schema tables for easy access
export * from "./schema"