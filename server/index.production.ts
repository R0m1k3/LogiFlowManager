import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "http";
import { setupLocalAuth } from "./localAuth.production";
import { registerRoutes } from "./routes.production";
import { setupSecurityHeaders, setupRateLimiting, setupInputSanitization } from "./security";
import { setupCompression } from "./cache";
import { monitor, setupMonitoringEndpoints } from "./monitoring";
import { initializeRolesAndPermissions } from "./initRolesAndPermissions.production";
import { pool } from "./db.production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Security middleware
setupSecurityHeaders(app);
setupRateLimiting(app);
setupInputSanitization(app);
setupCompression(app);

// Performance monitoring
app.use(monitor.middleware());
setupMonitoringEndpoints(app);

// Parse JSON with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

async function startServer() {
  try {
    console.log("🚀 Starting LogiFlow Production Server...");
    
    // Test database connection
    console.log("Testing database connection...");
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log("✅ Database connection successful");
    
    // Initialize roles and permissions
    console.log("Initializing roles and permissions...");
    await initializeRolesAndPermissions();
    console.log("Roles and permissions initialization completed");

    // Setup authentication
    setupLocalAuth(app);

    // Register API routes
    await registerRoutes(app);

    // Serve static files from dist/public
    const publicPath = join(__dirname, '..', 'dist', 'public');
    app.use(express.static(publicPath));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: 'production',
        version: '1.0.0'
      });
    });

    // Catch-all handler for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(join(publicPath, 'index.html'));
    });

    // Global error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Production error:', err);
      res.status(500).json({ 
        message: 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    });

    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`🎯 LogiFlow Production Server running on port ${port}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`🔗 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
      console.log(`🚀 Ready to serve requests at http://0.0.0.0:${port}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer().catch(console.error);