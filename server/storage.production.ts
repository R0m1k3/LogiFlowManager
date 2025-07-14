import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { db, pool } from "./db.production";
import { storage as originalStorage } from "./storage";

// Use the production storage with PostgreSQL connection
export const storage = originalStorage;

// Export database instances for production use
export { db, pool };