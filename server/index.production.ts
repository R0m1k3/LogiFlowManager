import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Forcer la configuration de production Docker
process.env.USE_LOCAL_AUTH = "true";
process.env.NODE_ENV = "production";

// Vérifier et afficher la configuration de base de données
console.log("Production Environment Configuration:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- USE_LOCAL_AUTH:", process.env.USE_LOCAL_AUTH);
console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "***configured***" : "NOT SET");
console.log("- PORT:", process.env.PORT || 5000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced logging middleware for debugging
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  const reqId = Math.random().toString(36).substring(7);
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log incoming request details
  console.log(`[${reqId}] --> ${req.method} ${reqPath}`);
  console.log(`[${reqId}]     Host: ${req.get('host')}`);
  console.log(`[${reqId}]     IP: ${req.ip || req.socket.remoteAddress}`);
  console.log(`[${reqId}]     Headers: ${JSON.stringify({
    'x-forwarded-for': req.get('x-forwarded-for'),
    'x-real-ip': req.get('x-real-ip'),
    'user-agent': req.get('user-agent')?.substring(0, 50)
  })}`);

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `[${reqId}] <-- ${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
    
    if (capturedJsonResponse && reqPath.startsWith("/api")) {
      const responseStr = JSON.stringify(capturedJsonResponse);
      if (responseStr.length > 100) {
        logLine += ` :: ${responseStr.substring(0, 99)}…`;
      } else {
        logLine += ` :: ${responseStr}`;
      }
    }

    console.log(logLine);
    
    // Log errors
    if (res.statusCode >= 400) {
      console.error(`[${reqId}] ERROR Response:`, res.statusCode, res.statusMessage);
    }
  });

  next();
});

// Fonction pour servir les fichiers statiques en production
function serveStatic(app: express.Express) {
  // En production, les fichiers sont dans dist/client
  const distPath = path.resolve(process.cwd(), "dist/client");
  
  console.log(`[express] Serving static files from: ${distPath}`);
  
  // Servir les fichiers statiques depuis dist/client
  app.use(express.static(distPath));
  
  // Route catch-all pour le SPA
  app.get("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(`[ERROR] index.html not found at: ${indexPath}`);
      res.status(404).send("Application not found");
      return;
    }
    res.sendFile(indexPath);
  });
}

// Import des routes de production (sans dépendances Replit)
async function loadRoutes() {
  const { registerRoutes } = await import("./routes.production.js");
  return registerRoutes;
}

(async () => {
  const registerRoutes = await loadRoutes();
  const server = await registerRoutes(app);

  // Gestion des erreurs
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(`[ERROR] ${status}: ${message}`);
  });

  // En production, servir les fichiers statiques
  serveStatic(app);

  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`[express] serving on port ${port}`);
    console.log(`[express] Server bound to 0.0.0.0:${port}`);
    console.log(`[express] Ready to accept connections`);
    
    // Test server accessibility
    setTimeout(() => {
      console.log("\n🔍 Server diagnostics:");
      console.log(`   - Process PID: ${process.pid}`);
      console.log(`   - Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      console.log(`   - Node version: ${process.version}`);
      console.log(`   - Working directory: ${process.cwd()}`);
    }, 1000);
  });
  
  // Handle server errors
  server.on('error', (error: any) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
    }
  });
})();