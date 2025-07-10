import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type User } from "@shared/schema";
import { eq } from "drizzle-orm";
// Import de la DB de production
import { db } from "./db.production";
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
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function createDefaultAdminUser() {
  try {
    // First ensure database schema exists
    await initializeDatabase();
    
    console.log("Checking for default admin user...");
    
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log("Creating default admin user...");
      const hashedPassword = await hashPassword('admin');
      
      // Create admin user using raw SQL with all required columns
      await db.execute(`
        INSERT INTO users (id, username, email, first_name, last_name, role, password, password_changed) 
        VALUES ('admin_local', 'admin', 'admin@logiflow.com', 'Admin', 'Système', 'admin', '${hashedPassword}', false)
        ON CONFLICT (id) DO NOTHING
      `);
      
      console.log("✅ Default admin user created: admin/admin");
    } else {
      console.log("✅ Default admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
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
      const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (user.length > 0) {
        done(null, user[0]);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error, null);
    }
  });

  // Local strategy
  passport.use(new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
      try {
        const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
        
        if (user.length === 0) {
          return done(null, false, { message: 'Utilisateur non trouvé' });
        }

        const isValidPassword = await comparePasswords(password, user[0].password);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Mot de passe incorrect' });
        }

        return done(null, user[0]);
      } catch (error) {
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
      const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
      const showDefault = adminUser.length > 0 && !adminUser[0].password_changed;
      res.json({ showDefault: !!showDefault });
    } catch (error) {
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