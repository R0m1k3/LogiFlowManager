import { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Headers de sécurité
export function setupSecurityHeaders(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Protection contre les attaques XSS
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Protection HTTPS
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Politique de sécurité du contenu
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' ws: wss:; " +
      "font-src 'self' data:;"
    );
    
    // Protection contre les attaques de référence
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Protection des données sensibles
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    next();
  });
}

// Limitation du taux de requêtes
export function setupRateLimiting(app: Express) {
  // Limiteur général
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limite chaque IP à 1000 requêtes par fenêtre
    message: {
      error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true, // Configuration pour Docker/proxy
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    }
  });

  // Limiteur pour l'authentification
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limite les tentatives de connexion
    message: {
      error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true, // Configuration pour Docker/proxy
  });

  // Limiteur pour l'API
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requêtes par minute
    message: {
      error: 'Limite API atteinte, veuillez ralentir vos requêtes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true, // Configuration pour Docker/proxy
  });

  app.use(generalLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/', apiLimiter);
}

// Validation et nettoyage des entrées
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Supprimer les caractères dangereux
    return input.replace(/[<>]/g, '').trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  
  return input;
}

// Middleware de nettoyage des requêtes
export function setupInputSanitization(app: Express) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    next();
  });
}

// Middleware de logging sécurisé
export function secureLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  
  // En production, ne pas logger les données sensibles
  if (process.env.NODE_ENV === 'production') {
    if (message.includes('password') || message.includes('token')) {
      console.log(`[${timestamp}] ${message} - [SENSITIVE DATA HIDDEN]`);
    } else {
      console.log(`[${timestamp}] ${message}`, logData);
    }
  } else {
    console.log(`[${timestamp}] ${message}`, logData);
  }
}