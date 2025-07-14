import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { pool } from "./db.production";
import bcrypt from "bcrypt";

// Use connect-pg-simple for production
import connectPgSimple from "connect-pg-simple";
const PgSession = connectPgSimple(session);

// Production authentication with PostgreSQL
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string) {
  return await bcrypt.compare(supplied, stored);
}

async function createDefaultAdminUser() {
  const client = await pool.connect();
  try {
    // Check if admin user exists
    const existingAdmin = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (existingAdmin.rows.length === 0) {
      console.log('Creating default admin user...');
      const hashedPassword = await hashPassword('admin');
      
      await client.query(`
        INSERT INTO users (id, username, email, first_name, last_name, name, role, password, password_changed) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'admin',
        'admin',
        'admin@logiflow.com',
        'Admin',
        'User',
        'Admin User',
        'admin',
        hashedPassword,
        false
      ]);
      
      console.log('✅ Default admin user created: admin/admin');
    }
  } finally {
    client.release();
  }
}

export function setupLocalAuth(app: Express) {
  // Session configuration for production
  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'LogiFlow_Super_Secret_Session_Key_2025_Production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      try {
        const client = await pool.connect();
        const result = await client.query(
          'SELECT * FROM users WHERE username = $1',
          [username]
        );
        client.release();

        if (result.rows.length === 0) {
          return done(null, false, { message: 'Utilisateur non trouvé' });
        }

        const user = result.rows[0];
        
        if (!user.password) {
          return done(null, false, { message: 'Mot de passe non configuré' });
        }

        const isValidPassword = await comparePasswords(password, user.password);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Mot de passe incorrect' });
        }

        // Don't return password in user object
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const client = await pool.connect();
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      client.release();

      if (result.rows.length === 0) {
        return done(null, false);
      }

      const user = result.rows[0];
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(error);
    }
  });

  // Login route
  app.post('/api/login', passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user, message: 'Connexion réussie' });
  });

  // Create default admin user on startup
  createDefaultAdminUser().catch(console.error);
}

export const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Non authentifié' });
};