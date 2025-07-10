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
      
      await db.insert(users).values({
        id: 'admin_local',
        username: 'admin',
        email: 'admin@logiflow.com',
        firstName: 'Admin',
        lastName: 'Système',
        role: 'admin',
        password: hashedPassword,
        passwordChanged: false
      });
      
      console.log("✅ Default admin user created: admin/admin");
    } else {
      console.log("✅ Default admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

export function setupLocalAuth(app: Express) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in HTTPS production
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

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

  // Login route
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Connexion échouée' });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la connexion' });
        }
        return res.json({ 
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
      }
      res.json({ message: 'Déconnexion réussie' });
    });
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