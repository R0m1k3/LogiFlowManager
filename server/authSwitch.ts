import { Express } from "express";
import { setupAuth as setupReplitAuth, isAuthenticated as replitIsAuthenticated } from "./replitAuth";
import { setupLocalAuth, requireAuth as localRequireAuth } from "./localAuth";

// Environment variable to switch between auth systems
const USE_LOCAL_AUTH = process.env.USE_LOCAL_AUTH === 'true';

export async function setupAuth(app: Express) {
  if (USE_LOCAL_AUTH) {
    console.log('Using local authentication system');
    setupLocalAuth(app);
  } else {
    console.log('Using Replit authentication system');
    await setupReplitAuth(app);
  }
}

export const isAuthenticated = USE_LOCAL_AUTH ? localRequireAuth : replitIsAuthenticated;