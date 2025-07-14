import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { eq, and, inArray, desc, sql, gte, lte } from "drizzle-orm";

// Production database configuration
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for production");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

export const db = drizzle(pool, { schema });

// Import and re-export the DatabaseStorage class with production db
import { DatabaseStorage } from "./storage";

// Override the db import in storage with production db
class ProductionDatabaseStorage extends DatabaseStorage {
  constructor() {
    super();
    // Use production database connection
    Object.defineProperty(this, 'db', {
      get() { return db; }
    });
  }
}

export const storage = new ProductionDatabaseStorage();