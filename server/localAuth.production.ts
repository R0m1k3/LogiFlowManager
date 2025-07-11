import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type User } from "@shared/schema";
// Removed Drizzle ORM import - using raw SQL only
// Import de la DB de production
// Removed db import - using pool.query directly
import { initializeDatabase } from "./initDatabase.production";
import connectPgSimple from "connect-pg-simple";

const scryptAsync = promisify(scrypt);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

interface SelectUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  password: string;
  passwordChanged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Handle case where stored password might not have the expected format
  if (!stored || !stored.includes(".")) {
    console.error("❌ Invalid password format in database:", stored ? "missing salt separator" : "null/undefined");
    // If it's the default admin password, allow plain text comparison for migration
    if (supplied === 'admin' && (stored === 'admin' || stored === 'admin123')) {
      console.log("⚠️ Legacy admin password detected, allowing one-time login for migration");
      return true;
    }
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    console.error("❌ Invalid password components:", { hasHash: !!hashed, hasSalt: !!salt });
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("❌ Error comparing passwords:", error);
    return false;
  }
}

async function createDefaultAdminUser() {
  try {
    // Force database initialization FIRST with raw SQL
    console.log("🔧 CRITICAL: Forcing database initialization before admin creation...");
    await initializeDatabase();
    
    console.log("🔧 Checking for default admin user with raw SQL...");
    
    // Use raw SQL to check for admin user (avoid Drizzle issues)
    const { pool } = await import("./db.production.js");
    const adminCheck = await pool.query(`SELECT id, password FROM users WHERE username = 'admin' LIMIT 1`);
    
    if (adminCheck.rows.length === 0) {
      console.log("🔧 Creating default admin user with raw SQL...");
      const hashedPassword = await hashPassword('admin');
      
      // Use raw SQL to create admin user (completely avoid Drizzle)
      await pool.query(`
        INSERT INTO users (id, username, email, name, role, password, password_changed) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, ['admin_local', 'admin', 'admin@logiflow.com', 'Admin Système', 'admin', hashedPassword, false]);
      
      console.log("✅ CRITICAL: Default admin user created: admin/admin");
    } else {
      // Check if existing admin has plain text password
      const adminUser = adminCheck.rows[0];
      if (!adminUser.password || !adminUser.password.includes(".")) {
        console.log("⚠️ CRITICAL: Admin user has plain text password, updating to hashed...");
        const hashedPassword = await hashPassword('admin');
        await pool.query(`
          UPDATE users 
          SET password = $1, password_changed = false 
          WHERE username = 'admin'
        `, [hashedPassword]);
        console.log("✅ CRITICAL: Admin password updated to hashed format");
      } else {
        console.log("✅ CRITICAL: Default admin user already exists with hashed password");
      }
    }
  } catch (error) {
    console.error("❌ CRITICAL: Error creating admin user:", error);
    console.error("❌ CRITICAL: Error details:", error.message);
    throw error; // Re-throw to stop application startup
  }
}

export function setupLocalAuth(app: Express) {
  console.log("🔧 Setting up local authentication...");
  
  // Session configuration with PostgreSQL store
  const connectPg = connectPgSimple(session);
  
  app.use(session({
    store: new connectPg({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || 'logiflow-production-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // HTTPS handled by reverse proxy
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax'
    },
    name: 'logiflow.sid'
  }));
  
  console.log("✅ Session configured");

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id: string, done) => {
    try {
      // Use raw SQL to avoid Drizzle ORM issues
      const { pool } = await import("./db.production.js");
      const result = await pool.query(`
        SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
        FROM users 
        WHERE id = $1 
        LIMIT 1
      `, [id]);
      
      if (result.rows.length === 0) {
        return done(null, false);
      }
      done(null, result.rows[0]);
    } catch (error) {
      console.error('❌ Error in deserializeUser:', error);
      done(error, null);
    }
  });

  // Local strategy
  passport.use(new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
      try {
        // Use raw SQL to avoid Drizzle ORM issues
        const { pool } = await import("./db.production.js");
        const result = await pool.query(`
          SELECT id, username, email, name, role, password, password_changed, created_at, updated_at
          FROM users 
          WHERE username = $1 
          LIMIT 1
        `, [username]);
        
        if (result.rows.length === 0) {
          return done(null, false, { message: 'Utilisateur non trouvé' });
        }

        const user = result.rows[0];
        const isValidPassword = await comparePasswords(password, user.password);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Mot de passe incorrect' });
        }

        return done(null, user);
      } catch (error) {
        console.error('❌ Error in LocalStrategy:', error);
        return done(error);
      }
    }
  ));

  // Login route handler function
  const loginHandler = (req: any, res: any, next: any) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Connexion échouée' });
      }

      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la connexion' });
        }
        return res.json({ 
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name || user.name,
          lastName: user.last_name || user.name,
          role: user.role,
          passwordChanged: user.password_changed
        });
      });
    })(req, res, next);
  };

  // Login routes (both paths for compatibility)
  app.post('/api/login', loginHandler);
  app.post('/api/auth/login', loginHandler);

  // Logout handler function
  const logoutHandler = (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
      }
      res.json({ message: 'Déconnexion réussie' });
    });
  };

  // Logout routes (both paths for compatibility)
  app.post('/api/logout', logoutHandler);
  app.post('/api/auth/logout', logoutHandler);

  // Get current user
  app.get('/api/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    const user = req.user as any;
    res.json({ 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      firstName: user.first_name || user.name,
      lastName: user.last_name || user.name,
      role: user.role,
      passwordChanged: user.password_changed
    });
  });

  // Check if default credentials should be shown
  app.get('/api/default-credentials-check', async (req, res) => {
    try {
      // Use raw SQL to avoid Drizzle ORM issues
      const { pool } = await import("./db.production.js");
      const result = await pool.query(`
        SELECT id, username, password_changed
        FROM users 
        WHERE username = $1 
        LIMIT 1
      `, ['admin']);
      
      const showDefault = result.rows.length > 0 && !result.rows[0].password_changed;
      res.json({ showDefault: !!showDefault });
    } catch (error) {
      console.error('❌ Error in default-credentials-check:', error);
      res.json({ showDefault: true }); // Default to showing credentials if error
    }
  });

  // Initialize default admin user
  createDefaultAdminUser();
}

export const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Non authentifié' });
};