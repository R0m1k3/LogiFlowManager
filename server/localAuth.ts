import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

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
    const existingAdmin = await storage.getUserByUsername('admin');
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('admin');
      await storage.createUser({
        id: 'admin_local',
        username: 'admin',
        email: 'admin@logiflow.com',
        firstName: 'Administrateur',
        lastName: 'Système',
        password: hashedPassword,
        role: 'admin',
        passwordChanged: false,
      });
      console.log('Admin user created: admin / admin');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

export function setupLocalAuth(app: Express) {
  // Create admin user on startup
  createDefaultAdminUser();
  
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    tableName: 'session',
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user || !user.password) {
            return done(null, false, { message: 'Identifiant ou mot de passe incorrect' });
          }

          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: 'Identifiant ou mot de passe incorrect' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserWithGroups(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });



  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentification échouée" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role,
          passwordChanged: user.passwordChanged 
        });
      });
    })(req, res, next);
  });

  // Logout routes (both GET and POST for compatibility)
  const logoutHandler = (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) return next(err);
      req.session.destroy((err: any) => {
        if (err) return next(err);
        res.clearCookie('connect.sid', { path: '/' });
        // Force redirect to login page for both GET and POST
        res.redirect('/auth');
      });
    });
  };
  
  app.post("/api/logout", logoutHandler);
  app.get("/api/logout", logoutHandler);

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    const user = req.user as SelectUser;
    res.json({ 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      firstName: user.firstName, 
      lastName: user.lastName, 
      role: user.role,
      passwordChanged: user.passwordChanged 
    });
  });

  // Check if default credentials should be shown
  app.get("/api/default-credentials-check", async (req, res) => {
    try {
      const adminUser = await storage.getUserByUsername('admin');
      const showDefault = adminUser && !adminUser.passwordChanged;
      res.json({ showDefault: !!showDefault });
    } catch (error) {
      res.json({ showDefault: true }); // Default to showing credentials if error
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", auth: "local" });
  });
}

export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  next();
};